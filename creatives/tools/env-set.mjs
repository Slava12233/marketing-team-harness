#!/usr/bin/env node
// creatives/tools/env-set.mjs: puts a secret into the repo-root .env without the value ever passing through the
// chat. Node 20+, no dependencies. The value comes from the clipboard (the Owner, or the harness in the Owner's
// browser, clicked "Copy" on the screen that shows it) or from stdin (tests and pipes); it is written as one
// NAME=value line, the file is restricted to the current user, and the clipboard is cleared. The tool prints the
// name and the character count only, never the value, never any other line of the file.
//
//   node creatives/tools/env-set.mjs --from-clipboard META_MARKETING_TOKEN      clipboard -> .env, clipboard cleared
//   node creatives/tools/env-set.mjs --from-stdin NAME < file-or-pipe            stdin -> .env (tests, pipes)
//   node creatives/tools/env-set.mjs --check NAME                                set / empty / missing, with the count
//   node creatives/tools/env-set.mjs --unset NAME                                blank the line (after a leak: revoke first)
//   options: --env <path> (default: .env in the repository root), --min-length <n> (default 20),
//            --keep-clipboard (do not clear it), --json
//
// Rules: a NAME is uppercase letters, digits and underscores; a value is one line with no whitespace, at least
// --min-length characters (so "done" or an empty copy is refused), at most 8192; every existing NAME= line is
// replaced by the one new line (the Graph tools read the last non-empty one, so duplicates would only confuse);
// other lines, comments and the file's line endings are kept. Exit codes: 0 done, 1 nothing written (empty or bad
// value, no clipboard tool, no .env), 2 usage. A value that reaches the chat is burned: revoke it, then --unset.
import { readFileSync, writeFileSync, existsSync, renameSync, chmodSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..', '..');
const NAME_RE = /^[A-Z][A-Z0-9_]*$/;

const usage = () => `Usage: node creatives/tools/env-set.mjs (--from-clipboard | --from-stdin | --check | --unset) NAME [--env <path>] [--min-length <n>] [--keep-clipboard] [--json]
Writes one NAME=value line into .env from the clipboard or stdin; prints the name and the character count, never the value.`;

function parseArgs(argv) {
  const o = { mode: '', name: '', env: join(ROOT, '.env'), minLength: 20, keepClipboard: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--from-clipboard' || a === '--from-stdin' || a === '--check' || a === '--unset') {
      if (o.mode) throw new Error('one mode only');
      o.mode = a.slice(2);
    } else if (a === '--env') o.env = resolve(argv[++i] || '');
    else if (a === '--min-length') { o.minLength = Number(argv[++i]); if (!Number.isInteger(o.minLength) || o.minLength < 1) throw new Error('--min-length needs a whole number'); }
    else if (a === '--keep-clipboard') o.keepClipboard = true;
    else if (a === '--json') o.json = true;
    else if (a === '--help' || a === '-h') { o.mode = 'help'; }
    else if (a.startsWith('-')) throw new Error(`unknown option ${a}`);
    else if (!o.name) o.name = a;
    else throw new Error(`unexpected argument ${a}`);
  }
  if (o.mode === 'help') return o;
  if (!o.mode) throw new Error('a mode is needed');
  if (!o.name) throw new Error('a NAME is needed');
  if (!NAME_RE.test(o.name)) throw new Error('NAME must be uppercase letters, digits and underscores');
  return o;
}

// The clipboard, read and cleared by the platform's own tool. Nothing here prints the value.
function clipboardTools() {
  if (process.platform === 'win32') {
    return {
      read: () => run('powershell', ['-NoProfile', '-NonInteractive', '-Command', 'Get-Clipboard -Raw']),
      clear: () => run('powershell', ['-NoProfile', '-NonInteractive', '-STA', '-Command', 'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::Clear()']).ok
        || run('cmd', ['/c', 'type nul | clip']).ok,
      name: 'Get-Clipboard',
    };
  }
  if (process.platform === 'darwin') {
    return { read: () => run('pbpaste', []), clear: () => run('sh', ['-c', 'pbcopy < /dev/null']).ok, name: 'pbpaste' };
  }
  for (const [cmd, readArgs, clearArgs] of [
    ['wl-paste', ['--no-newline'], ['--clear']],
    ['xclip', ['-selection', 'clipboard', '-o'], ['-selection', 'clipboard', '-i', '/dev/null']],
    ['xsel', ['--clipboard', '--output'], ['--clipboard', '--clear']],
  ]) {
    if (run('sh', ['-c', `command -v ${cmd}`]).ok) {
      const c = cmd === 'wl-paste' ? 'wl-copy' : cmd;
      return { read: () => run(cmd, readArgs), clear: () => run(c, clearArgs).ok, name: cmd };
    }
  }
  return null;
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', windowsHide: true, timeout: 20000 });
  return { ok: !r.error && r.status === 0, out: r.stdout || '' };
}

function readStdin() {
  try { return readFileSync(0, 'utf8'); } catch { return ''; }
}

