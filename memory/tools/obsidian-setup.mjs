#!/usr/bin/env node
// obsidian-setup.mjs — makes Obsidian ready for the vault without any click by the Owner.
//
// What it does (Windows and macOS; Linux reports only):
//   1. finds the Obsidian app (per-user or machine install) and its CLI binary;
//   2. registers this folder as a vault in Obsidian's global config (obsidian.json, the same file the
//      app writes when you use File → Open folder as vault), marked as the vault to open;
//   3. turns on the command line interface in that config (the key `cli`, the same one the toggle in
//      Settings → General → Advanced writes; verified against Obsidian 1.14.5 on 2026-10-26);
//   4. starts Obsidian when it is not running (a running app has to be restarted once for a freshly
//      enabled CLI: the main process reads the config at startup; the script says so and never kills it).
//
// Usage:  node memory/tools/obsidian-setup.mjs            register + enable + start, then report
//         node memory/tools/obsidian-setup.mjs --check    report only, exit 0 when everything is ready, 1 otherwise
//         node memory/tools/obsidian-setup.mjs --cli-path print the CLI binary path (empty line when absent)
//         node memory/tools/obsidian-setup.mjs --cli <args…>  run the CLI by its full path (no PATH needed),
//                                                             e.g. --cli vault   or   --cli search query=caps
// Output is names and paths only. No dependencies. Node 20+.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const VAULT = path.resolve(here, '..', '..');            // memory/tools → the vault root
const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const CLI_PATH_ONLY = argv.includes('--cli-path');
const cliIdx = argv.indexOf('--cli');
const CLI_ARGS = cliIdx >= 0 ? argv.slice(cliIdx + 1) : null;
const QUIET = argv.includes('--quiet');

const log = (s) => { if (!QUIET) console.log(s); };

function configDir() {
  if (process.platform === 'win32') return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'obsidian');
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'obsidian');
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'obsidian');
}

function findApp() {
  const c = [];
  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    c.push({ app: path.join(local, 'Programs', 'Obsidian', 'Obsidian.exe'), cli: path.join(local, 'Programs', 'Obsidian', 'Obsidian.com') });
    for (const pf of [process.env.ProgramFiles, process.env['ProgramW6432'], 'C:\\Program Files']) {
      if (pf) c.push({ app: path.join(pf, 'Obsidian', 'Obsidian.exe'), cli: path.join(pf, 'Obsidian', 'Obsidian.com') });
    }
  } else if (process.platform === 'darwin') {
    for (const base of ['/Applications', path.join(os.homedir(), 'Applications')]) {
      // The CLI binary inside the app bundle is unverified on macOS; the brew cask also exposes `obsidian` on PATH.
      c.push({ app: path.join(base, 'Obsidian.app'), cli: path.join(base, 'Obsidian.app', 'Contents', 'MacOS', 'Obsidian') });
    }
  } else {
    for (const p of ['/usr/bin/obsidian', '/usr/local/bin/obsidian', '/opt/Obsidian/obsidian', '/snap/bin/obsidian']) c.push({ app: p, cli: p });
  }
  for (const x of c) if (fs.existsSync(x.app)) return { app: x.app, cli: fs.existsSync(x.cli) ? x.cli : onPath('obsidian') };
  const p = onPath('obsidian');
  return p ? { app: p, cli: p } : null;
}

function onPath(name) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], { encoding: 'utf8' });
  const first = (r.stdout || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)[0];
  return r.status === 0 && first ? first : '';
}

function isRunning() {
  if (process.platform === 'win32') {
    const r = spawnSync('tasklist', ['/FI', 'IMAGENAME eq Obsidian.exe', '/NH'], { encoding: 'utf8' });
    return /Obsidian\.exe/i.test(r.stdout || '');
  }
  const r = spawnSync('pgrep', ['-x', 'Obsidian'], { encoding: 'utf8' });
  return r.status === 0;
}

