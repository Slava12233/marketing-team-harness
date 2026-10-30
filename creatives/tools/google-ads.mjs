#!/usr/bin/env node
// google-ads.mjs: the harness's Google Ads tool on the Google Ads REST API: the login (OAuth, the refresh token
// written into .env unseen), reads (GAQL search and the baseline report), ids for specs (places, languages),
// conversion actions, and Search campaigns built PAUSED from a spec file, checked by Google first (validateOnly).
// Enabling a campaign or raising a budget needs the Owner's words in --go and is written to the go log.
//
// Usage (from the repository root; Node 20+, no dependencies). Every subcommand takes --dry-run (prints the exact
// requests with the secrets shown as [token]; no network) and --json (raw JSON to stdout; human lines go to stderr):
//   node creatives/tools/google-ads.mjs login [--port <n>]       only with the OAuth fallback (a service account needs no login)
//   node creatives/tools/google-ads.mjs check
//   node creatives/tools/google-ads.mjs accounts
//   node creatives/tools/google-ads.mjs search --gaql "SELECT ... FROM ..." [--out <file.csv>]
//   node creatives/tools/google-ads.mjs report --level campaign|ad_group|ad|keyword|search_term
//                                       (--range LAST_7_DAYS | --since YYYY-MM-DD --until YYYY-MM-DD) [--out <file.csv>]
//   node creatives/tools/google-ads.mjs geo-search --q "<place>" [--country XX] [--locale en]
//   node creatives/tools/google-ads.mjs language-ids [--q "<name>"]
//   node creatives/tools/google-ads.mjs conversions list [--tags --out <file.md>]
//   node creatives/tools/google-ads.mjs conversions create --spec <file.json>
//   node creatives/tools/google-ads.mjs build --spec <file.json> [--validate]
//   node creatives/tools/google-ads.mjs pause --resource customers/<id>/campaigns|adGroups|adGroupAds/<id>
//   node creatives/tools/google-ads.mjs enable --resource customers/<id>/campaigns/<id> --go "<the Owner's words>" [--channel chat]
//   node creatives/tools/google-ads.mjs budget --resource customers/<id>/campaignBudgets/<id> --amount <n> [--go "<the Owner's words>"]
// The full API (anything the subcommands above do not name):
//   node creatives/tools/google-ads.mjs mutate --spec <file.json> [--validate] [--go "<the Owner's words>"]
//                                       any googleAds:mutate operations: every campaign type, asset, criterion,
//                                       audience, schedule, bid adjustment, shared set, label, experiment
//   node creatives/tools/google-ads.mjs service --path customers/{customer}:<method> [--body <file.json>] [--method GET|POST] [--go "…"]
//                                       any other API method (keyword ideas, conversion uploads, recommendations...)
//   node creatives/tools/google-ads.mjs recipe list | recipe show <name> | recipe run <name> [--set NAME=value ...] [--vars <file.json>] [--validate] [--go "…"]
//                                       the ready-made specs in creatives/tools/google-ads-recipes/ (add your own: no code)
//
// Configuration, from the repository-root .env only (template: .env.example); no other .env key is read. Two ways to
// sign in; the service account wins when its key is set:
//   GOOGLE_ADS_JSON_KEY_FILE      the service account's JSON key, a path relative to the harness folder (written by
//                                 google-cloud-setup.mjs, normally .secrets/google-ads-key.json, never committed, never
//                                 printed). The service account is added as a user of the Google Ads account (Admin >
//                                 Access and security); no OAuth client, no consent screen, no refresh token.
//   GOOGLE_ADS_CLIENT_ID          the fallback: the OAuth client (Desktop type) of the company's own Google Cloud project.
//   GOOGLE_ADS_CLIENT_SECRET      that client's secret (written by env-set.mjs --from-clipboard, never seen).
//   GOOGLE_ADS_REFRESH_TOKEN      required with the OAuth client for every call but login; written by login, never printed.
//   GOOGLE_ADS_CUSTOMER_ID        required; the Google Ads account (10 digits, dashes optional). Every account path is
//                                 built from it; it must match google_ads_customer_id in config/accounts.md.
//   GOOGLE_ADS_LOGIN_CUSTOMER_ID  optional; the manager account (MCC) the login reaches the account through.
//   GOOGLE_ADS_DEVELOPER_TOKEN    optional, legacy; sent as the developer-token header only when set.
//   GOOGLE_ADS_API_VERSION        optional; default v26.
// Secrets are never printed and never put in a URL; every printed line is scrubbed.
//
// Safety: mutate, service and recipe hold the same rules as the named subcommands: a campaign is created PAUSED
// whatever the spec says; an ENABLED status, a removal, an end-date change, a budget raise, a new ad group, ad or
// asset group in a live campaign, and any service method that is not a read or a forecast need the Owner's words in
// --go (a go-log row); a budget raise is at most +20 % a step and a daily budget at most half the Google share of the
// daily cap; every resource must be of the .env account, and an existing one must be known to this folder; Google
// validates every mutate (validateOnly) before the real one.
// Safety: build always creates the campaign PAUSED (a status in the spec is refused), declares EU political
// advertising on every campaign, checks the copy lengths, the destination against config/product.md and the
// budget against the Google share of the caps in config/goals.md, then asks Google to validate the whole batch
// (validateOnly) before the real, atomic create. enable refuses without --go, and budget refuses a raise without --go,
// a raise of more than 20 % in one step, or a budget above the Google share of the daily cap. enable, budget and pause
// act only on resources of the .env account that this folder created or names in its notes. Writes append to
// creatives/uploads/<YYYY-MM-DD>-google-ads.json; reads append nothing. Errors are never retried.
// Guide: docs/google-ads.md. Exit codes: 0 ok, 1 API or network error, 2 missing configuration, bad arguments or a
// refused request.

import fs from "node:fs";
import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
export const REPO = path.resolve(path.dirname(SELF), "..", "..");
export const ENV_KEYS = ["GOOGLE_ADS_JSON_KEY_FILE", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_CUSTOMER_ID",
  "GOOGLE_ADS_LOGIN_CUSTOMER_ID", "GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_API_VERSION"];
const ADS_HOST = "googleads.googleapis.com";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const SCOPE = "https://www.googleapis.com/auth/adwords";
const DEFAULT_VERSION = "v26";
export const MAX_PAGES = 200;
export const LOGIN_WAIT_MS = 5 * 60 * 1000;
export const MAX_RAISE = 0.2;
export const DATE_RANGES = new Set(["TODAY", "YESTERDAY", "LAST_7_DAYS", "LAST_14_DAYS", "LAST_30_DAYS", "THIS_MONTH",
  "LAST_MONTH", "LAST_BUSINESS_WEEK", "THIS_WEEK_MON_TODAY", "THIS_WEEK_SUN_TODAY", "LAST_WEEK_MON_SUN", "LAST_WEEK_SUN_SAT"]);
export const MATCH_TYPES = new Set(["EXACT", "PHRASE", "BROAD"]);
export const BIDDING = new Set(["MAXIMIZE_CONVERSIONS", "MAXIMIZE_CLICKS", "MANUAL_CPC"]);
export const CONVERSION_CATEGORIES = new Set(["SUBMIT_LEAD_FORM", "CONTACT", "BOOK_APPOINTMENT", "SIGNUP", "REQUEST_QUOTE",
  "GET_DIRECTIONS", "PHONE_CALL_LEAD", "QUALIFIED_LEAD", "PURCHASE", "ADD_TO_CART", "BEGIN_CHECKOUT", "PAGE_VIEW", "DEFAULT"]);
const LIMITS = { headline: 30, description: 90, path: 15, sitelink: 25, sitelinkDescription: 35, callout: 25, keyword: 80, keywordWords: 10 };
const PINS = new Set(["HEADLINE_1", "HEADLINE_2", "HEADLINE_3", "DESCRIPTION_1", "DESCRIPTION_2"]);
const MUTABLE = /^customers\/(\d{10})\/(campaigns|adGroups|adGroupAds|campaignBudgets)\/(\d+(?:~\d+)?)$/;

// ---------- errors ----------
export class UsageError extends Error {}
export class AdsError extends Error {
  constructor(message, info = {}) { super(message); Object.assign(this, info); }
}

