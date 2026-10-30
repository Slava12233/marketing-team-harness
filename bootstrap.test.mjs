// bootstrap.test.mjs: parity tests for the two first-run scripts, bootstrap.ps1 (Windows PowerShell) and
// bootstrap.sh (bash). Node 20+, no dependencies. Run it with a time bound, from the harness folder:
//   timeout 300 node --test bootstrap.test.mjs
// Only report modes run here (--help, the wrong folder, --check): nothing is ever installed. The --check cases
// run in a temporary copy of the harness essentials, with a PATH that holds only stub git, node and claude
// commands (fixed versions) and the system folders the shells need. The PowerShell cases are skipped off
// Windows; the bash cases are skipped when no bash is found.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const IS_WIN = process.platform === 'win32';
const TAG_RE = /^\[(ok|installed|missing|skipped|todo)\] (.*)$/;
const STATUSES = ['ok', 'installed', 'missing', 'skipped', 'todo'];
const KEYS = ['git', 'node', 'claude', 'env', 'app', 'chrome', 'playwright', 'obsidian', 'ffmpeg', 'hyperframes', 'obsidian_setup', 'routines', 'manifest', 'instance'];
const HEADINGS = ['Required', 'Recommended', 'Optional', 'What remains'];
const ESSENTIALS = ['CLAUDE.md', '.mcp.json', '.env.example', 'bootstrap.ps1', 'bootstrap.sh', 'README.md', 'dashboard/setup-page.mjs', 'dashboard/setup.html', 'docs/release-manifest.txt', 'vendor/hyperframes/.claude-plugin/marketplace.json'];
const SENTINEL = 'SENTINEL_VALUE_NEVER_PRINTED_4711';

// ---- the two shells ----
function findPowerShell() {
  if (!IS_WIN) return '';
  const p = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  return fs.existsSync(p) ? p : '';
}
function findBash() {   // Windows: Git's usr\bin\bash.exe (never System32's WSL launcher); elsewhere bash on PATH
  const dirs = (process.env.PATH || process.env.Path || '').split(path.delimiter).filter(Boolean);
  if (IS_WIN) {
    const cands = [];
    for (const base of [process.env.ProgramFiles, process.env.ProgramW6432, 'C:\\Program Files']) if (base) cands.push(path.join(base, 'Git', 'usr', 'bin', 'bash.exe'));
    for (const d of dirs) {
      if (/system32|windowsapps/i.test(d)) continue;
      const b = path.join(d, 'bash.exe');
      if (!fs.existsSync(b)) continue;
      if (/[\\/]git[\\/]bin$/i.test(d)) cands.push(path.join(d, '..', 'usr', 'bin', 'bash.exe'));
      cands.push(b);
    }
    return cands.find((c) => fs.existsSync(c)) || '';
  }
  for (const d of dirs) { const b = path.join(d, 'bash'); if (fs.existsSync(b)) return b; }
  return '';
}
const PS = findPowerShell();
const BASH = findBash();
const skipPs = PS ? false : 'Windows PowerShell is only on Windows';
const skipSh = BASH ? false : 'no bash found';

// ---- helpers ----
function envWithPath(p) {   // the process environment with its PATH (any spelling) replaced
  const env = {};
  for (const [k, v] of Object.entries(process.env)) if (k.toLowerCase() !== 'path') env[k] = v;
  env[IS_WIN ? 'Path' : 'PATH'] = p;
  return env;
}
function tmpDir(tag) { return fs.mkdtempSync(path.join(os.tmpdir(), `bootstrap-test-${tag}-`)); }
function rm(dir) { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* left for the OS */ } }

