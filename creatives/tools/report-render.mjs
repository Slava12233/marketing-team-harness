#!/usr/bin/env node
// report-render.mjs: renders a Markdown report (the client report first of all) to a self-contained, one-page,
// printable HTML file, and on request to a PDF with a headless Edge or Chrome.
//
// Usage (from the repository root; Node 20+; no dependencies; no network):
//   node creatives/tools/report-render.mjs <report.md> [--pdf] [--lang he|en|fr|...] [--dir rtl|ltr]
//        [--out <file.html>] [--root <harness folder>] [--browser <path>]
//   With --pdf, bound the call in time: timeout 120 node creatives/tools/report-render.mjs ... --pdf
//
// What it does:
//   - strips the YAML frontmatter and HTML comments, then renders a Markdown subset: headings, paragraphs, bold,
//     italic, inline code, links (http, https, mailto, relative and # only), bullet and numbered lists (nested by
//     indentation), tables (with :--: alignment), blockquotes, horizontal rules and fenced code. Everything else is
//     text: every character of the source is HTML-escaped, so a <script> in a report prints as text.
//   - writes <report dir>/<name>.html (or --out): A4, system fonts, embedded CSS, a header with the company name
//     (config/company.md, "Name") and the report date (frontmatter as_of, else created, else the file name's
//     YYYY-MM-DD), page numbers in print, a @media print block.
//   - direction: --dir, else "Report direction" in config/reporting.md, else rtl for an rtl language, else ltr.
//     Language: --lang, else "Report language" in config/reporting.md (a name such as French, or a code), else en.
//   - the harness folder (where config/ is): --root, else the first folder above the report that holds
//     config/company.md, else the folder two levels above this script.
//   - --pdf: prints the HTML to <name>.pdf beside it with headless Edge or Chrome (--headless=new
//     --print-to-pdf=<path> --no-pdf-header-footer). Browser lookup, as creatives/tools/ad-shots.sh: --browser,
//     $REPORT_RENDER_BROWSER, $AD_SHOTS_BROWSER, Edge then Chrome at the usual Windows paths, Edge, Chrome and
//     Chromium on macOS, then the PATH. A 90-second bound: the browser's process tree is killed after it.
//
// Exit: 0 written; 1 the PDF was asked for and not written (no browser found, the browser failed or ran out of
// time; the HTML is still written and named); 2 usage (no report, an unreadable file, a bad flag).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const SCRIPT_ROOT = path.resolve(path.dirname(SELF), '..', '..');
const PDF_BOUND_MS = 90_000;
const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur', 'yi', 'ps', 'sd', 'ug', 'dv', 'ckb']);
const LANG_CODES = {
  arabic: 'ar', chinese: 'zh', czech: 'cs', danish: 'da', dutch: 'nl', english: 'en', finnish: 'fi', french: 'fr',
  german: 'de', greek: 'el', hebrew: 'he', hindi: 'hi', hungarian: 'hu', indonesian: 'id', italian: 'it',
  japanese: 'ja', korean: 'ko', norwegian: 'nb', persian: 'fa', farsi: 'fa', polish: 'pl', portuguese: 'pt',
  romanian: 'ro', russian: 'ru', spanish: 'es', swedish: 'sv', thai: 'th', turkish: 'tr', ukrainian: 'uk',
  urdu: 'ur', vietnamese: 'vi', yiddish: 'yi',
};

// ---------- helpers ----------
export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function splitFrontmatter(md) {
  const src = String(md).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const m = src.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!m) return { data: {}, body: src };
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return { data, body: src.slice(m[0].length) };
}

export const stripFrontmatter = md => splitFrontmatter(md).body;