// ---------- .env (only the keys above are ever kept) ----------
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
// ---------- the service account (GOOGLE_ADS_JSON_KEY_FILE) ----------
// readServiceKey: the key file's three fields the sign-in needs, or a UsageError naming what is wrong. The private key
// is never printed; the caller adds it to the scrubber.
export function readServiceKey(file) {
  let j;
  try { j = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) {
    throw new UsageError(e.code === "ENOENT"
      ? `GOOGLE_ADS_JSON_KEY_FILE names ${file}, which does not exist: run node creatives/tools/google-cloud-setup.mjs run (it writes the key there).`
      : `GOOGLE_ADS_JSON_KEY_FILE (${file}) is not a JSON key file: create a new key with node creatives/tools/google-cloud-setup.mjs run.`);
  }
  if (!j || j.type !== "service_account" || !j.client_email || !j.private_key) {
    throw new UsageError(`GOOGLE_ADS_JSON_KEY_FILE (${file}) is not a service account key (type service_account with client_email and private_key).`);
  }
  return { email: String(j.client_email), privateKey: String(j.private_key), tokenUri: String(j.token_uri || TOKEN_URL) };
}
// serviceAssertion: the signed JWT (RS256) that Google's token endpoint exchanges for an access token, one hour.
export function serviceAssertion(key, nowMs = Date.now()) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const iat = Math.floor(nowMs / 1000);
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: key.email, scope: SCOPE, aud: key.tokenUri, iat, exp: iat + 3600 })}`;
  const sig = crypto.sign("RSA-SHA256", Buffer.from(unsigned), key.privateKey).toString("base64url");
  return `${unsigned}.${sig}`;
}

// setEnvLine: NAME=value written once, every other NAME= line removed, everything else kept with its line endings
// (the same rule as env-set.mjs). The file is written through a temporary file and closed to the user.
export function setEnvLine(text, name, value) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const re = new RegExp("^\\s*" + name + "\\s*=");
  let placed = false;
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    if (re.test(line)) {
      if (!placed) { out.push(`${name}=${value}`); placed = true; }
      continue;
    }
    out.push(line);
  }
  if (!placed) {
    if (out.length && out[out.length - 1] === "") out.pop();
    out.push(`${name}=${value}`, "");
  }
  return out.join(eol);
}
export function writeEnvAtomic(file, text) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, text, { encoding: "utf8", mode: 0o600 });
  fs.renameSync(tmp, file);
  try { fs.chmodSync(file, 0o600); } catch { /* Windows ignores it */ }
  if (process.platform === "win32" && process.env.USERNAME) {
    spawnSync("icacls", [file, "/inheritance:r", "/grant:r", `${process.env.USERNAME}:(R,W)`], { stdio: "ignore", windowsHide: true });
  }
}

// ---------- scrubber ----------
export function scrubText(text, secrets = []) {
  let s = String(text);
  for (const secret of secrets) if (secret && secret.length >= 4) s = s.split(secret).join("[token]");
  return s.replace(/(access_token|refresh_token|client_secret|code)=[^&\s"']+/gi, "$1=[token]")
    .replace(/"(access_token|refresh_token|id_token)"\s*:\s*"[^"]+"/gi, '"$1":"[token]"');
}
export function makeScrubber(initial = []) {
  const secrets = initial.filter(Boolean);
  const scrub = (text) => scrubText(text, secrets);
  scrub.add = (secret) => { if (secret) secrets.push(String(secret)); };
  return scrub;
}

// ---------- ids and money ----------
export const customerDigits = (v) => String(v || "").replace(/-/g, "").trim();
export const isCustomerId = (v) => /^\d{10}$/.test(customerDigits(v));
export const toMicros = (amount) => Math.round(Number(amount) * 1_000_000);
export const fromMicros = (micros) => (micros === undefined || micros === null || micros === "" ? "" : Number(micros) / 1_000_000);

// Google counts a full-width character (Chinese, Japanese, Korean) as two; Hebrew, Arabic and Latin count one.
export function adLength(text) {
  let n = 0;
  for (const ch of String(text)) n += /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch) ? 2 : 1;
  return n;
}

// ---------- config files (read-only) ----------
// The account this folder is bound to: google_ads_customer_id in config/accounts.md (null while it is a placeholder).
export function configuredCustomer(root) {
  try {
    const md = fs.readFileSync(path.join(root, "config", "accounts.md"), "utf8");
    const m = /\|\s*`google_ads_customer_id`\s*\|\s*`?([\d-]{10,12})`?\s*\|/i.exec(md);
    if (m && isCustomerId(m[1])) return customerDigits(m[1]);
  } catch { /* no config yet */ }
  return null;
}
// The destination URLs of config/product.md (the funnels and destination pages tables); empty while a placeholder.
export function destinationUrls(root) {
  try {
    const md = fs.readFileSync(path.join(root, "config", "product.md"), "utf8");
    return [...new Set([...md.matchAll(/https?:\/\/[^\s|)`<>]+/gi)].map((m) => m[0].replace(/[.,;]+$/, "")))];
  } catch { return []; }
}
const firstNumber = (s) => { const m = /(\d[\d,]*(?:\.\d+)?)/.exec(String(s || "")); return m ? Number(m[1].replace(/,/g, "")) : null; };
// The Google share of the daily cap of config/goals.md: { dailyCap, share, limit } or null while either is unset.
export function googleDailyLimit(root) {
  try {
    const md = fs.readFileSync(path.join(root, "config", "goals.md"), "utf8");
    const cap = /\|\s*Daily \(all [^|]*\|\s*([^|]+)\|/i.exec(md);
    const share = /\|\s*Google(?: Ads)?\s*\|\s*([^|]+)\|/i.exec(md.split(/^## Platform share/im)[1] || "");
    const dailyCap = cap ? firstNumber(cap[1]) : null;
    const pct = share ? firstNumber(share[1]) : null;
    if (!dailyCap || pct === null) return null;
    // Google may spend up to twice a campaign's daily budget on one day, so the budgets stay at half the share.
    return { dailyCap, share: pct, limit: (dailyCap * pct) / 100 / 2 };
  } catch { return null; }
}

// ---------- known objects (the Google resources this folder created) ----------
export const knownFile = (root) => path.join(root, "memory", "state", "known-objects-google.json");
export function loadKnown(root) {
  try {
    const j = JSON.parse(fs.readFileSync(knownFile(root), "utf8"));
    return { customer: j.customer || null, resources: new Set(Array.isArray(j.resources) ? j.resources : []) };
  } catch { return { customer: null, resources: new Set() }; }
}
export function saveKnown(root, customer, resources) {
  const known = loadKnown(root);
  if (known.customer && known.customer !== customer) known.resources = new Set();
  for (const r of resources) known.resources.add(r);
  fs.mkdirSync(path.dirname(knownFile(root)), { recursive: true });
  fs.writeFileSync(knownFile(root), JSON.stringify({ customer, updated: new Date().toISOString(), resources: [...known.resources].slice(-5000) }, null, 2) + "\n");
}
// Is the resource (or its numeric id) named in the vault, the plans, the reports, the config or the checklist?
export function namedInVault(root, needles) {
  const stack = ["memory", "plans", "reports", "config", "checklist.md"].map((r) => path.join(root, r));
  let budget = 4000;
  while (stack.length && budget-- > 0) {
    const p = stack.pop();
    let st;
    try { st = fs.statSync(p); } catch { continue; }
    if (st.isDirectory()) {
      if (/[\\/](archive|node_modules|\.git)$/.test(p)) continue;
      for (const n of fs.readdirSync(p)) stack.push(path.join(p, n));
    } else if (/\.(md|json|txt|base)$/i.test(p) && st.size < 2_000_000 && !p.endsWith("known-objects-google.json")) {
      try { const t = fs.readFileSync(p, "utf8"); if (needles.some((n) => t.includes(n))) return true; } catch { /* skip */ }
    }
  }
  return false;
}

// ---------- the build spec ----------
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const str = (v) => (typeof v === "string" ? v.trim() : "");
const ymd = /^\d{4}-\d{2}-\d{2}$/;
export const SPEC_KEYS = ["type", "campaign", "locations", "location_presence", "languages", "negative_keywords", "ad_groups", "sitelinks", "callouts"];
export const CAMPAIGN_KEYS = ["name", "daily_budget", "bidding", "target_cpa", "max_cpc", "start_date", "end_date", "search_partners",
  "final_url_suffix", "eu_political_ads"];
/** Returns { problems, warnings } for a build spec; the destination and cap checks read the given repository root. */
export function validateBuildSpec(spec, root) {
  const p = [];
  const w = [];
  if (!isObj(spec)) return { problems: ["the spec is not a JSON object"], warnings: w };
  for (const k of Object.keys(spec)) if (!SPEC_KEYS.includes(k)) p.push(`unknown field "${k}" (allowed: ${SPEC_KEYS.join(", ")})`);
  const type = spec.type || "SEARCH";
  if (type === "PERFORMANCE_MAX" || type === "DEMAND_GEN") {
    p.push(`type ${type} is the next release of this tool (phase 2); today build makes Search campaigns only`);
    return { problems: p, warnings: w };
  }
  if (type !== "SEARCH") p.push(`type "${type}" is not supported (SEARCH)`);
  const c = spec.campaign;
  if (!isObj(c)) { p.push("campaign is missing"); return { problems: p, warnings: w }; }
  for (const k of Object.keys(c)) {
    if (k === "status") p.push("campaign.status is refused: the campaign is always created PAUSED; enabling it is enable --go after the Owner's go");
    else if (!CAMPAIGN_KEYS.includes(k)) p.push(`unknown campaign field "${k}" (allowed: ${CAMPAIGN_KEYS.join(", ")})`);
  }
  if (!str(c.name)) p.push("campaign.name is missing");
  const budget = Number(c.daily_budget);
  if (!(budget > 0)) p.push("campaign.daily_budget must be a positive amount in the account currency");
  const bidding = c.bidding || "MAXIMIZE_CONVERSIONS";
  if (!BIDDING.has(bidding)) p.push(`campaign.bidding must be one of ${[...BIDDING].join(", ")}`);
  if (c.target_cpa !== undefined && !(Number(c.target_cpa) > 0)) p.push("campaign.target_cpa must be a positive amount");
  if (c.target_cpa !== undefined && bidding !== "MAXIMIZE_CONVERSIONS") p.push("campaign.target_cpa applies only to MAXIMIZE_CONVERSIONS");
  if (c.max_cpc !== undefined && !(Number(c.max_cpc) > 0)) p.push("campaign.max_cpc must be a positive amount");
  if (bidding === "MANUAL_CPC" && c.max_cpc === undefined) p.push("MANUAL_CPC needs campaign.max_cpc (the default bid of the ad groups)");
  if (c.start_date !== undefined && !ymd.test(String(c.start_date))) p.push("campaign.start_date must be YYYY-MM-DD");
  if (c.end_date !== undefined && !ymd.test(String(c.end_date))) p.push("campaign.end_date must be YYYY-MM-DD");
  if (c.start_date && c.end_date && c.start_date > c.end_date) p.push("campaign.start_date is after campaign.end_date");
  if (c.eu_political_ads !== undefined && typeof c.eu_political_ads !== "boolean") p.push("campaign.eu_political_ads must be true or false");
  if (c.final_url_suffix !== undefined && (typeof c.final_url_suffix !== "string" || /^[?&]/.test(c.final_url_suffix))) {
    p.push("campaign.final_url_suffix is the query without ? (for example utm_source=google&utm_medium=cpc&ref=...)");
  }
  if (!/utm_source=/.test(String(c.final_url_suffix || ""))) w.push("campaign.final_url_suffix has no utm_source: put the agreed ref and utm_* of config/accounts.md on every Google click");
  const ids = (v, label) => {
    if (!Array.isArray(v) || !v.length) { p.push(`${label} is missing or empty (ids from geo-search / language-ids)`); return; }
    if (!v.every((x) => /^\d+$/.test(String(x)))) p.push(`${label} must be numeric ids (from geo-search / language-ids)`);
  };
  ids(spec.locations, "locations");
  ids(spec.languages, "languages");
  if (spec.location_presence !== undefined && !["PRESENCE", "PRESENCE_OR_INTEREST"].includes(spec.location_presence)) {
    p.push('location_presence must be "PRESENCE" (people in the places; the default) or "PRESENCE_OR_INTEREST"');
  }
  const keyword = (k, label) => {
    if (!isObj(k)) { p.push(`${label} must be { "text": "...", "match": "PHRASE" }`); return; }
    const t = str(k.text);
    if (!t) p.push(`${label}.text is missing`);
    else {
      if (adLength(t) > LIMITS.keyword) p.push(`${label} "${t}" is longer than ${LIMITS.keyword} characters`);
      if (t.split(/\s+/).length > LIMITS.keywordWords) p.push(`${label} "${t}" has more than ${LIMITS.keywordWords} words`);
    }
    if (!MATCH_TYPES.has(k.match)) p.push(`${label}.match must be EXACT, PHRASE or BROAD`);
  };
  if (spec.negative_keywords !== undefined) {
    if (!Array.isArray(spec.negative_keywords)) p.push("negative_keywords must be a list");
    else spec.negative_keywords.forEach((k, i) => keyword(k, `negative_keywords[${i}]`));
  }
  const urls = destinationUrls(root);
  const destinationOk = (u) => {
    const bare = String(u).split("#")[0].split("?")[0].replace(/\/+$/, "");
    return urls.some((d) => bare === d.split("#")[0].split("?")[0].replace(/\/+$/, ""));
  };
  if (!urls.length) w.push("config/product.md lists no destination URL yet: the final URLs could not be checked against the destination pages table");
  const groups = spec.ad_groups;
  if (!Array.isArray(groups) || !groups.length) p.push("ad_groups is missing or empty");
  else groups.forEach((g, gi) => {
    const L = `ad_groups[${gi}]`;
    if (!isObj(g)) { p.push(`${L} is not an object`); return; }
    for (const k of Object.keys(g)) if (!["name", "cpc_bid", "keywords", "ads"].includes(k)) p.push(`unknown field ${L}.${k}`);
    if (!str(g.name)) p.push(`${L}.name is missing`);
    if (g.cpc_bid !== undefined && !(Number(g.cpc_bid) > 0)) p.push(`${L}.cpc_bid must be a positive amount`);
    if (!Array.isArray(g.keywords) || !g.keywords.length) p.push(`${L}.keywords is missing or empty`);
    else g.keywords.forEach((k, i) => keyword(k, `${L}.keywords[${i}]`));
    if (!Array.isArray(g.ads) || !g.ads.length) { p.push(`${L}.ads is missing or empty`); return; }
    g.ads.forEach((a, ai) => {
      const A = `${L}.ads[${ai}]`;
      if (!isObj(a)) { p.push(`${A} is not an object`); return; }
      for (const k of Object.keys(a)) if (!["headlines", "descriptions", "final_url", "path1", "path2"].includes(k)) p.push(`unknown field ${A}.${k}`);
      const text = (x) => (isObj(x) ? str(x.text) : str(x));
      const pin = (x, kind) => {
        if (!isObj(x) || x.pin === undefined) return;
        if (!PINS.has(x.pin) || !x.pin.startsWith(kind)) p.push(`${A}: pin "${x.pin}" is not a ${kind.toLowerCase()} position`);
      };
      const hs = Array.isArray(a.headlines) ? a.headlines : [];
      const ds = Array.isArray(a.descriptions) ? a.descriptions : [];
      if (hs.length < 3 || hs.length > 15) p.push(`${A} has ${hs.length} headlines (a responsive search ad takes 3 to 15)`);
      if (ds.length < 2 || ds.length > 4) p.push(`${A} has ${ds.length} descriptions (2 to 4)`);
      hs.forEach((h) => { const t = text(h); if (!t) p.push(`${A}: an empty headline`); else if (adLength(t) > LIMITS.headline) p.push(`${A}: headline "${t}" is ${adLength(t)} characters (at most ${LIMITS.headline})`); pin(h, "HEADLINE"); });
      ds.forEach((d) => { const t = text(d); if (!t) p.push(`${A}: an empty description`); else if (adLength(t) > LIMITS.description) p.push(`${A}: description "${t}" is ${adLength(t)} characters (at most ${LIMITS.description})`); pin(d, "DESCRIPTION"); });
      if (new Set(hs.map(text)).size !== hs.length) p.push(`${A}: two headlines are the same`);
      for (const k of ["path1", "path2"]) if (a[k] !== undefined && adLength(a[k]) > LIMITS.path) p.push(`${A}.${k} is longer than ${LIMITS.path} characters`);
      if (a.path2 && !a.path1) p.push(`${A}.path2 needs path1`);
      if (!/^https:\/\/\S+$/i.test(str(a.final_url))) p.push(`${A}.final_url must be an https:// address`);
      else if (urls.length && !destinationOk(a.final_url)) p.push(`${A}.final_url ${a.final_url} is not a destination page of config/product.md (the destination pages table)`);
      else if (/[?&](utm_|ref=)/.test(a.final_url)) w.push(`${A}.final_url carries tracking parameters; keep them in campaign.final_url_suffix`);
    });
  });
  if (spec.sitelinks !== undefined) {
    if (!Array.isArray(spec.sitelinks)) p.push("sitelinks must be a list");
    else spec.sitelinks.forEach((s, i) => {
      const S = `sitelinks[${i}]`;
      if (!isObj(s)) { p.push(`${S} is not an object`); return; }
      if (!str(s.text)) p.push(`${S}.text is missing`);
      else if (adLength(s.text) > LIMITS.sitelink) p.push(`${S}.text "${s.text}" is longer than ${LIMITS.sitelink} characters`);
      for (const k of ["description1", "description2"]) if (s[k] !== undefined && adLength(s[k]) > LIMITS.sitelinkDescription) p.push(`${S}.${k} is longer than ${LIMITS.sitelinkDescription} characters`);
      if (Boolean(s.description1) !== Boolean(s.description2)) p.push(`${S}: give both description1 and description2, or neither`);
      if (!/^https:\/\/\S+$/i.test(str(s.url))) p.push(`${S}.url must be an https:// address`);
    });
  }
  if (spec.callouts !== undefined) {
    if (!Array.isArray(spec.callouts)) p.push("callouts must be a list of texts");
    else spec.callouts.forEach((t, i) => { if (!str(t)) p.push(`callouts[${i}] is empty`); else if (adLength(t) > LIMITS.callout) p.push(`callouts[${i}] "${t}" is longer than ${LIMITS.callout} characters`); });
  }
  const lim = googleDailyLimit(root);
  if (budget > 0) {
    if (!lim) w.push("config/goals.md has no daily cap or Google platform share yet: the budget could not be checked against the caps");
    else if (budget > lim.limit) {
      p.push(`campaign.daily_budget ${budget} is above ${lim.limit} (half the Google share ${lim.share} % of the daily cap ${lim.dailyCap} in config/goals.md; Google may spend up to twice a daily budget on one day)`);
    }
  }
  return { problems: p, warnings: w };
}

/** The atomic googleAds:mutate operations for a valid Search spec. Temporary ids are negative and unique. */
export function buildOperations(spec, customer) {
  let next = -1;
  const temp = (kind) => `customers/${customer}/${kind}/${next--}`;
  const c = spec.campaign;
  const ops = [];
  const budget = temp("campaignBudgets");
  ops.push({ campaignBudgetOperation: { create: { resourceName: budget, name: `${c.name} budget`, amountMicros: String(toMicros(c.daily_budget)), deliveryMethod: "STANDARD", explicitlyShared: false } } });
  const campaign = temp("campaigns");
  const bidding = c.bidding || "MAXIMIZE_CONVERSIONS";
  const camp = {
    resourceName: campaign,
    name: c.name,
    status: "PAUSED",
    advertisingChannelType: "SEARCH",
    campaignBudget: budget,
    networkSettings: { targetGoogleSearch: true, targetSearchNetwork: Boolean(c.search_partners), targetContentNetwork: false, targetPartnerSearchNetwork: false },
    geoTargetTypeSetting: { positiveGeoTargetType: spec.location_presence || "PRESENCE", negativeGeoTargetType: "PRESENCE" },
    containsEuPoliticalAdvertising: c.eu_political_ads === true ? "CONTAINS_EU_POLITICAL_ADVERTISING" : "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",
  };
  if (bidding === "MAXIMIZE_CONVERSIONS") camp.maximizeConversions = c.target_cpa ? { targetCpaMicros: String(toMicros(c.target_cpa)) } : {};
  else if (bidding === "MAXIMIZE_CLICKS") camp.targetSpend = c.max_cpc ? { cpcBidCeilingMicros: String(toMicros(c.max_cpc)) } : {};
  else camp.manualCpc = { enhancedCpcEnabled: false };
  if (c.start_date) camp.startDateTime = `${c.start_date} 00:00:00`;
  if (c.end_date) camp.endDateTime = `${c.end_date} 23:59:59`;
  if (c.final_url_suffix) camp.finalUrlSuffix = c.final_url_suffix;
  ops.push({ campaignOperation: { create: camp } });
  for (const id of spec.locations) ops.push({ campaignCriterionOperation: { create: { campaign, location: { geoTargetConstant: `geoTargetConstants/${id}` } } } });
  for (const id of spec.languages) ops.push({ campaignCriterionOperation: { create: { campaign, language: { languageConstant: `languageConstants/${id}` } } } });
  for (const k of spec.negative_keywords || []) ops.push({ campaignCriterionOperation: { create: { campaign, negative: true, keyword: { text: k.text.trim(), matchType: k.match } } } });
  for (const g of spec.ad_groups) {
    const group = temp("adGroups");
    const ag = { resourceName: group, campaign, name: g.name, status: "ENABLED", type: "SEARCH_STANDARD" };
    const bid = g.cpc_bid ?? (bidding === "MANUAL_CPC" ? c.max_cpc : undefined);
    if (bid) ag.cpcBidMicros = String(toMicros(bid));
    ops.push({ adGroupOperation: { create: ag } });
    for (const k of g.keywords) ops.push({ adGroupCriterionOperation: { create: { adGroup: group, status: "ENABLED", keyword: { text: k.text.trim(), matchType: k.match } } } });
    for (const a of g.ads) {
      const asset = (x) => {
        const o = { text: (isObj(x) ? x.text : x).trim() };
        if (isObj(x) && x.pin) o.pinnedField = x.pin;
        return o;
      };
      const rsa = { headlines: a.headlines.map(asset), descriptions: a.descriptions.map(asset) };
      if (a.path1) rsa.path1 = a.path1;
      if (a.path2) rsa.path2 = a.path2;
      ops.push({ adGroupAdOperation: { create: { adGroup: group, status: "ENABLED", ad: { finalUrls: [a.final_url.trim()], responsiveSearchAd: rsa } } } });
    }
  }
  for (const s of spec.sitelinks || []) {
    const asset = temp("assets");
    const sl = { linkText: s.text.trim() };
    if (s.description1) { sl.description1 = s.description1; sl.description2 = s.description2; }
    ops.push({ assetOperation: { create: { resourceName: asset, finalUrls: [s.url.trim()], sitelinkAsset: sl } } });
    ops.push({ campaignAssetOperation: { create: { campaign, asset, fieldType: "SITELINK" } } });
  }
  for (const t of spec.callouts || []) {
    const asset = temp("assets");
    ops.push({ assetOperation: { create: { resourceName: asset, calloutAsset: { calloutText: t.trim() } } } });
    ops.push({ campaignAssetOperation: { create: { campaign, asset, fieldType: "CALLOUT" } } });
  }
  return ops;
}

export function validateConversionSpec(spec) {
  if (!isObj(spec)) return ["the spec is not a JSON object"];
  const p = [];
  for (const k of Object.keys(spec)) if (!["name", "category", "value", "counting"].includes(k)) p.push(`unknown field "${k}" (allowed: name, category, value, counting)`);
  if (!str(spec.name)) p.push("name is missing");
  if (!CONVERSION_CATEGORIES.has(spec.category)) p.push(`category must be one of ${[...CONVERSION_CATEGORIES].join(", ")}`);
  if (spec.value !== undefined && !(Number(spec.value) >= 0)) p.push("value must be a number (the default value of one conversion)");
  if (spec.counting !== undefined && !["ONE_PER_CLICK", "MANY_PER_CLICK"].includes(spec.counting)) p.push("counting must be ONE_PER_CLICK (leads) or MANY_PER_CLICK (sales)");
  return p;
}

// ---------- the full API: any mutate, any service method, recipes ----------
// mutate takes any list of googleAds:mutate operations (every resource type of the API: Performance Max, Demand Gen,
// Display, Video, Shopping, assets, ad schedules, audiences, bid adjustments, shared sets, labels, experiments...).
// guardOperations normalises them and lists what is refused and what needs the Owner's go; the money rules hold for
// every operation, whatever it is.
const RES = /^customers\/(\d{10})\/(\w+)\/(-?[\d~]+)$/;
const isTemp = (r) => { const m = RES.exec(r); return Boolean(m) && m[3].startsWith("-"); };
const opKind = (op) => (isObj(op) ? Object.keys(op).filter((k) => /Operation$/.test(k)) : []);
const PUBLISHING = new Set(["adGroupOperation", "adGroupAdOperation", "assetGroupOperation"]);
/**
 * ops: the mutateOperations list. Returns { problems, needsGo, existing, budgetUpdates, campaignsCreated, ops }:
 * problems refuse the request; needsGo lists what needs the Owner's words; existing lists the existing resources
 * the operations touch or hang under (each must be known to this folder); budgetUpdates are checked against the
 * live amount and publishUnder against the parent's live status before anything is sent.
 */
export function guardOperations(input, customer) {
  const problems = [];
  const needsGo = [];
  const existing = new Set();
  const budgetUpdates = [];
  const campaignsCreated = [];
  const publishUnder = [];
  if (!Array.isArray(input) || !input.length) return { problems: ["the spec needs a non-empty \"operations\" list (googleAds:mutate operations)"], needsGo, existing: [], budgetUpdates, campaignsCreated, publishUnder, ops: [] };
  const ops = JSON.parse(JSON.stringify(input));
  for (const m of JSON.stringify(ops).matchAll(/customers\/(\d+)/g)) {
    if (m[1] !== customer) { problems.push(`refused: an operation names Google Ads account ${m[1]}, not this folder's account ${customer}`); break; }
  }
  const refsIn = (obj, own) => {
    const out = [];
    const walk = (v) => {
      if (Array.isArray(v)) return v.forEach(walk);
      if (isObj(v)) return Object.values(v).forEach(walk);
      if (typeof v === "string" && RES.test(v) && v !== own && !isTemp(v)) out.push(v);
    };
    walk(obj);
    return out;
  };
  ops.forEach((op, i) => {
    const kinds = opKind(op);
    if (kinds.length !== 1) { problems.push(`operations[${i}] must hold exactly one <resource>Operation (for example campaignOperation)`); return; }
    const kind = kinds[0];
    const inner = op[kind];
    const L = `operations[${i}] ${kind}`;
    if (!isObj(inner)) { problems.push(`${L} is not an object`); return; }
    const verbs = ["create", "update", "remove"].filter((v) => inner[v] !== undefined);
    if (verbs.length !== 1) { problems.push(`${L} needs exactly one of create, update, remove`); return; }
    if (inner.remove !== undefined) {
      const r = String(inner.remove);
      if (!RES.test(r)) problems.push(`${L}: remove needs a resource name`);
      else { existing.add(r); needsGo.push(`remove ${r} (a delete is the Owner's)`); }
      return;
    }
    if (inner.create !== undefined) {
      const c = inner.create;
      if (!isObj(c)) { problems.push(`${L}: create is not an object`); return; }
      for (const r of refsIn(c, c.resourceName)) existing.add(r);
      if (kind === "campaignOperation") {
        if (c.status !== undefined && c.status !== "PAUSED") problems.push(`${L}: a campaign is always created PAUSED (status "${c.status}" refused); turning it on is enable --go after the Owner's go`);
        c.status = "PAUSED";
        if (c.containsEuPoliticalAdvertising === undefined) c.containsEuPoliticalAdvertising = "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING";
        campaignsCreated.push(c.resourceName || `operations[${i}]`);
      }
      // a new ad group, ad or asset group under a campaign or ad group that already exists publishes at once when
      // that campaign is live: the run reads the parent first (publishUnder) and asks for the go only then
      const parent = c.campaign || c.adGroup;
      if (PUBLISHING.has(kind) && parent && !isTemp(parent) && c.status !== "PAUSED") publishUnder.push({ index: i, kind, parent });
      if (kind === "campaignBudgetOperation" && c.amountMicros !== undefined) budgetUpdates.push({ create: true, micros: Number(c.amountMicros), index: i });
      return;
    }
    const u = inner.update;
    if (!isObj(u) || !RES.test(String(u.resourceName || ""))) { problems.push(`${L}: update needs a resourceName`); return; }
    if (!inner.updateMask) problems.push(`${L}: update needs an updateMask (the fields it changes, snake_case, comma-separated)`);
    existing.add(u.resourceName);
    for (const r of refsIn(u, u.resourceName)) existing.add(r);
    if (u.status === "ENABLED") needsGo.push(`${u.resourceName} turned ENABLED`);
    if (kind === "campaignOperation" && (u.endDateTime !== undefined || /end_date/.test(String(inner.updateMask)))) needsGo.push(`${u.resourceName}: the end date changed (an extension is the Owner's)`);
    if (kind === "campaignBudgetOperation" && u.amountMicros !== undefined) budgetUpdates.push({ resource: u.resourceName, micros: Number(u.amountMicros), index: i });
  });
  return { problems, needsGo, existing: [...existing], budgetUpdates, campaignsCreated, publishUnder, ops };
}

// service runs any other Google Ads API method by its REST path (keyword ideas, conversion uploads,
// recommendations, reach forecasts, experiments...). Methods that only read or forecast run freely; any other
// method needs the Owner's words in --go. Mutates go through mutate, where the guards are.
export const READ_METHOD = /:(search|searchStream|suggest|listAccessibleCustomers|generate[A-Za-z]*|list[A-Za-z]*|get[A-Za-z]*)$/;
export function checkServicePath(p, customer) {
  const s = String(p || "").trim().replace(/^\/+/, "").replace(/^v\d+\//, "").replaceAll("{customer}", customer).replaceAll("${CUSTOMER}", customer);
  if (!/^[A-Za-z0-9_\-./~:]+$/.test(s) || s.includes("..")) return { problem: `--path "${p}" is not a Google Ads API path (for example customers/{customer}:generateKeywordIdeas)` };
  if (/:mutate$/i.test(s)) return { problem: "mutates go through the mutate subcommand (its guards hold the money rules)" };
  for (const m of s.matchAll(/customers\/(\d+)/g)) if (m[1] !== customer) return { problem: `refused: --path names Google Ads account ${m[1]}, not this folder's account ${customer}` };
  return { path: s, read: READ_METHOD.test(s) };
}

// Recipes: JSON files in creatives/tools/google-ads-recipes/ (no code). ${NAME} is replaced by --set NAME=value
// (JSON when it parses, else text; @path reads a file as base64, for images) or by --vars <file.json>; ${CUSTOMER}
// is the .env account. A string that is exactly "${NAME}" takes the value as it is (a list, a number).
export const RECIPES_DIR = path.join(path.dirname(SELF), "google-ads-recipes");
export function fillRecipe(recipe, vars) {
  const missing = new Set();
  const fill = (v) => {
    if (Array.isArray(v)) return v.map(fill);
    if (isObj(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]));
    if (typeof v !== "string") return v;
    const whole = /^\$\{([A-Z0-9_]+)\}$/.exec(v);
    if (whole) { if (!(whole[1] in vars)) missing.add(whole[1]); return vars[whole[1]]; }
    return v.replace(/\$\{([A-Z0-9_]+)\}/g, (_, k) => { if (!(k in vars)) { missing.add(k); return ""; } return String(vars[k]); });
  };
  const out = { ...recipe };
  for (const k of ["operations", "body", "path"]) if (recipe[k] !== undefined) out[k] = fill(recipe[k]);
  return { recipe: out, missing: [...missing] };
}

// ---------- GAQL ----------
export function isReadOnlyQuery(q) {
  const s = String(q || "").trim();
  return /^SELECT\s/i.test(s) && !/;/.test(s.replace(/'[^']*'/g, ""));
}
const REPORT_METRICS = ["metrics.impressions", "metrics.clicks", "metrics.ctr", "metrics.average_cpc", "metrics.cost_micros", "metrics.conversions", "metrics.cost_per_conversion"];
const REPORT_LEVELS = {
  campaign: { from: "campaign", fields: ["campaign.id", "campaign.name", "campaign.status", "campaign.advertising_channel_type"], where: "campaign.status != 'REMOVED'" },
  ad_group: { from: "ad_group", fields: ["campaign.name", "ad_group.id", "ad_group.name", "ad_group.status"], where: "ad_group.status != 'REMOVED'" },
  ad: { from: "ad_group_ad", fields: ["campaign.name", "ad_group.name", "ad_group_ad.ad.id", "ad_group_ad.status", "ad_group_ad.policy_summary.approval_status"], where: "ad_group_ad.status != 'REMOVED'" },
  keyword: { from: "keyword_view", fields: ["campaign.name", "ad_group.name", "ad_group_criterion.keyword.text", "ad_group_criterion.keyword.match_type", "ad_group_criterion.status"], where: "ad_group_criterion.status != 'REMOVED'" },
  search_term: { from: "search_term_view", fields: ["campaign.name", "ad_group.name", "search_term_view.search_term", "search_term_view.status"], where: null },
};
export function reportQuery(level, { range, since, until }) {
  const L = REPORT_LEVELS[level];
  const during = range ? `segments.date DURING ${range}` : `segments.date BETWEEN '${since}' AND '${until}'`;
  return `SELECT ${[...L.fields, ...REPORT_METRICS].join(", ")} FROM ${L.from} WHERE ${[during, L.where].filter(Boolean).join(" AND ")} ORDER BY metrics.cost_micros DESC`;
}
// A GAQL row (nested camelCase objects) flattened to dotted keys; *Micros money fields become amounts too.
export function flattenRow(row, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(row || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (isObj(v)) flattenRow(v, key, out);
    else out[key] = Array.isArray(v) ? JSON.stringify(v) : v;
  }
  return out;
}
const MONEY_MICROS = ["metrics.costMicros", "metrics.averageCpc", "metrics.costPerConversion"];
export function reportRows(results) {
  return results.map((r) => {
    const f = flattenRow(r);
    for (const k of MONEY_MICROS) if (k in f) { f[k.replace(/Micros$/, "")] = fromMicros(f[k]); if (k.endsWith("Micros")) delete f[k]; }
    return f;
  });
}

// ---------- CSV (UTF-8 with BOM) ----------
const NUMERIC = /^-?\d+(\.\d+)?(e[+-]?\d+)?$/i;
export function csvCell(value) {
  if (value === null || value === undefined) return "";
  let s = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/^[=+\-@\t\r]/.test(s) && !NUMERIC.test(s)) s = "'" + s;
  if (/[",\r\n]/.test(s) || /^\s|\s$/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}
export function toCsv(headers, rows) {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) lines.push(headers.map((h) => csvCell(row[h])).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}

// ---------- arguments ----------
const BOOL = new Set(["dry-run", "json", "help", "validate", "tags"]);
const VALUED = new Set(["port", "gaql", "out", "level", "range", "since", "until", "q", "country", "locale", "spec", "resource", "go", "channel", "amount",
  "path", "body", "method", "set", "vars"]);
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
        if (v === undefined || (v.startsWith("--") && k !== "go")) throw new UsageError(`--${k} needs a value`);
      }
      if (k === "set") (o.set = o.set || []).push(v);
      else o[k] = v;
    } else if (["customer", "customer-id", "account"].includes(k)) {
      throw new UsageError(`--${k} is refused: the account is GOOGLE_ADS_CUSTOMER_ID in .env only (one Google Ads account per harness folder)`);
    } else throw new UsageError(`unknown option: --${k} (see --help)`);
  }
  return { pos, o };
}
const COMMON = ["dry-run", "json", "help"];
const ALLOWED = {
  login: ["port"],
  check: [],
  accounts: [],
  search: ["gaql", "out"],
  report: ["level", "range", "since", "until", "out"],
  "geo-search": ["q", "country", "locale"],
  "language-ids": ["q"],
  "conversions list": ["tags", "out"],
  "conversions create": ["spec"],
  build: ["spec", "validate"],
  pause: ["resource"],
  enable: ["resource", "go", "channel"],
  budget: ["resource", "amount", "go", "channel"],
  mutate: ["spec", "validate", "go", "channel"],
  service: ["path", "body", "method", "go", "channel", "out"],
  "recipe list": [],
  "recipe show": [],
  "recipe run": ["set", "vars", "validate", "go", "channel", "out"],
};
export function helpText() {
  const all = fs.readFileSync(SELF, "utf8").split(/\r?\n/).slice(1);
  const end = all.findIndex((l) => !l.startsWith("//"));
  return all.slice(0, end === -1 ? all.length : end).map((l) => l.slice(3)).join("\n");
}

// ---------- small helpers ----------
const cell = (v) => (v === null || v === undefined ? "" : String(v).replace(/\|/g, "\\|").replace(/\r?\n/g, " "));
function table(headers, rows) {
  const lines = [`| ${headers.join(" | ")} |`, `|${headers.map(() => "---").join("|")}|`];
  for (const r of rows) lines.push(`| ${r.map(cell).join(" | ")} |`);
  return lines.join("\n");
}
function readJsonFile(file, label) {
  if (!fs.existsSync(file)) throw new UsageError(`${label} not found: ${file}`);
  try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, "")); }
  catch (e) { throw new UsageError(`${label} is not valid JSON (${file}): ${e.message}`); }
}
const req = (method, p, body, note) => ({ method, path: p, body, note });
function openInBrowser(url) {
  const opts = { stdio: "ignore", windowsHide: true };
  if (process.platform === "win32") spawnSync("rundll32", ["url.dll,FileProtocolHandler", url], opts);
  else if (process.platform === "darwin") spawnSync("open", [url], opts);
  else spawnSync("xdg-open", [url], opts);
}