function stubs(kind, nodeVersion) {   // a folder of stub git, node and claude commands with fixed versions
  const dir = tmpDir(`stubs-${kind}`);
  if (kind === 'ps') {
    fs.writeFileSync(path.join(dir, 'git.cmd'), '@echo off\r\necho git version 2.99.0.test\r\n');
    fs.writeFileSync(path.join(dir, 'node.cmd'), `@echo off\r\necho ${nodeVersion}\r\n`);
    fs.writeFileSync(path.join(dir, 'claude.cmd'), '@echo off\r\nif "%~1"=="--version" echo 2.1.0 (Claude Code)\r\nexit /b 0\r\n');
    fs.writeFileSync(path.join(dir, 'codex.cmd'), '@echo off\r\nif "%~1"=="--version" echo codex-cli 0.200.0\r\nexit /b 0\r\n');
  } else {
    const w = (name, body) => { const f = path.join(dir, name); fs.writeFileSync(f, `#!/bin/sh\n${body}\n`); fs.chmodSync(f, 0o755); };
    w('git', 'echo "git version 2.99.0.test"');
    w('node', `echo "${nodeVersion}"`);
    w('claude', '[ "$1" = --version ] && echo "2.1.0 (Claude Code)"\nexit 0');
    w('codex', '[ "$1" = --version ] && echo "codex-cli 0.200.0"\nexit 0');
  }
  return dir;
}
function shellPath(kind, stubDir) {
  if (kind === 'ps') {
    const sr = process.env.SystemRoot || 'C:\\Windows';
    return [stubDir, path.join(sr, 'System32'), sr, path.join(sr, 'System32', 'WindowsPowerShell', 'v1.0')].join(';');
  }
  if (IS_WIN) return [stubDir, path.dirname(BASH)].join(';');
  return [stubDir, '/usr/bin', '/bin'].join(':');
}

// A temporary harness: the essentials copied, and a manifest that lists exactly the files copied.
function harness(mutate) {
  const dir = tmpDir('harness');
  for (const rel of ESSENTIALS) {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src)) continue;
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.copyFileSync(src, path.join(dir, rel));
  }
  const mf = path.join(dir, 'docs', 'release-manifest.txt');
  const listed = fs.existsSync(mf) ? fs.readFileSync(mf, 'utf8').split(/\r?\n/).filter(Boolean) : [];
  const keep = listed.filter((l) => { const p = l.slice(l.indexOf(' ') + 1).replace(/^[ *]+/, ''); return fs.existsSync(path.join(dir, p)); });
  for (const rel of ESSENTIALS) if (!keep.some((l) => l.endsWith('  ' + rel)) && fs.existsSync(path.join(dir, rel)) && rel !== 'docs/release-manifest.txt') keep.push('0'.repeat(64) + '  ' + rel);
  fs.mkdirSync(path.dirname(mf), { recursive: true });
  fs.writeFileSync(mf, keep.join('\n') + '\n');
  if (mutate) mutate(dir);
  return dir;
}

function run(kind, args, cwd, env, script) {
  const res = kind === 'ps'
    ? spawnSync(PS, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script || path.join(cwd, 'bootstrap.ps1'), ...args], { cwd, env, encoding: 'utf8', timeout: 120000 })
    : spawnSync(BASH, [script || 'bootstrap.sh', ...args], { cwd, env, encoding: 'utf8', timeout: 120000 });
  if (res.error) throw res.error;
  return { code: res.status, out: (res.stdout || '') + (res.stderr || ''), stdout: res.stdout || '' };
}
function check(kind, nodeVersion = 'v22.11.0', mutate, agent) {   // one --check run in a fresh temporary harness
  const dir = harness(mutate);
  const sd = stubs(kind, nodeVersion);
  try {
    const args = [kind === 'ps' ? '-Check' : '--check'];
    if (agent) args.push(kind === 'ps' ? `-${agent[0].toUpperCase()}${agent.slice(1)}` : `--${agent}`);
    const r = run(kind, args, dir, envWithPath(shellPath(kind, sd)));
    const resultFile = path.join(dir, 'dashboard', 'bootstrap-result.json');
    const logFile = path.join(dir, 'bootstrap.log');
    r.result = fs.existsSync(resultFile) ? fs.readFileSync(resultFile, 'utf8') : null;
    r.log = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : null;
    return r;
  } finally { rm(dir); rm(sd); }
}

