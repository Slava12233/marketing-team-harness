// memory/tools/lib.mjs: shared helpers for the vault tools (build-hot, build-capabilities, lint, frontmatter)
// and the two Claude Code hooks. Node 20+, ESM, no dependencies. Contract: memory/README.md.
// Everything here is pure file work: no network, never reads .env (only .env.example, for variable names).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------- vault root and walking

/** Directories never walked, at any depth (Obsidian ignores most of them as well; see .obsidian/app.json). examples/ holds a
 * fictional company's vault and vendor/ a vendored plugin: neither is part of this company's vault. */
export const EXCLUDED_DIRS = new Set(['creatives', 'node_modules', '.claude', '.git', 'dashboard', '.obsidian', '.vercel', '.trash', 'examples', 'vendor', 'dist']);

/** Folders (relative to the root) whose markdown files are vault notes: linted, indexed, read by build-hot. */
export const NOTE_ROOTS = ['memory/', 'reports/', 'plans/'];

/** Notes inside these prefixes are not real notes (templates) and are skipped by lint and INDEX. */
export const NOTE_SKIP = ['memory/templates/'];

export const TOOL_DIR = path.dirname(fileURLToPath(import.meta.url));

/** The vault root: --root <dir>, else MEMORY_VAULT_ROOT, else two levels above memory/tools/. */
export function findRoot(argv = process.argv.slice(2)) {
  const i = argv.indexOf('--root');
  if (i !== -1 && argv[i + 1]) return path.resolve(argv[i + 1]);
  if (process.env.MEMORY_VAULT_ROOT) return path.resolve(process.env.MEMORY_VAULT_ROOT);
  return path.resolve(TOOL_DIR, '..', '..');
}

export const toPosix = p => p.split(path.sep).join('/');

/** Every file under root (relative posix paths), excluded directories skipped at any depth. */
export function walkFiles(root, { exts = null } = {}) {
  const out = [];
  const stack = [''];
  while (stack.length) {
    const relDir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(path.join(root, relDir), { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const rel = relDir ? `${relDir}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (!EXCLUDED_DIRS.has(e.name)) stack.push(rel);
      } else if (e.isFile()) {
        if (!exts || exts.includes(path.extname(e.name).toLowerCase())) out.push(rel);
      }
    }
  }
  return out.sort();
}

export const walkMarkdown = root => walkFiles(root, { exts: ['.md'] });

export const isNotePath = rel => NOTE_ROOTS.some(p => rel.startsWith(p)) && !NOTE_SKIP.some(p => rel.startsWith(p));

// ---------------------------------------------------------------- text helpers

export const normalizeEol = s => String(s).replace(/^﻿/, '').replace(/\r\n?/g, '\n');

export function readText(abs) {
  try { return normalizeEol(fs.readFileSync(abs, 'utf8')); } catch { return null; }
}

/** Writes only when the content differs; returns true when it wrote. Creates the folder. */
export function writeIfChanged(abs, content) {
  const old = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  if (old === content) return false;
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
  return true;
}

/** sha256 of the normalised body (LF line ends, leading blank lines and trailing whitespace dropped), first 16 hex. */
export function contentHash(body) {
  const norm = normalizeEol(body).replace(/[ \t]+$/gm, '').replace(/^\n+/, '').replace(/\s+$/, '');
  return crypto.createHash('sha256').update(norm, 'utf8').digest('hex').slice(0, 16);
}

export const lineCount = s => (s.endsWith('\n') ? s.slice(0, -1) : s).split('\n').length;

/** One line, at most max characters; a cut never leaves an open `code` span or a half [[wikilink]]. */
export const oneLine = (s, max = 300) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  let cut = t.slice(0, max - 1);
  const open = cut.lastIndexOf('[['); if (open !== -1 && cut.indexOf(']]', open) === -1) cut = cut.slice(0, open);
  if ((cut.match(/`/g) || []).length % 2) cut = cut.slice(0, cut.lastIndexOf('`'));
  return cut.trimEnd() + '…';
};

// ---------------------------------------------------------------- the company's config (read-only)

/** The value after a bold `**Label:**` in a config/*.md file; '' when missing or still a double-brace placeholder.
 *  The same detection as dashboard/setup-page.mjs, so the vault and the setup page agree. */