// The error a Google answer carries, as one line plus the codes (for example authorizationError: USER_PERMISSION_DENIED).
export function describeError(json, status) {
  const e = (json && json.error) || {};
  const codes = [];
  const msgs = [];
  for (const d of Array.isArray(e.details) ? e.details : []) {
    for (const x of Array.isArray(d.errors) ? d.errors : []) {
      for (const [k, v] of Object.entries(x.errorCode || {})) codes.push(`${k}: ${v}`);
      if (x.message) msgs.push(x.message + (x.location && x.location.fieldPathElements ? ` (at ${x.location.fieldPathElements.map((f) => f.fieldName + (f.index !== undefined ? `[${f.index}]` : "")).join(".")})` : ""));
    }
  }
  if (json && json.error_description) msgs.push(json.error_description);
  if (json && typeof json.error === "string") codes.push(`oauth: ${json.error}`);
  return { codes, message: msgs.join("; ") || e.message || `HTTP ${status}`, status: e.status || status };
}
export function fixList(codes, message) {
  const all = codes.join(" ") + " " + String(message || "");
  if (/invalid_grant|OAUTH_TOKEN_(EXPIRED|REVOKED|INVALID)|invalid_client|unauthorized_client/i.test(all)) {
    return "The sign-in is no longer valid. With the service account (GOOGLE_ADS_JSON_KEY_FILE): its key was deleted or disabled; make a new one with node creatives/tools/google-cloud-setup.mjs run --project <id>. With the OAuth fallback: the login expired, was revoked or the client changed; run node creatives/tools/google-ads.mjs login (the Owner clicks Allow). A client in Testing mode on the consent screen expires its logins after 7 days: publish the consent screen (Google Auth Platform > Audience > Publish app).";
  }
  if (/DEVELOPER_TOKEN|NOT_APPROVED|test account|TEST_ACCOUNT|access level|explorer/i.test(all)) {
    return "The Google Cloud project's Google Ads API access is Test only, so it reaches test accounts only. The Owner applies for Explorer in the Cloud Console (Google Ads API > Overview > Upgrade access level > Apply); review is usually automated. Nothing was retried.";
  }
  if (/USER_PERMISSION_DENIED/.test(all)) {
    return "The signed-in Google user has no access to this Google Ads account, or reaches it only through a manager account: set GOOGLE_ADS_LOGIN_CUSTOMER_ID to the manager's id, or add the user in Google Ads > Admin > Access and security, then run check.";
  }
  if (/CUSTOMER_NOT_ENABLED|CUSTOMER_NOT_FOUND/.test(all)) {
    return "The Google Ads account is not enabled (no billing yet, cancelled, or never finished): the Owner opens Google Ads > Billing and finishes the account, then run check.";
  }
  if (/SERVICE_DISABLED|has not been used in project|is disabled/i.test(all)) {
    return "The Google Ads API is not turned on in the company's Google Cloud project: Cloud Console > APIs & Services > Library > Google Ads API > Enable, wait a few minutes, then run check.";
  }
  if (/EU_POLITICAL_ADVERTISING/.test(all)) {
    return "An existing campaign in the account has no EU political advertising declaration, so Google blocks every campaign change: the Owner opens each campaign's settings in Google Ads and answers the EU political ads question.";
  }
  return null;
}