// The item name of a tag line: the words up to " is " / " does " / " exists" (or " are ", " needs ", ": ", ". ", "; "),
// after the parenthesised parts, versions and paths are taken out; lower case.
function itemName(rest) {
  let s = rest;
  while (/\([^()]*\)/.test(s)) s = s.replace(/\([^()]*\)/g, ' ');
  s = s.replace(/\bv?\d+(\.\d+)+\S*/g, ' ').replace(/^\s*\d+ of /, '');
  let cut = s.length;
  for (const sep of [' is ', ' does ', ' exists', ' are ', ' needs ', ': ', '. ', '; ']) { const i = s.indexOf(sep); if (i >= 0 && i < cut) cut = i; }
  return s.slice(0, cut).replace(/\.$/, '').replace(/\s+/g, ' ').trim().toLowerCase();
}
function items(out) {
  const set = new Set();
  for (const line of out.split(/\r?\n/)) { const m = TAG_RE.exec(line); if (m) set.add(`${m[1]} ${itemName(m[2])}`); }
  return [...set].sort();
}
function assertShape(r, label) {
  assert.ok(r.code === 0 || r.code === 1, `${label}: exit ${r.code}\n${r.out}`);
  const lines = r.stdout.split(/\r?\n/);
  for (const h of HEADINGS) assert.ok(lines.includes(h), `${label}: heading "${h}" missing\n${r.out}`);
  const from = lines.indexOf('Required'); const to = lines.indexOf('What remains');
  for (const line of lines.slice(from + 1, to)) {
    if (!line || /^\s/.test(line) || HEADINGS.includes(line)) continue;
    assert.match(line, TAG_RE, `${label}: an item line without a tag: ${line}`);
  }
}
function assertResult(r, kind, label) {
  assert.ok(r.result, `${label}: dashboard/bootstrap-result.json was not written`);
  const j = JSON.parse(r.result);
  assert.match(j.ran, /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}(:[0-9]{2}){2}[+-][0-9]{2}:[0-9]{2}$/, `${label}: ran`);
  assert.equal(j.mode, 'check');
  assert.equal(j.script, kind === 'ps' ? 'bootstrap.ps1' : 'bootstrap.sh');
  assert.equal(j.exit, r.code, `${label}: the exit in the file`);
  for (const k of KEYS) {
    assert.ok(j.items[k], `${label}: item ${k} missing`);
    assert.ok(STATUSES.includes(j.items[k].status), `${label}: item ${k} status ${j.items[k].status}`);
    assert.equal(typeof j.items[k].version, 'string', `${label}: item ${k} version`);
  }
  return j;
}

// ---- (a) the usage ----
function usageOptions(out) {
  const m = /\[(-{1,2}\w+) \| (-{1,2}\w+) \| (-{1,2}\w+)\] \[(-{1,2}\w+)\]/.exec(out);
  assert.ok(m, `no usage line in:\n${out}`);
  return m.slice(1).map((o) => o.replace(/^-+/, '').toLowerCase()).sort();
}
test('(a) PowerShell -Help exits 0 and names the four options', { skip: skipPs }, () => {
  const dir = tmpDir('help');
  try {
    const r = run('ps', ['-Help'], dir, process.env, path.join(ROOT, 'bootstrap.ps1'));
    assert.equal(r.code, 0, r.out);
    assert.deepEqual(usageOptions(r.out), ['ask', 'check', 'help', 'yes']);
  } finally { rm(dir); }
});
test('(a) bash --help exits 0 and names the same four options', { skip: skipSh }, () => {
  const dir = tmpDir('help');
  try {
    const r = run('sh', ['--help'], dir, process.env, path.join(ROOT, 'bootstrap.sh'));
    assert.equal(r.code, 0, r.out);
    assert.deepEqual(usageOptions(r.out), ['ask', 'check', 'help', 'yes']);
  } finally { rm(dir); }
});