function safeUrl(url) {
  const u = url.trim();
  if (/^(https?:|mailto:)/i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return null;       // javascript:, data:, file: and every other scheme
  return u;                                              // a relative path or a #anchor
}

// ---------- inline ----------
export function renderInline(text) {
  const slots = [];
  const put = html => `\u0000${slots.push(html) - 1}\u0000`;
  let s = String(text).replace(/\u0000/g, '');
  s = s.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_, _t, code) => put(`<code>${escapeHtml(code.trim())}</code>`));
  s = s.replace(/\\([\\`*_{}\[\]()#+\-.!|>~])/g, (_, ch) => put(escapeHtml(ch)));
  s = s.replace(/<((?:https?:\/\/|mailto:)[^\s<>]+)>/gi, (_, url) => put(`<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`));
  s = s.replace(/\[([^\]]*)\]\(\s*([^()\s]+(?:\([^()\s]*\))?[^()\s]*)(?:\s+"([^"]*)")?\s*\)/g, (_, label, url, title) => {
    const href = safeUrl(url);
    const inner = renderInline(label);
    if (href === null) return put(inner);
    const t = title ? ` title="${escapeHtml(title)}"` : '';
    return put(`<a href="${escapeHtml(href)}"${t}>${inner}</a>`);
  });
  s = escapeHtml(s);
  s = s.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/g, '$1<strong>$2</strong>');
  s = s.replace(/(^|[^*\w])\*(?=[^\s*])([\s\S]*?[^\s*])\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/(^|[^\w])_(?=[^\s_])([\s\S]*?[^\s_])_(?!\w)/g, '$1<em>$2</em>');
  s = s.replace(/ {2,}\n|\\\n/g, '<br>\n');
  for (let i = 0; i < 5 && s.includes('\u0000'); i++) s = s.replace(/\u0000(\d+)\u0000/g, (_, n) => slots[Number(n)]);
  return s;
}

// ---------- blocks ----------
const RE_HR = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const RE_HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/;
const RE_FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const RE_QUOTE = /^ {0,3}>/;
const RE_ITEM = /^( *)([-*+]|\d{1,9}[.)])[ \t]+(.*)$/;
const RE_TABLE_SEP = /^ *\|? *:?-+:? *(\| *:?-+:? *)*\|? *$/;

function splitRow(line) {
  let t = line.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1);
  const cells = [];
  let cur = '', inCode = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '\\' && t[i + 1] === '|') { cur += '\\|'; i++; continue; }
    if (c === '`') inCode = !inCode;
    if (c === '|' && !inCode) { cells.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  cells.push(cur.trim());
  return cells;
}

const isTableStart = (lines, i) => lines[i].includes('|') && i + 1 < lines.length && RE_TABLE_SEP.test(lines[i + 1]) && lines[i + 1].includes('-');

function renderTable(header, sep, rows) {
  const align = splitRow(sep).map(c => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'end' : c.startsWith(':') ? 'start' : ''));
  const cell = (tag, text, i) => `<${tag}${align[i] ? ` class="al-${align[i]}"` : ''}>${renderInline(text)}</${tag}>`;
  const head = splitRow(header);
  let html = '<table>\n<thead><tr>' + head.map((c, i) => cell('th', c, i)).join('') + '</tr></thead>\n<tbody>\n';
  for (const r of rows) {
    const cells = splitRow(r);
    while (cells.length < head.length) cells.push('');
    html += '<tr>' + cells.slice(0, head.length).map((c, i) => cell('td', c, i)).join('') + '</tr>\n';
  }
  return html + '</tbody>\n</table>';
}

function startsBlock(lines, i) {
  const l = lines[i];
  return RE_HR.test(l) || RE_HEADING.test(l) || RE_FENCE.test(l) || RE_QUOTE.test(l) || RE_ITEM.test(l) || isTableStart(lines, i);
}

function renderList(lines, start) {
  const first = lines[start].match(RE_ITEM);
  const indent = first[1].length;
  const ordered = /\d/.test(first[2]);
  const startNum = ordered ? parseInt(first[2], 10) : 1;
  const items = [];
  let i = start;
  while (i < lines.length) {
    const m = lines[i].match(RE_ITEM);
    if (!m || m[1].length !== indent || /\d/.test(m[2]) !== ordered) break;
    const body = [m[3]];
    const contentIndent = m[1].length + m[2].length + 1;
    i++;
    while (i < lines.length) {
      const l = lines[i];
      if (l.trim() === '') {
        const next = lines[i + 1];
        if (next !== undefined && next.trim() !== '' && next.match(/^ */)[0].length > indent) { body.push(''); i++; continue; }
        break;
      }
      const lead = l.match(/^ */)[0].length;
      const im = l.match(RE_ITEM);
      if (im && im[1].length <= indent) break;
      if (lead > indent) { body.push(l.slice(Math.min(lead, contentIndent))); i++; continue; }
      if (startsBlock(lines, i)) break;
      body.push(l.trim()); i++;   // a lazy continuation of the item's paragraph
    }
    items.push(body);
  }
  const tag = ordered ? 'ol' : 'ul';
  const startAttr = ordered && startNum !== 1 ? ` start="${startNum}"` : '';
  const lis = items.map(body => {
    let inner = renderBlocks(body.join('\n')).trim();
    const single = inner.match(/^<p>([\s\S]*?)<\/p>(\n[\s\S]*)?$/);
    if (single && !single[1].includes('<p>')) inner = single[1] + (single[2] || '');
    return `<li>${inner}</li>`;
  });
  return { html: `<${tag}${startAttr}>\n${lis.join('\n')}\n</${tag}>`, next: i };
}

export function renderBlocks(md) {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }
    let m;
    if ((m = line.match(RE_FENCE))) {
      const fence = m[1];
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence)) code.push(lines[i++]);
      i++;
      out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }
    if (RE_HR.test(line)) { out.push('<hr>'); i++; continue; }
    if ((m = line.match(RE_HEADING))) {
      const n = m[1].length;
      out.push(`<h${n}>${renderInline(m[2])}</h${n}>`); i++; continue;
    }
    if (RE_QUOTE.test(line)) {
      const q = [];
      while (i < lines.length && lines[i].trim() !== '' && (RE_QUOTE.test(lines[i]) || !startsBlock(lines, i))) {
        q.push(lines[i].replace(/^ {0,3}> ?/, '')); i++;
      }
      out.push(`<blockquote>\n${renderBlocks(q.join('\n'))}\n</blockquote>`);
      continue;
    }
    if (isTableStart(lines, i)) {
      const header = lines[i], sep = lines[i + 1], rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim() !== '' && lines[i].includes('|')) rows.push(lines[i++]);
      out.push(renderTable(header, sep, rows));
      continue;
    }
    if (RE_ITEM.test(line)) {
      const { html, next } = renderList(lines, i);
      out.push(html); i = next; continue;
    }
    const para = [line.replace(/^ +/, '')];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !startsBlock(lines, i)) para.push(lines[i++].replace(/^ +/, ''));
    out.push(`<p>${renderInline(para.join('\n'))}</p>`);
  }
  return out.join('\n');
}