export function configLine(root, rel, label) {
  const t = readText(path.join(root, rel)) || '';
  const m = new RegExp('\\*\\*' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\*\\*[ \\t]*(.*)', 'i').exec(t);
  return m && !m[1].includes('{{') ? m[1].replace(/<!--.*?-->/g, '').trim() : '';
}

/** The Owner's chat language from config/operator.md: 'he' when it names Hebrew, else 'en' (also with no file). */
export function ownerLanguage(root) {
  return /hebrew|עברית/i.test(configLine(root, 'config/operator.md', 'Chat language')) ? 'he' : 'en';
}

const validTz = tz => { try { new Intl.DateTimeFormat('en-CA', { timeZone: tz }); return true; } catch { return false; } };

/** The IANA timezone of config/operator.md (its first word), else UTC. */
export function vaultTimezone(root) {
  const tz = (configLine(root, 'config/operator.md', 'Timezone').split(/[\s,;(]/)[0] || '').trim();
  return tz && validTz(tz) ? tz : 'UTC';
}

// ---------------------------------------------------------------- dates (the company's timezone)

/** { date: 'YYYY-MM-DD', time: 'HH:MM', offset: '+02:00', iso } in the given IANA timezone (default UTC). */
export function vaultNow(d = new Date(), tz = 'UTC') {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: validTz(tz) ? tz : 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    second: '2-digit', hourCycle: 'h23', timeZoneName: 'longOffset',
  }).formatToParts(d).map(p => [p.type, p.value]));
  let offset = (parts.timeZoneName || 'GMT').replace('GMT', '');
  if (!offset) offset = '+00:00';
  if (/^[+-]\d{2}$/.test(offset)) offset += ':00';
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${parts.hour}:${parts.minute}`;
  return { date, time, offset, iso: `${date}T${time}:${parts.second}${offset}` };
}

export const isDate = s => /^\d{4}-\d{2}-\d{2}/.test(String(s ?? ''));
export const dateOf = s => (isDate(s) ? String(s).slice(0, 10) : null);
/** Whole days from date a to date b (both YYYY-MM-DD). */
export function daysBetween(a, b) {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}

// ---------------------------------------------------------------- frontmatter (YAML subset)

/** Splits a note into its frontmatter text and body. */
export function splitFrontmatter(text) {
  const t = normalizeEol(text);
  if (!t.startsWith('---\n')) return { hasFm: false, fmText: '', body: t };
  const m = /\n---[ \t]*(\n|$)/.exec(t.slice(3));
  if (!m) return { hasFm: false, fmText: '', body: t };
  const end = 3 + m.index;
  return { hasFm: true, fmText: t.slice(4, end), body: t.slice(end + m[0].length) };
}

function unquote(v) {
  if (v.length >= 2 && v[0] === '"' && v.endsWith('"')) {
    return v.slice(1, -1).replace(/\\(["\\/nt])/g, (_, c) => ({ n: '\n', t: '\t' }[c] ?? c));
  }
  if (v.length >= 2 && v[0] === "'" && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
  return v;
}

function stripComment(v) {
  if (v.startsWith('"') || v.startsWith("'")) {
    const q = v[0];
    for (let i = 1; i < v.length; i++) {
      if (q === '"' && v[i] === '\\') { i++; continue; }
      if (v[i] === q) {
        if (q === "'" && v[i + 1] === "'") { i++; continue; }
        return v.slice(0, i + 1);
      }
    }
    return v;
  }
  return v.replace(/\s+#.*$/, '').trim();
}

function splitFlow(inner) {
  const items = []; let cur = ''; let q = null; let depth = 0;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (q) {
      cur += c;
      if (c === '\\' && q === '"') { cur += inner[++i] ?? ''; continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === '[') depth++;
    if (c === ']') depth--;
    if (c === ',' && depth === 0) { items.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) items.push(cur.trim());
  return items.map(unquote);
}

export function parseScalar(raw) {
  const v = stripComment(String(raw).trim());
  if (v.startsWith('[') && v.endsWith(']') && !v.startsWith('[[')) return splitFlow(v.slice(1, -1));
  return unquote(v);
}

/**
 * Parses the frontmatter subset the vault uses: `key: scalar`, quoted strings, flow lists `[a, "b"]`,
 * block lists (`key:` then `  - item`), block scalars (`>`, `|`, with `-`/`+`). Nested maps are kept as
 * their raw indented text. Values are strings or arrays of strings; an empty value is ''.
 */
export function parseFrontmatter(fmText) {
  const lines = normalizeEol(fmText).split('\n');
  const out = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || /^\s*#/.test(line) || /^\s/.test(line) || /^-\s/.test(line)) continue;
    const m = /^([^\s:#][^:]*?)\s*:(?:[ \t]+(.*))?[ \t]*$/.exec(line);
    if (!m) continue;
    const key = m[1].trim();
    const rawVal = (m[2] ?? '').trim();
    const block = [];
    let j = i + 1;
    while (j < lines.length) {
      const l = lines[j];
      if (/^\s+\S/.test(l) || (!rawVal && /^-(\s|$)/.test(l))) { block.push(l); j++; continue; }
      if (l.trim() === '' && j + 1 < lines.length && /^\s+\S/.test(lines[j + 1])) { block.push(l); j++; continue; }
      break;
    }
    if (/^[>|][+-]?$/.test(rawVal)) {
      const body = block.map(l => l.trim());
      out[key] = rawVal[0] === '>' ? body.join(' ').replace(/\s+/g, ' ').trim() : body.join('\n');
      i = j - 1; continue;
    }
    if (rawVal === '' && block.length) {
      if (block.every(l => /^\s*-(\s|$)/.test(l) || l.trim() === '')) {
        out[key] = block.filter(l => l.trim()).map(l => parseScalar(l.replace(/^\s*-\s?/, '')));
      } else {
        out[key] = block.join('\n');
      }
      i = j - 1; continue;
    }
    out[key] = parseScalar(rawVal);
  }
  return out;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+([+-]\d{2}:?\d{2}|Z)?)?$/;

export function needsQuote(s, inFlow = false) {
  if (s === '') return true;
  if (DATE_RE.test(s)) return false;
  if (/^\s|\s$/.test(s)) return true;
  if (/^[-?:,[\]{}#&*!|>'"%@`]/.test(s)) return true;
  if (/: |:$| #/.test(s)) return true;
  if (/^(true|false|null|yes|no|on|off|~)$/i.test(s)) return true;
  if (/^[+-]?\d[\d_]*(\.\d+)?([eE][+-]?\d+)?$/.test(s) || /^[+-]?\.\d+$/.test(s)) return true;
  if (/^0x[0-9a-f]+$/i.test(s)) return true;
  if (inFlow && /[,[\]{}]/.test(s)) return true;
  if (/[\n\t]/.test(s)) return true;
  return false;
}

