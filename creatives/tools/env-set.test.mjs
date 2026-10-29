// creatives/tools/env-set.test.mjs: node --test creatives/tools/env-set.test.mjs (Node 20+, no dependencies).
// Every case uses a temporary .env and --from-stdin, so no real clipboard and no real .env is touched.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TOOL = join(dirname(fileURLToPath(import.meta.url)), 'env-set.mjs');
const TOKEN = 'EAAfakeTokenForTheTestOnly0123456789abcdefghijklmnop';

function tmpEnv(content) {
  const dir = mkdtempSync(join(tmpdir(), 'env-set-'));
  const file = join(dir, '.env');
  writeFileSync(file, content);
  return { dir, file };
}
function run(args, input) {
  const r = spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8', input: input ?? '' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const TEMPLATE = '# comment\nMETA_MARKETING_TOKEN=\n\nMETA_AD_ACCOUNT_ID=123\nMETA_GRAPH_VERSION=v23.0\nMETA_PAGE_ID=\n';

test('from stdin: the line is set once, the rest is kept, the value is never printed', () => {
  const { dir, file } = tmpEnv(TEMPLATE);
  try {
    const r = run(['--from-stdin', 'META_MARKETING_TOKEN', '--env', file], TOKEN + '\n');
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /META_MARKETING_TOKEN set in .*\(\d+ characters, from the stdin\)/);
    assert.ok(!r.out.includes(TOKEN), 'the value must never be printed');
    const text = readFileSync(file, 'utf8');
    assert.equal(text, `# comment\nMETA_MARKETING_TOKEN=${TOKEN}\n\nMETA_AD_ACCOUNT_ID=123\nMETA_GRAPH_VERSION=v23.0\nMETA_PAGE_ID=\n`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('duplicates collapse into one line and CRLF endings are kept', () => {
  const { dir, file } = tmpEnv('A=1\r\nMETA_MARKETING_TOKEN=old\r\nB=2\r\nMETA_MARKETING_TOKEN=\r\n');
  try {
    const r = run(['--from-stdin', 'META_MARKETING_TOKEN', '--env', file], TOKEN);
    assert.equal(r.code, 0, r.out);
    assert.equal(readFileSync(file, 'utf8'), `A=1\r\nMETA_MARKETING_TOKEN=${TOKEN}\r\nB=2\r\n`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a name with no line yet is appended', () => {
  const { dir, file } = tmpEnv('A=1\n');
  try {
    const r = run(['--from-stdin', 'FAL_KEY', '--env', file], TOKEN);
    assert.equal(r.code, 0, r.out);
    assert.equal(readFileSync(file, 'utf8'), `A=1\nFAL_KEY=${TOKEN}\n`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('refused: empty, whitespace, too short; nothing written', () => {
  const { dir, file } = tmpEnv(TEMPLATE);
  try {
    for (const [input, re] of [['', /empty/], ['abc def ghi jkl mno pqr stu vwx', /whitespace/], ['done', /shorter than 20/], ['x'.repeat(9000), /longer than 8192/]]) {
      const r = run(['--from-stdin', 'META_MARKETING_TOKEN', '--env', file], input);
      assert.equal(r.code, 1, r.out);
      assert.match(r.out, re);
    }
    assert.equal(readFileSync(file, 'utf8'), TEMPLATE);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('--check reports set / empty / missing with the count only', () => {
  const { dir, file } = tmpEnv(TEMPLATE);
  try {
    let r = run(['--check', 'META_MARKETING_TOKEN', '--env', file]);
    assert.equal(r.code, 1); assert.match(r.out, /empty/);
    r = run(['--check', 'NOT_THERE', '--env', file]);
    assert.equal(r.code, 1); assert.match(r.out, /no line/);
    run(['--from-stdin', 'META_MARKETING_TOKEN', '--env', file], TOKEN);
    r = run(['--check', 'META_MARKETING_TOKEN', '--env', file, '--json']);
    assert.equal(r.code, 0);
    const j = JSON.parse(r.out);
    assert.equal(j.status, 'set'); assert.equal(j.length, TOKEN.length);
    assert.ok(!r.out.includes(TOKEN));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('--unset blanks the line', () => {
  const { dir, file } = tmpEnv(`META_MARKETING_TOKEN=${TOKEN}\nB=2\n`);
  try {
    const r = run(['--unset', 'META_MARKETING_TOKEN', '--env', file]);
    assert.equal(r.code, 0, r.out);
    assert.equal(readFileSync(file, 'utf8'), 'META_MARKETING_TOKEN=\nB=2\n');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('usage errors exit 2; a missing .env exits 1', () => {
  assert.equal(run(['--from-stdin', 'lower_case']).code, 2);
  assert.equal(run(['--from-stdin']).code, 2);
  assert.equal(run(['--check', 'A', '--unset', 'A']).code, 2);
  assert.equal(run(['--help']).code, 0);
  const r = run(['--check', 'A', '--env', join(tmpdir(), 'no-such-dir-env-set', '.env')]);
  assert.equal(r.code, 1); assert.match(r.out, /does not exist/);
});
