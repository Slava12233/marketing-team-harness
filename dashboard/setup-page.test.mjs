// dashboard/setup-page.test.mjs: smoke test of setup-page.mjs. It works in throwaway copies under the system temp
// folder and never touches this repository's own dashboard files. Run: node dashboard/setup-page.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLE = join(REPO, 'examples', 'acme-fitness');
const FIXTURES = join(REPO, 'templates', 'company');   // the blank company files a new copy is reset to (memory/tools/instance.mjs)

function withCopy(example, fn) {   // a minimal harness folder: the template files, or the fictional example over them
  const dir = mkdtempSync(join(tmpdir(), 'setup-page-'));
  try {
    writeFileSync(join(dir, 'CLAUDE.md'), '');
    // The bare template comes from templates/company/ (config/ with its {{ placeholders, the empty checklist, the
    // empty state file: the files a new copy is reset to), so a company's filled config/ never changes a result.
    cpSync(join(REPO, '.mcp.json'), join(dir, '.mcp.json'));
    cpSync(join(FIXTURES, 'checklist.md'), join(dir, 'checklist.md'));
    cpSync(join(FIXTURES, 'config'), join(dir, 'config'), { recursive: true });
    cpSync(join(REPO, 'config', 'README.md'), join(dir, 'config', 'README.md'));
    mkdirSync(join(dir, 'dashboard'));
    mkdirSync(join(dir, 'plans'));
    cpSync(join(REPO, 'dashboard', 'setup-page.mjs'), join(dir, 'dashboard', 'setup-page.mjs'));
    cpSync(join(FIXTURES, 'dashboard', 'state.json'), join(dir, 'dashboard', 'state.json'));
    if (example) {
      cpSync(join(EXAMPLE, 'config'), join(dir, 'config'), { recursive: true });
      cpSync(join(EXAMPLE, 'checklist.md'), join(dir, 'checklist.md'));
      cpSync(join(EXAMPLE, 'plans'), join(dir, 'plans'), { recursive: true });
      writeFileSync(join(dir, 'dashboard', 'state.json'), JSON.stringify({ campaigns: [{ id: '600000000000001', name: 'Example', status: 'PAUSED' }] }));
    }
    fn(dir);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
// Where the page looks for the Obsidian app and its vault list: pointed into the copy, so the machine's own
// Obsidian install never changes a result. The folder 'away' is empty unless a test fills it.
const away = dir => join(dir, 'away');
const SANDBOXED = ['LOCALAPPDATA', 'ProgramFiles', 'ProgramW6432', 'APPDATA', 'HOME', 'USERPROFILE', 'XDG_CONFIG_HOME'];
const sandbox = dir => {   // names compared without case (Git Bash spells PROGRAMFILES); Windows rebuilds ProgramFiles from ProgramW6432
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !SANDBOXED.some(n => n.toLowerCase() === k.toLowerCase())));
  for (const n of SANDBOXED) env[n] = away(dir);
  return env;
};
// On Windows every Obsidian location is under those variables; elsewhere a machine-wide app may still be found.
const SEALED = process.platform === 'win32';
const run = (dir, ...args) => spawnSync(process.execPath, [join(dir, 'dashboard', 'setup-page.mjs'), ...args], { encoding: 'utf8', env: sandbox(dir) });
function page(dir) {   // the written page, its embedded data, and the status of every item it shows
  const html = readFileSync(join(dir, 'dashboard', 'setup.html'), 'utf8');
  const m = html.match(/<script type="application\/json" id="setup-data">([^<]*)<\/script>/);
  assert.ok(m, 'the page embeds its data');
  const data = JSON.parse(m[1]), st = {};
  for (const c of data.model.chapters) for (const i of c.items || []) st[i.key] = i.status;
  return { html, data, st };
}