export const quote = s => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';

export function serializeValue(v, inFlow = false) {
  if (Array.isArray(v)) return '[' + v.map(x => serializeValue(String(x), true)).join(', ') + ']';
  if (v === null || v === undefined) return '';
  const s = String(v);
  return needsQuote(s, inFlow) ? quote(s) : s;
}

/** Serialises an ordered object into a frontmatter block, `---` lines included, with a trailing newline. */
export function serializeFrontmatter(obj) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const sv = serializeValue(v);
    lines.push(sv === '' ? `${k}:` : `${k}: ${sv}`);
  }
  lines.push('---');
  return lines.join('\n') + '\n';
}

/** Replaces (or appends) one scalar key in a note's frontmatter without touching the other lines. */
export function setFrontmatterKey(text, key, value) {
  const { hasFm, fmText, body } = splitFrontmatter(text);
  if (!hasFm) return text;
  const lines = fmText.split('\n');
  const re = new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`);
  const idx = lines.findIndex(l => re.test(l));
  const line = `${key}: ${serializeValue(value)}`;
  if (idx === -1) lines.push(line); else lines[idx] = line;
  return `---\n${lines.join('\n')}\n---\n${body}`;
}

// ---------------------------------------------------------------- notes

/** Loads every vault note (markdown under memory/, reports/, plans/; templates skipped). */
export function loadNotes(root) {
  return walkMarkdown(root).filter(isNotePath).map(rel => loadNote(root, rel)).filter(Boolean);
}

export function loadNote(root, rel) {
  const abs = path.join(root, rel);
  const text = readText(abs);
  if (text === null) return null;
  const { hasFm, fmText, body } = splitFrontmatter(text);
  const fm = hasFm ? parseFrontmatter(fmText) : {};
  let mtime = null;
  try { mtime = fs.statSync(abs).mtime; } catch { /* ignore */ }
  return {
    rel, abs, text, hasFm, fmText, fm, body, mtime,
    name: path.posix.basename(rel, '.md'),
    folder: path.posix.dirname(rel),
    title: ((/^#\s+(.+)$/m.exec(body) || [])[1] || '').trim() || path.posix.basename(rel, '.md'),
  };
}

export const str = v => String(Array.isArray(v) ? v.join(', ') : (v ?? '')).trim();

// ---------------------------------------------------------------- markdown structure

/** The text of the first section whose heading matches re (until the next heading of the same or a higher level). */
export function getSection(body, re) {
  const lines = normalizeEol(body).split('\n');
  let start = -1; let level = 0; let fence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(```|~~~)/.test(lines[i])) fence = !fence;
    if (fence) continue;
    const m = /^(#{1,6})\s+(.*)$/.exec(lines[i]);
    if (!m) continue;
    if (start === -1) { if (re.test(m[2].trim())) { start = i; level = m[1].length; } }
    else if (m[1].length <= level) return lines.slice(start + 1, i).join('\n');
  }
  return start === -1 ? null : lines.slice(start + 1).join('\n');
}

