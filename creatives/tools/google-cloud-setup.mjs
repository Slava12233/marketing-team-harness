#!/usr/bin/env node
// google-cloud-setup.mjs: the Google Cloud side of the Google Ads connection, from the command line instead of the
// Cloud Console (Node 20+, no dependencies; it drives Google's own CLI, gcloud). It replaces the console steps of the
// OAuth route (the consent screen, the Desktop client, the "Allow" login) with a service account that google-ads.mjs
// signs in with (GOOGLE_ADS_JSON_KEY_FILE). What it cannot do stays in the browser, and it prints the exact link:
// adding the service account to the Google Ads account (Admin > Access and security), the Explorer access application
// (Cloud Console > Google Ads API > Overview), billing and advertiser verification.
//
//   node creatives/tools/google-cloud-setup.mjs install            install the gcloud CLI (winget on Windows, Homebrew on a Mac)
//   node creatives/tools/google-cloud-setup.mjs login              gcloud auth login: the Owner signs in to Google in the browser
//   node creatives/tools/google-cloud-setup.mjs run --project <id> [--name "<project name>"] [--account <service account id>]
//                                                                  the project (created when missing), the Google Ads API on,
//                                                                  the service account, its key in .secrets/, its path in .env
//   node creatives/tools/google-cloud-setup.mjs check [--project <id>]   what is in place (reads only)
//   every subcommand takes --dry-run (print the gcloud commands, run nothing) and --json
//
// Rules: the key file is written by gcloud itself into .secrets/google-ads-key.json (git-ignored, limited to this user)
// and its contents are never read into chat or printed; .env gets only the path (GOOGLE_ADS_JSON_KEY_FILE), through the
// same atomic writer as google-ads.mjs, and is never printed. A project or service account that exists is reused,
// never changed or deleted. An organization that blocks key creation (iam.disableServiceAccountKeyCreation) is
// reported with its two ways out; nothing is retried. Writes append to creatives/uploads/<date>-google-cloud.json.
// Exit codes: 0 ok, 1 gcloud or Google refused, 2 a missing tool, sign-in or argument.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setEnvLine, writeEnvAtomic, readServiceKey } from "./google-ads.mjs";

const SELF = fileURLToPath(import.meta.url);
export const REPO = path.resolve(path.dirname(SELF), "..", "..");
export const API = "googleads.googleapis.com";
export const KEY_REL = ".secrets/google-ads-key.json";
export const DEFAULT_ACCOUNT = "harness-google-ads";
const BOUND_MS = 20 * 60 * 1000;

export class UsageError extends Error {}

// Project ids: 6–30 characters, lower-case letters, digits and hyphens, a letter first, no hyphen last.
export const isProjectId = (s) => /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(String(s || ""));
// Service account ids: 6–30 characters, the same alphabet.
export const isAccountId = (s) => /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(String(s || ""));
export const serviceEmail = (account, project) => `${account}@${project}.iam.gserviceaccount.com`;
export const consoleUrls = (project, email) => ({
  explorer: `https://console.cloud.google.com/apis/api/${API}/overview?project=${project}`,
  adsAccess: "https://ads.google.com/aw/accessandsecurity",
  serviceAccount: email,
});

// A suggested project id from config/company.md's short name: "<name>-ads-<4 random>" (ids are global across Google).
export function suggestProject(repo, rand = Math.random) {
  let name = "";
  try {
    const m = /\*\*Short name:\*\*[ \t]*(.*)/i.exec(fs.readFileSync(path.join(repo, "config", "company.md"), "utf8"));
    if (m && !m[1].includes("{{")) name = m[1];
  } catch { /* no config yet */ }
  const base = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 16) || "harness";
  const tail = Math.floor(rand() * 0xffff).toString(16).padStart(4, "0");
  return `${/^[a-z]/.test(base) ? base : "h-" + base}-ads-${tail}`.replace(/--+/g, "-");
}