// validate: the one-line value, or a reason (never the value) why it is refused.
function validate(raw, minLength) {
  const v = (raw || '').replace(/﻿/g, '').trim();
  if (!v) return { reason: 'the value is empty (nothing was copied)' };
  if (/\s/.test(v)) return { reason: 'the value has whitespace or more than one line (copy only the token)' };
  if (v.length < minLength) return { reason: `the value is shorter than ${minLength} characters (not a token)` };
  if (v.length > 8192) return { reason: 'the value is longer than 8192 characters' };
  return { value: v };
}

// setLine: NAME=value written once, every other NAME= line removed, everything else kept with its line endings.
function setLine(text, name, value) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const re = new RegExp('^\\s*' + name + '\\s*=');
  let placed = false;
  const out = [];
  for (const line of lines) {
    if (re.test(line)) {
      if (!placed) { out.push(`${name}=${value}`); placed = true; }
      continue;
    }
    out.push(line);
  }
  if (!placed) {
    if (out.length && out[out.length - 1] === '') out.pop();
    out.push(`${name}=${value}`, '');
  }
  return out.join(eol);
}

function restrict(file) {
  try { chmodSync(file, 0o600); } catch { /* Windows ignores it */ }
  if (process.platform === 'win32' && process.env.USERNAME) {
    run('icacls', [file, '/inheritance:r', '/grant:r', `${process.env.USERNAME}:(R,W)`]);
  }
}

function writeAtomic(file, text) {
  const tmp = file + '.tmp';
  writeFileSync(tmp, text, { encoding: 'utf8', mode: 0o600 });
  renameSync(tmp, file);
  restrict(file);
}

function currentValueLength(text, name) {   // the last non-empty NAME= line, as the Graph tools read it
  const re = new RegExp('^\\s*' + name + '\\s*=(.*)$');
  let found = false, len = 0;
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(re);
    if (!m) continue;
    found = true;
    const v = m[1].trim();
    if (v) len = v.length;
  }
  return found ? len : -1;
}

function say(o, obj, line) {
  if (o.json) console.log(JSON.stringify(obj));
  else console.log(line);
}

function main() {
  let o;
  try { o = parseArgs(process.argv.slice(2)); } catch (e) { console.error(e.message); console.error(usage()); return 2; }
  if (o.mode === 'help') { console.log(usage()); return 0; }
  const rel = o.env.startsWith(ROOT) ? o.env.slice(ROOT.length + 1).replace(/\\/g, '/') : o.env;

  if (!existsSync(o.env)) {
    say(o, { name: o.name, status: 'no-env', file: rel }, `${rel} does not exist: copy .env.example to .env first (the bootstrap does it).`);
    return 1;
  }
  const text = readFileSync(o.env, 'utf8');

  if (o.mode === 'check') {
    const n = currentValueLength(text, o.name);
    const status = n < 0 ? 'missing' : n === 0 ? 'empty' : 'set';
    say(o, { name: o.name, status, length: Math.max(n, 0), file: rel },
      status === 'set' ? `${o.name}: set (${n} characters) in ${rel}.` : status === 'empty' ? `${o.name}: empty in ${rel}.` : `${o.name}: no line in ${rel}.`);
    return status === 'set' ? 0 : 1;
  }

  if (o.mode === 'unset') {
    writeAtomic(o.env, setLine(text, o.name, ''));
    say(o, { name: o.name, status: 'unset', file: rel }, `${o.name} blanked in ${rel}. If the old value leaked, revoke it in Business Settings → System users first.`);
    return 0;
  }

  let raw, source, clip = null;
  if (o.mode === 'from-stdin') { raw = readStdin(); source = 'stdin'; }
  else {
    clip = clipboardTools();
    if (!clip) { say(o, { name: o.name, status: 'no-clipboard-tool' }, 'No clipboard tool was found (wl-paste, xclip or xsel on Linux). Use --from-stdin, or install one.'); return 1; }
    const r = clip.read();
    if (!r.ok) { say(o, { name: o.name, status: 'clipboard-read-failed' }, `The clipboard could not be read (${clip.name}).`); return 1; }
    raw = r.out; source = 'clipboard';
  }
  const v = validate(raw, o.minLength);
  raw = null;
  if (v.reason) {
    say(o, { name: o.name, status: 'refused', reason: v.reason, source }, `${o.name} not written: ${v.reason}.`);
    return 1;
  }
  writeAtomic(o.env, setLine(text, o.name, v.value));
  const len = v.value.length;
  v.value = null;
  let cleared = false;
  if (source === 'clipboard' && !o.keepClipboard) cleared = !!clip.clear();
  say(o, { name: o.name, status: 'set', length: len, source, file: rel, clipboardCleared: cleared },
    `${o.name} set in ${rel} (${len} characters, from the ${source})${source === 'clipboard' ? (cleared ? '; clipboard cleared.' : '; the clipboard could not be cleared: copy something harmless over it.') : '.'}`);
  return 0;
}

process.exit(main());