test('bare template: everything to do except .mcp.json; offline; optional rows hidden', () => withCopy(false, dir => {
  const r = run(dir, '--print');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, SEALED ? /^setup page: 1\/52 done, next: Git installed/m : /^setup page: \d+\/52 done, next: Git installed/m);
  const { html, st } = page(dir);
  const app = ['obsidian.installed', 'obsidian.vault_opened', 'obsidian.cli', 'app.desktop'];   // machine-wide installs off Windows
  for (const [k, s] of Object.entries(st)) {
    if (!SEALED && app.includes(k)) continue;
    assert.equal(s, k === 'install.mcpjson' ? 'done' : 'todo', k);
  }
  assert.ok(!('meta.webhook' in st) && !('meta.instagram' in st));
  assert.match(html, /<html lang="en" dir="ltr">/);
  assert.match(html, /<meta http-equiv="refresh" content="5">/);
  assert.doesNotMatch(html, /(src|href)=["']?(https?:)?\/\//i, 'no external resource');
}));

test('marks: merged into setup-progress.json; a bad key, status or language exits 2; a file answer wins', () => withCopy(false, dir => {
  let r = run(dir, '--mark', 'interview.a=done', '--mark', 'install.git=done');
  assert.equal(r.status, 0, r.stderr);
  const prog = JSON.parse(readFileSync(join(dir, 'dashboard', 'setup-progress.json'), 'utf8'));
  assert.deepEqual(prog.marks, { 'interview.a': 'done', 'install.git': 'done' });
  assert.ok(!Number.isNaN(Date.parse(prog.updatedAt)));
  assert.equal(page(dir).st['interview.a'], 'done');
  r = run(dir, '--mark', 'bogus=done');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /install\.git/);
  assert.equal(run(dir, '--mark', 'install.git=maybe').status, 2);
  assert.equal(run(dir, '--lang', 'fr').status, 2);
  r = run(dir, '--mark', 'install.env=done');
  assert.equal(r.status, 0);
  assert.equal(page(dir).st['install.env'], 'todo');
  assert.match(r.stderr, /win over a mark/);
}));

test('the fictional example: statuses from the files; .env never read; Hebrew renders right to left', () => withCopy(true, dir => {
  writeFileSync(join(dir, '.env'), 'META_MARKETING_TOKEN=sentinel-never-shown\n');
  assert.equal(run(dir).status, 0);
  let { html, st } = page(dir);
  const want = { 'meta.portfolio': 'done', 'meta.page': 'done', 'meta.adaccount': 'done', 'meta.payment': 'done',
    'meta.phone': 'done', 'meta.login': 'done', 'meta.pixel': 'done', 'meta.apptoken': 'owner', 'meta.whatsapp': 'na',
    'meta.leadads': 'done', 'meta.leadscenter': 'owner', 'meta.domain': 'owner', 'meta.people': 'todo',
    'setup.files': 'done', 'setup.plan': 'done', 'flight.build': 'done', 'install.env': 'done', 'fal.login': 'todo' };
  for (const r of 'abcdefghi') want['interview.' + r] = 'done';
  for (const [k, s] of Object.entries(want)) assert.equal(st[k], s, k);
  assert.ok(!('meta.webhook' in st) && !('meta.instagram' in st), 'n/a optional rows are hidden');
  assert.ok(!html.includes('sentinel-never-shown'), '.env never reaches the page');
  assert.match(html, /Setup progress · Acme Fitness/);
  assert.equal(run(dir, '--lang', 'he').status, 0);
  ({ html } = page(dir));
  assert.match(html, /<html lang="he" dir="rtl">/);
  assert.match(html, /התור שלכם/);
}));