/** Top-level bullet or numbered items of a block of text (the first line of each item). */
export function getBullets(text) {
  if (!text) return [];
  return normalizeEol(text).split('\n')
    .map(l => /^(?:[-*+]|\d+[.)])\s+(.*\S)\s*$/.exec(l))
    .filter(Boolean).map(m => m[1]);
}

/** Splits a markdown table row into cells, honouring `\|` escapes and pipes inside [[wikilinks]] and `code`. */
export function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const cells = []; let cur = ''; let link = 0; let code = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && s[i + 1] === '|') { cur += link ? '\\|' : '|'; i++; continue; }
    if (c === '`') code = !code;
    if (!code && c === '[' && s[i + 1] === '[') { link++; cur += '[['; i++; continue; }
    if (!code && c === ']' && s[i + 1] === ']' && link) { link--; cur += ']]'; i++; continue; }
    if (c === '|' && !link && !code) { cells.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  cells.push(cur.trim());
  return cells;
}

/** Every markdown table in a body: { heading, header: [..], rows: [[..]] }. */
export function parseTables(body) {
  const lines = normalizeEol(body).split('\n');
  const tables = []; let heading = ''; let fence = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*(```|~~~)/.test(l)) { fence = !fence; continue; }
    if (fence) continue;
    const h = /^#{1,6}\s+(.*)$/.exec(l);
    if (h) { heading = h[1].trim(); continue; }
    if (/^\s*\|/.test(l) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const header = splitRow(l);
      const rows = [];
      let j = i + 2;
      while (j < lines.length && /^\s*\|/.test(lines[j])) { rows.push(splitRow(lines[j])); j++; }
      tables.push({ heading, header, rows });
      i = j - 1;
    }
  }
  return tables;
}

/** Index of the first header cell matching re, or -1. */
export const col = (header, re) => header.findIndex(h => re.test(h));

// ---------------------------------------------------------------- wikilinks

/**
 * Every [[wikilink]] and ![[embed]] in a text, with its line number and whether it sits in a fenced code
 * block or an inline code span. Handles [[name]], [[name|alias]], [[name#heading]], [[name#^block]] and
 * the table form [[name\|alias]]. target is '' for a same-note link ([[#heading]]).
 */
export function extractWikilinks(text) {
  const out = [];
  const lines = normalizeEol(text).split('\n');
  let fence = false;
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; continue; }
    const codeRanges = [];
    const codeRe = /(`+)[^`]*?\1/g; let cm;
    while ((cm = codeRe.exec(line))) codeRanges.push([cm.index, cm.index + cm[0].length]);
    const re = /(!?)\[\[([^[\]\n]+?)\]\]/g; let m;
    while ((m = re.exec(line))) {
      const inner = m[2];
      const pipe = inner.search(/\\?\|/);
      let target = pipe === -1 ? inner : inner.slice(0, pipe);
      const hash = target.indexOf('#');
      if (hash !== -1) target = target.slice(0, hash);
      target = target.replace(/\\$/, '').trim();
      out.push({
        raw: m[0], target, embed: m[1] === '!', line: n + 1, inFence: fence,
        inInlineCode: codeRanges.some(([a, b]) => m.index >= a && m.index < b),
      });
    }
  }
  return out;
}

/** Resolves link targets the way Obsidian does: by file name anywhere in the vault, or by a path suffix. */
export function buildResolver(root) {
  const files = walkFiles(root);
  const byBase = new Map();
  const add = key => {
    const base = key.split('/').pop();
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base).push(key);
  };
  const mdKeys = new Set(); const fileKeys = new Set();
  for (const rel of files) {
    const low = rel.toLowerCase();
    if (low.endsWith('.md')) { const k = low.slice(0, -3); mdKeys.add(k); add(k); }
    fileKeys.add(low); add(low);
  }
  const matchIn = (t, set) => (byBase.get(t.split('/').pop()) || []).some(k => set.has(k) && (k === t || k.endsWith('/' + t)));
  return {
    files,
    resolve(target) {
      let t = String(target).replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\//, '').trim().toLowerCase();
      if (!t) return true;
      if (t.endsWith('.md')) t = t.slice(0, -3);
      if (matchIn(t, mdKeys)) return true;
      if (/\.[a-z0-9]{1,6}$/.test(t) && matchIn(t, fileKeys)) return true;
      return false;
    },
    /** Basenames (lower case, no .md) used by more than one markdown file. */
    duplicateBasenames() {
      const counts = new Map();
      for (const k of mdKeys) { const b = k.split('/').pop(); counts.set(b, (counts.get(b) || 0) + 1); }
      return new Set([...counts].filter(([, c]) => c > 1).map(([b]) => b));
    },
  };
}

// ---------------------------------------------------------------- secrets and PII

/** Addresses that may always appear in notes: the commit co-author address and the GitHub remote, not people. */
export const ALLOWED_EMAILS = new Set(['noreply@anthropic.com', 'git@github.com']);
const ALLOWED_EMAIL_SUFFIXES = ['@users.noreply.github.com'];
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/** The fixed allow-list plus every address written in config/operator.md and config/company.md (the Owner's,
 *  the Operators' and the company's own public addresses; never a customer's or a lead's). */
export function allowedEmails(root) {
  const set = new Set(ALLOWED_EMAILS);
  for (const rel of ['config/operator.md', 'config/company.md']) {
    const t = readText(path.join(root, rel)) || '';
    for (const m of t.matchAll(EMAIL_RE)) set.add(m[0].toLowerCase());
  }
  return set;
}
const SECRETISH_NAME = /(TOKEN|KEY|SECRET|PASSWORD|PASSWD|PASS|AUTH|CREDENTIAL|PRIVATE|API|DSN|COOKIE|SESSION|WEBHOOK)/;
const PLACEHOLDER = /^(|<[^>]*>|\{\{.*\}\}|\$\{?[A-Za-z_]\w*\}?|x+|\.\.\.|…|\*+|-+|changeme|change-me|placeholder|redacted|\[redacted\]|your[_-][\w-]*|none|null|todo|tbd|n\/a)$/i;

/** Variable names declared in .env.example (never .env itself). */
export function envExampleNames(root) {
  const t = readText(path.join(root, '.env.example'));
  if (!t) return new Set();
  return new Set([...t.matchAll(/^\s*#?\s*([A-Z][A-Z0-9_]*)\s*=/gm)].map(m => m[1]));
}

// Phone shapes, any country: an international number (+ country code, then groups) or a national number that starts
// with the trunk 0 (grouped with spaces or dashes, or 10-11 digits in one run). 8-15 digits in all. Meta ids
// (15-19 digits, never a leading 0 or +), dates (YYYY-MM-DD) and times are not phones.
const PHONE_RES = [
  /(?<![\w+])\+\d{1,3}(?:[ .-]?\(?\d{1,4}\)?)(?:[ .-]?\d{2,4}){1,4}(?![\d:-])/g,
  /(?<![\w.:-])0\d{1,4}[ -]\d{3,4}[ -]?\d{3,4}(?![\d:-])/g,
  /(?<![\w.:-])0\d{9,10}(?![\w.:-])/g,
];
const digitCount = s => (s.match(/\d/g) || []).length;

const PATTERNS = [
  { kind: 'meta-token', re: /EAA[A-Za-z0-9]{40,}/g },
  { kind: 'api-key', re: /(?<![A-Za-z0-9])sk-[A-Za-z0-9]{20,}/g },
  { kind: 'fal-key', re: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[0-9a-f]{32}/g },
  { kind: 'email', re: EMAIL_RE },
  ...PHONE_RES.map(re => ({ kind: 'phone', re })),
];

function emailAllowed(e, allowed) {
  const low = e.toLowerCase();
  return allowed.has(low) || ALLOWED_EMAIL_SUFFIXES.some(s => low.endsWith(s));
}

/**
 * Finds token shapes, emails (outside the allowed set: pass `allowed` from allowedEmails(root)), phone numbers
 * and `.env` names written with a value. Returns [{ kind, line, start, end }] sorted by position; the tools print
 * the kind and line only, never the match.
 */
export function scanSecrets(text, { envNames = new Set(), allowed = ALLOWED_EMAILS } = {}) {
  const hits = [];
  const t = String(text);
  const lineAt = i => t.slice(0, i).split('\n').length;
  for (const { kind, re } of PATTERNS) {
    re.lastIndex = 0; let m;
    while ((m = re.exec(t))) {
      if (kind === 'email' && emailAllowed(m[0], allowed)) continue;
      if (kind === 'phone') {
        const n = digitCount(m[0]);
        if (n < 8 || n > 15) continue;
        if (hits.some(h => h.kind === 'phone' && m.index < h.end && m.index + m[0].length > h.start)) continue;
      }
      hits.push({ kind, match: m[0], line: lineAt(m.index), start: m.index, end: m.index + m[0].length });
    }
  }
  const envRe = /(?<![A-Za-z0-9_])([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)=("[^"\n]*"|'[^'\n]*'|[^\s`'"|<>]*)/g; let m;
  while ((m = envRe.exec(t))) {
    const name = m[1];
    if (!envNames.has(name) && !SECRETISH_NAME.test(name)) continue;
    const val = m[2].replace(/^["']|["']$/g, '').trim();
    if (PLACEHOLDER.test(val)) continue;
    hits.push({ kind: 'env-value', match: m[0], name, line: lineAt(m.index), start: m.index + name.length + 1, end: m.index + m[0].length });
  }
  return hits.sort((a, b) => a.start - b.start);
}

/** Replaces every hit of scanSecrets with [redacted] (an .env hit keeps its name: NAME=[redacted]). */
export function scrubSecrets(text, opts) {
  let t = String(text);
  const hits = scanSecrets(t, opts);
  let lastStart = Infinity;
  for (let i = hits.length - 1; i >= 0; i--) {
    const h = hits[i];
    if (h.end > lastStart) continue; // overlaps a hit already replaced
    t = t.slice(0, h.start) + '[redacted]' + t.slice(h.end);
    lastStart = h.start;
  }
  return t;
}

// ---------------------------------------------------------------- .claude inventory (skills, agents)

/** Skills from .claude/skills/<dir>/SKILL.md: { name, dir, description, source, path, fm, body }. */
export function listSkills(root) {
  const dir = path.join(root, '.claude', 'skills');
  let lock = {};
  try { lock = JSON.parse(fs.readFileSync(path.join(root, 'skills-lock.json'), 'utf8')).skills || {}; } catch { /* none */ }
  let names = [];
  try { names = fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort(); } catch { return []; }
  return names.map(n => {
    const rel = `.claude/skills/${n}/SKILL.md`;
    const text = readText(path.join(root, rel));
    if (text === null) return null;
    const parts = splitFrontmatter(text);
    const fm = parseFrontmatter(parts.fmText);
    const name = str(fm.name) || n;
    return { name, dir: n, description: str(fm.description), source: lock[n]?.source || lock[name]?.source || 'project', path: rel, fm, body: parts.body };
  }).filter(Boolean);
}

/** Agents from .claude/agents/*.md: { name, model, description, tools, disallowedTools, skills, path }. */
export function listAgents(root) {
  const dir = path.join(root, '.claude', 'agents');
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort(); } catch { return []; }
  const list = v => (Array.isArray(v) ? v.map(String) : str(v) ? str(v).split(',').map(s => s.trim()).filter(Boolean) : []);
  return files.map(f => {
    const rel = `.claude/agents/${f}`;
    const fm = parseFrontmatter(splitFrontmatter(readText(path.join(root, rel)) || '').fmText);
    return {
      name: str(fm.name) || path.basename(f, '.md'), model: str(fm.model) || null, description: str(fm.description),
      tools: list(fm.tools), disallowedTools: list(fm.disallowedTools), skills: list(fm.skills), path: rel,
    };
  });
}

// ---------------------------------------------------------------- CLI helpers

export function parseFlags(argv = process.argv.slice(2)) {
  const flags = new Set(); const values = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root' || a === '--by' || a === '--now') { values[a.slice(2)] = argv[++i]; continue; }
    if (a.startsWith('--')) flags.add(a.slice(2));
  }
  return { flags, values };
}

/** True when the module at metaUrl is the process entry point. */
export const isMain = metaUrl => {
  try { return path.resolve(fileURLToPath(metaUrl)) === path.resolve(process.argv[1] || ''); } catch { return false; }
};