// ---- (b) the wrong folder ----
for (const kind of ['ps', 'sh']) {
  test(`(b) ${kind === 'ps' ? 'PowerShell' : 'bash'} in a folder that is not the harness exits 2 and writes nothing`, { skip: kind === 'ps' ? skipPs : skipSh }, () => {
    const dir = tmpDir('empty');
    try {
      const r = run(kind, [kind === 'ps' ? '-Check' : '--check'], dir, process.env, path.join(ROOT, kind === 'ps' ? 'bootstrap.ps1' : 'bootstrap.sh'));
      assert.equal(r.code, 2, r.out);
      assert.match(r.out, /not the harness folder/);
      assert.deepEqual(fs.readdirSync(dir), [], 'the wrong folder stays empty');
    } finally { rm(dir); }
  });
}

// ---- (c) + (d) the check, in parity ----
test('(c)(d) --check: same shape, same items and tags, the result file and the log, in both scripts', { skip: skipPs || skipSh }, () => {
  const ps = check('ps'); const sh = check('sh');
  assertShape(ps, 'bootstrap.ps1'); assertShape(sh, 'bootstrap.sh');
  assert.equal(ps.code, sh.code, `exit codes differ\n--- ps\n${ps.out}\n--- sh\n${sh.out}`);
  assert.deepEqual(items(ps.stdout), items(sh.stdout), `item sets differ\n--- ps\n${ps.out}\n--- sh\n${sh.out}`);
  assert.ok(ps.stdout.includes('[ok] Node.js v22.11.0 is installed'), ps.out);
  assert.ok(ps.stdout.includes('[ok] The harness files are complete ('), ps.out);
  const jp = assertResult(ps, 'ps', 'bootstrap.ps1'); const js = assertResult(sh, 'sh', 'bootstrap.sh');
  for (const k of KEYS) assert.equal(jp.items[k].status, js.items[k].status, `item ${k}: ps ${jp.items[k].status}, sh ${js.items[k].status}`);
  assert.equal(jp.items.node.version, 'v22.11.0'); assert.equal(js.items.node.version, 'v22.11.0');
  assert.equal(jp.items.git.version, 'git version 2.99.0.test'); assert.equal(js.items.git.version, 'git version 2.99.0.test');
  for (const [r, name] of [[ps, 'bootstrap.ps1'], [sh, 'bootstrap.sh']]) {
    assert.ok(r.log, `${name}: bootstrap.log was not written`);
    assert.match(r.log.split(/\r?\n/)[0], new RegExp(`^\\W*${name.replace('.', '\\.')}, mode check, `));
    assert.ok(r.log.includes('Mode: check only. Nothing is installed; only bootstrap.log and dashboard/bootstrap-result.json are written.'), `${name}: the mode line is not in the log`);
    for (const line of r.stdout.split(/\r?\n/)) if (TAG_RE.test(line)) assert.ok(r.log.includes(line), `${name}: not logged: ${line}`);
  }
});

test('(d) the log and the result file never carry a value from .env', { skip: skipPs || skipSh }, () => {
  const withEnv = (dir) => fs.writeFileSync(path.join(dir, '.env'), `META_MARKETING_TOKEN=${SENTINEL}\n`);
  for (const kind of ['ps', 'sh']) {
    const r = check(kind, 'v22.11.0', withEnv);
    assert.ok(r.stdout.includes('[ok] .env exists (contents never shown).'), r.out);
    for (const text of [r.out, r.log || '', r.result || '']) assert.ok(!text.includes(SENTINEL), `${kind}: a value from .env was printed or written`);
  }
});

