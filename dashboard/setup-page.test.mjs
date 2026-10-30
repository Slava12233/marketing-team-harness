// dashboard/setup-page.test.mjs: smoke test of setup-page.mjs. It works in throwaway copies under the system temp
// folder and never touches this repository's own dashboard files. Run: node dashboard/setup-page.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
// The wizard as the browser shows it: the shipped default and renderer, plus the data file this copy wrote.
const DEFAULT_JS = join(REPO, 'dashboard', 'setup-default.js'), WIZARD_JS = join(REPO, 'dashboard', 'setup-wizard.js');
function loadInto(w, file) { new Function('window', readFileSync(file, 'utf8'))(w); return w; }
function page(dir, lang) {   // the rendered wizard, the data file, the strings, and the status of every item shown
  const text = readFileSync(join(dir, 'dashboard', 'setup-data.js'), 'utf8');
  const w = loadInto(loadInto(loadInto({}, DEFAULT_JS), WIZARD_JS), join(dir, 'dashboard', 'setup-data.js'));
  const data = w.SETUP_DATA, D = w.SETUP_DEFAULT, W = w.SetupWizard, st = {};
  const view = W.merge(D, data, null, Date.now());
  const html = W.render(view, D.strings[lang || data.lang], { hinted: D.hinted });
  for (const c of data.chapters) for (const i of c.items || []) st[i.key] = i.status;
  return { html, text, data, strings: D.strings, st, view };
}

