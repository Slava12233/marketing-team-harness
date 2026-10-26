#!/usr/bin/env node
// meta-graph.mjs: the Graph API reads and safe writes that Meta's official Ads MCP has no tool for: targeting
// search, audience size estimates, lead forms, lead rows, automated rules, lookalike audiences and insights
// breakdowns written to a CSV file. Builds stay in the MCP; this tool fills the holes around them.
//
// Usage (from the repository root; Node 20+, no dependencies). Every subcommand takes --dry-run (prints the exact
// requests with the token shown as [token]; no network) and --json (raw JSON to stdout; human lines go to stderr):
//   node creatives/tools/meta-graph.mjs check
//   node creatives/tools/meta-graph.mjs targeting-search --q "<text>" [--type adinterest|adbehavior|adworkposition|adeducationmajor|adgeolocation|adlocale]
//   node creatives/tools/meta-graph.mjs delivery-estimate --targeting <file.json> --goal <OPTIMIZATION_GOAL>
//   node creatives/tools/meta-graph.mjs lead-forms list
//   node creatives/tools/meta-graph.mjs lead-forms create --spec <file.json>
//   node creatives/tools/meta-graph.mjs leads --form <id> --out <file.csv OUTSIDE this repository> [--since <ISO date>] [--fields <list>]
//   node creatives/tools/meta-graph.mjs insights --level campaign|adset|ad (--since YYYY-MM-DD --until YYYY-MM-DD | --preset last_7d)
//                                       [--ids a,b,c] [--breakdowns age,gender,...] [--fields <list>] [--async] --out <file.csv>
//   node creatives/tools/meta-graph.mjs rules list
//   node creatives/tools/meta-graph.mjs rules create --spec <file.json>
//   node creatives/tools/meta-graph.mjs rules delete --id <rule id> --yes
//   node creatives/tools/meta-graph.mjs audiences list
//   node creatives/tools/meta-graph.mjs audiences lookalike --origin <audience id> --ratio 0.01 --country XX --name "<name>"
//
// Configuration, from the repository-root .env only (template: .env.example); no other .env key is read:
//   META_AD_ACCOUNT_ID    required; the ad account id, digits, "act_" optional. Every account path is built from it;
//                         no subcommand takes an account id on the command line.
//   META_MARKETING_TOKEN  required; a System User token. For the token only, the process environment wins over .env.
//   META_GRAPH_VERSION    optional; default v23.0.
//   META_PAGE_ID          optional; the Page id, digits. Needed by lead-forms (and used by leads for the Page token).
// Tokens are never printed and never put in a URL: they travel in an Authorization header, and every printed line
// is scrubbed. The Page token (fetched with the System User token for lead-forms and leads) is handled the same way.
// Generating, rotating or revoking the token is the Owner's click in Meta Business Settings (System users).
//
// Safety: leads writes its CSV only to a path OUTSIDE this repository and never prints a row (count, path and field
// names only). rules create accepts only execution_type PAUSE or NOTIFICATION, and creates the rule DISABLED unless
// the spec says "status": "ENABLED". rules delete checks the rule belongs to the .env account and needs --yes.
// lead-forms create refuses a spec without privacy_policy.url. Every write (lead-forms create, rules create, rules
// delete, audiences lookalike) appends to creatives/uploads/<YYYY-MM-DD>-meta-graph.json; reads append nothing.
// Errors are never retried. Code 190, 200 or 10 prints the Owner's fix list. Guide: docs/meta-graph.md.
// Exit codes: 0 ok, 1 API or network error, 2 missing configuration, bad arguments or a refused request.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
export const REPO = path.resolve(path.dirname(SELF), "..", "..");
export const ENV_KEYS = ["META_AD_ACCOUNT_ID", "META_MARKETING_TOKEN", "META_GRAPH_VERSION", "META_PAGE_ID"];
const GRAPH_HOST = "graph.facebook.com";
const DEFAULT_VERSION = "v23.0";
export const MAX_PAGES = 500;
export const MAX_POLLS = 60;
export const POLL_MS = 5000;
const AUTH_CODES = new Set([190, 200, 10]);

export const INSIGHTS_DEFAULT_FIELDS =
  "campaign_name,adset_name,ad_name,spend,impressions,reach,frequency,clicks,ctr,cpm,actions,cost_per_action_type";
export const LEADS_DEFAULT_FIELDS =
  "id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,platform,is_organic,field_data";
const DATE_PRESETS = new Set([
  "today", "yesterday", "this_month", "last_month", "this_quarter", "last_quarter", "this_year", "last_year",
  "maximum", "data_maximum", "last_3d", "last_7d", "last_14d", "last_28d", "last_30d", "last_90d",
  "last_week_mon_sun", "last_week_sun_sat", "this_week_mon_today", "this_week_sun_today",
]);
// --type values map to Meta's targeting search (GET /search?type=...); without --type the account's unified
// targetingsearch endpoint is used. Behaviours live under adTargetingCategory with class=behaviors.
const SEARCH_TYPES = {
  adinterest: { type: "adinterest" },
  adbehavior: { type: "adTargetingCategory", class: "behaviors" },
  adworkposition: { type: "adworkposition" },
  adeducationmajor: { type: "adeducationmajor" },
  adgeolocation: { type: "adgeolocation" },
  adlocale: { type: "adlocale" },
};
const ACCOUNT_STATUS = { 1: "ACTIVE", 2: "DISABLED", 3: "UNSETTLED", 7: "PENDING_RISK_REVIEW", 8: "PENDING_SETTLEMENT",
  9: "IN_GRACE_PERIOD", 100: "PENDING_CLOSURE", 101: "CLOSED", 201: "ANY_ACTIVE", 202: "ANY_CLOSED" };

// ---------- errors ----------
export class UsageError extends Error {}
export class GraphError extends Error {
  constructor(message, info = {}) { super(message); Object.assign(this, info); }
}

