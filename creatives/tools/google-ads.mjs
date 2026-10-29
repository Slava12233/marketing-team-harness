#!/usr/bin/env node
// google-ads.mjs: the harness's Google Ads tool on the Google Ads REST API: the login (OAuth, the refresh token
// written into .env unseen), reads (GAQL search and the baseline report), ids for specs (places, languages),
// conversion actions, and Search campaigns built PAUSED from a spec file, checked by Google first (validateOnly).
// Enabling a campaign or raising a budget needs the Owner's words in --go and is written to the go log.
//
// Usage (from the repository root; Node 20+, no dependencies). Every subcommand takes --dry-run (prints the exact
// requests with the secrets shown as [token]; no network) and --json (raw JSON to stdout; human lines go to stderr):
//   node creatives/tools/google-ads.mjs login [--port <n>]
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
//
// Configuration, from the repository-root .env only (template: .env.example); no other .env key is read:
//   GOOGLE_ADS_CLIENT_ID          required; the OAuth client (Desktop type) of the company's own Google Cloud project.
//   GOOGLE_ADS_CLIENT_SECRET      required; that client's secret (written by env-set.mjs --from-clipboard, never seen).
//   GOOGLE_ADS_REFRESH_TOKEN      required for every call but login; written by login, never printed.
//   GOOGLE_ADS_CUSTOMER_ID        required; the Google Ads account (10 digits, dashes optional). Every account path is
//                                 built from it; it must match google_ads_customer_id in config/accounts.md.
//   GOOGLE_ADS_LOGIN_CUSTOMER_ID  optional; the manager account (MCC) the login reaches the account through.
//   GOOGLE_ADS_DEVELOPER_TOKEN    optional, legacy; sent as the developer-token header only when set.
//   GOOGLE_ADS_API_VERSION        optional; default v26.
// Secrets are never printed and never put in a URL; every printed line is scrubbed.
//
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
export const ENV_KEYS = ["GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_CUSTOMER_ID",
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
function writeEnvAtomic(file, text) {
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
const VALUED = new Set(["port", "gaql", "out", "level", "range", "since", "until", "q", "country", "locale", "spec", "resource", "go", "channel", "amount"]);
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
      o[k] = v;
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
    return "The login is no longer valid (expired, revoked, or the OAuth client changed). Run: node creatives/tools/google-ads.mjs login (the Owner clicks Allow). A client in Testing mode on the consent screen expires its logins after 7 days: publish the consent screen (Google Auth Platform > Audience > Publish app).";
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
  const grouped = pos[0] === "conversions";
  const key = grouped ? `${pos[0]} ${pos[1] || ""}`.trim() : pos[0];
  if (!ALLOWED[key]) { err(`unknown subcommand: ${pos.join(" ")} (see --help)`); return 2; }
  if (pos.length > (grouped ? 2 : 1)) { err(`unexpected argument: ${pos.slice(grouped ? 2 : 1).join(" ")} (see --help)`); return 2; }
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
  if (!clientId || !clientSecret) {
    problems.push(envExists
      ? "GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET must both be set in .env: copy each from the Cloud Console (Google Auth Platform > Clients) and run node creatives/tools/env-set.mjs --from-clipboard <NAME> (never paste a value in chat)."
      : noEnv);
  }
  const needsAccount = !["login", "accounts", "geo-search"].includes(key);
  if (key !== "login" && !refresh) problems.push("GOOGLE_ADS_REFRESH_TOKEN is not set: run node creatives/tools/google-ads.mjs login first (the Owner clicks Allow in the browser).");
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
    return namedInVault(io.repo, [r, r.split("/").pop()]);
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
          req("POST", TOKEN_URL, { grant_type: "refresh_token", refresh_token: "[token]" }),
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
    const form = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh, client_id: clientId, client_secret: clientSecret });
    const r = await send("POST", TOKEN_URL, { "Content-Type": "application/x-www-form-urlencoded" }, form.toString(), "oauth2/token");
    if (!r.access_token) throw new AdsError("Google returned no access token: run login again");
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
    const out = { login: "ok", accessible: names.length, customer: { id: cu.id, name: cu.descriptiveName, currency: cu.currencyCode, time_zone: cu.timeZone,
      status: cu.status, manager: cu.manager, test_account: cu.testAccount }, through_manager: loginCustomer || null, conversion_actions: conv.length, bound: bound || null };
    if (o.json) say(JSON.stringify(out, null, 2));
    human(`login           : ok (the refresh token works; ${names.length} account(s) reachable)`);
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