function readConfig(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function samePath(a, b) {
  const n = (p) => path.resolve(String(p || '')).replace(/[\\/]+$/, '').toLowerCase();
  return n(a) === n(b);
}

function registered(cfg) {
  if (!cfg || !cfg.vaults) return '';
  for (const [id, v] of Object.entries(cfg.vaults)) if (v && samePath(v.path, VAULT)) return id;
  return '';
}

function randomId() {
  let s = '';
  for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

function main() {
  const app = findApp();
  const dir = configDir();
  const file = path.join(dir, 'obsidian.json');

  if (CLI_PATH_ONLY) { console.log(app && app.cli ? app.cli : ''); return 0; }

  if (CLI_ARGS) {
    if (!app || !app.cli) { console.error('obsidian-setup: no Obsidian CLI found'); return 2; }
    const r = spawnSync(app.cli, CLI_ARGS, { encoding: 'utf8', stdio: 'inherit', windowsHide: true, timeout: 60000 });
    return r.status == null ? 2 : r.status;
  }

  const cfg = readConfig(file) || { vaults: {} };
  const state = {
    app: app ? app.app : '',
    cli: app ? app.cli : '',
    configFile: file,
    vaultRegistered: !!registered(cfg),
    cliEnabled: cfg.cli === true,
    running: isRunning(),
  };

  if (CHECK) {
    log(`obsidian-setup --check (vault ${VAULT})`);
    log(`  app:        ${state.app || 'not found'}`);
    log(`  cli binary: ${state.cli || 'not found'}`);
    log(`  vault registered in ${file}: ${state.vaultRegistered ? 'yes' : 'no'}`);
    log(`  cli enabled: ${state.cliEnabled ? 'yes' : 'no'}`);
    log(`  app running: ${state.running ? 'yes' : 'no'}`);
    const ready = !!state.app && state.vaultRegistered && state.cliEnabled;
    log(ready ? 'obsidian-setup: ready' : 'obsidian-setup: not ready (run without --check)');
    return ready ? 0 : 1;
  }

  if (!app) {
    log('obsidian-setup: Obsidian is not installed; nothing registered. Install it (winget install Obsidian.Obsidian / brew install --cask obsidian) and run again.');
    return 1;
  }

  let changed = false;
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
  if (fs.existsSync(file)) { try { fs.copyFileSync(file, file + '.bak-obsidian-setup'); } catch { /* best effort */ } }
  if (!cfg.vaults) cfg.vaults = {};
  if (!registered(cfg)) {
    for (const v of Object.values(cfg.vaults)) if (v && v.open) delete v.open;   // the app opens the vault marked open
    cfg.vaults[randomId()] = { path: VAULT, ts: Date.now(), open: true };
    changed = true;
    log(`obsidian-setup: registered ${VAULT} as a vault`);
  } else {
    log('obsidian-setup: vault already registered');
  }
  if (cfg.cli !== true) { cfg.cli = true; changed = true; log('obsidian-setup: command line interface enabled'); }
  else log('obsidian-setup: command line interface already enabled');
  if (changed) fs.writeFileSync(file, JSON.stringify(cfg));

  if (!state.running) {
    try {
      const child = process.platform === 'darwin'
        ? spawn('open', ['-a', 'Obsidian'], { detached: true, stdio: 'ignore' })
        : spawn(app.app, [], { detached: true, stdio: 'ignore', windowsHide: false });
      child.unref();
      log('obsidian-setup: Obsidian started; it opens the vault');
    } catch (e) { log(`obsidian-setup: could not start Obsidian (${e.message}); open it yourself once`); }
  } else if (changed) {
    log('obsidian-setup: Obsidian is running; close and reopen it once so it reads the new setting (the CLI answers after that)');
  } else {
    log('obsidian-setup: Obsidian is running');
  }
  log(`obsidian-setup: CLI = ${app.cli || 'not found'} (the harness calls it by this path; nothing to add to PATH)`);
  return 0;
}

process.exit(main());