// ---------- .env (only the four keys above are ever kept) ----------
export function readEnvFile(file, keys = ENV_KEYS) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m || !keys.includes(m[1])) continue;
    let v = m[2].trim();
    const q = v[0];
    if ((q === '"' || q === "'") && v.endsWith(q) && v.length >= 2) v = v.slice(1, -1);
    if (v) out[m[1]] = v;
  }
  return out;
}

// ---------- scrubber ----------
export function scrubText(text, secrets = []) {
  let s = String(text);
  for (const secret of secrets) if (secret && secret.length >= 4) s = s.split(secret).join("[token]");
  return s.replace(/access_token=[^&\s"']+/gi, "access_token=[token]");
}
export function makeScrubber(initial = []) {
  const secrets = initial.filter(Boolean);
  const scrub = (text) => scrubText(text, secrets);
  scrub.add = (secret) => { if (secret) secrets.push(String(secret)); };
  return scrub;
}

// ---------- CSV (UTF-8 with BOM, so spreadsheet apps open right-to-left and accented text correctly) ----------
const NUMERIC = /^-?\d+(\.\d+)?(e[+-]?\d+)?$/i;
export function csvCell(value) {
  if (value === null || value === undefined) return "";
  let s = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/^[=+\-@\t\r]/.test(s) && !NUMERIC.test(s)) s = "'" + s; // a cell is never read as a spreadsheet formula
  if (/[",\r\n]/.test(s) || /^\s|\s$/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}
export function toCsv(headers, rows) {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) lines.push(headers.map((h) => csvCell(row[h])).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}
export function writeCsv(file, headers, rows, { mode } = {}) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, toCsv(headers, rows), mode ? { encoding: "utf8", mode } : "utf8");
}

// ---------- row flattening ----------
const isActionList = (v) => Array.isArray(v) && v.length > 0 && v.every((x) => x && typeof x === "object" && "action_type" in x);
export function flattenInsightRows(rows) {
  const base = [];
  const extra = new Set();
  const out = rows.map((row) => {
    const flat = {};
    for (const [k, v] of Object.entries(row)) {
      if (isActionList(v)) {
        const prefix = k === "actions" ? "action" : k === "cost_per_action_type" ? "cpa" : k;
        for (const a of v) { const col = `${prefix}:${a.action_type}`; flat[col] = a.value; extra.add(col); }
      } else if (Array.isArray(v) && v.length === 0) {
        continue;
      } else {
        flat[k] = v;
        if (!base.includes(k)) base.push(k);
      }
    }
    return flat;
  });
  return { headers: [...base, ...[...extra].sort()], rows: out };
}
export function flattenLeadRows(rows, requestedFields = []) {
  const base = requestedFields.filter((f) => f !== "field_data");
  const answers = [];
  const out = rows.map((row) => {
    const flat = {};
    for (const [k, v] of Object.entries(row)) {
      if (k === "field_data") continue;
      flat[k] = v;
      if (!base.includes(k)) base.push(k);
    }
    for (const fd of Array.isArray(row.field_data) ? row.field_data : []) {
      if (!fd || !fd.name) continue;
      const col = base.includes(fd.name) ? `field:${fd.name}` : fd.name;
      flat[col] = Array.isArray(fd.values) ? fd.values.join("; ") : fd.values;
      if (!answers.includes(col)) answers.push(col);
    }
    return flat;
  });
  return { headers: [...base, ...answers], rows: out };
}

// ---------- spec validators (return a list of problems; empty means valid) ----------
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
export const LEAD_FORM_KEYS = ["name", "questions", "privacy_policy", "thank_you_page", "context_card", "locale",
  "block_display_for_non_targeted_viewer", "follow_up_action_url"];
export function validateLeadFormSpec(spec) {
  if (!isObj(spec)) return ["the spec is not a JSON object"];
  const p = [];
  for (const k of Object.keys(spec)) if (!LEAD_FORM_KEYS.includes(k)) p.push(`unknown field "${k}" (allowed: ${LEAD_FORM_KEYS.join(", ")})`);
  if (typeof spec.name !== "string" || !spec.name.trim()) p.push("name is missing");
  if (!Array.isArray(spec.questions) || spec.questions.length === 0) p.push("questions is missing or empty");
  const pp = spec.privacy_policy;
  if (!isObj(pp) || typeof pp.url !== "string" || !pp.url.trim()) {
    p.push("privacy_policy.url is missing (Meta requires a privacy policy link on every lead form)");
  } else if (!/^https?:\/\/\S+$/i.test(pp.url.trim())) {
    p.push("privacy_policy.url is not a web address (expected https://...)");
  }
  if (spec.follow_up_action_url !== undefined && !/^https?:\/\/\S+$/i.test(String(spec.follow_up_action_url))) {
    p.push("follow_up_action_url is not a web address (expected https://...)");
  }
  return p;
}
export const RULE_KEYS = ["name", "evaluation_spec", "execution_spec", "schedule_spec", "status"];
export const RULE_EXECUTION_ALLOWED = ["PAUSE", "NOTIFICATION"];
export function validateRuleSpec(spec) {
  if (!isObj(spec)) return ["the spec is not a JSON object"];
  const p = [];
  for (const k of Object.keys(spec)) if (!RULE_KEYS.includes(k)) p.push(`unknown field "${k}" (allowed: ${RULE_KEYS.join(", ")})`);
  if (typeof spec.name !== "string" || !spec.name.trim()) p.push("name is missing");
  const ev = spec.evaluation_spec;
  if (!isObj(ev)) p.push("evaluation_spec is missing");
  else {
    if (typeof ev.evaluation_type !== "string") p.push("evaluation_spec.evaluation_type is missing (SCHEDULE or TRIGGER)");
    if (!Array.isArray(ev.filters) || ev.filters.length === 0) p.push("evaluation_spec.filters is missing or empty");
  }
  const ex = spec.execution_spec;
  const type = isObj(ex) ? ex.execution_type : undefined;
  if (!RULE_EXECUTION_ALLOWED.includes(type)) {
    p.push(`execution_spec.execution_type ${type === undefined ? "is missing" : `"${type}" is refused`}: this tool only creates rules ` +
      "that PAUSE or send a NOTIFICATION (never UNPAUSE, CHANGE_BUDGET, CHANGE_BID, ROTATE or any other action)");
  }
  if (spec.schedule_spec !== undefined && !isObj(spec.schedule_spec)) p.push("schedule_spec is not an object");
  if (spec.status !== undefined && !["ENABLED", "DISABLED"].includes(spec.status)) p.push('status must be "ENABLED" or "DISABLED"');
  return p;
}

// ---------- paths ----------
function realish(p) {
  let cur = path.resolve(p);
  const rest = [];
  while (!fs.existsSync(cur)) {
    const parent = path.dirname(cur);
    if (parent === cur) break;
    rest.unshift(path.basename(cur));
    cur = parent;
  }
  let real = cur;
  try { real = fs.realpathSync.native(cur); } catch { /* keep the resolved path */ }
  return path.join(real, ...rest);
}
export function isInside(child, parent) {
  const norm = (p) => (process.platform === "win32" ? realish(p).toLowerCase() : realish(p));
  const rel = path.relative(norm(parent), norm(child));
  return rel === "" || (rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel));
}

// ---------- arguments ----------
const BOOL = new Set(["dry-run", "json", "async", "yes", "help"]);
const VALUED = new Set(["q", "type", "targeting", "goal", "spec", "form", "out", "since", "until", "fields", "level",
  "ids", "preset", "breakdowns", "origin", "ratio", "country", "name", "id"]);
export function parseArgs(argv) {
  const pos = [];
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h") { o.help = true; continue; }
    if (!a.startsWith("--")) { pos.push(a); continue; }
    let k = a.slice(2);
    let v;
    const eq = k.indexOf("=");
    if (eq >= 0) { v = k.slice(eq + 1); k = k.slice(0, eq); }
    if (BOOL.has(k)) {
      if (v !== undefined) throw new UsageError(`--${k} takes no value`);
      o[k] = true;
    } else if (VALUED.has(k)) {
      if (v === undefined) {
        v = argv[++i];
        if (v === undefined || v.startsWith("--")) throw new UsageError(`--${k} needs a value`);
      }
      o[k] = v;
    } else throw new UsageError(`unknown option: --${k} (see --help)`);
  }
  return { pos, o };
}
const COMMON = ["dry-run", "json", "help"];
const ALLOWED = {
  check: [],
  "targeting-search": ["q", "type"],
  "delivery-estimate": ["targeting", "goal"],
  "lead-forms list": [],
  "lead-forms create": ["spec"],
  leads: ["form", "out", "since", "fields"],
  insights: ["level", "ids", "since", "until", "preset", "breakdowns", "fields", "out", "async"],
  "rules list": [],
  "rules create": ["spec"],
  "rules delete": ["id", "yes"],
  "audiences list": [],
  "audiences lookalike": ["origin", "ratio", "country", "name"],
};