test('bare template: everything to do except .mcp.json; offline; optional rows hidden', () => withCopy(false, dir => {
  const r = run(dir, '--print');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, SEALED ? /^setup page: 1\/60 done, next: Git installed/m : /^setup page: \d+\/60 done, next: Git installed/m);
  const { data, st } = page(dir);
  const app = ['obsidian.installed', 'obsidian.vault_opened', 'obsidian.cli', 'app.desktop'];   // machine-wide installs off Windows
  for (const [k, s] of Object.entries(st)) {
    if (!SEALED && app.includes(k)) continue;
    assert.equal(s, k === 'install.mcpjson' ? 'done' : 'todo', k);
  }
  assert.ok(!('meta.webhook' in st) && !('meta.instagram' in st));
  assert.equal(data.lang, 'en');
  assert.ok(!existsSync(join(dir, 'dashboard', 'setup.html')), 'the page is static and shipped: the generator never writes it');
  const shipped = readFileSync(join(REPO, 'dashboard', 'setup.html'), 'utf8');
  assert.doesNotMatch(shipped, /(src|href)=["']?(https?:)?\/\//i, 'no external resource');
  assert.match(shipped, /setup-default\.js/); assert.match(shipped, /setup-data\.js/); assert.match(shipped, /setup-live\.js/);
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
  let { html, text, st } = page(dir);
  const want = { 'meta.portfolio': 'done', 'meta.page': 'done', 'meta.adaccount': 'done', 'meta.payment': 'done',
    'meta.phone': 'done', 'meta.login': 'done', 'meta.pixel': 'done', 'meta.apptoken': 'owner', 'meta.whatsapp': 'na',
    'meta.leadads': 'done', 'meta.leadscenter': 'owner', 'meta.domain': 'owner', 'meta.people': 'todo',
    'setup.files': 'done', 'setup.plan': 'done', 'flight.build': 'done', 'install.env': 'done', 'fal.login': 'todo' };
  for (const r of 'abcdefghi') want['interview.' + r] = 'done';
  for (const [k, s] of Object.entries(want)) assert.equal(st[k], s, k);
  assert.ok(!('meta.webhook' in st) && !('meta.instagram' in st), 'n/a optional rows are hidden');
  assert.ok(!text.includes('sentinel-never-shown') && !html.includes('sentinel-never-shown'), '.env never reaches the page');
  assert.match(html, /<h1>Setup wizard<\/h1><p class="company">Acme Fitness · /);
  assert.equal(run(dir, '--lang', 'he').status, 0);
  let data;
  ({ html, data } = page(dir));
  assert.equal(data.lang, 'he');
  assert.equal(page(dir).strings.he.dir, 'rtl');
  assert.match(html, /התור שלכם/);
}));

test('both string tables cover every chapter, item, status and hint; the embedded scripts compile', () => withCopy(false, dir => {
  run(dir, '--mark', 'meta.webhook=todo', '--mark', 'meta.instagram=todo');   // marks show the optional rows (placeholders here)
  const { data, strings } = page(dir);
  const keys = data.chapters.flatMap(c => (c.items || []).map(i => i.key));
  assert.equal(keys.length, 62);
  for (const lang of ['en', 'he']) {
    const S = strings[lang];
    for (const p of ['A', 'B']) assert.ok(S.parts[p], `${lang} part ${p}`);
    for (const k of ['git', 'node', 'claude', 'env', 'manifest', 'app', 'chrome', 'playwright', 'obsidian', 'node_upgrade', 'ffmpeg', 'hyperframes', 'obsidian_setup', 'routines', 'instance', 'brew']) assert.ok(S.install[k], `${lang} install ${k}`);
    for (const k of ['pending', 'ok', 'installed', 'missing', 'skipped', 'todo', 'doing']) assert.ok(S.liveStatus[k], `${lang} live status ${k}`);
    for (const k of ['now', 'installing', 'checking', 'allSet', 'installNote', 'installStopped', 'waiting']) assert.ok(S[k], `${lang} ${k}`);
    for (const c of data.chapters) {
      assert.ok(S.chapters[c.id], `${lang} chapter ${c.id}`);
      if (c.info) assert.ok(S.info[c.id] && S.info[c.id].length, `${lang} info lines ${c.id}`);
    }
    for (const k of keys) assert.ok(S.items[k], `${lang} item ${k}`);
    for (const s of ['todo', 'doing', 'done', 'owner', 'na']) assert.ok(S.status[s], `${lang} status ${s}`);
    assert.deepEqual(Object.keys(S.hints).sort(), Object.keys(strings.en.hints).sort(), `${lang} hints`);
  }
  const shipped = readFileSync(join(REPO, 'dashboard', 'setup.html'), 'utf8');
  const scripts = [...shipped.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert.equal(scripts.length, 1);
  for (const s of scripts) assert.doesNotThrow(() => new Function(s), 'the inline script compiles');
  assert.match(page(dir, 'he').html, /עדכון אחרון/);
  // the shipped default is what --default writes from the tables (rewrite it with --default after a table change)
  assert.equal(run(dir, '--default').status, 0);
  assert.equal(readFileSync(join(dir, 'dashboard', 'setup-default.js'), 'utf8'), readFileSync(DEFAULT_JS, 'utf8'), 'dashboard/setup-default.js is stale: run node dashboard/setup-page.mjs --default');
}));

test('the live install: the bootstrap\'s items tick in chapter A1, the one being installed spins, a finished run shows what is missing', () => withCopy(false, dir => {
  assert.equal(run(dir).status, 0);
  const w = loadInto(loadInto(loadInto({}, DEFAULT_JS), WIZARD_JS), join(dir, 'dashboard', 'setup-data.js'));
  const D = w.SETUP_DEFAULT, W = w.SetupWizard, now = Date.parse('2026-10-29T12:00:30Z');
  const live = { started: '2026-10-29T12:00:00Z', updated: '2026-10-29T12:00:20Z', script: 'bootstrap.sh', mode: 'all', running: true, current: 'node',
    items: { git: 'ok', node: 'missing', claude: 'installed', env: 'pending', manifest: 'ok', app: 'ok', chrome: 'skipped', playwright: 'pending',
      obsidian: 'pending', node_upgrade: 'pending', ffmpeg: 'pending', hyperframes: 'pending', obsidian_setup: 'pending', routines: 'pending', instance: 'pending' } };
  let v = W.merge(D, w.SETUP_DATA, live, now);
  const a1 = v.chapters.find(c => c.id === 'c1');
  const st = Object.fromEntries(a1.items.map(i => [i.key, i.status]));
  assert.equal(st['live.git'], 'done'); assert.equal(st['live.claude'], 'done'); assert.equal(st['live.node'], 'doing');
  assert.equal(st['live.chrome'], 'na'); assert.equal(st['live.env'], 'todo');
  assert.ok(!('live.node_upgrade' in st) && !('live.routines' in st), 'quiet and later items are not listed');
  assert.equal(v.now.kind, 'installing');
  assert.equal(v.chapters.find(c => c.id === 'app').items.find(i => i.key === 'app.desktop').status, 'done', 'the app found by the bootstrap answers A2');
  let html = W.render(v, D.strings.en, { hinted: D.hinted });
  assert.match(html, /Installing Node\.js 20 or newer…/);
  assert.match(html, /<li class="item st-doing" data-key="live\.node">/);
  // the next view, after the install: Node.js turns done and pops
  const prev = W.statuses(v);
  live.items.node = 'installed'; live.current = 'env'; live.updated = '2026-10-29T12:00:25Z';
  v = W.merge(D, w.SETUP_DATA, live, now);
  const pop = W.popped(prev, v);
  assert.deepEqual(Object.keys(pop), ['live.node']);
  html = W.render(v, D.strings.he, { hinted: D.hinted, pop });
  assert.match(html, /<li class="item st-done pop" data-key="live\.node">/);
  assert.match(html, /מתקין את/);
  // finished with an item missing: the run is over, the item waits for the Owner
  live.running = false; live.current = ''; live.items.env = 'missing';
  v = W.merge(D, w.SETUP_DATA, live, now);
  assert.equal(v.chapters.find(c => c.id === 'c1').items.find(i => i.key === 'live.env').status, 'owner');
  // a running file not updated for 30 minutes is a stopped run
  live.running = true; live.current = 'ffmpeg';
  v = W.merge(D, w.SETUP_DATA, live, Date.parse('2026-10-29T13:00:00Z'));
  assert.equal(v.running, false);
  assert.notEqual(v.now.kind, 'installing');
}));

test('the memory vault chapter: app, Obsidian config, shipped hooks and business note answered by files; never a click', () => withCopy(false, dir => {
  const keys = ['obsidian.installed', 'obsidian.vault_opened', 'obsidian.cli', 'obsidian.hooks', 'memory.business_filled', 'memory.routines'];
  let r = run(dir, '--print');
  assert.equal(r.status, 0, r.stderr);
  let { html, data, st, strings } = page(dir);
  const ch = data.chapters.find(c => c.id === 'vault');
  assert.deepEqual(ch.items.map(i => i.key), keys);
  assert.equal(data.chapters.indexOf(ch), 15, 'in Part B, after the first flight: the video\'s chapter B4');
  assert.equal(ch.n, 'B4');
  assert.equal(st['obsidian.hooks'], 'todo', 'no settings file in this copy');
  assert.equal(st['memory.business_filled'], 'todo');
  assert.equal(st['memory.routines'], 'todo', 'no routine row in this copy');
  assert.equal(st['obsidian.vault_opened'], 'todo');
  assert.equal(st['obsidian.cli'], 'todo');
  if (SEALED) assert.equal(st['obsidian.installed'], 'todo');
  for (const lang of ['en', 'he']) {
    for (const k of ['obsidian.vault_opened', 'obsidian.cli']) assert.match(strings[lang].hints[k], /obsidian-setup\.mjs/, `${lang} hint ${k}`);
    assert.match(strings[lang].hints['obsidian.hooks'], /hooks-paste-block\.md/);
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
  assert.equal(data.chapters.find(c => c.id === 'vault').status, 'done');
}));

test('two parts in the video\'s order: labels A0–A10 and B1–B5, the desktop app answered by a file, the new items marked', () => withCopy(false, dir => {
  let r = run(dir, '--lang', 'en', '--print');   // the fixture copies the real config/, whose chat language may be Hebrew
  assert.equal(r.status, 0, r.stderr);
  let { html, data, st } = page(dir);
  assert.deepEqual(data.chapters.map(c => c.n), ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'G', 'A10', 'B1', 'B2', 'B3', 'B4', 'B5']);
  assert.deepEqual(data.chapters.filter(c => c.part === 'B').map(c => c.id), ['c8', 'c9', 'c10', 'vault', 'c11']);
  assert.equal(data.chapters.find(c => c.id === 'app').items.map(i => i.key).join(' '), 'app.desktop install.approved');
  assert.equal(data.chapters.find(c => c.id === 'keys').items[0].key, 'keys.table');
  assert.ok(data.chapters.find(c => c.id === 'c10').items.some(i => i.key === 'flight.video'), 'the video ad is a step of the first flight');
  assert.match(html, /<h2 class="part">Part A, <bdi dir="ltr">\/connect<\/bdi>: accounts and keys/);
  assert.match(html, /<h2 class="part">Part B, <bdi dir="ltr">\/campaign<\/bdi>: the first campaign<\/h2>/);
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

const PLATFORMS = '{' + '{PLATFORMS}}';   // split so the scrub gate does not read it as a placeholder
test('the platforms of config/operator.md: Meta only hides the Google chapter, Google only hides the Meta rows', () => withCopy(false, dir => {
  const op = join(dir, 'config', 'operator.md');
  const base = readFileSync(op, 'utf8');
  writeFileSync(op, base.replace(PLATFORMS, 'Meta'));
  let r = run(dir, '--print');
  assert.equal(r.status, 0, r.stderr);
  let { data, html } = page(dir);
  assert.deepEqual(data.chapters.find(c => c.id === 'google').items, [], 'no Google rows for a Meta-only company');
  assert.doesNotMatch(html, /google.account/);
  assert.ok(data.chapters.find(c => c.id === 'c2').items.length > 0);
  writeFileSync(op, base.replace(PLATFORMS, 'Google'));
  r = run(dir, '--print');
  assert.equal(r.status, 0, r.stderr);
  ({ data } = page(dir));
  const keys = data.chapters.flatMap(c => (c.items || []).map(i => i.key));
  assert.ok(keys.includes('google.login') && keys.includes('google.access'));
  assert.ok(!keys.some(k => k.startsWith('meta.') || k === 'login.tools' || k === 'token.check'), 'no Meta rows for a Google-only company');
  assert.equal(data.chapters.find(c => c.id === 'google').n, 'G');
}));

test('Codex (dashboard/agent.json, or the bootstrap\'s live file): the Codex app and extension, $commands, no Claude wording', () => withCopy(false, dir => {
  writeFileSync(join(dir, 'dashboard', 'agent.json'), '{"agent": "codex"}\n');
  const r = run(dir, '--print');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /The Codex Chrome extension/);
  assert.doesNotMatch(r.stdout, /Claude in Chrome|Claude desktop app installed/);
  const w = loadInto(loadInto(loadInto({}, DEFAULT_JS), WIZARD_JS), join(dir, 'dashboard', 'setup-data.js'));
  const D = w.SETUP_DEFAULT, W = w.SetupWizard;
  assert.equal(w.SETUP_DATA.agent, 'codex');
  const v = W.merge(D, w.SETUP_DATA, null, Date.now());
  assert.equal(v.agent, 'codex');
  assert.equal(v.chapters.find(c => c.id === 'vault').items.find(i => i.key === 'memory.routines').status, 'na', 'no routines in Codex');
  for (const lang of ['en', 'he']) {
    const S = W.strings(D, lang, 'codex');
    const html = W.render(v, S, { hinted: D.hinted, open: { app: true, chrome: true, c0: true } });
    assert.doesNotMatch(html, /Claude in Chrome|Code tab|לשונית Code/, `${lang}: Claude wording left`);
    assert.match(html, lang === 'en' ? /The Codex app/ : /אפליקציית Codex/);
    assert.match(html, /<bdi dir="ltr">\$connect<\/bdi>/, `${lang}: $connect kept left to right`);
    for (const k of Object.keys(D.strings[lang].items)) assert.ok(S.items[k], `${lang}: item ${k} lost in the merge`);
  }
  // Before setup-page.mjs ran, the bootstrap's live file says it; the Claude wording stays the default.
  assert.equal(W.merge(D, null, { running: false, agent: 'codex', items: {} }, Date.now()).agent, 'codex');
  assert.equal(W.strings(D, 'en', 'claude'), D.strings.en);
}));