test('both string tables cover every chapter, item, status and hint; the embedded scripts compile', () => withCopy(false, dir => {
  run(dir, '--mark', 'meta.webhook=todo', '--mark', 'meta.instagram=todo');   // marks show the optional rows (placeholders here)
  const { html, data } = page(dir);
  const keys = data.model.chapters.flatMap(c => (c.items || []).map(i => i.key));
  assert.equal(keys.length, 54);
  for (const lang of ['en', 'he']) {
    const S = data.strings[lang];
    for (const p of ['A', 'B']) assert.ok(S.parts[p], `${lang} part ${p}`);
    for (const c of data.model.chapters) {
      assert.ok(S.chapters[c.id], `${lang} chapter ${c.id}`);
      if (c.info) assert.ok(S.info[c.id] && S.info[c.id].length, `${lang} info lines ${c.id}`);
    }
    for (const k of keys) assert.ok(S.items[k], `${lang} item ${k}`);
    for (const s of ['todo', 'doing', 'done', 'owner', 'na']) assert.ok(S.status[s], `${lang} status ${s}`);
    assert.deepEqual(Object.keys(S.hints).sort(), Object.keys(data.strings.en.hints).sort(), `${lang} hints`);
  }
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert.equal(scripts.length, 2);
  for (const s of scripts) assert.doesNotThrow(() => new Function(s), 'an inline script compiles');
  const src = html.match(/var render = (function renderPage\([\s\S]*?\});\n {2}function show\(/)[1];
  const render = new Function('return ' + src)();
  const first = html.match(/<main id="app">([\s\S]*?)<\/main>/)[1];
  assert.equal(render(data.model, data.strings[data.model.lang], data.glyphs), first, 'the toggle renders what Node rendered');
  assert.match(render(data.model, data.strings.he, data.glyphs), /עדכון אחרון/);
}));

test('the memory vault chapter: app, Obsidian config, shipped hooks and business note answered by files; never a click', () => withCopy(false, dir => {
  const keys = ['obsidian.installed', 'obsidian.vault_opened', 'obsidian.cli', 'obsidian.hooks', 'memory.business_filled', 'memory.routines'];
  let r = run(dir, '--print');
  assert.equal(r.status, 0, r.stderr);
  let { html, data, st } = page(dir);
  const ch = data.model.chapters.find(c => c.id === 'vault');
  assert.deepEqual(ch.items.map(i => i.key), keys);
  assert.equal(data.model.chapters.indexOf(ch), 14, 'in Part B, after the first flight: the video\'s chapter B4');
  assert.equal(ch.n, 'B4');
  assert.equal(st['obsidian.hooks'], 'todo', 'no settings file in this copy');
  assert.equal(st['memory.business_filled'], 'todo');
  assert.equal(st['memory.routines'], 'todo', 'no routine row in this copy');
  assert.equal(st['obsidian.vault_opened'], 'todo');
  assert.equal(st['obsidian.cli'], 'todo');
  if (SEALED) assert.equal(st['obsidian.installed'], 'todo');
  for (const lang of ['en', 'he']) {
    for (const k of ['obsidian.vault_opened', 'obsidian.cli']) assert.match(data.strings[lang].hints[k], /obsidian-setup\.mjs/, `${lang} hint ${k}`);
    assert.match(data.strings[lang].hints['obsidian.hooks'], /hooks-paste-block\.md/);
  }
  assert.match(html, /<span class="hint">[^<]*<code dir="ltr">node memory\/tools\/obsidian-setup\.mjs<\/code>/, 'an open Obsidian item shows its command');
  assert.match(r.stdout, /\[obsidian\.cli\] \(Nothing to click/);
  assert.doesNotMatch(html + r.stdout, /Settings → General|Open folder as vault/, 'no click is asked in Obsidian');
  // the bootstrap's mark counts while no app is found; a mark on a file-answered item does not
  r = run(dir, '--mark', 'obsidian.installed=done', '--mark', 'obsidian.cli=done', '--mark', 'obsidian.hooks=done');
  assert.equal(r.status, 0, r.stderr);
  ({ st } = page(dir));
  assert.equal(st['obsidian.installed'], 'done');
  assert.equal(st['obsidian.vault_opened'], 'todo');
  assert.equal(st['obsidian.cli'], 'todo');
  assert.equal(st['obsidian.hooks'], 'todo');
  assert.match(r.stderr, /obsidian\.cli stays todo/);
  writeFileSync(join(dir, 'dashboard', 'setup-progress.json'), '{"marks":{}}');
  // the files: the app where its installer puts it, this folder in Obsidian's vault list, the shipped hooks, the note
  const a = away(dir);
  const exe = process.platform === 'win32' ? join(a, 'Programs', 'Obsidian', 'Obsidian.exe')
    : process.platform === 'darwin' ? join(a, 'Applications', 'Obsidian.app') : join(a, '.local', 'bin', 'obsidian');
  mkdirSync(dirname(exe), { recursive: true });
  if (process.platform === 'darwin') mkdirSync(exe); else writeFileSync(exe, '');
  const reg = process.platform === 'win32' ? join(a, 'obsidian') : process.platform === 'darwin'
    ? join(a, 'Library', 'Application Support', 'obsidian') : join(a, 'obsidian');
  mkdirSync(reg, { recursive: true });
  const vaults = { abc123: { path: dir + (process.platform === 'win32' ? '\\' : '/'), ts: 1, open: true } };
  writeFileSync(join(reg, 'obsidian.json'), JSON.stringify({ vaults }));
  mkdirSync(join(dir, '.claude'));
  cpSync(join(REPO, '.claude', 'settings.json'), join(dir, '.claude', 'settings.json'));   // the shipped file
  mkdirSync(join(dir, 'memory', 'business'), { recursive: true });
  writeFileSync(join(dir, 'memory', 'business', 'company.md'), '# Company\n\nName: <fill at /setup>\n');
  assert.equal(run(dir).status, 0);
  ({ st } = page(dir));
  assert.equal(st['obsidian.installed'], 'done');
  assert.equal(st['obsidian.vault_opened'], 'done');
  assert.equal(st['obsidian.cli'], 'todo', 'the config does not say "cli": true yet');
  assert.equal(st['obsidian.hooks'], 'done', 'the shipped settings file carries the hooks');
  assert.equal(st['memory.business_filled'], 'todo', 'a placeholder is left');
  writeFileSync(join(reg, 'obsidian.json'), JSON.stringify({ vaults, cli: true }));
  writeFileSync(join(dir, 'memory', 'business', 'company.md'), '# Company\n\nName: Example Co\n');
  // the routines row of config/operator.md: declined is n/a, registered is done; never a click
  mkdirSync(join(dir, 'config'), { recursive: true });
  const op = join(dir, 'config', 'operator.md');
  writeFileSync(op, '## Memory routines\n\n| Nightly memory check | not registered: declined | | |\n');
  assert.equal(run(dir).status, 0);
  assert.equal(page(dir).st['memory.routines'], 'na');
  writeFileSync(op, '## Memory routines\n\n| Nightly memory check | harness-nightly-memory-check | 0 23 * * 1-5 | x |\n');
  assert.equal(run(dir).status, 0);
  ({ data, st } = page(dir));
  assert.equal(st['obsidian.cli'], 'done');
  assert.equal(st['memory.business_filled'], 'done');
  assert.equal(st['memory.routines'], 'done');
  assert.equal(data.model.chapters.find(c => c.id === 'vault').status, 'done');
}));

test('two parts in the video\'s order: labels A0–A10 and B1–B5, the desktop app answered by a file, the new items marked', () => withCopy(false, dir => {
  let r = run(dir, '--lang', 'en', '--print');   // the fixture copies the real config/, whose chat language may be Hebrew
  assert.equal(r.status, 0, r.stderr);
  let { html, data, st } = page(dir);
  assert.deepEqual(data.model.chapters.map(c => c.n), ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'B1', 'B2', 'B3', 'B4', 'B5']);
  assert.deepEqual(data.model.chapters.filter(c => c.part === 'B').map(c => c.id), ['c8', 'c9', 'c10', 'vault', 'c11']);
  assert.equal(data.model.chapters.find(c => c.id === 'app').items.map(i => i.key).join(' '), 'app.desktop install.approved');
  assert.equal(data.model.chapters.find(c => c.id === 'keys').items[0].key, 'keys.table');
  assert.ok(data.model.chapters.find(c => c.id === 'c10').items.some(i => i.key === 'flight.video'), 'the video ad is a step of the first flight');
  assert.match(html, /<h2 class="part">Part A, \/connect: accounts and keys/);
  assert.match(html, /<h2 class="part">Part B, \/campaign: the first campaign<\/h2>/);
  assert.match(r.stdout, /== Part A, \/connect: accounts and keys/);
  assert.match(r.stdout, /^A3\. Claude in Chrome/m);
  assert.match(r.stdout, /^B3\. First campaign built PAUSED/m);
  for (const k of ['chrome.extension', 'keys.table', 'flight.video']) assert.equal(st[k], 'todo', k);
  if (SEALED) assert.equal(st['app.desktop'], 'todo', 'no app under the sandboxed folders');
  assert.match(html, /<span class="hint">[^<]*Connectors/, 'an open extension item shows the Owner\'s path');
  // marks on the new items count; then the desktop app is answered by its launcher once that file is there
  r = run(dir, '--mark', 'chrome.extension=done', '--mark', 'keys.table=done', '--mark', 'flight.video=done', '--mark', 'app.desktop=done');
  assert.equal(r.status, 0, r.stderr);
  ({ st } = page(dir));
  for (const k of ['chrome.extension', 'keys.table', 'flight.video', 'app.desktop']) assert.equal(st[k], 'done', k);
  writeFileSync(join(dir, 'dashboard', 'setup-progress.json'), '{"marks":{}}');
  const a = away(dir);
  if (process.platform === 'win32') { mkdirSync(join(a, 'Microsoft', 'WindowsApps'), { recursive: true }); writeFileSync(join(a, 'Microsoft', 'WindowsApps', 'claude-desktop.exe'), ''); }
  else if (process.platform === 'darwin') mkdirSync(join(a, 'Applications', 'Claude.app'), { recursive: true });
  assert.equal(run(dir).status, 0);
  ({ st } = page(dir));
  if (process.platform !== 'linux') assert.equal(st['app.desktop'], 'done', 'the launcher file answers');
  assert.equal(st['chrome.extension'], 'todo', 'no mark left');
}));