// ---------- run ----------
/**
 * Runs one subcommand and resolves to the exit code (0 ok, 1 API error, 2 configuration, arguments or refusal).
 * opts: fetch, env (unused for secrets: they come from .env only), cwd, repo, stdout, stderr, now(), dotenv,
 * openBrowser(url) (login; HARNESS_NO_BROWSER=1 skips it), loginWaitMs.
 */
export async function run(argv, opts = {}) {
  const io = {
    fetch: opts.fetch || globalThis.fetch,
    env: opts.env || process.env,
    cwd: opts.cwd || process.cwd(),
    repo: opts.repo || opts.cwd || REPO,
    stdout: opts.stdout || process.stdout,
    stderr: opts.stderr || process.stderr,
    now: opts.now || (() => new Date()),
    openBrowser: opts.openBrowser || openInBrowser,
    loginWaitMs: opts.loginWaitMs || LOGIN_WAIT_MS,
  };
  const scrub = makeScrubber();
  const say = (s) => io.stdout.write(scrub(s) + "\n");
  const err = (s) => io.stderr.write(scrub(s) + "\n");

  let parsed;
  try { parsed = parseArgs(argv); } catch (e) { err(e.message); return 2; }
  const { pos, o } = parsed;
  if (o.help || pos.length === 0) { say(helpText()); return o.help ? 0 : 2; }
  const grouped = pos[0] === "conversions" || pos[0] === "recipe";
  const key = grouped ? `${pos[0]} ${pos[1] || ""}`.trim() : pos[0];
  if (!ALLOWED[key]) { err(`unknown subcommand: ${pos.join(" ")} (see --help)`); return 2; }
  const named = key === "recipe show" || key === "recipe run";
  const maxPos = (grouped ? 2 : 1) + (named ? 1 : 0);
  if (named && !pos[2]) { err(`${key} needs a recipe name (see: recipe list)`); return 2; }
  if (pos.length > maxPos) { err(`unexpected argument: ${pos.slice(maxPos).join(" ")} (see --help)`); return 2; }
  for (const k of Object.keys(o)) {
    if (!COMMON.includes(k) && !ALLOWED[key].includes(k)) { err(`--${k} does not apply to "${key}" (see --help)`); return 2; }
  }
  const human = o.json ? err : say;

  // configuration
  const envFile = path.join(io.repo, ".env");
  const fileEnv = opts.dotenv || readEnvFile(envFile);
  const envExists = Boolean(opts.dotenv) || fs.existsSync(envFile);
  for (const k of ["GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_DEVELOPER_TOKEN"]) scrub.add(fileEnv[k]);
  const clientId = fileEnv.GOOGLE_ADS_CLIENT_ID || "";
  const clientSecret = fileEnv.GOOGLE_ADS_CLIENT_SECRET || "";
  const refresh = fileEnv.GOOGLE_ADS_REFRESH_TOKEN || "";
  const customer = customerDigits(fileEnv.GOOGLE_ADS_CUSTOMER_ID);
  const loginCustomer = customerDigits(fileEnv.GOOGLE_ADS_LOGIN_CUSTOMER_ID);
  const devToken = fileEnv.GOOGLE_ADS_DEVELOPER_TOKEN || "";
  const version = String(fileEnv.GOOGLE_ADS_API_VERSION || DEFAULT_VERSION).trim();
  const problems = [];
  const noEnv = "No .env at the repository root. Copy .env.example to .env (the bootstrap does it), then follow docs/google-setup-guide.md.";
  const offline = ["recipe list", "recipe show"].includes(key);
  // The service account (GOOGLE_ADS_JSON_KEY_FILE) wins over the OAuth client; its key is read only when a call needs it.
  const keyFile = fileEnv.GOOGLE_ADS_JSON_KEY_FILE ? path.resolve(io.repo, fileEnv.GOOGLE_ADS_JSON_KEY_FILE) : "";
  let serviceKey = null;
  if (keyFile && !offline && key !== "login") {
    try { serviceKey = readServiceKey(keyFile); scrub.add(serviceKey.privateKey); } catch (e) { problems.push(e.message); }
  }
  if (!keyFile && (!clientId || !clientSecret) && !offline) {
    problems.push(envExists
      ? "Google Ads has no sign-in in .env: run node creatives/tools/google-cloud-setup.mjs run (a service account, GOOGLE_ADS_JSON_KEY_FILE), or, as the fallback, set GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET from the Cloud Console (Google Auth Platform > Clients) with node creatives/tools/env-set.mjs --from-clipboard <NAME> (never paste a value in chat)."
      : noEnv);
  }
  const needsAccount = !["login", "accounts", "geo-search", "recipe list", "recipe show"].includes(key);
  if (!keyFile && !["login", "recipe list", "recipe show"].includes(key) && !refresh) problems.push("GOOGLE_ADS_REFRESH_TOKEN is not set: run node creatives/tools/google-ads.mjs login first (the Owner clicks Allow in the browser).");
  if (needsAccount && !customer) problems.push("GOOGLE_ADS_CUSTOMER_ID is not set in .env: run accounts, then write the chosen id (10 digits) with env-set.mjs or by hand; see .env.example.");
  else if (customer && !isCustomerId(customer)) problems.push("GOOGLE_ADS_CUSTOMER_ID in .env is not a 10-digit Google Ads customer id (dashes optional).");
  if (loginCustomer && !isCustomerId(loginCustomer)) problems.push("GOOGLE_ADS_LOGIN_CUSTOMER_ID in .env is not a 10-digit manager account id.");
  if (!/^v\d+$/.test(version)) problems.push(`GOOGLE_ADS_API_VERSION in .env is not a version like ${DEFAULT_VERSION}.`);
  const bound = configuredCustomer(io.repo);
  if (customer && bound && bound !== customer) {
    err(`refused: .env holds Google Ads account ${customer} but this harness folder is bound to ${bound} (config/accounts.md, google_ads_customer_id). Nothing was sent. Another company's account is another harness folder; if this company's account changed, the Owner updates config/accounts.md and .env together.`);
    return 2;
  }
  const CUST = customer && isCustomerId(customer) ? customer : "<GOOGLE_ADS_CUSTOMER_ID>";
  const resolve = (p) => path.resolve(io.cwd, p);
  const today = () => io.now().toISOString().slice(0, 10);

  function checkResource(r, kinds) {
    const m = MUTABLE.exec(String(r || ""));
    if (!m || !kinds.includes(m[2])) throw new UsageError(`--resource must be customers/<id>/${kinds.join("|")}/<id> (the resource name from build, report or search)`);
    if (m[1] !== customer) throw new UsageError(`refused: ${r} belongs to Google Ads account ${m[1]}, not this folder's account ${customer}`);
    return { kind: m[2], id: m[3] };
  }
  function isKnown(r) {
    const k = loadKnown(io.repo);
    if (k.customer === customer && k.resources.has(r)) return true;
    const last = r.split("/").pop();
    return namedInVault(io.repo, [...new Set([r, last, last.split("~")[0]])]);
  }

  function mutatePlan(operations, label) {
    const g = guardOperations(operations, CUST);
    if (g.problems.length) throw new UsageError(`${label} was refused for these reasons:${g.problems.map((x) => "\n  - " + x).join("")}`);
    if (g.needsGo.length && !str(o.go)) {
      throw new UsageError(`refused: ${label} needs the Owner's go, quoted exactly in --go "<words>" from the same message as the spend statement:${g.needsGo.map((x) => "\n  - " + x).join("")}\nNothing was sent.`);
    }
    if (!o["dry-run"]) {
      const unknown = g.existing.filter((r) => !isKnown(r));
      if (unknown.length) throw new UsageError(`refused: ${unknown.join(", ")} ${unknown.length > 1 ? "were" : "was"} not created or recorded by this folder. Read ${unknown.length > 1 ? "them" : "it"} with report or search and record the resource name in the plan first.`);
    }
    const validate = req("POST", `customers/${CUST}/googleAds:mutate`, { mutateOperations: g.ops, validateOnly: true }, "Google checks the whole batch; nothing is changed");
    const write = req("POST", `customers/${CUST}/googleAds:mutate`, { mutateOperations: g.ops }, "one atomic batch: everything or nothing");
    return { steps: o.validate ? [validate] : [validate, write], exec: () => execMutate(g, validate, write, label) };
  }
  function servicePlan(sp, method, body, label) {
    if (!sp.read && !str(o.go)) throw new UsageError(`refused: ${sp.path} is not a read or a forecast, so it needs the Owner's go quoted in --go "<words>". Nothing was sent.`);
    const step = req(method, sp.path, body, sp.read ? "a read or a forecast" : "a write: ledgered, with a go-log row");
    return { steps: [step], exec: () => execService(step, sp, label) };
  }

  // ---------- each subcommand: validate, then a plan of requests and the code that runs it ----------
  let plan;
  try { plan = buildPlan(); } catch (e) { if (e instanceof UsageError) { err(e.message); return 2; } throw e; }

  function buildPlan() {
    const q = (query, note) => req("POST", `customers/${CUST}/googleAds:search`, { query }, note);
    switch (key) {
      case "login": {
        if (o.port !== undefined && !/^\d{2,5}$/.test(o.port)) throw new UsageError("--port must be a port number");
        return { steps: [
          req("GET", AUTH_URL, { client_id: clientId || "<GOOGLE_ADS_CLIENT_ID>", scope: SCOPE, access_type: "offline", prompt: "consent", redirect_uri: "http://127.0.0.1:<port>", code_challenge_method: "S256" }, "opened in the browser; the Owner signs in and clicks Allow"),
          req("POST", TOKEN_URL, { grant_type: "authorization_code", code: "[code]", client_secret: "[token]", code_verifier: "[verifier]" }, "the refresh token goes straight into .env as GOOGLE_ADS_REFRESH_TOKEN; never printed"),
        ], exec: execLogin };
      }
      case "check":
        return { steps: [
          keyFile ? req("POST", TOKEN_URL, { grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: "[signed with the service account key]" })
            : req("POST", TOKEN_URL, { grant_type: "refresh_token", refresh_token: "[token]" }),
          req("GET", "customers:listAccessibleCustomers"),
          q("SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.status, customer.manager, customer.test_account FROM customer"),
          q("SELECT conversion_action.id, conversion_action.name, conversion_action.status FROM conversion_action WHERE conversion_action.status = 'ENABLED'"),
        ], exec: execCheck };
      case "accounts":
        return { steps: [req("GET", "customers:listAccessibleCustomers"),
          req("POST", "customers/<each id>/googleAds:search", { query: "SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.manager, customer.test_account, customer.status FROM customer" }, "once per accessible account; an error is shown on its row")], exec: execAccounts };
      case "search": {
        if (!o.gaql) throw new UsageError('search needs --gaql "SELECT ... FROM ..."');
        if (!isReadOnlyQuery(o.gaql)) throw new UsageError("search runs one SELECT query only");
        const step = q(o.gaql.trim(), `follows nextPageToken, at most ${MAX_PAGES} pages`);
        return { steps: [step], exec: () => execSearch(step) };
      }
      case "report": {
        if (!REPORT_LEVELS[o.level]) throw new UsageError(`report needs --level ${Object.keys(REPORT_LEVELS).join("|")}`);
        if (o.range && (o.since || o.until)) throw new UsageError("use either --range or --since/--until, not both");
        if (o.range && !DATE_RANGES.has(o.range)) throw new UsageError(`--range must be one of ${[...DATE_RANGES].join(", ")}`);
        if (!o.range && (!ymd.test(o.since || "") || !ymd.test(o.until || ""))) throw new UsageError("report needs --range LAST_7_DAYS (or another range), or --since and --until as YYYY-MM-DD");
        if (!o.range && o.since > o.until) throw new UsageError("--since is after --until");
        const step = q(reportQuery(o.level, o), `follows nextPageToken; money in the account currency (micros converted)`);
        return { steps: [step], exec: () => execSearch(step, true) };
      }
      case "geo-search": {
        if (!str(o.q)) throw new UsageError('geo-search needs --q "<place name>"');
        if (o.country && !/^[A-Za-z]{2}$/.test(o.country)) throw new UsageError("--country must be a two-letter country code");
        const body = { locale: o.locale || "en", locationNames: { names: [o.q.trim()] } };
        if (o.country) body.countryCode = o.country.toUpperCase();
        const step = req("POST", "geoTargetConstants:suggest", body);
        return { steps: [step], exec: () => execGeo(step) };
      }
      case "language-ids": {
        const step = q("SELECT language_constant.id, language_constant.name, language_constant.code FROM language_constant WHERE language_constant.targetable = TRUE");
        return { steps: [step], exec: () => execLanguages(step) };
      }
      case "conversions list": {
        if (o.tags && !o.out) throw new UsageError("--tags writes the tag snippets to a file: add --out plans/<date>-request-google-tag.md");
        const fields = ["conversion_action.id", "conversion_action.name", "conversion_action.status", "conversion_action.category", "conversion_action.type", "conversion_action.counting_type"];
        if (o.tags) fields.push("conversion_action.tag_snippets");
        const step = q(`SELECT ${fields.join(", ")} FROM conversion_action WHERE conversion_action.status != 'REMOVED'`);
        return { steps: [step], exec: () => execConversions(step) };
      }
      case "conversions create": {
        if (!o.spec) throw new UsageError("conversions create needs --spec <file.json>");
        const spec = readJsonFile(resolve(o.spec), "conversion spec");
        const p = validateConversionSpec(spec);
        if (p.length) throw new UsageError(`the conversion spec was refused for these reasons:${p.map((x) => "\n  - " + x).join("")}`);
        const create = { name: spec.name.trim(), category: spec.category, type: "WEBPAGE", status: "ENABLED",
          countingType: spec.counting || (spec.category === "PURCHASE" ? "MANY_PER_CLICK" : "ONE_PER_CLICK") };
        if (spec.value !== undefined) create.valueSettings = { defaultValue: Number(spec.value), alwaysUseDefaultValue: false };
        const step = req("POST", `customers/${CUST}/conversionActions:mutate`, { operations: [{ create }] });
        return { steps: [step], exec: () => execSimpleWrite("conversions create", step, { name: create.name, category: create.category }) };
      }
      case "build": {
        if (!o.spec) throw new UsageError("build needs --spec <file.json> (see docs/google-ads.md)");
        const spec = readJsonFile(resolve(o.spec), "build spec");
        const { problems: p, warnings } = validateBuildSpec(spec, io.repo);
        for (const x of warnings) err(`warning: ${x}`);
        if (p.length) throw new UsageError(`the build spec was refused for these reasons:${p.map((x) => "\n  - " + x).join("")}`);
        const ops = buildOperations(spec, CUST);
        const validate = req("POST", `customers/${CUST}/googleAds:mutate`, { mutateOperations: ops, validateOnly: true }, "Google checks the whole batch; nothing is created");
        const create = req("POST", `customers/${CUST}/googleAds:mutate`, { mutateOperations: ops }, "one atomic batch: everything or nothing; the campaign PAUSED");
        const readBack = q("SELECT campaign.id, campaign.name, campaign.status, campaign.serving_status, campaign_budget.amount_micros FROM campaign WHERE campaign.resource_name = '<the new campaign>'");
        return { steps: o.validate ? [validate] : [validate, create, readBack], exec: () => execBuild(spec, validate, create) };
      }
      case "pause": {
        const r = checkResource(o.resource, ["campaigns", "adGroups", "adGroupAds"]);
        const step = req("POST", `customers/${CUST}/${r.kind}:mutate`, { operations: [{ update: { resourceName: o.resource, status: "PAUSED" }, updateMask: "status" }] });
        return { steps: [step], exec: () => execStatus("pause", step, "PAUSED") };
      }
      case "enable": {
        checkResource(o.resource, ["campaigns"]);
        if (!str(o.go)) throw new UsageError('refused: enable needs --go "<the Owner\'s words, quoted exactly>" from the same message as the spend statement. Nothing was sent.');
        if (!isKnown(o.resource)) throw new UsageError(`refused: ${o.resource} was not created or recorded by this folder (no build ledger, no note names it). Read it with report or search and record it in the plan first.`);
        const step = req("POST", `customers/${CUST}/campaigns:mutate`, { operations: [{ update: { resourceName: o.resource, status: "ENABLED" }, updateMask: "status" }] });
        return { steps: [q(`SELECT campaign.id, campaign.name, campaign.status, campaign.end_date_time, campaign_budget.amount_micros FROM campaign WHERE campaign.resource_name = '${o.resource}'`), step], exec: () => execEnable(step) };
      }
      case "budget": {
        checkResource(o.resource, ["campaignBudgets"]);
        const amount = Number(o.amount);
        if (!(amount > 0)) throw new UsageError("budget needs --amount <the new daily budget, in the account currency>");
        if (!isKnown(o.resource)) throw new UsageError(`refused: ${o.resource} was not created or recorded by this folder. Record it in the plan first.`);
        const lim = googleDailyLimit(io.repo);
        if (lim && amount > lim.limit) throw new UsageError(`refused: ${amount} is above ${lim.limit}, half the Google share (${lim.share} %) of the daily cap ${lim.dailyCap} in config/goals.md. A cap change is the Owner's, in writing.`);
        const step = req("POST", `customers/${CUST}/campaignBudgets:mutate`, { operations: [{ update: { resourceName: o.resource, amountMicros: String(toMicros(amount)) }, updateMask: "amount_micros" }] });
        return { steps: [q(`SELECT campaign_budget.amount_micros, campaign_budget.name FROM campaign_budget WHERE campaign_budget.resource_name = '${o.resource}'`), step], exec: () => execBudget(step, amount) };
      }
      case "mutate": {
        if (!o.spec) throw new UsageError("mutate needs --spec <file.json> ({\"operations\": [ googleAds:mutate operations ]}; see docs/google-ads.md)");
        const spec = readJsonFile(resolve(o.spec), "mutate spec");
        return mutatePlan(Array.isArray(spec) ? spec : spec.operations, `mutate ${path.basename(o.spec)}`);
      }
      case "service": {
        const sp = checkServicePath(o.path, CUST);
        if (sp.problem) throw new UsageError(sp.problem);
        const method = String(o.method || (o.body ? "POST" : /:listAccessibleCustomers$/.test(sp.path) ? "GET" : "POST")).toUpperCase();
        if (!["GET", "POST"].includes(method)) throw new UsageError("--method must be GET or POST");
        const body = o.body ? readJsonFile(resolve(o.body), "service body") : method === "POST" ? {} : undefined;
        return servicePlan(sp, method, body, `service ${sp.path}`);
      }
      case "recipe list":
        return { steps: [], exec: execRecipeList };
      case "recipe show":
      case "recipe run": {
        const name = pos[2];
        if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) throw new UsageError("a recipe name is lower case with dashes (see: recipe list)");
        const recipe = readJsonFile(path.join(RECIPES_DIR, `${name}.json`), `recipe ${name}`);
        if (key === "recipe show") return { steps: [], exec: () => execRecipeShow(name, recipe) };
        const vars = { ...(isObj(recipe.defaults) ? recipe.defaults : {}), ...(o.vars ? readJsonFile(resolve(o.vars), "vars file") : {}) };
        for (const pair of o.set || []) {
          const eq = pair.indexOf("=");
          if (eq < 1) throw new UsageError(`--set takes NAME=value (got "${pair}")`);
          const k = pair.slice(0, eq).trim();
          let v = pair.slice(eq + 1);
          if (v.startsWith("@")) {
            const file = resolve(v.slice(1));
            if (!fs.existsSync(file)) throw new UsageError(`--set ${k}: file not found: ${file}`);
            v = fs.readFileSync(file).toString("base64");
          } else { try { v = JSON.parse(v); } catch { /* text */ } }
          vars[k] = v;
        }
        vars.CUSTOMER = CUST;
        const { recipe: filled, missing } = fillRecipe(recipe, vars);
        if (missing.length) throw new UsageError(`recipe ${name} needs: ${missing.map((m) => `${m} (${(recipe.vars || {})[m] || "see recipe show"})`).join("; ")}`);
        if (recipe.kind === "service") {
          const sp = checkServicePath(filled.path, CUST);
          if (sp.problem) throw new UsageError(sp.problem);
          return servicePlan(sp, String(recipe.method || "POST").toUpperCase(), filled.body, `recipe ${name}`);
        }
        if (recipe.kind !== "mutate") throw new UsageError(`recipe ${name}: "kind" must be "mutate" or "service"`);
        return mutatePlan(filled.operations, `recipe ${name}`);
      }
      default:
        throw new UsageError(`unknown subcommand: ${key}`);
    }
  }

  // ---------- dry run ----------
  if (o["dry-run"]) {
    human(`DRY RUN (no network): ${key}; Google Ads account ${CUST}${loginCustomer ? `, through manager ${loginCustomer}` : ""}, API ${version}, login: ${refresh ? "present" : "MISSING"}`);
    for (const p of problems) human(`warning: ${p}`);
    plan.steps.forEach((s, i) => {
      const url = s.path.startsWith("https://") ? s.path : `https://${ADS_HOST}/${version}/${s.path}`;
      human(`${i + 1}. ${s.method} ${url}`);
      if (!s.path.startsWith("https://")) human("   Authorization: Bearer [token]");
      if (s.body !== undefined) human(`   ${JSON.stringify(s.body, null, 2).split("\n").join("\n   ")}`);
      if (s.note) human(`   (${s.note})`);
    });
    if (o.json) say(JSON.stringify({ dry_run: true, command: key, version, steps: plan.steps }, null, 2));
    return 0;
  }
  if (problems.length) { for (const p of problems) err(p); return 2; }

  // ---------- HTTP ----------
  async function send(method, url, headers, body, label) {
    let res;
    try { res = await io.fetch(url, { method, headers, body }); }
    catch (e) { throw new AdsError(scrub(`network error on ${method} ${label}: ${e.message || e}`)); }
    const text = await res.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    if (!res.ok || (json && json.error)) {
      const d = describeError(json, res.status);
      throw new AdsError(scrub(`Google ${method} ${label} -> HTTP ${res.status}${d.codes.length ? ` (${d.codes.join(", ")})` : ""}: ${d.message}`), { status: res.status, codes: d.codes, detail: d.message });
    }
    return json;
  }
  let accessToken = "";
  async function token() {
    if (accessToken) return accessToken;
    let form, url = TOKEN_URL;
    if (serviceKey) {   // the service account: a signed assertion, no refresh token
      const assertion = serviceAssertion(serviceKey, io.now().getTime());
      scrub.add(assertion);
      form = new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion });
      url = serviceKey.tokenUri;
    } else form = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh, client_id: clientId, client_secret: clientSecret });
    const r = await send("POST", url, { "Content-Type": "application/x-www-form-urlencoded" }, form.toString(), "oauth2/token");
    if (!r.access_token) throw new AdsError(serviceKey ? "Google returned no access token for the service account: create a new key with google-cloud-setup.mjs run" : "Google returned no access token: run login again");
    scrub.add(r.access_token);
    accessToken = r.access_token;
    return accessToken;
  }
  async function call(method, p, body, { login = true } = {}) {
    const headers = { Authorization: `Bearer ${await token()}` };
    if (devToken) headers["developer-token"] = devToken;
    if (login && loginCustomer) headers["login-customer-id"] = loginCustomer;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    return send(method, `https://${ADS_HOST}/${version}/${p}`, headers, body === undefined ? undefined : JSON.stringify(body), `/${p}`);
  }
  async function searchAll(p, query, opt) {
    const results = [];
    let pageToken;
    let pages = 0;
    do {
      if (pages >= MAX_PAGES) throw new AdsError(`stopped after ${MAX_PAGES} pages; narrow the query`);
      const r = await call("POST", p, pageToken ? { query, pageToken } : { query }, opt);
      if (Array.isArray(r.results)) results.push(...r.results);
      pageToken = r.nextPageToken;
      pages++;
    } while (pageToken);
    return results;
  }
  const searchCustomer = (query, opt) => searchAll(`customers/${customer}/googleAds:search`, query, opt);
  function appendLedger(entry) {
    const file = path.join(io.repo, "creatives", "uploads", `${today()}-google-ads.json`);
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
  const entryFor = (command, summary) => ({ at: io.now().toISOString(), tool: "google-ads", command, customer, summary, resources: [], status: "FAILED" });
  function goLogRow({ objects, daily, end }) {
    const file = path.join(io.repo, "memory", "money", "go-log.md");
    if (!fs.existsSync(file)) return null;
    const lim = googleDailyLimit(io.repo);
    const words = String(o.go).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
    const now = io.now();
    const time = `${now.toISOString().slice(11, 16)} UTC`;
    const row = `| ${today()} | ${time} | ${o.channel || "chat"} | "${words}" | ${objects.map((x) => "`" + x + "`").join(", ")} | ${daily} | ${lim ? `daily ${lim.dailyCap}, Google share ${lim.share} %` : "see config/goals.md"} | ${end || "none"} | google-ads.mjs (main session) |`;
    let text = fs.readFileSync(file, "utf8");
    if (!text.endsWith("\n")) text += "\n";
    text = text.replace(/^as_of:.*$/m, `as_of: ${now.toISOString()}`);
    fs.writeFileSync(file, text + row + "\n");
    return path.relative(io.repo, file).split(path.sep).join("/");
  }

  // ---------- executors ----------
  async function execLogin() {
    if (keyFile) { human("This folder signs in with a service account (GOOGLE_ADS_JSON_KEY_FILE in .env): no login is needed. Run check."); return 0; }
    if (!clientId || !clientSecret) { for (const p of problems) err(p); return 2; }
    const verifier = crypto.randomBytes(48).toString("base64url");
    const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
    const state = crypto.randomBytes(16).toString("hex");
    const server = http.createServer();
    const got = new Promise((resolveCode, rejectCode) => {
      const timer = setTimeout(() => rejectCode(new AdsError(`no answer from the browser within ${Math.round(io.loginWaitMs / 60000)} minutes; run login again`)), io.loginWaitMs);
      server.on("request", (rq, rs) => {
        const u = new URL(rq.url, "http://127.0.0.1");
        if (u.pathname !== "/") { rs.writeHead(404); rs.end(); return; }
        const fail = u.searchParams.get("error");
        const code = u.searchParams.get("code");
        const ok = !fail && code && u.searchParams.get("state") === state;
        rs.writeHead(ok ? 200 : 400, { "Content-Type": "text/html; charset=utf-8" });
        rs.end(ok ? "<h2>Signed in. You can close this tab and go back to Claude.</h2>" : "<h2>The sign-in did not finish. Go back to Claude.</h2>");
        clearTimeout(timer);
        if (ok) resolveCode(code);
        else rejectCode(new AdsError(fail ? `Google answered "${fail}" (the Owner did not click Allow, or the account has no access)` : "the browser came back without a valid code"));
      });
    });
    await new Promise((r) => server.listen(o.port ? Number(o.port) : 0, "127.0.0.1", r));
    const redirect = `http://127.0.0.1:${server.address().port}`;
    const url = new URL(AUTH_URL);
    for (const [k, v] of Object.entries({ client_id: clientId, redirect_uri: redirect, response_type: "code", scope: SCOPE, access_type: "offline",
      prompt: "consent", state, code_challenge: challenge, code_challenge_method: "S256" })) url.searchParams.set(k, v);
    human("Opening Google's sign-in page. The Owner signs in with the Google user that can open the company's Google Ads account and clicks Allow.");
    human(`If no browser opens, open this address yourself: ${url}`);
    if (!io.env.HARNESS_NO_BROWSER) io.openBrowser(url.toString());
    let code;
    try { code = await got; } finally { server.close(); }
    scrub.add(code);
    const form = new URLSearchParams({ grant_type: "authorization_code", code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirect, code_verifier: verifier });
    const r = await send("POST", TOKEN_URL, { "Content-Type": "application/x-www-form-urlencoded" }, form.toString(), "oauth2/token");
    if (r.access_token) scrub.add(r.access_token);
    if (!r.refresh_token) throw new AdsError("Google returned no refresh token (the consent was not offline); run login again");
    scrub.add(r.refresh_token);
    const before = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : "";
    writeEnvAtomic(envFile, setEnvLine(before, "GOOGLE_ADS_REFRESH_TOKEN", r.refresh_token));
    const granted = String(r.scope || "").split(/\s+/);
    if (o.json) say(JSON.stringify({ saved: "GOOGLE_ADS_REFRESH_TOKEN", length: r.refresh_token.length, scope_ok: granted.includes(SCOPE) }));
    human(`GOOGLE_ADS_REFRESH_TOKEN saved to .env (${r.refresh_token.length} characters). Next: node creatives/tools/google-ads.mjs accounts`);
    if (r.scope && !granted.includes(SCOPE)) { err("warning: Google did not grant the Google Ads scope; add it on the consent screen (Data access) and run login again"); return 2; }
    return 0;
  }
  async function execCheck() {
    await token();
    const list = await call("GET", "customers:listAccessibleCustomers", undefined, { login: false });
    const names = (list.resourceNames || []).map((r) => r.split("/").pop());
    const [c] = await searchCustomer(plan.steps[2].body.query);
    const cu = (c && c.customer) || {};
    let conv = [];
    try { conv = await searchCustomer(plan.steps[3].body.query); } catch { /* reported below as no data */ }
    const reachable = names.includes(customer) || Boolean(loginCustomer);
    const out = { login: "ok", auth: serviceKey ? "service_account" : "oauth_client", service_account: serviceKey ? serviceKey.email : null, accessible: names.length, customer: { id: cu.id, name: cu.descriptiveName, currency: cu.currencyCode, time_zone: cu.timeZone,
      status: cu.status, manager: cu.manager, test_account: cu.testAccount }, through_manager: loginCustomer || null, conversion_actions: conv.length, bound: bound || null };
    if (o.json) say(JSON.stringify(out, null, 2));
    human(serviceKey
      ? `login           : ok (service account ${serviceKey.email}; ${names.length} account(s) it was added to)`
      : `login           : ok (the refresh token works; ${names.length} account(s) reachable)`);
    if (serviceKey && !names.includes(customer) && !loginCustomer) human(`                  ${customer} has not added the service account yet: Google Ads > Admin > Access and security > + > ${serviceKey.email} (Standard)`);
    human(`google ads      : ${customer} "${cu.descriptiveName || ""}", status ${cu.status || "?"}, ${cu.currencyCode || "?"}, ${cu.timeZone || "?"}${cu.testAccount ? " (TEST ACCOUNT)" : ""}${cu.manager ? " (a MANAGER account: choose a client account)" : ""}`);
    human(`reached         : ${loginCustomer ? `through manager ${loginCustomer}` : reachable ? "directly" : "not in the list of accounts this login reaches"}`);
    human(`config binding  : ${bound ? `config/accounts.md names ${bound} (matches)` : "config/accounts.md has no google_ads_customer_id yet: write it in /connect"}`);
    human(`conversions     : ${conv.length} enabled conversion action(s)${conv.length ? "" : " (none yet: a Search campaign that maximizes conversions needs one; see conversions create)"}`);
    human(`api access      : a production read worked${cu.testAccount ? " on a test account only" : ""}, so the project's access level is ${cu.testAccount ? "at least Test" : "Explorer or higher"}`);
    if (cu.manager) return 2;
    if (cu.status && cu.status !== "ENABLED") { err(fixList(["CUSTOMER_NOT_ENABLED"], "")); return 2; }
    return 0;
  }
  async function execAccounts() {
    await token();
    const list = await call("GET", "customers:listAccessibleCustomers", undefined, { login: false });
    const ids = (list.resourceNames || []).map((r) => r.split("/").pop());
    const rows = [];
    for (const id of ids) {
      try {
        const [r] = await searchAll(`customers/${id}/googleAds:search`, plan.steps[1].body.query, { login: false });
        const cu = (r && r.customer) || {};
        rows.push({ id, name: cu.descriptiveName || "", currency: cu.currencyCode || "", manager: Boolean(cu.manager), test: Boolean(cu.testAccount), status: cu.status || "" });
      } catch (e) { rows.push({ id, name: "", currency: "", manager: "", test: "", status: `error: ${(e.codes || []).join(", ") || e.message}` }); }
    }
    if (o.json) { say(JSON.stringify({ accounts: rows }, null, 2)); return 0; }
    say(table(["id", "name", "currency", "manager", "test", "status"], rows.map((r) => [r.id, r.name, r.currency, r.manager, r.test, r.status])));
    say(`\n${rows.length} account(s). Pick the company's (not a manager) and set GOOGLE_ADS_CUSTOMER_ID; when it is reached through a manager, set GOOGLE_ADS_LOGIN_CUSTOMER_ID to the manager.`);
    return 0;
  }
  async function execSearch(step, isReport = false) {
    const results = await searchCustomer(step.body.query);
    const rows = isReport ? reportRows(results) : results.map((r) => flattenRow(r));
    const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    if (o.out) {
      const out = resolve(o.out);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, toCsv(headers, rows), "utf8");
      human(`${rows.length} row(s), ${headers.length} column(s) written to ${out}`);
    }
    if (o.json) say(JSON.stringify({ results }, null, 2));
    else if (!o.out) {
      say(table(headers, rows.map((r) => headers.map((h) => r[h]))));
      say(`\n${rows.length} row(s).${isReport ? " Money in the account currency." : ""}`);
    }
    return 0;
  }
  async function execGeo(step) {
    const r = await call("POST", step.path, step.body, { login: false });
    const list = (r.geoTargetConstantSuggestions || []).map((s) => ({ ...(s.geoTargetConstant || {}), reach: s.reach }));
    if (o.json) { say(JSON.stringify(r, null, 2)); return 0; }
    say(table(["id", "name", "type", "country", "canonical name", "reach"], list.map((g) => [g.id, g.name, g.targetType, g.countryCode, g.canonicalName, g.reach])));
    say(`\n${list.length} place(s) for "${o.q}". Use the id in the spec's locations.`);
    return 0;
  }
  async function execLanguages(step) {
    const results = await searchCustomer(step.body.query);
    const want = str(o.q).toLowerCase();
    const rows = results.map((r) => r.languageConstant || {}).filter((l) => !want || String(l.name).toLowerCase().includes(want) || String(l.code).toLowerCase() === want);
    if (o.json) { say(JSON.stringify({ languages: rows }, null, 2)); return 0; }
    say(table(["id", "name", "code"], rows.map((l) => [l.id, l.name, l.code])));
    say(`\n${rows.length} language(s). Use the id in the spec's languages.`);
    return 0;
  }
  async function execConversions(step) {
    const results = await searchCustomer(step.body.query);
    const rows = results.map((r) => r.conversionAction || {});
    if (o.tags) {
      const out = resolve(o.out);
      const lines = [`# Request: the Google tag and conversion snippets`, "", `Needs product team (or Needs Owner when config/product-team.md says there is none). Generated ${today()} by google-ads.mjs for Google Ads account ${customer}.`,
        "Install the global site tag on every destination page, and the event snippet where the conversion happens (the thank-you state of the form). Consent gating follows config/accounts.md, as for the Meta pixel.", ""];
      for (const a of rows) {
        lines.push(`## ${a.name} (${a.category}, id ${a.id})`, "");
        for (const t of a.tagSnippets || []) {
          lines.push(`### ${t.type || "snippet"} (${t.pageFormat || ""})`, "", "Global site tag:", "", "```html", t.globalSiteTag || "", "```", "", "Event snippet:", "", "```html", t.eventSnippet || "", "```", "");
        }
      }
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
      human(`the tag snippets of ${rows.length} conversion action(s) written to ${out}`);
    }
    if (o.json) { say(JSON.stringify({ conversion_actions: rows }, null, 2)); return 0; }
    say(table(["id", "name", "status", "category", "type", "counting"], rows.map((a) => [a.id, a.name, a.status, a.category, a.type, a.countingType])));
    say(`\n${rows.length} conversion action(s).`);
    return 0;
  }
  async function execSimpleWrite(command, step, summary) {
    const entry = entryFor(command, summary);
    try {
      const r = await call("POST", step.path, step.body);
      entry.resources = (r.results || []).map((x) => x.resourceName).filter(Boolean);
      entry.status = entry.resources.length ? "ok" : "no resource returned";
      const ledger = appendLedger(entry);
      if (entry.resources.length) saveKnown(io.repo, customer, entry.resources);
      if (o.json) say(JSON.stringify(r, null, 2));
      human(`${command}: ${entry.resources.join(", ") || "nothing returned"}`);
      human(`ledger: ${ledger}`);
      return entry.resources.length ? 0 : 1;
    } catch (e) { entry.error = scrub(e.message); appendLedger(entry); throw e; }
  }
  async function execBuild(spec, validate, create) {
    human(`build: ${validate.body.mutateOperations.length} operations for the Search campaign "${spec.campaign.name}" (PAUSED), Google Ads account ${customer}`);
    await call("POST", validate.path, validate.body);
    human("validateOnly: Google accepted the whole batch (nothing created yet)");
    if (o.validate) return 0;
    const entry = entryFor("build", { type: "SEARCH", campaign: spec.campaign.name, daily_budget: spec.campaign.daily_budget, operations: create.body.mutateOperations.length });
    let r;
    try { r = await call("POST", create.path, create.body); }
    catch (e) { entry.error = scrub(e.message); appendLedger(entry); throw e; }
    for (const x of r.mutateOperationResponses || []) for (const v of Object.values(x)) if (v && v.resourceName) entry.resources.push(v.resourceName);
    entry.status = entry.resources.length ? "ok" : "no resources returned";
    const ledger = appendLedger(entry);
    saveKnown(io.repo, customer, entry.resources);
    const campaign = entry.resources.find((x) => /\/campaigns\/\d+$/.test(x));
    const budget = entry.resources.find((x) => /\/campaignBudgets\/\d+$/.test(x));
    let live = {};
    if (campaign) {
      const [row] = await searchCustomer(`SELECT campaign.id, campaign.name, campaign.status, campaign.serving_status, campaign_budget.amount_micros FROM campaign WHERE campaign.resource_name = '${campaign}'`);
      live = row || {};
    }
    const status = live.campaign && live.campaign.status;
    if (o.json) say(JSON.stringify({ resources: entry.resources, campaign, budget, live }, null, 2));
    human(`created ${entry.resources.length} resource(s). Campaign ${campaign} "${spec.campaign.name}", read back: status ${status || "?"}, daily budget ${live.campaignBudget ? fromMicros(live.campaignBudget.amountMicros) : "?"}`);
    human(`budget resource: ${budget}`);
    human(`ledger: ${ledger}. Write the resource names into the plan and the campaign note now.`);
    if (status && status !== "PAUSED") { err(`WARNING: the campaign reads back as ${status}, not PAUSED. Pause it now: node creatives/tools/google-ads.mjs pause --resource ${campaign}`); return 1; }
    return 0;
  }
  async function execStatus(command, step, want) {
    const entry = entryFor(command, { resource: o.resource, status: want });
    try {
      const r = await call("POST", step.path, step.body);
      entry.resources = (r.results || []).map((x) => x.resourceName).filter(Boolean);
      entry.status = "ok";
      const ledger = appendLedger(entry);
      if (o.json) say(JSON.stringify(r, null, 2));
      human(`${o.resource}: ${want}`);
      human(`ledger: ${ledger}`);
      return 0;
    } catch (e) { entry.error = scrub(e.message); appendLedger(entry); throw e; }
  }
  async function execEnable(step) {
    const [before] = await searchCustomer(plan.steps[0].body.query);
    if (!before) throw new AdsError(`${o.resource} was not found in Google Ads account ${customer}`);
    const daily = before.campaignBudget ? fromMicros(before.campaignBudget.amountMicros) : "?";
    const end = before.campaign && before.campaign.endDateTime;
    const lim = googleDailyLimit(io.repo);
    if (lim && Number(daily) > lim.limit) throw new UsageError(`refused: the campaign's daily budget ${daily} is above ${lim.limit}, half the Google share of the daily cap in config/goals.md`);
    const entry = entryFor("enable", { resource: o.resource, daily, go: o.go });
    try {
      await call("POST", step.path, step.body);
      entry.status = "ok";
      entry.resources = [o.resource];
    } catch (e) { entry.error = scrub(e.message); appendLedger(entry); throw e; }
    const ledger = appendLedger(entry);
    const goLog = goLogRow({ objects: [o.resource], daily, end });
    const [after] = await searchCustomer(plan.steps[0].body.query.replace("campaign.end_date_time,", "campaign.serving_status, campaign.end_date_time,"));
    const st = after && after.campaign ? `${after.campaign.status}, serving ${after.campaign.servingStatus || "?"}` : "?";
    if (o.json) say(JSON.stringify({ resource: o.resource, read_back: after || null, go_log: goLog }, null, 2));
    human(`${o.resource} "${before.campaign.name}": ENABLED. Read back: ${st}. Daily budget ${daily}, end ${end || "none"}.`);
    human(`ledger: ${ledger}; go log: ${goLog || "memory/money/go-log.md not found: write the row by hand"}`);
    human("Then: report --level ad (approval status) after review, and the session note.");
    return 0;
  }
  async function execBudget(step, amount) {
    const [before] = await searchCustomer(plan.steps[0].body.query);
    if (!before || !before.campaignBudget) throw new AdsError(`${o.resource} was not found in Google Ads account ${customer}`);
    const current = fromMicros(before.campaignBudget.amountMicros);
    if (amount > current && !str(o.go)) throw new UsageError(`refused: raising the daily budget from ${current} to ${amount} needs --go "<the Owner's words>". Nothing was sent.`);
    if (amount > current * (1 + MAX_RAISE) + 1e-9) throw new UsageError(`refused: ${current} to ${amount} is a raise of more than ${MAX_RAISE * 100} % in one step (the scaling rule: at most +20 %, 48 to 72 hours apart). The most this step can be is ${Math.floor(current * (1 + MAX_RAISE) * 100) / 100}.`);
    const entry = entryFor("budget", { resource: o.resource, from: current, to: amount, go: o.go || null });
    try { await call("POST", step.path, step.body); entry.status = "ok"; entry.resources = [o.resource]; }
    catch (e) { entry.error = scrub(e.message); appendLedger(entry); throw e; }
    const ledger = appendLedger(entry);
    const goLog = amount > current ? goLogRow({ objects: [o.resource], daily: amount, end: "" }) : null;
    if (o.json) say(JSON.stringify({ resource: o.resource, from: current, to: amount, go_log: goLog }, null, 2));
    human(`${o.resource}: daily budget ${current} -> ${amount}`);
    human(`ledger: ${ledger}${goLog ? `; go log: ${goLog}` : ""}`);
    return 0;
  }

  async function execMutate(g, validate, write, label) {
    // the live checks first: budget amounts against their current value and the caps, parents' live status
    const lim = googleDailyLimit(io.repo);
    const goNeeded = [...g.needsGo];
    for (const b of g.budgetUpdates) {
      const amount = b.micros / 1_000_000;
      if (lim && amount > lim.limit) throw new UsageError(`refused: a daily budget of ${amount} is above ${lim.limit}, half the Google share (${lim.share} %) of the daily cap ${lim.dailyCap} in config/goals.md`);
      if (b.create) continue;
      const [row] = await searchCustomer(`SELECT campaign_budget.amount_micros FROM campaign_budget WHERE campaign_budget.resource_name = '${b.resource}'`);
      const current = row && row.campaignBudget ? fromMicros(row.campaignBudget.amountMicros) : null;
      if (current === null) throw new AdsError(`${b.resource} was not found in Google Ads account ${customer}`);
      if (amount > current) {
        if (amount > current * (1 + MAX_RAISE) + 1e-9) throw new UsageError(`refused: ${b.resource} from ${current} to ${amount} is a raise of more than ${MAX_RAISE * 100} % in one step`);
        goNeeded.push(`${b.resource}: daily budget ${current} -> ${amount}`);
      }
    }
    for (const p of g.publishUnder) {
      const isGroup = /\/adGroups\//.test(p.parent);
      const q = isGroup
        ? `SELECT campaign.status, ad_group.status FROM ad_group WHERE ad_group.resource_name = '${p.parent}'`
        : `SELECT campaign.status FROM campaign WHERE campaign.resource_name = '${p.parent}'`;
      const [row] = await searchCustomer(q);
      const live = row && row.campaign && row.campaign.status === "ENABLED" && (!isGroup || (row.adGroup && row.adGroup.status === "ENABLED"));
      if (live) goNeeded.push(`a new ${p.kind.replace(/Operation$/, "")} ENABLED in the live ${p.parent} (publishes at once; set "status": "PAUSED" to add it paused)`);
    }
    if (goNeeded.length && !str(o.go)) throw new UsageError(`refused: ${label} needs the Owner's go, quoted exactly in --go "<words>":${goNeeded.map((x) => "\n  - " + x).join("")}\nNothing was sent.`);
    human(`${label}: ${g.ops.length} operation(s) on Google Ads account ${customer}${g.campaignsCreated.length ? `; ${g.campaignsCreated.length} campaign(s) created PAUSED` : ""}`);
    await call("POST", validate.path, validate.body);
    human("validateOnly: Google accepted the whole batch (nothing changed yet)");
    if (o.validate) return 0;
    const entry = entryFor(label, { operations: g.ops.length, kinds: [...new Set(g.ops.flatMap(opKind))], go: goNeeded.length ? o.go : null });
    let r;
    try { r = await call("POST", write.path, write.body); }
    catch (e) { entry.error = scrub(e.message); appendLedger(entry); throw e; }
    for (const x of r.mutateOperationResponses || []) for (const v of Object.values(x)) if (v && v.resourceName) entry.resources.push(v.resourceName);
    entry.status = "ok";
    const ledger = appendLedger(entry);
    saveKnown(io.repo, customer, entry.resources);
    const goLog = goNeeded.length ? goLogRow({ objects: entry.resources.length ? entry.resources : g.existing, daily: "see the ledger", end: "" }) : null;
    const created = entry.resources.filter((x) => /\/campaigns\/\d+$/.test(x));
    let notPaused = [];
    if (created.length && g.campaignsCreated.length) {
      const rows = await searchCustomer(`SELECT campaign.resource_name, campaign.status FROM campaign WHERE campaign.resource_name IN (${created.map((c) => `'${c}'`).join(", ")})`);
      notPaused = rows.filter((x) => x.campaign && x.campaign.status !== "PAUSED").map((x) => x.campaign.resourceName);
    }
    if (o.json) say(JSON.stringify({ resources: entry.resources, ledger, go_log: goLog }, null, 2));
    human(`done: ${entry.resources.length} resource(s)${entry.resources.length ? ":\n  " + entry.resources.join("\n  ") : ""}`);
    human(`ledger: ${ledger}${goLog ? `; go log: ${goLog}` : ""}. Write the resource names into the plan and the campaign note now.`);
    if (notPaused.length) { err(`WARNING: ${notPaused.join(", ")} read back not PAUSED: pause now with google-ads.mjs pause --resource <it>`); return 1; }
    return 0;
  }
  async function execService(step, sp, label) {
    const login = !/listAccessibleCustomers|^geoTargetConstants/.test(sp.path);
    if (sp.read) {
      const r = await call(step.method, step.path, step.method === "GET" ? undefined : step.body, { login });
      if (o.out) {
        const out = resolve(o.out);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, JSON.stringify(r, null, 2) + "\n");
        human(`the answer written to ${out}`);
      } else say(JSON.stringify(r, null, 2));
      return 0;
    }
    const entry = entryFor(label, { path: sp.path, method: step.method, go: o.go });
    let r;
    try { r = await call(step.method, step.path, step.method === "GET" ? undefined : step.body, { login }); }
    catch (e) { entry.error = scrub(e.message); appendLedger(entry); throw e; }
    entry.status = "ok";
    const walk = (v) => { if (Array.isArray(v)) v.forEach(walk); else if (isObj(v)) { if (typeof v.resourceName === "string") entry.resources.push(v.resourceName); Object.values(v).forEach(walk); } };
    walk(r);
    const ledger = appendLedger(entry);
    if (entry.resources.length) saveKnown(io.repo, customer, entry.resources);
    const goLog = goLogRow({ objects: entry.resources.length ? entry.resources : [sp.path], daily: "n/a", end: "" });
    say(JSON.stringify(r, null, 2));
    human(`ledger: ${ledger}; go log: ${goLog || "memory/money/go-log.md not found"}`);
    return 0;
  }
  function execRecipeList() {
    const files = fs.existsSync(RECIPES_DIR) ? fs.readdirSync(RECIPES_DIR).filter((n) => n.endsWith(".json")).sort() : [];
    const rows = files.map((n) => {
      let r = {};
      try { r = JSON.parse(fs.readFileSync(path.join(RECIPES_DIR, n), "utf8")); } catch { r = { description: "(not valid JSON)" }; }
      return [n.replace(/\.json$/, ""), r.kind || "?", r.description || ""];
    });
    if (o.json) { say(JSON.stringify(rows.map(([name, kind, description]) => ({ name, kind, description })), null, 2)); return 0; }
    say(table(["recipe", "kind", "what it does"], rows));
    say(`\n${rows.length} recipe(s) in creatives/tools/google-ads-recipes/. A new one is a JSON file there (see docs/google-ads.md).`);
    return 0;
  }
  function execRecipeShow(name, recipe) {
    if (o.json) { say(JSON.stringify(recipe, null, 2)); return 0; }
    say(`${name} (${recipe.kind}): ${recipe.description || ""}`);
    if (recipe.notes) say(`notes: ${recipe.notes}`);
    const vars = Object.entries(recipe.vars || {});
    say(vars.length ? "variables (--set NAME=value; @file for an image):" : "no variables");
    for (const [k, v] of vars) say(`  ${k.padEnd(22)} ${v}${recipe.defaults && k in recipe.defaults ? ` (default ${JSON.stringify(recipe.defaults[k])})` : ""}`);
    return 0;
  }

  try {
    return await plan.exec();
  } catch (e) {
    if (e instanceof UsageError) { err(e.message); return 2; }
    err(scrub(e.message || String(e)));
    const fix = e instanceof AdsError ? fixList(e.codes || [], e.detail || e.message) : null;
    if (fix) err(fix);
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
  run(process.argv.slice(2)).then(
    (code) => { process.exitCode = code; },
    (e) => { process.stderr.write(scrubText(e && e.message ? e.message : String(e)) + "\n"); process.exitCode = 1; },
  );
}