// ---- (e) the manifest check ----
test('(e) a listed harness file that is missing is reported [missing] by both scripts', { skip: skipPs || skipSh }, () => {
  const drop = (dir) => fs.rmSync(path.join(dir, 'README.md'));
  const ps = check('ps', 'v22.11.0', drop); const sh = check('sh', 'v22.11.0', drop);
  const want = '[missing] 1 of the harness files are missing (first: README.md). Unzip the harness again.';
  assert.ok(ps.stdout.includes(want), ps.out); assert.ok(sh.stdout.includes(want), sh.out);
  assert.equal(ps.code, 1); assert.equal(sh.code, 1);
  assert.equal(JSON.parse(ps.result).items.manifest.status, 'missing');
  assert.equal(JSON.parse(sh.result).items.manifest.status, 'missing');
});

// ---- the Node.js upgrade line (Node 20 or 21) ----
test('Node.js 20: both scripts report the optional upgrade for the video plugin, in parity', { skip: skipPs || skipSh }, () => {
  const ps = check('ps', 'v20.11.0'); const sh = check('sh', 'v20.11.0');
  const want = '[skipped] Node.js v20.11.0 is enough for the harness; the video plugin needs 22 or newer (optional upgrade).';
  assert.ok(ps.stdout.includes(want), ps.out); assert.ok(sh.stdout.includes(want), sh.out);
  assert.deepEqual(items(ps.stdout), items(sh.stdout), `item sets differ\n--- ps\n${ps.out}\n--- sh\n${sh.out}`);
  for (const r of [ps, sh]) {
    const j = JSON.parse(r.result);
    assert.equal(j.items.node_upgrade.status, 'skipped');
    assert.equal(j.items.node_upgrade.version, 'v20.11.0');
    assert.equal(j.items.node.status, 'ok');
  }
});

// ---- (f) the live file of the setup wizard ----
// An --ask run where every question is answered No (Enter, then end of input): nothing is installed, no browser
// starts (HARNESS_NO_BROWSER), and dashboard/setup-live.js holds every item, finished, in the same shape from both.
function askRun(kind, first = '') {   // first: the answer to the first question (the app), Enter by default
  const dir = harness();
  const sd = stubs(kind, 'v22.11.0');
  try {
    const env = { ...envWithPath(shellPath(kind, sd)), HARNESS_NO_BROWSER: '1' };
    const r = spawnSync(kind === 'ps' ? PS : BASH, kind === 'ps'
      ? ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(dir, 'bootstrap.ps1'), '-Ask'] : ['bootstrap.sh', '--ask'],
      { cwd: dir, env, encoding: 'utf8', timeout: 120000, input: first + '\n'.repeat(20) });
    if (r.error) throw r.error;
    const f = path.join(dir, 'dashboard', 'setup-live.js');
    const text = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
    const af = path.join(dir, 'dashboard', 'agent.json');
    const agentFile = fs.existsSync(af) ? fs.readFileSync(af, 'utf8') : null;
    return { out: (r.stdout || '') + (r.stderr || ''), text, agentFile };
  } finally { rm(dir); rm(sd); }
}
function liveOf(text) { const w = {}; new Function('window', text)(w); return w.SETUP_LIVE; }

test('(f) a run without --check writes the live file of the wizard: every item, finished, the same from both scripts', { skip: skipPs || skipSh }, () => {
  const ps = askRun('ps'); const sh = askRun('sh');
  for (const [r, name] of [[ps, 'bootstrap.ps1'], [sh, 'bootstrap.sh']]) {
    assert.ok(r.text, `${name}: dashboard/setup-live.js was not written\n${r.out}`);
    assert.ok(r.out.includes('Open dashboard/setup.html in a browser to watch every step tick as it happens.'), `${name}: no wizard line\n${r.out}`);
    const live = liveOf(r.text);
    assert.equal(live.running, false, `${name}: the run is not marked finished`);
    assert.equal(live.script, name);
    assert.equal(live.current, '');
    for (const k of KEYS) assert.ok(k in live.items, `${name}: item ${k} missing from the live file`);
    assert.equal(live.items.node, 'ok', `${name}: node`);
    assert.equal(live.items.git, 'ok', `${name}: git`);
  }
  const a = liveOf(ps.text), b = liveOf(sh.text);
  for (const k of KEYS) assert.equal(a.items[k], b.items[k], `item ${k}: ps ${a.items[k]}, sh ${b.items[k]}`);
});