export function helpText() {
  const all = fs.readFileSync(SELF, "utf8").split(/\r?\n/).slice(1); // skip the #! line
  const end = all.findIndex((l) => !l.startsWith("//"));
  return all.slice(0, end === -1 ? all.length : end).map((l) => l.slice(3)).join("\n");
}

// ---------- small helpers ----------
const digits = (v) => /^\d+$/.test(String(v || ""));
const csvList = (v) => String(v || "").split(",").map((s) => s.trim()).filter(Boolean);
const cell = (v) => (v === null || v === undefined ? "" : String(Array.isArray(v) ? v.join(" > ") : v).replace(/\|/g, "\\|").replace(/\r?\n/g, " "));
const encodeParam = (v) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v));
function readJsonFile(file, label) {
  if (!fs.existsSync(file)) throw new UsageError(`${label} not found: ${file}`);
  try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, "")); }
  catch (e) { throw new UsageError(`${label} is not valid JSON (${file}): ${e.message}`); }
}
function table(headers, rows) {
  const lines = [`| ${headers.join(" | ")} |`, `|${headers.map(() => "---").join("|")}|`];
  for (const r of rows) lines.push(`| ${r.map(cell).join(" | ")} |`);
  return lines.join("\n");
}
const req = (method, p, params = {}, token = "[token]", note) => ({ method, path: p, params, token, note });

function ownerFixList(code) {
  return [
    `Meta refused the token or the app (code ${code}). Nothing was retried. The Owner's fix list (console clicks; names only, never paste a token in chat):`,
    "  1. App mode: the developer app (Business type) is in Business Settings > Accounts > Apps and is Live, or in",
    "     Development with the System User among its roles.",
    "  2. System User asset access: Business Settings > Users > System users > the System User > Assign assets:",
    "     the ad account with Manage campaigns (full control); the Page with ads and leads access for lead-forms and leads;",
    "     and the app itself (Develop app).",
    "  3. Token permissions: on the System User, Revoke tokens for the app first, then Generate new token with",
    "     ads_management and ads_read (plus leads_retrieval, pages_manage_ads, pages_read_engagement and pages_show_list",
    "     for lead forms and leads); paste it into .env as META_MARKETING_TOKEN, then run: node creatives/tools/meta-graph.mjs check",
    "  Code 190 means the token is invalid, expired or revoked (step 3). Code 200 or 10 means a missing asset or permission (steps 1-3).",
  ].join("\n");
}

// ---------- run ----------
/**
 * Runs one subcommand and resolves to the exit code (0 ok, 1 API error, 2 configuration, arguments or refusal).
 * opts: fetch (default globalThis.fetch), env (the process environment; only META_MARKETING_TOKEN is taken from it),
 * cwd (where relative file arguments resolve; when given and repo is not, it is also the repository root),
 * repo (the repository root holding .env and creatives/uploads/), stdout, stderr, sleep(ms), now().
 */
