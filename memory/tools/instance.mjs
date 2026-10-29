#!/usr/bin/env node
// memory/tools/instance.mjs: every copy of this harness is a new business. Node 20+, no dependencies.
// A copy (a clone of the template, a zip, a folder copied from another company's harness) is recognised by the
// instance marker .harness-instance.json at the folder's root: it names the folder and the computer it was
// written for, it is never committed (.gitignore) and never shipped (docs/UPGRADE-PATHS.txt [never]). A folder
// with no marker, or with a marker written for another folder or another computer, is a new copy, with no
// question asked. Its reset moves every company file it finds (config/, checklist.md, the vault's company notes,
// plans/, reports/, the flights' creatives, the progress page's files, .env, .vercel/) into a dated archive
// .previous-company/<stamp>/ (gitignored, outside the vault), puts the blank files of templates/company/ back,
// recreates .env from .env.example, and writes the marker. Harness files (CLAUDE.md, skills, tools, the vault's
// machinery, the platform learnings in memory/learnings/) are never touched. A blank folder only gets its marker.
//
//   node memory/tools/instance.mjs --check              exit 0: this folder's own harness; exit 3: a new copy
//   node memory/tools/instance.mjs --reset              a new copy: archive, blank, marker (nothing when exit 0 above)
//   node memory/tools/instance.mjs --reset --dry-run    the list of what would be archived, nothing moved
//   node memory/tools/instance.mjs --restore <archive>  an archived company back into this folder (the current
//                                                       company files are archived first); the marker is written
//   node memory/tools/instance.mjs --adopt              the marker for a folder that has none, nothing moved: only
//                                                       upgrade.sh / upgrade.ps1 run it (an upgrade in place is the
//                                                       same business); a marker from elsewhere is left as it is
//   node memory/tools/instance.mjs --gate               the template's blank gate (docs/scrub-check.sh, the release):
//                                                       every tracked company file is its blank template, exit 1 if not
//   options: --root <dir> (default: the harness folder this file is in), --force (reset even this folder's own
//            harness), --json, --quiet (one word: same | new | marked | archived <path> | restored <path>)
//
// .env is moved or copied as a file, never opened, read or printed. Nothing is deleted: every company file that
// leaves its place is in the archive. Exit codes: 0 done (or the same harness), 1 failed, 2 usage, 3 a new copy
// (--check only); --gate: 0 clean, 1 a company file is tracked.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const MARKER = '.harness-instance.json';
const ARCHIVE = '.previous-company';
const TEMPLATES = 'templates/company';

// The company's files: everything under these folders (but the keep files) and these single files.
const COMPANY_DIRS = ['config', 'memory/state', 'memory/business', 'memory/campaigns', 'memory/flights',
  'memory/audiences', 'memory/experiments', 'memory/decisions', 'memory/sessions', 'memory/open', 'memory/reviews',
  'memory/archive', 'memory/tooling', 'memory/capabilities', 'memory/money', 'memory/inbox', 'plans', 'reports',
  'creatives/src', 'creatives/briefs', 'creatives/uploads', '.vercel'];
const COMPANY_FILES = ['checklist.md', 'memory/HOME.md', 'memory/HOME.en.md', 'memory/HOT.md', 'memory/INDEX.md',
  'dashboard/state.json', 'dashboard/state.local.json', 'dashboard/setup-data.js', 'dashboard/setup-live.js', 'dashboard/setup-progress.json',
  'dashboard/bootstrap-result.json', '.env.local'];
const HARNESS_FILES = new Set(['config/README.md']);                   // harness-owned files inside a company folder
const HARNESS_CREATIVES = new Set(['tools', 'preview-template', 'landing-template', 'src', 'briefs', 'uploads']);
const KEEP = new Set(['.gitkeep', '_about.md']);                       // folder descriptions stay in place

const usage = () => `Usage: node memory/tools/instance.mjs (--check | --reset [--dry-run] [--force] | --restore <archive> | --adopt | --gate) [--root <dir>] [--json] [--quiet]
Every copy of the harness is a new business: --check says whether this folder is its own harness (exit 0) or a new copy (exit 3);
--reset archives another company's files into ${ARCHIVE}/<stamp>/, restores the blank templates and writes ${MARKER}.`;

function parseArgs(argv) {
  const o = { mode: '', root: path.resolve(here, '..', '..'), dryRun: false, force: false, json: false, quiet: false, from: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check' || a === '--reset' || a === '--restore' || a === '--adopt' || a === '--gate') {
      if (o.mode) throw new Error('one mode only');
      o.mode = a.slice(2);
      if (a === '--restore') { o.from = argv[++i] || ''; if (!o.from) throw new Error('--restore needs the archive folder'); }
    } else if (a === '--root') o.root = path.resolve(argv[++i] || '');
    else if (a === '--dry-run') o.dryRun = true;
    else if (a === '--force') o.force = true;
    else if (a === '--json') o.json = true;
    else if (a === '--quiet') o.quiet = true;
    else if (a === '--help' || a === '-h') o.mode = 'help';
    else throw new Error(`unknown argument: ${a}`);
  }
  if (!o.mode) throw new Error('a mode is needed');
  return o;
}