// ---- (g) Codex instead of Claude Code ----
test('(g) --check --codex: the Codex CLI, app and extension in place of Claude, the Claude-only items skipped, in parity', { skip: skipPs || skipSh }, () => {
  const ps = check('ps', 'v22.11.0', null, 'codex'); const sh = check('sh', 'v22.11.0', null, 'codex');
  assertShape(ps, 'bootstrap.ps1'); assertShape(sh, 'bootstrap.sh');
  assert.equal(ps.code, sh.code, `exit codes differ\n--- ps\n${ps.out}\n--- sh\n${sh.out}`);
  assert.deepEqual(items(ps.stdout), items(sh.stdout), `item sets differ\n--- ps\n${ps.out}\n--- sh\n${sh.out}`);
  for (const r of [ps, sh]) {
    assert.ok(r.stdout.includes('App: Codex (chosen with '), r.out);
    assert.ok(r.stdout.includes('[ok] The Codex CLI is installed (codex-cli 0.200.0).'), r.out);
    assert.ok(r.stdout.includes('[skipped] The HyperFrames video plugin is for Claude Code only'), r.out);
    assert.ok(r.stdout.includes('[skipped] The memory routines are a Claude desktop app feature'), r.out);
    assert.ok(r.stdout.includes('  3. Install the Codex Chrome extension: in the Codex app, Plugins > Chrome; sign in to it.'), r.out);
    assert.ok(!/Claude in Chrome|Claude desktop app is|Code tab/.test(r.stdout.split('What remains')[1] || ''), `${r.out}`);
    const j = JSON.parse(r.result);
    assert.equal(j.items.claude.version, 'codex-cli 0.200.0');
    assert.equal(j.items.routines.status, 'skipped');
  }
  const jp = JSON.parse(ps.result), js = JSON.parse(sh.result);
  for (const k of KEYS) assert.equal(jp.items[k].status, js.items[k].status, `item ${k}: ps ${jp.items[k].status}, sh ${js.items[k].status}`);
  // --check without a flag never asks and stays Claude Code.
  const plain = check('sh');
  assert.ok(plain.stdout.includes('App: Claude Code (not chosen yet: a run without --check asks).'), plain.out);
});

test('(g) the first question picks the app: 2 means Codex, written to dashboard/agent.json and the live file, in both scripts', { skip: skipPs || skipSh }, () => {
  for (const kind of ['ps', 'sh']) {
    const r = askRun(kind, '2\n');
    assert.ok(r.out.includes('Which app will run the harness on this computer?'), `${kind}: no question\n${r.out}`);
    assert.ok(r.out.includes('App: Codex (your answer).'), `${kind}\n${r.out}`);
    assert.match(r.agentFile || '', /"agent": "codex"/, `${kind}: dashboard/agent.json`);
    assert.equal(liveOf(r.text).agent, 'codex', `${kind}: the live file`);
    const enter = askRun(kind);
    assert.ok(enter.out.includes('App: Claude Code (your answer).'), `${kind}: Enter means Claude Code\n${enter.out}`);
    assert.equal(liveOf(enter.text).agent, 'claude');
  }
});

test('(f) --check writes no live file and opens nothing', { skip: skipPs || skipSh }, () => {
  for (const kind of ['ps', 'sh']) {
    const r = check(kind);
    assert.ok(!r.out.includes('setup wizard opened'), r.out);
    assert.ok(!r.out.includes('Open dashboard/setup.html'), r.out);
  }
});
