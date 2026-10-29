// memory/tools/instance.test.mjs: timeout 300 node --test memory/tools/instance.test.mjs (Node 20+, no dependencies).
// Every case runs instance.mjs with --root on a temporary harness folder: CLAUDE.md, the real templates/company/,
// and the company files a case writes. The real folder, its marker and its .env are never touched.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TOOL = join(dirname(fileURLToPath(import.meta.url)), 'instance.mjs');
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SENTINEL = 'SENTINEL_TOKEN_NEVER_PRINTED_0815';

function harness(company) {   // a blank harness; with company = true, a filled one as another company left it
  const dir = mkdtempSync(join(tmpdir(), 'instance-'));
  writeFileSync(join(dir, 'CLAUDE.md'), '# harness\n');
  writeFileSync(join(dir, '.env.example'), 'META_MARKETING_TOKEN=\n');
  cpSync(join(REPO, 'templates', 'company'), join(dir, 'templates', 'company'), { recursive: true });
  cpSync(join(REPO, 'templates', 'company'), dir, { recursive: true });
  const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
  put('config/README.md', '# how config works\n');
  put('memory/decisions/_about.md', '# about decisions\n');
  put('memory/learnings/meta-platform/2026-01-01-a-fact.md', '# a platform fact\n');
  put('creatives/tools/render-stills.mjs', '// tool\n');
  if (company) {
    put('config/company.md', '# Company\n\n**Name:** Other Company Ltd\n');
    put('memory/decisions/2026-01-02-a-ruling.md', '# a ruling\n');
    put('memory/state/known-objects.json', '{"ids":["123"]}\n');
    put('plans/2026-01-02-first-flight-plan.md', '# plan\n');
    put('creatives/2026-01-flight/S01.png', 'png');
    put('memory/HOT.md', '# HOT of the other company\n');
    put('.env', `META_MARKETING_TOKEN=${SENTINEL}\n`);
  }
  return dir;
}
function run(dir, ...args) {
  const r = spawnSync(process.execPath, [TOOL, '--root', dir, ...args], { encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || ''), stdout: r.stdout || '' };
}
const read = (dir, rel) => readFileSync(join(dir, rel), 'utf8');
const blank = (rel) => readFileSync(join(REPO, 'templates', 'company', rel), 'utf8');