const posix = (p) => p.split(path.sep).join('/');
const sameText = (a, b) => a.replace(/\r\n/g, '\n') === b.replace(/\r\n/g, '\n');
const key = (p) => (process.platform === 'win32' || process.platform === 'darwin' ? p.toLowerCase() : p);

function walk(root, rel, out) {   // every file under root/rel, as posix paths relative to root
  let entries;
  try { entries = fs.readdirSync(path.join(root, rel), { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) walk(root, r, out);
    else if (e.isFile()) out.push(r);
  }
  return out;
}

function templates(root) {   // posix path → blank text, from templates/company/
  const map = new Map();
  for (const rel of walk(path.join(root, TEMPLATES), '', [])) map.set(rel, fs.readFileSync(path.join(root, TEMPLATES, rel), 'utf8'));
  return map;
}

// The company files present in the folder, and those that differ from the blank templates (another company's).
function companyFiles(root, blank) {
  const found = new Set();
  for (const d of COMPANY_DIRS) for (const f of walk(root, d, [])) if (!KEEP.has(path.posix.basename(f)) && !HARNESS_FILES.has(f)) found.add(f);
  for (const f of COMPANY_FILES) if (fs.existsSync(path.join(root, f))) found.add(f);
  let flights = [];
  try { flights = fs.readdirSync(path.join(root, 'creatives'), { withFileTypes: true }); } catch { /* no creatives/ */ }
  for (const e of flights) if (e.isDirectory() && !HARNESS_CREATIVES.has(e.name)) for (const f of walk(root, `creatives/${e.name}`, [])) found.add(f);
  const foreign = [...found].filter((f) => !blank.has(f) || !sameText(fs.readFileSync(path.join(root, f), 'utf8'), blank.get(f))).sort();
  return { found: [...found].sort(), foreign };
}

function readMarker(root) {
  try { return JSON.parse(fs.readFileSync(path.join(root, MARKER), 'utf8')); } catch { return null; }
}

function status(root) {
  const m = readMarker(root);
  const machine = os.hostname();
  if (!m) return { same: false, reason: 'no instance marker: a fresh copy', marker: null };
  if (key(path.resolve(String(m.folder || ''))) !== key(root)) return { same: false, reason: `the marker was written for another folder (${m.folder})`, marker: m };
  if (String(m.machine || '').toLowerCase() !== machine.toLowerCase()) return { same: false, reason: `the marker was written on another computer (${m.machine})`, marker: m };
  return { same: true, reason: `this folder's own harness since ${m.created}`, marker: m };
}

function stamp() {
  const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function restrict(file) {
  try { fs.chmodSync(file, 0o600); } catch { /* Windows ignores it */ }
  if (process.platform === 'win32' && process.env.USERNAME) {
    spawnSync('icacls', [file, '/inheritance:r', '/grant:r', `${process.env.USERNAME}:(R,W)`], { stdio: 'ignore', windowsHide: true });
  }
}

function moveFile(root, rel, dest) {
  const to = path.join(dest, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  try { fs.renameSync(path.join(root, rel), to); } catch {
    fs.copyFileSync(path.join(root, rel), to); fs.rmSync(path.join(root, rel));
  }
}

function writeMarker(root, archived) {
  const m = { schema: 1, id: crypto.randomBytes(8).toString('hex'), folder: root, machine: os.hostname(),
    created: new Date().toISOString(), archived: archived || null };
  fs.writeFileSync(path.join(root, MARKER), JSON.stringify(m, null, 2) + '\n');
  return m;
}

function restoreBlank(root, blank) {   // every blank file not in its place (archived, or deleted by the wizard)
  for (const [rel, text] of blank) {
    const to = path.join(root, rel);
    if (fs.existsSync(to)) continue;
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, text);
  }
}

// Archive the company files that are not blank (and .env when there are any, or when the marker came from
// elsewhere), then put the blank templates back and recreate .env from .env.example.
function archiveAndBlank(root, blank, foreign, withEnv, dryRun) {
  const envPresent = fs.existsSync(path.join(root, '.env'));
  const list = [...foreign]; if (withEnv && envPresent) list.push('.env');
  if (dryRun) return { archive: null, moved: list };
  if (list.length === 0) { restoreBlank(root, blank); return { archive: null, moved: list }; }
  let rel = `${ARCHIVE}/${stamp()}`;
  for (let n = 2; fs.existsSync(path.join(root, rel)); n++) rel = `${ARCHIVE}/${stamp()}-${n}`;   // never into an archive that exists
  const dest = path.join(root, rel);
  fs.mkdirSync(dest, { recursive: true });
  for (const f of foreign) moveFile(root, f, dest);
  if (withEnv && envPresent) { moveFile(root, '.env', dest); restrict(path.join(dest, '.env')); }
  restoreBlank(root, blank);
  if (withEnv && fs.existsSync(path.join(root, '.env.example')) && !fs.existsSync(path.join(root, '.env'))) {
    fs.copyFileSync(path.join(root, '.env.example'), path.join(root, '.env')); restrict(path.join(root, '.env'));
  }
  return { archive: rel, moved: list };
}

function say(o, result, line) {
  if (o.json) process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  else if (o.quiet) process.stdout.write(result.word + '\n');
  else process.stdout.write(line + '\n');
}

function main() {
  let o;
  try { o = parseArgs(process.argv.slice(2)); } catch (e) { process.stderr.write(`${e.message}\n${usage()}\n`); return 2; }
  if (o.mode === 'help') { process.stdout.write(usage() + '\n'); return 0; }
  const root = o.root;
  if (!fs.existsSync(path.join(root, 'CLAUDE.md')) || !fs.existsSync(path.join(root, TEMPLATES))) {
    process.stderr.write(`not a harness folder with ${TEMPLATES}/: ${root}\n`); return 2;
  }
  const blank = templates(root);
  const st = status(root);
  const files = companyFiles(root, blank);

  if (o.mode === 'check') {
    const word = st.same ? 'same' : 'new';
    say(o, { word, same: st.same, reason: st.reason, foreign: files.foreign.length, marker: st.marker },
      st.same ? `same: ${st.reason}`
        : `new: ${st.reason}; ${files.foreign.length ? `${files.foreign.length} files of another company would be archived` : 'no other company\'s files'}. Run: node memory/tools/instance.mjs --reset, then /connect`);
    return st.same ? 0 : 3;
  }

  if (o.mode === 'gate') {   // the template repository ships no company: tracked files only (what a release carries)
    const git = spawnSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'utf8', windowsHide: true });
    const tracked = git.status === 0 ? new Set(git.stdout.split('\0').filter(Boolean)) : null;
    const hits = files.foreign.filter((f) => !tracked || tracked.has(f)).map((f) => `not blank: ${f}`);
    for (const rel of blank.keys()) if (!fs.existsSync(path.join(root, rel))) hits.push(`missing: ${rel}`);
    const more = hits.length > 40 ? [`   ... ${hits.length} in all`] : [];
    if (o.json) process.stdout.write(JSON.stringify({ clean: hits.length === 0, hits }, null, 2) + '\n');
    else if (hits.length) process.stdout.write(['== blank gate: the template holds a company\'s files (reset with node memory/tools/instance.mjs --reset --force)', ...hits.slice(0, 40), ...more].join('\n') + '\n');
    else process.stdout.write('blank gate: clean\n');
    return hits.length ? 1 : 0;
  }

  if (o.mode === 'adopt') {
    if (st.marker) { say(o, { word: st.same ? 'same' : 'new', same: st.same, reason: st.reason }, `${st.same ? 'same' : 'new'}: ${st.reason}; the marker is left as it is`); return 0; }
    writeMarker(root, null);
    say(o, { word: 'marked', same: true, reason: 'adopted by an upgrade in place' }, 'marked: this folder is its own harness (an upgrade in place keeps the business)');
    return 0;
  }

  if (o.mode === 'reset') {
    if (st.same && !o.force) { say(o, { word: 'same', same: true, reason: st.reason }, `same: ${st.reason}; nothing to reset`); return 0; }
    const withEnv = files.foreign.length > 0 || !!st.marker;   // another company was here: its .env goes too
    const r = archiveAndBlank(root, blank, files.foreign, withEnv, o.dryRun);
    if (o.dryRun) { say(o, { word: 'new', dryRun: true, would_archive: r.moved }, `dry run: ${r.moved.length} files would be archived${r.moved.length ? ':\n  ' + r.moved.join('\n  ') : ''}`); return 0; }
    writeMarker(root, r.archive);
    say(o, { word: r.archive ? `archived ${r.archive}` : 'marked', archive: r.archive, archived: r.moved.length, reason: st.reason },
      r.archive ? `new business: ${r.moved.length} files of the previous company moved to ${r.archive}/; the blank templates restored; .env recreated from .env.example; marker written. Next: /connect`
        : `new business: nothing of another company here; marker written. Next: /connect`);
    return 0;
  }

  // --restore <archive>: the archived company back in this folder (what is here now is archived first).
  const from = path.resolve(root, o.from);
  if (!fs.existsSync(from) || !fs.statSync(from).isDirectory()) { process.stderr.write(`no archive folder: ${from}\n`); return 2; }
  const back = walk(from, '', []);
  if (!back.length) { process.stderr.write(`the archive folder is empty: ${from}\n`); return 1; }
  const r = archiveAndBlank(root, blank, files.foreign, fs.existsSync(path.join(from, '.env')), false);
  for (const f of back) {
    const to = path.join(root, f);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    if (f === '.env' && fs.existsSync(to)) fs.rmSync(to);
    fs.copyFileSync(path.join(from, f), to);
    if (f === '.env') restrict(to);
  }
  writeMarker(root, r.archive);
  say(o, { word: `restored ${posix(path.relative(root, from)) || from}`, restored: back.length, archive: r.archive },
    `restored ${back.length} files from ${from}${r.archive ? `; what was here before is in ${r.archive}/` : ''}; marker written. Next: /health`);
  return 0;
}

try { process.exitCode = main(); } catch (e) { process.stderr.write(`instance.mjs failed: ${e.message}\n`); process.exitCode = 1; }