export async function run(argv, opts = {}) {
  const io = {
    fetch: opts.fetch || globalThis.fetch,
    env: opts.env || process.env,
    cwd: opts.cwd || process.cwd(),
    repo: opts.repo || opts.cwd || REPO,
    stdout: opts.stdout || process.stdout,
    stderr: opts.stderr || process.stderr,
    sleep: opts.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms))),
    now: opts.now || (() => new Date()),
  };
  const scrub = makeScrubber();
  const say = (s) => io.stdout.write(scrub(s) + "\n");
  const err = (s) => io.stderr.write(scrub(s) + "\n");

  let parsed;
  try { parsed = parseArgs(argv); } catch (e) { err(e.message); return 2; }
  const { pos, o } = parsed;
  if (o.help || pos.length === 0) { say(helpText()); return o.help ? 0 : 2; }
  const grouped = ["lead-forms", "rules", "audiences"].includes(pos[0]);
  const key = grouped ? `${pos[0]} ${pos[1] || ""}`.trim() : pos[0];
  if (!ALLOWED[key]) { err(`unknown subcommand: ${pos.join(" ")} (see --help)`); return 2; }
  if (pos.length > (grouped ? 2 : 1)) { err(`unexpected argument: ${pos.slice(grouped ? 2 : 1).join(" ")} (see --help)`); return 2; }
  for (const k of Object.keys(o)) {
    if (!COMMON.includes(k) && !ALLOWED[key].includes(k)) { err(`--${k} does not apply to "${key}" (see --help)`); return 2; }
  }
  const human = o.json ? err : say; // with --json, stdout carries only JSON

  // configuration
  const fileEnv = opts.dotenv || readEnvFile(path.join(io.repo, ".env"));
  const envExists = Boolean(opts.dotenv) || fs.existsSync(path.join(io.repo, ".env"));
  let token = "";
  let tokenSource = null;
  if (io.env.META_MARKETING_TOKEN) { token = io.env.META_MARKETING_TOKEN; tokenSource = "process environment"; }
  else if (fileEnv.META_MARKETING_TOKEN) { token = fileEnv.META_MARKETING_TOKEN; tokenSource = ".env (repository root)"; }
  scrub.add(token);
  const account = String(fileEnv.META_AD_ACCOUNT_ID || "").trim().replace(/^act_/i, "");
  const page = String(fileEnv.META_PAGE_ID || "").trim();
  const version = String(fileEnv.META_GRAPH_VERSION || DEFAULT_VERSION).trim();
  const configProblems = [];
  if (!account) {
    configProblems.push(envExists
      ? "META_AD_ACCOUNT_ID is not set in the repository-root .env. Add META_AD_ACCOUNT_ID=<id> (digits, act_ optional); see .env.example."
      : "No .env at the repository root. Copy .env.example to .env and fill META_AD_ACCOUNT_ID and META_MARKETING_TOKEN (names only in chat; never paste a value).");
  } else if (!digits(account)) configProblems.push("META_AD_ACCOUNT_ID in .env is not a numeric ad account id (digits, act_ optional).");
  if (page && !digits(page)) configProblems.push("META_PAGE_ID in .env is not a numeric Page id.");
  if (!/^v\d+\.\d+$/.test(version)) configProblems.push(`META_GRAPH_VERSION in .env is not a version like ${DEFAULT_VERSION}.`);
  const needsPage = key.startsWith("lead-forms");
  if (needsPage && !page) configProblems.push("META_PAGE_ID is not set in the repository-root .env; lead-forms needs it (the Page id, digits; see .env.example).");

  const ACT = `act_${account && digits(account) ? account : "<META_AD_ACCOUNT_ID>"}`;
  const PAGE = page && digits(page) ? page : "<META_PAGE_ID>";
  const resolve = (p) => path.resolve(io.cwd, p);
  const pageTokenReq = req("GET", PAGE, { fields: "access_token" }, "[token]",
    "the Page token is kept in memory only: never printed, never written, scrubbed from every message");

  // ---------- each subcommand: validate, then a plan of requests and the code that runs it ----------
  let plan;
  try {
    plan = buildPlan();
  } catch (e) {
    if (e instanceof UsageError) { err(e.message); return 2; }
    throw e;
  }

  function buildPlan() {
    switch (key) {
      case "check":
        return {
          steps: [
            req("GET", "me", { fields: "id,name" }),
            req("GET", ACT, { fields: "name,account_status,currency,timezone_name" }),
            req("GET", "me/permissions", {}, "[token]", "skipped quietly when Meta does not answer it"),
          ],
          exec: execCheck,
        };
      case "targeting-search": {
        if (!o.q || !o.q.trim()) throw new UsageError('targeting-search needs --q "<text>"');
        if (o.type && !SEARCH_TYPES[o.type]) throw new UsageError(`--type must be one of ${Object.keys(SEARCH_TYPES).join(", ")}`);
        const step = o.type
          ? req("GET", "search", { ...SEARCH_TYPES[o.type], q: o.q, limit: 50 })
          : req("GET", `${ACT}/targetingsearch`, { q: o.q, limit: 50 });
        return { steps: [step], exec: () => execTargeting(step) };
      }
      case "delivery-estimate": {
        if (!o.targeting) throw new UsageError("delivery-estimate needs --targeting <file.json> (a targeting spec)");
        if (!o.goal || !/^[A-Z][A-Z_]+$/.test(o.goal)) throw new UsageError("delivery-estimate needs --goal <OPTIMIZATION_GOAL> (for example LEAD_GENERATION, LINK_CLICKS, REACH)");
        const spec = readJsonFile(resolve(o.targeting), "targeting spec");
        if (!isObj(spec)) throw new UsageError("the targeting spec is not a JSON object");
        const step = req("GET", `${ACT}/delivery_estimate`, { targeting_spec: spec, optimization_goal: o.goal });
        return { steps: [step], exec: () => execDelivery(step) };
      }
      case "lead-forms list": {
        const step = req("GET", `${PAGE}/leadgen_forms`, { fields: "id,name,status,created_time,leads_count,locale", limit: 100 },
          "[page token]", `follows paging.next, at most ${MAX_PAGES} pages`);
        return { steps: [pageTokenReq, step], exec: () => execList(step, true, ["id", "name", "status", "created_time", "leads_count", "locale"]) };
      }
      case "lead-forms create": {
        if (!o.spec) throw new UsageError("lead-forms create needs --spec <file.json>");
        const spec = readJsonFile(resolve(o.spec), "lead form spec");
        const problems = validateLeadFormSpec(spec);
        if (problems.length) throw new UsageError(`the lead form spec was refused for these reasons:${problems.map((p) => "\n  - " + p).join("")}`);
        const step = req("POST", `${PAGE}/leadgen_forms`, { ...spec }, "[page token]");
        const summary = { name: spec.name, questions: spec.questions.length, locale: spec.locale || null, page_id: PAGE };
        return { steps: [pageTokenReq, step], exec: () => execWrite("lead-forms create", step, summary, true, "lead form") };
      }
      case "leads": {
        if (!o.form || !digits(o.form)) throw new UsageError("leads needs --form <form id> (digits)");
        if (o.json) throw new UsageError("leads never prints rows, so --json is refused; use --out <file.csv> outside the repository");
        if (!o.out) throw new UsageError("leads needs --out <file.csv> at a path OUTSIDE this repository (lead rows are personal data and never enter the repository)");
        const out = resolve(o.out);
        for (const root of new Set([io.repo, REPO])) {
          if (isInside(out, root)) throw new UsageError(`refused: ${out} is inside the repository (${root}). Lead rows are personal data; write them outside the repository, for example to your Downloads folder.`);
        }
        const fields = o.fields ? csvList(o.fields) : csvList(LEADS_DEFAULT_FIELDS);
        if (!fields.every((f) => /^[a-z_]+$/.test(f))) throw new UsageError("--fields must be a comma-separated list of field names");
        const params = { fields: fields.join(","), limit: 100 };
        if (o.since) {
          const t = Date.parse(o.since);
          if (Number.isNaN(t)) throw new UsageError("--since must be an ISO date, for example 2026-01-31 or 2026-01-31T08:00:00Z");
          params.filtering = [{ field: "time_created", operator: "GREATER_THAN", value: Math.floor(t / 1000) }];
        }
        const label = page ? "[page token]" : "[token]";
        const step = req("GET", `${o.form}/leads`, params, label, `follows paging.next, at most ${MAX_PAGES} pages; rows go only to the CSV`);
        return { steps: page ? [pageTokenReq, step] : [step], exec: () => execLeads(step, out, fields) };
      }
      case "insights": {
        if (!["campaign", "adset", "ad"].includes(o.level)) throw new UsageError("insights needs --level campaign|adset|ad");
        const range = o.since || o.until;
        if (range && o.preset) throw new UsageError("use either --since/--until or --preset, not both");
        if (!range && !o.preset) throw new UsageError("insights needs --since YYYY-MM-DD --until YYYY-MM-DD, or --preset (for example last_7d)");
        const params = { level: o.level, fields: o.fields ? csvList(o.fields).join(",") : INSIGHTS_DEFAULT_FIELDS };
        if (!/^[a-z0-9_.,]+$/.test(params.fields)) throw new UsageError("--fields must be a comma-separated list of field names");
        if (o.preset) {
          if (!DATE_PRESETS.has(o.preset)) throw new UsageError(`--preset must be one of ${[...DATE_PRESETS].join(", ")}`);
          params.date_preset = o.preset;
        } else {
          const ymd = /^\d{4}-\d{2}-\d{2}$/;
          if (!ymd.test(o.since || "") || !ymd.test(o.until || "")) throw new UsageError("--since and --until must both be dates as YYYY-MM-DD");
          if (o.since > o.until) throw new UsageError("--since is after --until");
          params.time_range = { since: o.since, until: o.until };
        }
        if (o.breakdowns) {
          const b = csvList(o.breakdowns);
          if (!b.every((x) => /^[a-z_]+$/.test(x))) throw new UsageError("--breakdowns must be a comma-separated list such as age,gender");
          params.breakdowns = b.join(",");
        }
        if (o.ids) {
          const ids = csvList(o.ids);
          if (!ids.length || !ids.every(digits)) throw new UsageError("--ids must be a comma-separated list of numeric ids");
          params.filtering = [{ field: `${o.level}.id`, operator: "IN", value: ids }];
        }
        params.action_attribution_windows = ["7d_click", "1d_view"];
        params.limit = 500;
        if (!o.out && !o.json) throw new UsageError("insights needs --out <file.csv> (for example reports/data/<date>-insights.csv), or --json");
        const out = o.out ? resolve(o.out) : null;
        if (o.async) {
          const steps = [
            req("POST", `${ACT}/insights`, params, "[token]", "returns report_run_id"),
            req("GET", "<report_run_id>", { fields: "async_status,async_percent_completion" }, "[token]",
              `polled until async_status is "Job Completed": at most ${MAX_POLLS} polls, ${POLL_MS / 1000} s apart`),
            req("GET", "<report_run_id>/insights", { limit: 500 }, "[token]", `follows paging.next, at most ${MAX_PAGES} pages`),
          ];
          return { steps, exec: () => execInsightsAsync(steps[0], out) };
        }
        const step = req("GET", `${ACT}/insights`, params, "[token]", `follows paging.next, at most ${MAX_PAGES} pages`);
        return { steps: [step], exec: () => execInsights(step, out) };
      }
      case "rules list": {
        const step = req("GET", `${ACT}/adrules_library`, { fields: "id,name,status,evaluation_spec,execution_spec,schedule_spec", limit: 100 },
          "[token]", `follows paging.next, at most ${MAX_PAGES} pages`);
        return { steps: [step], exec: () => execList(step, false, ["id", "name", "status", "execution_type", "schedule"], (r) => ({
          ...r, execution_type: r.execution_spec && r.execution_spec.execution_type, schedule: r.schedule_spec && r.schedule_spec.schedule_type,
        })) };
      }
      case "rules create": {
        if (!o.spec) throw new UsageError("rules create needs --spec <file.json>");
        const spec = readJsonFile(resolve(o.spec), "rule spec");
        const problems = validateRuleSpec(spec);
        if (problems.length) throw new UsageError(`the rule spec was refused for these reasons:${problems.map((p) => "\n  - " + p).join("")}`);
        const params = { ...spec, status: spec.status || "DISABLED" };
        const step = req("POST", `${ACT}/adrules_library`, params);
        const summary = { name: spec.name, execution_type: spec.execution_spec.execution_type, status: params.status };
        return { steps: [step], exec: () => execWrite("rules create", step, summary, false, "rule", params.status) };
      }
      case "rules delete": {
        if (!o.id || !digits(o.id)) throw new UsageError("rules delete needs --id <rule id> (digits)");
        if (!o.yes && !o["dry-run"]) throw new UsageError(`rules delete removes rule ${o.id} for good; add --yes to confirm`);
        const steps = [
          req("GET", o.id, { fields: "id,name,account_id" }, "[token]", `refused unless account_id is the .env account (${ACT})`),
          req("DELETE", o.id, {}),
        ];
        return { steps, exec: () => execRuleDelete(steps) };
      }
      case "audiences list": {
        const step = req("GET", `${ACT}/customaudiences`, {
          fields: "id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,delivery_status,operation_status", limit: 100,
        }, "[token]", `follows paging.next, at most ${MAX_PAGES} pages`);
        return { steps: [step], exec: () => execList(step, false, ["id", "name", "subtype", "size_lower", "size_upper", "delivery", "operation"], (r) => ({
          ...r, size_lower: r.approximate_count_lower_bound, size_upper: r.approximate_count_upper_bound,
          delivery: r.delivery_status && (r.delivery_status.description || r.delivery_status.code),
          operation: r.operation_status && (r.operation_status.description || r.operation_status.code),
        })) };
      }
      case "audiences lookalike": {
        if (!o.origin || !digits(o.origin)) throw new UsageError("audiences lookalike needs --origin <source audience id> (digits)");
        const ratio = Number(o.ratio);
        if (!o.ratio || !Number.isFinite(ratio) || ratio < 0.01 || ratio > 0.2) throw new UsageError("--ratio must be a number from 0.01 (1 %) to 0.20 (20 %)");
        const country = String(o.country || "").toUpperCase();
        if (!/^[A-Z]{2}$/.test(country)) throw new UsageError("--country must be a two-letter country code, for example GB");
        if (!o.name || !o.name.trim()) throw new UsageError('audiences lookalike needs --name "<audience name>"');
        const params = { name: o.name.trim(), subtype: "LOOKALIKE", origin_audience_id: o.origin, lookalike_spec: { ratio, country } };
        const step = req("POST", `${ACT}/customaudiences`, params);
        const summary = { name: params.name, origin_audience_id: o.origin, ratio, country };
        return { steps: [step], exec: () => execWrite("audiences lookalike", step, summary, false, "lookalike audience") };
      }
      default:
        throw new UsageError(`unknown subcommand: ${key}`);
    }
  }

  // ---------- dry run ----------
  if (o["dry-run"]) {
    const tokenLine = token ? `present (${tokenSource})` : "MISSING (looked in the process environment and the repository-root .env)";
    human(`DRY RUN (no network): ${key}; account ${ACT}, page ${PAGE}, Graph ${version}, token: ${tokenLine}`);
    for (const p of configProblems) human(`warning: ${p}`);
    plan.steps.forEach((s, i) => {
      human(`${i + 1}. ${s.method} https://${GRAPH_HOST}/${version}/${s.path}`);
      human(`   Authorization: Bearer ${s.token}`);
      for (const [k, v] of Object.entries(s.params)) human(`   ${k} = ${encodeParam(v)}`);
      if (s.note) human(`   (${s.note})`);
    });
    if (o.json) say(JSON.stringify({ dry_run: true, command: key, version, steps: plan.steps }, null, 2));
    return 0;
  }
  if (configProblems.length) { for (const p of configProblems) err(p); return 2; }
  if (!token) {
    err("META_MARKETING_TOKEN is not set. Looked in the process environment and in the repository-root .env.");
    err("The Owner generates it in Meta Business Settings > System users and writes it into .env (names only; never paste a value in chat).");
    return 2;
  }

  // ---------- Graph API ----------
  const base = `https://${GRAPH_HOST}/${version}`;
  async function send(method, url, bearer, body, label) {
    const headers = { Authorization: `Bearer ${bearer}` };
    if (body !== undefined) headers["Content-Type"] = "application/x-www-form-urlencoded";
    let res;
    try { res = await io.fetch(url.toString(), { method, headers, body }); }
    catch (e) { throw new GraphError(scrub(`network error on ${method} /${label}: ${e.message || e}`)); }
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!res.ok || (json && json.error)) {
      const e = (json && json.error) || {};
      const code = [e.code, e.error_subcode].filter(Boolean).join("/");
      const msg = e.error_user_msg || e.message || String(text).slice(0, 300);
      throw new GraphError(scrub(`Graph ${method} /${label} -> HTTP ${res.status}${code ? ` (code ${code})` : ""}: ${msg}`),
        { status: res.status, code: e.code, subcode: e.error_subcode });
    }
    return json;
  }
  function call(step, bearer, overridePath) {
    const p = overridePath || step.path;
    const url = new URL(`${base}/${p}`);
    let body;
    if (step.method === "GET") for (const [k, v] of Object.entries(step.params)) url.searchParams.set(k, encodeParam(v));
    else {
      const form = new URLSearchParams();
      for (const [k, v] of Object.entries(step.params)) form.set(k, encodeParam(v));
      body = form.toString();
    }
    return send(step.method, url, bearer, body, p);
  }
  async function callAll(step, bearer, overridePath) {
    const first = await call(step, bearer, overridePath);
    const data = Array.isArray(first.data) ? [...first.data] : [];
    let next = first.paging && first.paging.next;
    let pages = 1;
    while (next) {
      if (pages >= MAX_PAGES) throw new GraphError(`stopped after ${MAX_PAGES} pages of /${overridePath || step.path}; narrow the request`);
      const u = new URL(next);
      if (u.protocol !== "https:" || u.hostname !== GRAPH_HOST) throw new GraphError("paging.next points outside graph.facebook.com; stopped");
      u.searchParams.delete("access_token"); // the token travels in the header only
      const r = await send("GET", u, bearer, undefined, `${overridePath || step.path} (page ${pages + 1})`);
      if (Array.isArray(r.data)) data.push(...r.data);
      next = r.paging && r.paging.next;
      pages++;
    }
    return { data, pages, first };
  }
  async function pageToken() {
    const r = await call(pageTokenReq, token);
    if (!r || !r.access_token) {
      throw new GraphError(`no Page token returned for Page ${page}: the System User needs the Page assigned (Business Settings > Users > System users > Assign assets > Pages) and the token needs pages_manage_ads / leads_retrieval`);
    }
    scrub.add(r.access_token);
    return r.access_token;
  }
  function appendLedger(entry) {
    const date = io.now().toISOString().slice(0, 10);
    const file = path.join(io.repo, "creatives", "uploads", `${date}-meta-graph.json`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    let ledger = [];
    if (fs.existsSync(file)) {
      try { ledger = JSON.parse(fs.readFileSync(file, "utf8")); } catch { ledger = []; }
      if (!Array.isArray(ledger)) ledger = [];
    }
    ledger.push(entry);
    fs.writeFileSync(file, JSON.stringify(ledger, null, 2) + "\n");
    return path.relative(io.repo, file).split(path.sep).join("/");
  }

  // ---------- executors ----------
  async function execCheck() {
    const me = await call(plan.steps[0], token);
    const acct = await call(plan.steps[1], token);
    let perms = null;
    let permsNote = "";
    try {
      const r = await call(plan.steps[2], token);
      if (Array.isArray(r.data)) perms = r.data;
    } catch (e) { permsNote = e.message; }
    const granted = new Set((perms || []).filter((p) => p.status === "granted").map((p) => p.permission));
    const rows = [
      ["ads_read", "required for every subcommand"],
      ["ads_management", "required for writes: lead-forms create, rules create/delete, audiences lookalike"],
      ["leads_retrieval", "needed by leads (reported only)"],
      ["pages_manage_ads", "needed by lead-forms (reported only)"],
      ["pages_read_engagement", "needed by lead-forms and leads through the Page (reported only)"],
      ["pages_show_list", "needed to fetch the Page token (reported only)"],
    ];
    const missing = perms ? ["ads_read", "ads_management"].filter((p) => !granted.has(p)) : [];
    if (o.json) {
      say(JSON.stringify({ token_source: tokenSource, me, account: acct, page_id_set: Boolean(page), permissions: perms }, null, 2));
    } else {
      say(`token source : ${tokenSource}`);
      say(`token holder : ${me.name} (id ${me.id})`);
      const st = acct.account_status;
      say(`ad account   : ${ACT} "${acct.name}", status ${st}${ACCOUNT_STATUS[st] ? ` (${ACCOUNT_STATUS[st]})` : ""}, ${acct.currency}, ${acct.timezone_name}`);
      say(`page id      : ${page ? "set (META_PAGE_ID)" : "not set (only lead-forms needs it; leads then uses the System User token)"}`);
      if (perms) {
        say("permissions  :");
        for (const [name, why] of rows) say(`  ${name.padEnd(22)} ${(granted.has(name) ? "granted" : "missing").padEnd(8)} ${why}`);
      } else {
        say(`permissions  : could not be read (${permsNote || "no data"}); the first real call proves them`);
      }
    }
    if (missing.length) {
      err(`missing required permission(s): ${missing.join(", ")}. The Owner revokes the System User's token for the app, then generates a new one with ${missing.join(" and ")} (Business Settings > Users > System users).`);
      return 2;
    }
    return 0;
  }
  async function execTargeting(step) {
    const r = await call(step, token);
    if (o.json) { say(JSON.stringify(r, null, 2)); return 0; }
    const data = Array.isArray(r.data) ? r.data : [];
    say(table(["id", "name", "type", "audience_size_lower_bound", "audience_size_upper_bound", "path"],
      data.map((d) => [d.id || d.key, d.name, d.type || o.type || "", d.audience_size_lower_bound, d.audience_size_upper_bound,
        d.path || [d.country_name, d.region].filter(Boolean)])));
    say(`\n${data.length} result(s) for "${o.q}"${o.type ? ` (type ${o.type})` : ""}.`);
    return 0;
  }
  async function execDelivery(step) {
    const r = await call(step, token);
    if (o.json) { say(JSON.stringify(r, null, 2)); return 0; }
    const d = (Array.isArray(r.data) && r.data[0]) || {};
    say(`optimization goal        : ${o.goal}`);
    say(`estimate_dau             : ${d.estimate_dau ?? "no data"}`);
    say(`estimate_mau_lower_bound : ${d.estimate_mau_lower_bound ?? "no data"}`);
    say(`estimate_mau_upper_bound : ${d.estimate_mau_upper_bound ?? "no data"}`);
    say(`estimate_ready           : ${d.estimate_ready ?? "no data"}`);
    return 0;
  }
  async function execList(step, usePageToken, columns, map = (r) => r) {
    const bearer = usePageToken ? await pageToken() : token;
    const { data } = await callAll(step, bearer);
    if (o.json) { say(JSON.stringify({ data }, null, 2)); return 0; }
    const rows = data.map(map);
    say(table(columns, rows.map((r) => columns.map((c) => r[c]))));
    say(`\n${rows.length} item(s).`);
    return 0;
  }
  async function execWrite(command, step, summary, usePageToken, noun, status) {
    const entry = { at: io.now().toISOString(), tool: "meta-graph", command, account: ACT,
      request: { method: step.method, path: step.path, summary }, id: null, status: "FAILED" };
    try {
      const bearer = usePageToken ? await pageToken() : token;
      const r = await call(step, bearer);
      entry.id = r.id || null;
      entry.status = r.id ? "ok" : "no id returned";
      const ledger = appendLedger(entry);
      if (o.json) say(JSON.stringify(r, null, 2));
      if (!r.id) { err(`Meta answered without an id: ${JSON.stringify(r).slice(0, 300)}`); return 1; }
      human(`${noun} created: id ${r.id}${status ? ` (status ${status}${status === "DISABLED" ? '; add "status": "ENABLED" to the spec, or turn it on in Ads Manager > Rules' : ""})` : ""}`);
      human(`ledger: ${ledger}`);
      return 0;
    } catch (e) {
      entry.error = scrub(e.message || String(e));
      appendLedger(entry);
      throw e;
    }
  }
  async function execLeads(step, out, fields) {
    const bearer = page ? await pageToken() : token;
    const { data } = await callAll(step, bearer);
    const flat = flattenLeadRows(data, fields);
    writeCsv(out, flat.headers, flat.rows, { mode: 0o600 });
    say(`${flat.rows.length} lead(s) written to ${out}`);
    say(`fields: ${flat.headers.join(", ")}`);
    say("The file holds personal data: forward it to the company's CRM or sheet, then delete it. Never copy it into the repository or the chat.");
    return 0;
  }
  function writeInsights(data, out) {
    if (o.json) say(JSON.stringify({ data }, null, 2));
    if (out) {
      const flat = flattenInsightRows(data);
      writeCsv(out, flat.headers, flat.rows);
      human(`${flat.rows.length} row(s), ${flat.headers.length} column(s) written to ${out}`);
    }
    return 0;
  }
  async function execInsights(step, out) {
    const { data } = await callAll(step, token);
    return writeInsights(data, out);
  }
  async function execInsightsAsync(step, out) {
    const r = await call(step, token);
    const id = r.report_run_id;
    if (!id || !digits(id)) throw new GraphError(`async insights returned no report_run_id: ${scrub(JSON.stringify(r)).slice(0, 300)}`);
    human(`report_run_id ${id}: polling (at most ${MAX_POLLS} polls, ${POLL_MS / 1000} s apart)`);
    let status = "";
    for (let i = 1; i <= MAX_POLLS; i++) {
      const s = await call(plan.steps[1], token, id);
      status = s.async_status;
      if (status === "Job Completed") break;
      if (status === "Job Failed" || status === "Job Skipped") throw new GraphError(`async insights report ${id} ended with "${status}"`);
      if (i === MAX_POLLS) {
        throw new GraphError(`async insights report ${id} not finished after ${MAX_POLLS} polls (last status "${status}", ${s.async_percent_completion ?? "?"} %); run again later or narrow the request`);
      }
      await io.sleep(POLL_MS);
    }
    const { data } = await callAll(plan.steps[2], token, `${id}/insights`);
    return writeInsights(data, out);
  }
  async function execRuleDelete(steps) {
    const rule = await call(steps[0], token);
    const owner = String(rule.account_id || "").replace(/^act_/i, "");
    if (owner !== account) {
      err(`refused: rule ${o.id} does not belong to the .env ad account ${ACT}${owner ? ` (it belongs to act_${owner})` : " (Meta returned no account_id)"}.`);
      return 2;
    }
    const entry = { at: io.now().toISOString(), tool: "meta-graph", command: "rules delete", account: ACT,
      request: { method: "DELETE", path: o.id, summary: { id: o.id, name: rule.name } }, id: o.id, status: "FAILED" };
    try {
      const r = await call(steps[1], token);
      entry.status = r.success === false ? "not deleted" : "deleted";
      const ledger = appendLedger(entry);
      if (o.json) say(JSON.stringify(r, null, 2));
      if (r.success === false) { err(`Meta did not delete rule ${o.id}`); return 1; }
      human(`rule ${o.id} "${rule.name}" deleted`);
      human(`ledger: ${ledger}`);
      return 0;
    } catch (e) {
      entry.error = scrub(e.message || String(e));
      appendLedger(entry);
      throw e;
    }
  }

  try {
    return await plan.exec();
  } catch (e) {
    if (e instanceof UsageError) { err(e.message); return 2; }
    err(scrub(e.message || String(e)));
    if (e instanceof GraphError && AUTH_CODES.has(Number(e.code))) err(ownerFixList(e.code));
    return 1;
  }
}

// ---------- entry point ----------
const isMain = (() => {
  if (!process.argv[1]) return false;
  const a = path.resolve(process.argv[1]);
  return process.platform === "win32" ? a.toLowerCase() === SELF.toLowerCase() : a === SELF;
})();
if (isMain) {
  // process.exitCode, not process.exit(): on Windows, recent Node versions can abort with a libuv assertion
  // when exit() runs while a fetch handle is still closing. Letting the loop drain exits with the same code.
  run(process.argv.slice(2)).then(
    (code) => { process.exitCode = code; },
    (e) => { process.stderr.write(scrubText(e && e.message ? e.message : String(e)) + "\n"); process.exitCode = 1; },
  );
}