test('a fresh blank copy: --check says new (exit 3); --reset only writes the marker; then --check says same', () => {
  const dir = harness(false);
  try {
    assert.equal(run(dir, '--check').code, 3);
    const r = run(dir, '--reset', '--quiet');
    assert.equal(r.code, 0, r.out);
    assert.equal(r.stdout.trim(), 'marked');
    assert.ok(!existsSync(join(dir, '.previous-company')), 'nothing to archive in a blank copy');
    const m = JSON.parse(read(dir, '.harness-instance.json'));
    assert.equal(m.schema, 1);
    const c = run(dir, '--check', '--json');
    assert.equal(c.code, 0, c.out);
    assert.equal(JSON.parse(c.stdout).same, true);
    assert.equal(run(dir, '--reset', '--quiet').stdout.trim(), 'same', 'a second reset of the same folder does nothing');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('another company\'s copy: everything of it archived, the blanks back, .env moved unread, harness files kept', () => {
  const dir = harness(true);
  try {
    const dry = run(dir, '--reset', '--dry-run', '--json');
    assert.equal(dry.code, 0, dry.out);
    assert.ok(JSON.parse(dry.stdout).would_archive.includes('config/company.md'));
    assert.ok(existsSync(join(dir, 'plans', '2026-01-02-first-flight-plan.md')), 'a dry run moves nothing');

    const r = run(dir, '--reset', '--json');
    assert.equal(r.code, 0, r.out);
    assert.ok(!r.out.includes(SENTINEL), 'the token was printed');
    const { archive } = JSON.parse(r.stdout);
    assert.match(archive, /^\.previous-company\/\d{4}-\d{2}-\d{2}-\d{6}$/);
    for (const rel of ['config/company.md', 'memory/decisions/2026-01-02-a-ruling.md', 'memory/state/known-objects.json',
      'plans/2026-01-02-first-flight-plan.md', 'creatives/2026-01-flight/S01.png', 'memory/HOT.md', '.env']) {
      assert.ok(existsSync(join(dir, archive, rel)), `not archived: ${rel}`);
    }
    assert.equal(read(dir, join(archive, '.env')), `META_MARKETING_TOKEN=${SENTINEL}\n`);
    assert.equal(read(dir, 'config/company.md'), blank('config/company.md'));
    assert.equal(read(dir, 'memory/state/current.md'), blank('memory/state/current.md'));
    assert.equal(read(dir, '.env'), 'META_MARKETING_TOKEN=\n', '.env is recreated from .env.example');
    assert.ok(!existsSync(join(dir, 'plans', '2026-01-02-first-flight-plan.md')));
    assert.ok(!existsSync(join(dir, 'creatives', '2026-01-flight')) || readdirSync(join(dir, 'creatives', '2026-01-flight')).length === 0);
    for (const rel of ['config/README.md', 'memory/decisions/_about.md', 'memory/learnings/meta-platform/2026-01-01-a-fact.md', 'creatives/tools/render-stills.mjs']) {
      assert.ok(existsSync(join(dir, rel)), `a harness file was moved: ${rel}`);
    }
    assert.equal(run(dir, '--check').code, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a marker written for another folder makes the folder a new copy; --restore brings an archive back', () => {
  const dir = harness(true);
  try {
    writeFileSync(join(dir, '.harness-instance.json'), JSON.stringify({ schema: 1, folder: join(tmpdir(), 'somewhere-else'), machine: 'x', created: '2026-01-01' }));
    const c = run(dir, '--check');
    assert.equal(c.code, 3);
    assert.match(c.out, /another folder/);
    const { archive } = JSON.parse(run(dir, '--reset', '--json').stdout);
    const back = run(dir, '--restore', join(dir, archive), '--quiet');
    assert.equal(back.code, 0, back.out);
    assert.match(back.stdout.trim(), /^restored /);
    assert.equal(read(dir, 'config/company.md'), '# Company\n\n**Name:** Other Company Ltd\n');
    assert.equal(read(dir, '.env'), `META_MARKETING_TOKEN=${SENTINEL}\n`);
    assert.ok(!back.out.includes(SENTINEL));
    assert.equal(run(dir, '--check').code, 0, 'the restored folder is its own harness');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('--adopt marks a folder that has no marker and moves nothing; a marker from elsewhere is left as it is', () => {
  const dir = harness(true);
  try {
    const a = run(dir, '--adopt', '--quiet');
    assert.equal(a.code, 0, a.out);
    assert.equal(a.stdout.trim(), 'marked');
    assert.equal(read(dir, 'config/company.md'), '# Company\n\n**Name:** Other Company Ltd\n', 'adopt moved a company file');
    assert.equal(run(dir, '--check').code, 0);
    writeFileSync(join(dir, '.harness-instance.json'), JSON.stringify({ schema: 1, folder: join(tmpdir(), 'elsewhere'), machine: 'x', created: '2026-01-01' }));
    assert.equal(run(dir, '--adopt', '--quiet').stdout.trim(), 'new');
    assert.equal(run(dir, '--check').code, 3, 'adopt never overrides a marker from another folder');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('usage: no mode, two modes or an unknown flag exit 2; a folder without templates/company exits 2', () => {
  const dir = harness(false);
  try {
    assert.equal(run(dir).code, 2);
    assert.equal(run(dir, '--check', '--reset').code, 2);
    assert.equal(run(dir, '--check', '--nope').code, 2);
    rmSync(join(dir, 'templates'), { recursive: true, force: true });
    assert.equal(run(dir, '--check').code, 2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('--gate: a blank harness is clean (exit 0); a company file is a hit (exit 1); a blank file missing is a hit', () => {
  const dir = harness(false);
  try {
    const ok = run(dir, '--gate');
    assert.equal(ok.code, 0, ok.out);
    assert.match(ok.stdout, /blank gate: clean/);
    writeFileSync(join(dir, 'config', 'company.md'), '# Company\n\n**Name:** Other Company Ltd\n');
    rmSync(join(dir, 'memory', 'HOME.en.md'));
    const bad = run(dir, '--gate', '--json');
    assert.equal(bad.code, 1, bad.out);
    const { hits } = JSON.parse(bad.stdout);
    assert.ok(hits.includes('not blank: config/company.md'), bad.out);
    assert.ok(hits.includes('missing: memory/HOME.en.md'), bad.out);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