// Where gcloud is: on PATH, or where its installers put it (a new install is not on this window's PATH yet).
export function findGcloud(env = process.env, platform = process.platform, exists = fs.existsSync) {
  const win = platform === "win32";
  const names = win ? ["gcloud.cmd", "gcloud.exe"] : ["gcloud"];
  for (const dir of String(env.PATH || env.Path || "").split(path.delimiter).filter(Boolean)) {
    for (const n of names) if (exists(path.join(dir, n))) return path.join(dir, n);
  }
  const sdk = ["Google", "Cloud SDK", "google-cloud-sdk", "bin", "gcloud.cmd"];
  const places = win
    ? [env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, ...sdk), env["ProgramFiles(x86)"] && path.join(env["ProgramFiles(x86)"], ...sdk),
      env.ProgramFiles && path.join(env.ProgramFiles, ...sdk)]
    : ["/opt/homebrew/bin/gcloud", "/usr/local/bin/gcloud", "/opt/homebrew/share/google-cloud-sdk/bin/gcloud",
      "/usr/local/share/google-cloud-sdk/bin/gcloud", env.HOME && path.join(env.HOME, "google-cloud-sdk", "bin", "gcloud")];
  return places.find((p) => p && exists(p)) || "";
}

// One gcloud call: { status, stdout, stderr }. On Windows gcloud is a .cmd, which Node runs only through the shell,
// so every argument is quoted for cmd.exe.
function quoteCmd(a) { return /[\s"&|<>^()%!,;=]/.test(a) ? `"${String(a).replace(/"/g, '""')}"` : a; }
export function gcloudRunner(bin, { inherit = false } = {}) {
  return (args) => {
    const win = process.platform === "win32";
    const r = win
      ? spawnSync([quoteCmd(bin), ...args.map(quoteCmd)].join(" "), { shell: true, encoding: "utf8", timeout: BOUND_MS, windowsHide: !inherit, stdio: inherit ? "inherit" : "pipe" })
      : spawnSync(bin, args, { encoding: "utf8", timeout: BOUND_MS, stdio: inherit ? "inherit" : "pipe" });
    return { status: r.error ? 127 : r.status, stdout: String(r.stdout || ""), stderr: String(r.stderr || (r.error ? r.error.message : "")) };
  };
}

export function parseArgs(argv) {
  const pos = []; const o = {};
  const takes = new Set(["project", "name", "account"]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { pos.push(a); continue; }
    let k = a.slice(2), v = true;
    if (k.includes("=")) { v = k.slice(k.indexOf("=") + 1); k = k.slice(0, k.indexOf("=")); }
    else if (takes.has(k)) { v = argv[++i]; if (v === undefined) throw new UsageError(`--${k} needs a value`); }
    o[k] = v;
  }
  return { pos, o };
}

export function helpText() {
  return [
    "Usage: node creatives/tools/google-cloud-setup.mjs <install | login | run | check> [options]",
    "  install                 install the gcloud CLI (Windows: winget Google.CloudSDK; Mac: brew install --cask gcloud-cli)",
    "  login                   gcloud auth login: the Owner signs in with the Google user that owns the company's Cloud project",
    "  run --project <id>      create the project when missing, turn the Google Ads API on, create the service account",
    "                          and its key (.secrets/google-ads-key.json), and write its path to .env (GOOGLE_ADS_JSON_KEY_FILE)",
    "      [--name \"<name>\"]   the project's display name when it is created (default: \"Marketing harness\")",
    "      [--account <id>]    the service account id (default: harness-google-ads)",
    "  check [--project <id>]  what is in place, read only",
    "  --dry-run               print the gcloud commands, run nothing; --json prints the result as JSON",
    "Then, in the browser (no API exists): add the service account to Google Ads (Admin > Access and security, Standard)",
    "and apply for Explorer access (Cloud Console > Google Ads API > Overview). run prints both links.",
  ].join("\n");
}

export function run(argv, opts = {}) {
  const out = opts.out || ((s) => process.stdout.write(s + "\n"));
  const err = opts.err || ((s) => process.stderr.write(s + "\n"));
  const repo = opts.repo || REPO;
  const env = opts.env || process.env;
  const now = opts.now || (() => new Date());
  let parsed;
  try { parsed = parseArgs(argv); } catch (e) { err(e.message); return 2; }
  const { pos, o } = parsed;
  const cmd = pos[0];
  if (o.help || !cmd) { out(helpText()); return o.help ? 0 : 2; }
  if (!["install", "login", "run", "check"].includes(cmd) || pos.length > 1) { err(`unknown subcommand: ${pos.join(" ")} (see --help)`); return 2; }
  const dry = Boolean(o["dry-run"]);
  const human = o.json ? err : out;
  const bin = opts.gcloud !== undefined ? opts.gcloud : findGcloud(env);
  const exec = opts.exec || (bin ? gcloudRunner(bin) : null);
  const shown = (args) => "gcloud " + args.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(" ");

  if (cmd === "install") return install();
  if (!bin && !dry) { err("gcloud (the Google Cloud CLI) is not installed: run node creatives/tools/google-cloud-setup.mjs install"); return 2; }
  if (cmd === "login") {
    const args = ["auth", "login", "--brief"];
    if (dry) { out(shown(args)); return 0; }
    human("Opening Google's sign-in in the browser: the Owner signs in with the Google user that owns (or will own) the company's Cloud project and clicks Allow.");
    const r = (opts.execInherit || gcloudRunner(bin, { inherit: true }))(args);
    if (r.status !== 0) { err("The sign-in did not finish; run login again."); return 1; }
    human("Signed in. Next: node creatives/tools/google-cloud-setup.mjs run --project <id>");
    return 0;
  }

  const account = o.account === undefined ? DEFAULT_ACCOUNT : String(o.account);
  if (!isAccountId(account)) { err("--account must be 6–30 lower-case letters, digits or hyphens, starting with a letter"); return 2; }
  const project = o.project === undefined ? "" : String(o.project);
  if (cmd === "run" && !project) { err(`run needs --project <id>. A free id for this company could be: ${suggestProject(repo)} (ids are global across Google; 6–30 lower-case letters, digits and hyphens).`); return 2; }
  if (project && !isProjectId(project)) { err("--project must be 6–30 lower-case letters, digits or hyphens, starting with a letter and not ending with a hyphen"); return 2; }
  const email = project ? serviceEmail(account, project) : "";
  const keyAbs = path.join(repo, ...KEY_REL.split("/"));
  const envFile = path.join(repo, ".env");
  const g = (args) => exec([...args, "--quiet"]);
  const ok = (r) => r.status === 0;
  const first = (s) => String(s || "").split(/\r?\n/).map((x) => x.trim()).find(Boolean) || "";
  const activeAccount = () => first(g(["auth", "list", "--filter=status:ACTIVE", "--format=value(account)"]).stdout);
  const projectExists = () => ok(g(["projects", "describe", project, "--format=value(projectId)"]));
  const apiOn = () => first(g(["services", "list", "--enabled", `--filter=config.name=${API}`, "--format=value(config.name)", `--project=${project}`]).stdout) === API;
  const accountExists = () => ok(g(["iam", "service-accounts", "describe", email, `--project=${project}`, "--format=value(email)"]));
  const keyState = () => {   // the key named in .env: missing, another account's, or this one's
    let rel = "";
    try { const m = /^\s*GOOGLE_ADS_JSON_KEY_FILE\s*=\s*(.+?)\s*$/m.exec(fs.readFileSync(envFile, "utf8")); rel = m ? m[1].replace(/^["']|["']$/g, "") : ""; } catch { /* no .env */ }
    if (!rel) return { state: "unset" };
    try { const k = readServiceKey(path.resolve(repo, rel)); return { state: k.email === email ? "ok" : "other", rel, email: k.email }; }
    catch { return { state: "missing", rel }; }
  };

  if (cmd === "check") {
    const res = { gcloud: bin ? "found" : "missing", signed_in: "", project: project || null };
    if (!bin) { human("gcloud          : not installed (run install)"); if (o.json) out(JSON.stringify(res)); return 2; }
    res.signed_in = activeAccount();
    human(`gcloud          : ${bin}`);
    human(`signed in as    : ${res.signed_in || "nobody (run login)"}`);
    let good = Boolean(res.signed_in);
    if (project && res.signed_in) {
      res.project_exists = projectExists();
      res.api_on = res.project_exists && apiOn();
      res.service_account = res.project_exists && accountExists() ? email : null;
      const k = keyState();
      res.key = k.state;
      human(`project         : ${project} ${res.project_exists ? "exists" : "not found (run creates it)"}`);
      human(`google ads api  : ${res.api_on ? "on" : "off"}`);
      human(`service account : ${res.service_account || `${email} not created yet`}`);
      human(`key in .env     : ${k.state === "ok" ? `${k.rel} (this account)` : k.state === "other" ? `${k.rel} belongs to ${k.email}` : k.state === "missing" ? `${k.rel} is missing` : "not set"}`);
      good = res.project_exists && res.api_on && Boolean(res.service_account) && k.state === "ok";
      if (good) human(`then, by hand   : add ${email} to Google Ads (${consoleUrls(project, email).adsAccess}) and apply for Explorer (${consoleUrls(project, email).explorer})`);
    }
    if (o.json) out(JSON.stringify(res, null, 2));
    return good ? 0 : 2;
  }

  // run
  const plan = [
    ["projects", "create", project, `--name=${o.name || "Marketing harness"}`],
    ["services", "enable", API, `--project=${project}`],
    ["iam", "service-accounts", "create", account, "--display-name=Marketing harness (Google Ads)", `--project=${project}`],
    ["iam", "service-accounts", "keys", "create", keyAbs, `--iam-account=${email}`, `--project=${project}`],
  ];
  if (dry) {
    for (const p of plan) out(shown([...p, "--quiet"]));
    out(`then .env: GOOGLE_ADS_JSON_KEY_FILE=${KEY_REL}`);
    return 0;
  }
  if (!fs.existsSync(envFile)) { err("No .env at the harness root: run the bootstrap first (it copies .env.example to .env)."); return 2; }
  const who = activeAccount();
  if (!who) { err("gcloud is not signed in: run node creatives/tools/google-cloud-setup.mjs login (the Owner signs in in the browser)."); return 2; }
  human(`gcloud is signed in as ${who}.`);
  const done = [];
  const fail = (step, r) => {
    const text = `${r.stderr}\n${r.stdout}`;
    if (/disableServiceAccountKeyCreation/i.test(text)) {
      err(`refused: the organization above this project blocks service account keys (constraints/iam.disableServiceAccountKeyCreation).
Two ways out:
  1. An organization admin turns the rule off for this project only:
     gcloud resource-manager org-policies disable-enforce iam.disableServiceAccountKeyCreation --project=${project}
     then run this command again.
  2. Use the OAuth fallback instead (docs/google-setup-guide.md, "The fallback: an OAuth client").`);
    } else if (/already exists|ALREADY_EXISTS|is not available|already in use/i.test(text) && step === "project") {
      err(`refused: the project id ${project} is taken (ids are global across Google). Choose another, for example ${suggestProject(repo)}.`);
    } else if (/billing/i.test(text)) {
      err(`Google asked for billing on the Cloud project at the ${step} step: ${first(r.stderr)}`);
    } else err(`gcloud refused the ${step} step: ${first(r.stderr) || `exit ${r.status}`}`);
    ledger("FAILED");
    return 1;
  };
  const ledger = (status) => {
    try {
      const file = path.join(repo, "creatives", "uploads", `${now().toISOString().slice(0, 10)}-google-cloud.json`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      let list = [];
      try { list = JSON.parse(fs.readFileSync(file, "utf8")); if (!Array.isArray(list)) list = []; } catch { list = []; }
      list.push({ at: now().toISOString(), tool: "google-cloud-setup", command: "run", project, service_account: email, done, status });
      fs.writeFileSync(file, JSON.stringify(list, null, 2) + "\n");
    } catch { /* the ledger never blocks */ }
  };

  if (projectExists()) human(`project ${project}: exists, reused.`);
  else {
    const r = g(plan[0]);
    if (!ok(r)) return fail("project", r);
    done.push("project created"); human(`project ${project}: created.`);
  }
  if (apiOn()) human("Google Ads API: already on.");
  else {
    const r = g(plan[1]);
    if (!ok(r)) return fail("API", r);
    done.push("Google Ads API enabled"); human("Google Ads API: turned on.");
  }
  if (accountExists()) human(`service account ${email}: exists, reused.`);
  else {
    const r = g(plan[2]);
    if (!ok(r)) return fail("service account", r);
    done.push("service account created"); human(`service account ${email}: created.`);
  }
  const k = keyState();
  if (k.state === "ok") human(`key: ${k.rel} is this account's key, kept (no new key).`);
  else {
    fs.mkdirSync(path.dirname(keyAbs), { recursive: true });
    if (fs.existsSync(keyAbs)) fs.renameSync(keyAbs, `${keyAbs}.${now().toISOString().replace(/[:.]/g, "-")}.old`);
    const r = g(plan[3]);
    if (!ok(r)) return fail("key", r);
    try { fs.chmodSync(keyAbs, 0o600); } catch { /* Windows ignores it */ }
    if (process.platform === "win32" && env.USERNAME && !opts.exec) {
      spawnSync("icacls", [keyAbs, "/inheritance:r", "/grant:r", `${env.USERNAME}:(R,W)`], { stdio: "ignore", windowsHide: true });
    }
    writeEnvAtomic(envFile, setEnvLine(fs.readFileSync(envFile, "utf8"), "GOOGLE_ADS_JSON_KEY_FILE", KEY_REL));
    done.push("key created"); human(`key: written by gcloud to ${KEY_REL} (never shown); .env now names it as GOOGLE_ADS_JSON_KEY_FILE.`);
  }
  ledger("OK");
  const u = consoleUrls(project, email);
  const result = { project, service_account: email, key_file: KEY_REL, done, by_hand: { add_to_google_ads: u.adsAccess, explorer_application: u.explorer } };
  if (o.json) out(JSON.stringify(result, null, 2));
  human("");
  human("Two steps stay in the browser (Google has no API for them):");
  human(`  1. Google Ads > Admin > Access and security > + > ${email} > Standard access > Add account (${u.adsAccess})`);
  human(`  2. Apply for Explorer access: ${u.explorer} (the Upgrade access level form)`);
  human("Then: node creatives/tools/google-ads.mjs check");
  return 0;

  function install() {
    if (bin) { human(`gcloud is already installed: ${bin}`); return 0; }
    const platform = opts.platform || process.platform;
    let line;
    if (platform === "win32") line = ["winget", ["install", "--id", "Google.CloudSDK", "-e", "--source", "winget", "--accept-package-agreements", "--accept-source-agreements"]];
    else if (platform === "darwin") line = ["brew", ["install", "--cask", "gcloud-cli"]];
    else { err("Install the Google Cloud CLI by its official steps: https://cloud.google.com/sdk/docs/install , then run check."); return 2; }
    out(`Running: ${line[0]} ${line[1].join(" ")}`);
    if (dry) return 0;
    const runInstall = opts.installer || ((c, a) => spawnSync(c, a, { stdio: "inherit", timeout: BOUND_MS, shell: platform === "win32" }).status);
    let status = runInstall(line[0], line[1]);
    if (status !== 0 && platform === "darwin") { out("Running: brew install --cask google-cloud-sdk"); status = runInstall("brew", ["install", "--cask", "google-cloud-sdk"]); }
    const found = (opts.find || findGcloud)(env);
    if (status === 0 && found) { human(`gcloud installed: ${found}. Next: node creatives/tools/google-cloud-setup.mjs login`); return 0; }
    err(status === 0 ? "The install finished, but gcloud was not found yet: open a new terminal window and run check." : `The install did not finish (exit ${status}).`);
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SELF) process.exitCode = run(process.argv.slice(2));