export function renderMarkdown(md) {
  const body = stripFrontmatter(md).replace(/<!--[\s\S]*?-->/g, '');
  return renderBlocks(body);
}

// ---------- config ----------
function readField(file, label) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return null; }
  text = text.replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '');
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = text.match(new RegExp(`^\\*\\*${esc}:\\*\\*[ \\t]*(.+)$`, 'mi'));
  if (!m) return null;
  const v = m[1].trim();
  return !v || v.includes('{{') ? null : v;
}

export function findRoot(reportPath, explicit) {
  if (explicit) return path.resolve(explicit);
  let dir = path.dirname(path.resolve(reportPath));
  for (;;) {
    if (fs.existsSync(path.join(dir, 'config', 'company.md'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return SCRIPT_ROOT;
    dir = up;
  }
}

export function readCompanyName(root) {
  const f = path.join(root, 'config', 'company.md');
  return readField(f, 'Name') || readField(f, 'Short name') || '';
}

export function langCode(value) {
  if (!value) return null;
  const v = value.trim();
  if (/^[a-z]{2,3}(?:[-_][A-Za-z]{2,4})?$/i.test(v)) return v.replace('_', '-').toLowerCase();
  const name = v.toLowerCase().match(/[a-z]+/);
  return name && LANG_CODES[name[0]] ? LANG_CODES[name[0]] : null;
}

export function readReporting(root) {
  const f = path.join(root, 'config', 'reporting.md');
  const lang = langCode(readField(f, 'Report language'));
  const dirRaw = (readField(f, 'Report direction') || '').toLowerCase();
  const dir = /\brtl\b/.test(dirRaw) ? 'rtl' : /\bltr\b/.test(dirRaw) ? 'ltr' : null;
  return { lang, dir };
}

// ---------- document ----------
const CSS = `
:root { --ink: #1d232b; --muted: #5d6673; --rule: #d6dbe1; --soft: #f3f5f7; --accent: #2f5d8a; }
* { box-sizing: border-box; }
html { background: #e9ecef; }
body { color: var(--ink); background: #fff; font: 10.5pt/1.45 system-ui, -apple-system, "Segoe UI", Roboto,
  "Noto Sans", "Noto Sans Hebrew", "Noto Sans Arabic", Arial, sans-serif; max-width: 210mm; min-height: 297mm;
  margin: 0 auto; padding: 14mm 16mm; }
.report-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
  border-bottom: 2px solid var(--ink); padding-bottom: 6px; margin-bottom: 14px; }
.report-head .company { font-weight: 700; font-size: 12pt; letter-spacing: .01em; }
.report-head .date { color: var(--muted); font-variant-numeric: tabular-nums; }
h1 { font-size: 17pt; line-height: 1.2; margin: 0 0 10px; }
h2 { font-size: 12.5pt; margin: 16px 0 6px; padding-bottom: 2px; border-bottom: 1px solid var(--rule); }
h3 { font-size: 11pt; margin: 12px 0 4px; }
h4, h5, h6 { font-size: 10.5pt; margin: 10px 0 4px; }
p { margin: 0 0 8px; }
ul, ol { margin: 0 0 8px; padding-inline-start: 20px; }
li { margin: 2px 0; }
a { color: var(--accent); }
strong { font-weight: 700; }
code { font-family: ui-monospace, Consolas, Menlo, monospace; font-size: 9.5pt; background: var(--soft); padding: 0 3px; border-radius: 3px; }
pre { background: var(--soft); padding: 8px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; }
pre code { padding: 0; background: none; }
blockquote { margin: 8px 0; padding: 6px 12px; border-inline-start: 3px solid var(--accent); background: var(--soft); }
blockquote p:last-child { margin-bottom: 0; }
hr { border: 0; border-top: 1px solid var(--rule); margin: 12px 0; }
table { width: 100%; border-collapse: collapse; margin: 6px 0 10px; font-size: 9.5pt; font-variant-numeric: tabular-nums; }
th, td { border: 1px solid var(--rule); padding: 4px 6px; text-align: start; vertical-align: top; }
th { background: var(--soft); font-weight: 600; }
.al-center { text-align: center; } .al-end { text-align: end; } .al-start { text-align: start; }
.report-foot { margin-top: 16px; padding-top: 6px; border-top: 1px solid var(--rule); color: var(--muted); font-size: 8.5pt; }
@page { size: A4; margin: 14mm 14mm 16mm;
  @bottom-center { content: counter(page) " / " counter(pages); font: 8.5pt system-ui, sans-serif; color: #5d6673; } }
@media print {
  html, body { background: #fff; }
  body { max-width: none; min-height: 0; margin: 0; padding: 0; font-size: 10pt; }
  a { color: inherit; text-decoration: none; }
  h1, h2, h3 { break-after: avoid; }
  table, blockquote, pre, li { break-inside: avoid; }
  .report-foot { display: none; }
}
@media screen and (max-width: 640px) { body { padding: 16px; min-height: 0; } table { display: block; overflow-x: auto; } }
`;

export function reportDate(data, file) {
  const fromFm = String(data.as_of || data.created || '').match(/\d{4}-\d{2}-\d{2}/);
  if (fromFm) return fromFm[0];
  const fromName = path.basename(file || '').match(/\d{4}-\d{2}-\d{2}/);
  return fromName ? fromName[0] : '';
}

export function buildHtml({ markdown, file = '', company = '', lang = 'en', dir = 'ltr' }) {
  const { data } = splitFrontmatter(markdown);
  const body = renderMarkdown(markdown);
  const h1 = body.match(/<h1>([\s\S]*?)<\/h1>/);
  const titleText = h1 ? h1[1].replace(/<[^>]+>/g, '') : escapeHtml(path.basename(file, path.extname(file)));
  const date = reportDate(data, file);
  const title = [company && escapeHtml(company), titleText].filter(Boolean).join(' · ');
  return `<!doctype html>
<html lang="${escapeHtml(lang)}" dir="${dir === 'rtl' ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${CSS}</style>
</head>
<body>
<header class="report-head"><div class="company">${escapeHtml(company)}</div><div class="date">${escapeHtml(date)}</div></header>
<main class="report">
${body}
</main>
<footer class="report-foot">${escapeHtml(company)}${company && date ? ' · ' : ''}${escapeHtml(date)}</footer>
</body>
</html>
`;
}

// ---------- browser and PDF ----------
export function findBrowser(explicit, env = process.env) {
  for (const c of [explicit, env.REPORT_RENDER_BROWSER, env.AD_SHOTS_BROWSER]) if (c && fs.existsSync(c)) return c;
  const fixed = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];
  for (const c of fixed) if (fs.existsSync(c)) return c;
  const names = ['microsoft-edge', 'microsoft-edge-stable', 'msedge', 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome'];
  const exts = process.platform === 'win32' ? ['.exe', ''] : [''];
  const dirs = (env.PATH || env.Path || '').split(path.delimiter).filter(Boolean);
  for (const n of names) for (const d of dirs) for (const e of exts) {
    const p = path.join(d, n + e);
    try { if (fs.statSync(p).isFile()) return p; } catch { /* not here */ }
  }
  return null;
}

function killTree(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  else { try { process.kill(-child.pid, 'SIGKILL'); } catch { try { child.kill('SIGKILL'); } catch { /* gone */ } } }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function printPdf(browser, htmlPath, pdfPath, boundMs = PDF_BOUND_MS) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'report-render-'));
  try { fs.rmSync(pdfPath, { force: true }); } catch { /* not there */ }
  // A fresh profile keeps the run from handing off to a browser window that is already open.
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    `--user-data-dir=${profile}`, '--no-pdf-header-footer', `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href];
  const deadline = Date.now() + boundMs;
  const child = spawn(browser, args, { stdio: 'ignore', detached: process.platform !== 'win32', windowsHide: true });
  let exited = false, spawnError = null;
  child.on('exit', () => { exited = true; });
  child.on('error', e => { spawnError = e; exited = true; });
  const ready = () => { try { return fs.statSync(pdfPath).size > 0; } catch { return false; } };
  // Wait for the browser to exit and the file to exist, inside one deadline (a browser can hand off to a background
  // process, so the file may land a little after the first process returns).
  while (Date.now() < deadline && !(exited && ready()) && !spawnError) await sleep(250);
  const ok = ready();
  const timedOut = !ok && !spawnError && Date.now() >= deadline;
  killTree(child);
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch { /* left in the temp folder */ }
  return { ok, timedOut, error: spawnError ? String(spawnError.message || spawnError) : null };
}

// ---------- CLI ----------
const HELP = `report-render.mjs: a Markdown report -> a self-contained printable HTML file (and a PDF with --pdf)

Usage:
  node creatives/tools/report-render.mjs <report.md> [--pdf] [--lang <code>] [--dir rtl|ltr] [--out <file.html>]
                                         [--root <harness folder>] [--browser <path>]

  --pdf       also print <name>.pdf beside the HTML with headless Edge or Chrome (90-second bound)
  --lang      the html lang attribute (he, en, fr, ...); default: "Report language" in config/reporting.md, else en
  --dir       rtl or ltr; default: "Report direction" in config/reporting.md, else rtl for an rtl language, else ltr
  --out       the HTML path; default <report dir>/<name>.html (the PDF takes the same name with .pdf)
  --root      the harness folder that holds config/; default: found above the report
  --browser   the browser's full path; else $REPORT_RENDER_BROWSER, $AD_SHOTS_BROWSER, the usual install paths, the PATH

Exit: 0 written; 1 the PDF was not written (the HTML still was); 2 usage.`;

function parseArgs(argv) {
  const o = { file: null, pdf: false, lang: null, dir: null, out: null, root: null, browser: null, help: false };
  const takes = new Set(['--lang', '--dir', '--out', '--root', '--browser']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--pdf') o.pdf = true;
    else if (takes.has(a)) {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new Error(`${a} needs a value`);
      o[a.slice(2)] = v;
    } else if (a.startsWith('--')) throw new Error(`unknown flag ${a}`);
    else if (!o.file) o.file = a;
    else throw new Error(`unexpected argument ${a}`);
  }
  if (o.dir && !['rtl', 'ltr'].includes(o.dir.toLowerCase())) throw new Error('--dir must be rtl or ltr');
  return o;
}

export async function main(argv) {
  let o;
  try { o = parseArgs(argv); } catch (e) { console.error(`${e.message}\n\n${HELP}`); return 2; }
  if (o.help) { console.log(HELP); return 0; }
  if (!o.file) { console.error(HELP); return 2; }
  let markdown;
  try { markdown = fs.readFileSync(o.file, 'utf8'); } catch (e) { console.error(`cannot read ${o.file}: ${e.code || e.message}`); return 2; }
  const root = findRoot(o.file, o.root);
  const cfg = readReporting(root);
  const lang = (o.lang && (langCode(o.lang) || o.lang.toLowerCase())) || cfg.lang || 'en';
  const dir = (o.dir && o.dir.toLowerCase()) || cfg.dir || (RTL_LANGS.has(lang.split('-')[0]) ? 'rtl' : 'ltr');
  const company = readCompanyName(root);
  const parsed = path.parse(path.resolve(o.file));
  const htmlPath = path.resolve(o.out || path.join(parsed.dir, `${parsed.name}.html`));
  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
  fs.writeFileSync(htmlPath, buildHtml({ markdown, file: o.file, company, lang, dir }));
  console.log(`html ${htmlPath} (lang ${lang}, ${dir}${company ? '' : '; no company name in config/company.md'})`);
  if (!o.pdf) return 0;
  const browser = findBrowser(o.browser);
  if (!browser) {
    console.error('PDF not written: no Edge or Chrome found. Set REPORT_RENDER_BROWSER (or pass --browser) to the browser\'s full path; the HTML above is ready to print by hand.');
    return 1;
  }
  const pdfPath = htmlPath.replace(/\.html?$/i, '') + '.pdf';
  const r = await printPdf(browser, htmlPath, pdfPath);
  if (r.ok) { console.log(`pdf ${pdfPath}`); return 0; }
  console.error(r.timedOut
    ? `PDF not written: the browser ran past ${PDF_BOUND_MS / 1000} s and was stopped; the HTML above is ready to print by hand.`
    : `PDF not written: the browser did not produce it${r.error ? ` (${r.error})` : ''}; the HTML above is ready to print by hand.`);
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SELF) {
  main(process.argv.slice(2)).then(code => process.exit(code), e => { console.error((e && e.stack) || e); process.exit(1); });
}
