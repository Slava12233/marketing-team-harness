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

function withCopy(example, fn) {   // a minimal harness folder: the template files, or the fictional example over them
  const dir = mkdtempSync(join(tmpdir(), 'setup-page-'));
  try {
    writeFileSync(join(dir, 'CLAUDE.md'), '');
    for (const f of ['.mcp.json', 'checklist.md']) cpSync(join(REPO, f), join(dir, f));
    cpSync(join(REPO, 'config'), join(dir, 'config'), { recursive: true });
    mkdirSync(join(dir, 'dashboard'));
    mkdirSync(join(dir, 'plans'));
    for (const f of ['setup-page.mjs', 'state.json']) cpSync(join(REPO, 'dashboard', f), join(dir, 'dashboard', f));
    if (example) {
      cpSync(join(EXAMPLE, 'config'), join(dir, 'config'), { recursive: true });
      cpSync(join(EXAMPLE, 'checklist.md'), join(dir, 'checklist.md'));
      cpSync(join(EXAMPLE, 'plans'), join(dir, 'plans'), { recursive: true });
      writeFileSync(join(dir, 'dashboard', 'state.json'), JSON.stringify({ campaigns: [{ id: '600000000000001', name: 'Example', status: 'PAUSED' }] }));
    }
    fn(dir);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
const run = (dir, ...args) => spawnSync(process.execPath, [join(dir, 'dashboard', 'setup-page.mjs'), ...args], { encoding: 'utf8' });
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
  assert.match(r.stdout, /^setup page: 1\/41 done, next: Git installed/m);
  const { html, st } = page(dir);
  for (const [k, s] of Object.entries(st)) assert.equal(s, k === 'install.mcpjson' ? 'done' : 'todo', k);
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
  assert.equal(keys.length, 43);
  for (const lang of ['en', 'he']) {
    const S = data.strings[lang];
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
