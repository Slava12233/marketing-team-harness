// creatives/tools/google-ads.test.mjs: unit and flow tests of google-ads.mjs with a mocked fetch (no network).
// Every test works in throwaway folders under the system temp folder, each with its own fake .env and config, and
// never touches this repository's .env or creatives/uploads/. All ids are fake. Run: node --test creatives/tools/google-ads.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  run, readEnvFile, setEnvLine, scrubText, adLength, validateBuildSpec, buildOperations, isReadOnlyQuery, reportQuery,
  reportRows, configuredCustomer, googleDailyLimit, validateConversionSpec, fixList,
} from "./google-ads.mjs";

const CUSTOMER = "1234567890";
const MANAGER = "9876543210";
const CLIENT_ID = "fake-client-0000.apps.googleusercontent.com";
const SECRET = "FAKE-CLIENT-SECRET-00000000";
const REFRESH = "FAKE-REFRESH-TOKEN-1111111111111111";
const ACCESS = "FAKE-ACCESS-TOKEN-2222222222222222";
const URL_OK = "https://www.example.com/he/start";

function makeRepo({ env = {}, accounts = true, product = true, goals = true, goLog = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "google-ads-repo-"));
  const e = { GOOGLE_ADS_CLIENT_ID: CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET: SECRET, GOOGLE_ADS_REFRESH_TOKEN: REFRESH,
    GOOGLE_ADS_CUSTOMER_ID: "123-456-7890", ...env };
  const lines = Object.entries(e).filter(([, v]) => v !== null).map(([k, v]) => `${k}=${v}`);
  writeFileSync(join(dir, ".env"), [...lines, "SOME_OTHER_SECRET=never-read-0000"].join("\n") + "\n");
  mkdirSync(join(dir, "config"), { recursive: true });
  mkdirSync(join(dir, "memory", "money"), { recursive: true });
  if (accounts) writeFileSync(join(dir, "config", "accounts.md"), `## Google Ads\n\n| Field | Value |\n|---|---|\n| \`google_ads_customer_id\` | ${accounts === true ? "123-456-7890" : accounts} |\n`);
  if (product) writeFileSync(join(dir, "config", "product.md"), `| Language | URL |\n|---|---|\n| Hebrew | ${URL_OK} |\n`);
  if (goals) writeFileSync(join(dir, "config", "goals.md"), "## Hard caps\n\n| Cap | Amount | Set by |\n|---|---|---|\n| Daily (all ads together, every platform) | 400 ILS | Owner |\n\n## Platform share\n\n| Platform | Share of each cap |\n|---|---|\n| Meta | 50 % |\n| Google | 50 % |\n");
  if (goLog) writeFileSync(join(dir, "memory", "money", "go-log.md"), "---\nas_of: \n---\n\n| date | time (tz) | channel | the Owner's words, quoted | objects (ids) | daily | cap | end | who executed |\n|---|---|---|---|---|---|---|---|---|\n");
  return dir;
}
const clean = (d) => rmSync(d, { recursive: true, force: true });
const sink = () => { const s = { text: "", write(x) { s.text += x; return true; } }; return s; };

// routes: [{ method, path, reply, when? }] where path is the Ads path without /vNN/ or the full OAuth URL.
function mockFetch(routes) {
  const calls = [];
  const fn = async (url, init = {}) => {
    const u = new URL(url);
    const p = u.hostname === "googleads.googleapis.com" ? u.pathname.replace(/^\/v\d+\//, "") : `${u.origin}${u.pathname}`;
    let body = init.body;
    try { body = JSON.parse(init.body); } catch { /* a form */ }
    const call = { url: String(url), method: init.method || "GET", headers: init.headers || {}, rawBody: init.body, body, path: p };
    calls.push(call);
    const route = routes.find((r) => r.method === call.method && r.path === call.path && (!r.when || r.when(call)));
    let reply = route ? (typeof route.reply === "function" ? route.reply(call) : route.reply)
      : { status: 404, body: { error: { code: 404, message: `no mock route for ${call.method} ${call.path}`, status: "NOT_FOUND" } } };
    if (!(reply && "status" in reply && "body" in reply)) reply = { status: 200, body: reply };
    return { ok: reply.status < 400, status: reply.status, text: async () => JSON.stringify(reply.body) };
  };
  fn.calls = calls;
  return fn;
}
const TOKEN_ROUTE = { method: "POST", path: "https://oauth2.googleapis.com/token", reply: { access_token: ACCESS, expires_in: 3599, token_type: "Bearer" } };
async function go(argv, { repo, fetch = mockFetch([]), openBrowser, now } = {}) {
  const stdout = sink();
  const stderr = sink();
  const code = await run(argv, { fetch, env: {}, cwd: repo, repo, stdout, stderr, openBrowser, now, loginWaitMs: 5000 });
  return { code, out: stdout.text, err: stderr.text, fetch };
}
function assertHygiene(res) {
  for (const c of res.fetch.calls) for (const s of [REFRESH, ACCESS, SECRET]) assert.ok(!c.url.includes(s), `a secret reached a URL: ${c.url}`);
  for (const s of [REFRESH, ACCESS, SECRET]) assert.ok(!res.out.includes(s) && !res.err.includes(s), "a secret was printed");
}
function spec(over = {}) {
  return {
    type: "SEARCH",
    campaign: { name: "IL | Search | Leads | 2026-11", daily_budget: 80, bidding: "MAXIMIZE_CONVERSIONS", start_date: "2026-11-02",
      final_url_suffix: "utm_source=google&utm_medium=cpc&utm_campaign=il-search&ref=g1", ...(over.campaign || {}) },
    locations: [2376],
    languages: [1027],
    negative_keywords: [{ text: "free", match: "BROAD" }],
    ad_groups: [{
      name: "Core",
      keywords: [{ text: "mortgage advice", match: "PHRASE" }, { text: "mortgage broker", match: "EXACT" }],
      ads: [{ headlines: [{ text: "Mortgage advice", pin: "HEADLINE_1" }, "Talk to an adviser", "Book a free call"],
        descriptions: ["Clear answers about your mortgage options.", "Book a call in two minutes."], final_url: URL_OK, path1: "advice" }],
    }],
    sitelinks: [{ text: "How it works", url: URL_OK }],
    callouts: ["Answers in one day"],
    ...Object.fromEntries(Object.entries(over).filter(([k]) => k !== "campaign")),
  };
}
const writeSpec = (repo, s) => { const f = join(repo, "spec.json"); writeFileSync(f, JSON.stringify(s)); return f; };
const ledger = (repo) => {
  const d = join(repo, "creatives", "uploads");
  const f = existsSync(d) ? readdirSync(d).find((x) => x.endsWith("-google-ads.json")) : null;
  return f ? JSON.parse(readFileSync(join(d, f), "utf8")) : [];
};

// ---------- pure helpers ----------
test("readEnvFile keeps only the GOOGLE_ADS_ keys; setEnvLine replaces once and keeps the rest", () => {
  const repo = makeRepo();
  try {
    const env = readEnvFile(join(repo, ".env"));
    assert.equal(env.SOME_OTHER_SECRET, undefined);
    assert.equal(env.GOOGLE_ADS_REFRESH_TOKEN, REFRESH);
    const t = setEnvLine("A=1\r\nGOOGLE_ADS_REFRESH_TOKEN=old\r\nB=2\r\nGOOGLE_ADS_REFRESH_TOKEN=older\r\n", "GOOGLE_ADS_REFRESH_TOKEN", "new");
    assert.equal(t, "A=1\r\nGOOGLE_ADS_REFRESH_TOKEN=new\r\nB=2\r\n");
    assert.equal(setEnvLine("A=1\n", "X", "y"), "A=1\nX=y\n");
  } finally { clean(repo); }
});

test("scrubText hides secrets, tokens in JSON and form fields", () => {
  const s = scrubText(`x ${REFRESH} {"access_token":"abc123456"} refresh_token=zzz999&client_secret=qqq`, [REFRESH]);
  for (const bad of [REFRESH, "abc123456", "zzz999", "qqq"]) assert.ok(!s.includes(bad), bad);
});

test("adLength counts full-width characters twice and Hebrew once", () => {
  assert.equal(adLength("abc"), 3);
  assert.equal(adLength("שלום"), 4);
  assert.equal(adLength("広告"), 4);
});

test("the build spec: lengths, PAUSED only, destinations, caps, phase-2 types", () => {
  const repo = makeRepo();
  try {
    assert.deepEqual(validateBuildSpec(spec(), repo).problems, []);
    const long = spec();
    long.ad_groups[0].ads[0].headlines.push("This headline is far longer than thirty characters");
    assert.ok(validateBuildSpec(long, repo).problems.some((p) => p.includes("at most 30")));
    assert.ok(validateBuildSpec(spec({ campaign: { status: "ENABLED" } }), repo).problems.some((p) => p.includes("always created PAUSED")));
    const off = spec();
    off.ad_groups[0].ads[0].final_url = "https://other.example.net/page";
    assert.ok(validateBuildSpec(off, repo).problems.some((p) => p.includes("not a destination page")));
    assert.ok(validateBuildSpec(spec({ campaign: { daily_budget: 101 } }), repo).problems.some((p) => p.includes("above 100")));
    assert.ok(validateBuildSpec({ ...spec(), type: "PERFORMANCE_MAX" }, repo).problems[0].includes("phase 2"));
    const few = spec();
    few.ad_groups[0].ads[0].descriptions = ["only one"];
    assert.ok(validateBuildSpec(few, repo).problems.some((p) => p.includes("2 to 4")));
    const kw = spec();
    kw.ad_groups[0].keywords[0].match = "MODIFIED";
    assert.ok(validateBuildSpec(kw, repo).problems.some((p) => p.includes("EXACT, PHRASE or BROAD")));
  } finally { clean(repo); }
});

test("an unfilled config only warns: no destination list, no caps", () => {
  const repo = makeRepo({ product: false, goals: false });
  try {
    const r = validateBuildSpec(spec({ campaign: { daily_budget: 5000 } }), repo);
    assert.deepEqual(r.problems, []);
    assert.ok(r.warnings.some((w) => w.includes("destination")));
    assert.ok(r.warnings.some((w) => w.includes("caps")));
    assert.equal(googleDailyLimit(repo), null);
  } finally { clean(repo); }
});

test("buildOperations: one atomic batch, campaign PAUSED, EU declaration, temporary ids in order", () => {
  const ops = buildOperations(spec(), CUSTOMER);
  const camp = ops.find((o) => o.campaignOperation).campaignOperation.create;
  assert.equal(camp.status, "PAUSED");
  assert.equal(camp.containsEuPoliticalAdvertising, "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING");
  assert.equal(camp.startDateTime, "2026-11-02 00:00:00");
  assert.equal(camp.networkSettings.targetContentNetwork, false);
  assert.deepEqual(camp.maximizeConversions, {});
  assert.equal(ops[0].campaignBudgetOperation.create.amountMicros, "80000000");
  const names = JSON.stringify(ops).match(/customers\/1234567890\/\w+\/-\d+/g);
  assert.ok(names.length > 4);
  const created = ops.map((o) => Object.values(o)[0].create.resourceName).filter(Boolean);
  assert.equal(new Set(created).size, created.length, "temporary ids are unique");
  const rsa = ops.find((o) => o.adGroupAdOperation).adGroupAdOperation.create.ad.responsiveSearchAd;
  assert.equal(rsa.headlines[0].pinnedField, "HEADLINE_1");
  assert.ok(ops.some((o) => o.campaignCriterionOperation && o.campaignCriterionOperation.create.negative));
  assert.equal(ops.filter((o) => o.campaignAssetOperation).length, 2);
});

test("GAQL helpers: only SELECT; the report converts micros", () => {
  assert.equal(isReadOnlyQuery("SELECT campaign.id FROM campaign"), true);
  assert.equal(isReadOnlyQuery("select x from y; DROP"), false);
  assert.equal(isReadOnlyQuery("UPDATE campaign"), false);
  assert.match(reportQuery("campaign", { range: "LAST_7_DAYS" }), /DURING LAST_7_DAYS AND campaign.status != 'REMOVED'/);
  assert.match(reportQuery("keyword", { since: "2026-10-01", until: "2026-10-07" }), /BETWEEN '2026-10-01' AND '2026-10-07'/);
  const [row] = reportRows([{ campaign: { name: "C" }, metrics: { costMicros: "12500000", averageCpc: "1500000", clicks: "7" } }]);
  assert.equal(row["metrics.cost"], 12.5);
  assert.equal(row["metrics.averageCpc"], 1.5);
  assert.equal(row["metrics.costMicros"], undefined);
});

test("validators and fix lists", () => {
  assert.deepEqual(validateConversionSpec({ name: "Lead", category: "SUBMIT_LEAD_FORM" }), []);
  assert.ok(validateConversionSpec({ name: "x", category: "NOPE" }).length > 0);
  assert.match(fixList(["oauth: invalid_grant"], ""), /login/);
  assert.match(fixList(["authorizationError: USER_PERMISSION_DENIED"], ""), /GOOGLE_ADS_LOGIN_CUSTOMER_ID/);
  assert.match(fixList(["authorizationError: DEVELOPER_TOKEN_NOT_APPROVED"], ""), /Explorer/);
  assert.equal(fixList([], "something else"), null);
});

// ---------- flows ----------
test("an account id on the command line is refused", async () => {
  const repo = makeRepo();
  try {
    const r = await go(["report", "--level", "campaign", "--range", "LAST_7_DAYS", "--customer", "1111111111"], { repo });
    assert.equal(r.code, 2);
    assert.match(r.err, /GOOGLE_ADS_CUSTOMER_ID in \.env only/);
    assert.equal(r.fetch.calls.length, 0);
  } finally { clean(repo); }
});

test("a .env account that differs from config/accounts.md is refused before any call", async () => {
  const repo = makeRepo({ accounts: "111-111-1111" });
  try {
    assert.equal(configuredCustomer(repo), "1111111111");
    const r = await go(["check"], { repo });
    assert.equal(r.code, 2);
    assert.match(r.err, /bound to 1111111111/);
    assert.equal(r.fetch.calls.length, 0);
  } finally { clean(repo); }
});

test("build --dry-run prints the batch with the campaign PAUSED and makes no call", async () => {
  const repo = makeRepo();
  try {
    const r = await go(["build", "--spec", writeSpec(repo, spec()), "--dry-run"], { repo });
    assert.equal(r.code, 0, r.err);
    assert.equal(r.fetch.calls.length, 0);
    assert.match(r.out, /"status": "PAUSED"/);
    assert.match(r.out, /"validateOnly": true/);
    assert.match(r.out, /DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING/);
    assertHygiene(r);
  } finally { clean(repo); }
});

test("build: validateOnly first, then the atomic create, the ledger, known objects and a PAUSED read-back", async () => {
  const repo = makeRepo({ env: { GOOGLE_ADS_LOGIN_CUSTOMER_ID: MANAGER } });
  try {
    const camp = `customers/${CUSTOMER}/campaigns/555`;
    const fetch = mockFetch([
      TOKEN_ROUTE,
      { method: "POST", path: `customers/${CUSTOMER}/googleAds:mutate`, when: (c) => c.body.validateOnly === true, reply: {} },
      { method: "POST", path: `customers/${CUSTOMER}/googleAds:mutate`, when: (c) => !c.body.validateOnly, reply: { mutateOperationResponses: [
        { campaignBudgetResult: { resourceName: `customers/${CUSTOMER}/campaignBudgets/444` } },
        { campaignResult: { resourceName: camp } },
        { adGroupResult: { resourceName: `customers/${CUSTOMER}/adGroups/666` } },
      ] } },
      { method: "POST", path: `customers/${CUSTOMER}/googleAds:search`, reply: { results: [{ campaign: { status: "PAUSED", name: "x" }, campaignBudget: { amountMicros: "80000000" } }] } },
    ]);
    const r = await go(["build", "--spec", writeSpec(repo, spec())], { repo, fetch });
    assert.equal(r.code, 0, r.err);
    const mutates = fetch.calls.filter((c) => c.path.endsWith("googleAds:mutate"));
    assert.equal(mutates.length, 2);
    assert.equal(mutates[0].body.validateOnly, true);
    assert.equal(mutates[1].body.validateOnly, undefined);
    for (const c of fetch.calls.filter((x) => x.url.includes("googleads"))) {
      assert.equal(c.headers["login-customer-id"], MANAGER);
      assert.equal(c.headers["developer-token"], undefined, "no developer token header unless one is set");
      assert.match(c.headers.Authorization, /^Bearer /);
    }
    assert.match(r.out, /read back: status PAUSED/);
    const l = ledger(repo);
    assert.equal(l.length, 1);
    assert.equal(l[0].status, "ok");
    assert.ok(l[0].resources.includes(camp));
    const known = JSON.parse(readFileSync(join(repo, "memory", "state", "known-objects-google.json"), "utf8"));
    assert.equal(known.customer, CUSTOMER);
    assert.ok(known.resources.includes(camp));
    assertHygiene(r);
  } finally { clean(repo); }
});

test("build stops when Google rejects the validateOnly batch: nothing created, the field path reported", async () => {
  const repo = makeRepo();
  try {
    const fetch = mockFetch([TOKEN_ROUTE, { method: "POST", path: `customers/${CUSTOMER}/googleAds:mutate`, reply: { status: 400, body: { error: { code: 400, status: "INVALID_ARGUMENT", message: "Request contains an invalid argument.",
      details: [{ errors: [{ errorCode: { fieldError: "REQUIRED" }, message: "The required field was not present.", location: { fieldPathElements: [{ fieldName: "mutate_operations", index: 1 }, { fieldName: "campaign_operation" }] } }] }] } } } }]);
    const r = await go(["build", "--spec", writeSpec(repo, spec())], { repo, fetch });
    assert.equal(r.code, 1);
    assert.match(r.err, /fieldError: REQUIRED/);
    assert.match(r.err, /mutate_operations\[1\]/);
    assert.equal(fetch.calls.filter((c) => c.path.endsWith("googleAds:mutate")).length, 1);
    assert.equal(ledger(repo).length, 0);
  } finally { clean(repo); }
});

test("enable needs --go and a resource this folder knows; with both it writes the go log", async () => {
  const repo = makeRepo();
  try {
    const camp = `customers/${CUSTOMER}/campaigns/555`;
    let r = await go(["enable", "--resource", camp], { repo });
    assert.equal(r.code, 2);
    assert.match(r.err, /needs --go/);
    r = await go(["enable", "--resource", camp, "--go", "go, 80 a day"], { repo });
    assert.equal(r.code, 2);
    assert.match(r.err, /not created or recorded by this folder/);
    r = await go(["enable", "--resource", `customers/1111111111/campaigns/555`, "--go", "go"], { repo });
    assert.equal(r.code, 2);
    assert.match(r.err, /belongs to Google Ads account 1111111111/);
    mkdirSync(join(repo, "plans"), { recursive: true });
    writeFileSync(join(repo, "plans", "2026-10-30-google-search.md"), `Campaign: \`${camp}\`\n`);
    const fetch = mockFetch([
      TOKEN_ROUTE,
      { method: "POST", path: `customers/${CUSTOMER}/googleAds:search`, reply: { results: [{ campaign: { name: "IL Search", status: "PAUSED" }, campaignBudget: { amountMicros: "80000000" } }] } },
      { method: "POST", path: `customers/${CUSTOMER}/campaigns:mutate`, reply: { results: [{ resourceName: camp }] } },
    ]);
    r = await go(["enable", "--resource", camp, "--go", "Yes, go: 80 ILS a day | until Friday"], { repo, fetch });
    assert.equal(r.code, 0, r.err);
    const update = fetch.calls.find((c) => c.path.endsWith("campaigns:mutate")).body.operations[0];
    assert.equal(update.update.status, "ENABLED");
    assert.equal(update.updateMask, "status");
    const log = readFileSync(join(repo, "memory", "money", "go-log.md"), "utf8");
    assert.match(log, /"Yes, go: 80 ILS a day \\\| until Friday"/);
    assert.match(log, /customers\/1234567890\/campaigns\/555/);
    assert.doesNotMatch(log, /^as_of: $/m);
  } finally { clean(repo); }
});

test("budget: a raise needs --go and at most +20 %; a cut needs neither", async () => {
  const repo = makeRepo();
  try {
    const b = `customers/${CUSTOMER}/campaignBudgets/444`;
    mkdirSync(join(repo, "memory", "state"), { recursive: true });
    writeFileSync(join(repo, "memory", "state", "known-objects-google.json"), JSON.stringify({ customer: CUSTOMER, resources: [b] }));
    const routes = () => mockFetch([
      TOKEN_ROUTE,
      { method: "POST", path: `customers/${CUSTOMER}/googleAds:search`, reply: { results: [{ campaignBudget: { amountMicros: "50000000", name: "b" } }] } },
      { method: "POST", path: `customers/${CUSTOMER}/campaignBudgets:mutate`, reply: { results: [{ resourceName: b }] } },
    ]);
    let r = await go(["budget", "--resource", b, "--amount", "55"], { repo, fetch: routes() });
    assert.equal(r.code, 2);
    assert.match(r.err, /needs --go/);
    r = await go(["budget", "--resource", b, "--amount", "70", "--go", "raise it"], { repo, fetch: routes() });
    assert.equal(r.code, 2);
    assert.match(r.err, /more than 20 %/);
    r = await go(["budget", "--resource", b, "--amount", "150", "--go", "raise it"], { repo, fetch: routes() });
    assert.equal(r.code, 2);
    assert.match(r.err, /above 100/);
    let f = routes();
    r = await go(["budget", "--resource", b, "--amount", "60", "--go", "raise to 60"], { repo, fetch: f });
    assert.equal(r.code, 0, r.err);
    assert.equal(f.calls.find((c) => c.path.endsWith("campaignBudgets:mutate")).body.operations[0].update.amountMicros, "60000000");
    f = routes();
    r = await go(["budget", "--resource", b, "--amount", "30"], { repo, fetch: f });
    assert.equal(r.code, 0, r.err);
    const rows = readFileSync(join(repo, "memory", "money", "go-log.md"), "utf8").split("\n").filter((l) => l.includes("campaignBudgets/444"));
    assert.equal(rows.length, 1, "only the raise is a go-log row");
  } finally { clean(repo); }
});

test("pause is always allowed on the folder's account and never needs --go", async () => {
  const repo = makeRepo();
  try {
    const camp = `customers/${CUSTOMER}/campaigns/777`;
    const fetch = mockFetch([TOKEN_ROUTE, { method: "POST", path: `customers/${CUSTOMER}/campaigns:mutate`, reply: { results: [{ resourceName: camp }] } }]);
    const r = await go(["pause", "--resource", camp], { repo, fetch });
    assert.equal(r.code, 0, r.err);
    assert.equal(fetch.calls[1].body.operations[0].update.status, "PAUSED");
    assert.equal(ledger(repo)[0].command, "pause");
  } finally { clean(repo); }
});

test("report converts micros and pages through nextPageToken; search refuses a write", async () => {
  const repo = makeRepo();
  try {
    let n = 0;
    const fetch = mockFetch([TOKEN_ROUTE, { method: "POST", path: `customers/${CUSTOMER}/googleAds:search`, reply: () => (++n === 1
      ? { results: [{ campaign: { name: "A" }, metrics: { costMicros: "1000000" } }], nextPageToken: "p2" }
      : { results: [{ campaign: { name: "B" }, metrics: { costMicros: "2500000" } }] }) }]);
    const r = await go(["report", "--level", "campaign", "--range", "LAST_7_DAYS", "--json"], { repo, fetch });
    assert.equal(r.code, 0, r.err);
    assert.equal(fetch.calls.filter((c) => c.path.endsWith("googleAds:search")).length, 2);
    assert.equal(fetch.calls[2].body.pageToken, "p2");
    const out = join(repo, "reports", "data", "g.csv");
    n = 0;
    const r2 = await go(["report", "--level", "campaign", "--range", "LAST_7_DAYS", "--out", out], { repo, fetch });
    assert.equal(r2.code, 0, r2.err);
    assert.match(readFileSync(out, "utf8"), /metrics\.cost/);
    const bad = await go(["search", "--gaql", "DELETE FROM campaign"], { repo });
    assert.equal(bad.code, 2);
  } finally { clean(repo); }
});

test("check: an expired login prints the login fix and is never retried", async () => {
  const repo = makeRepo();
  try {
    const fetch = mockFetch([{ method: "POST", path: "https://oauth2.googleapis.com/token", reply: { status: 400, body: { error: "invalid_grant", error_description: "Token has been expired or revoked." } } }]);
    const r = await go(["check"], { repo, fetch });
    assert.equal(r.code, 1);
    assert.match(r.err, /google-ads\.mjs login/);
    assert.equal(fetch.calls.length, 1);
    assertHygiene(r);
  } finally { clean(repo); }
});

test("check reads the account and the conversion actions", async () => {
  const repo = makeRepo();
  try {
    const fetch = mockFetch([
      TOKEN_ROUTE,
      { method: "GET", path: "customers:listAccessibleCustomers", reply: { resourceNames: [`customers/${CUSTOMER}`] } },
      { method: "POST", path: `customers/${CUSTOMER}/googleAds:search`, when: (c) => /FROM customer/.test(c.body.query), reply: { results: [{ customer: { id: CUSTOMER, descriptiveName: "Co", currencyCode: "ILS", timeZone: "Asia/Jerusalem", status: "ENABLED", manager: false, testAccount: false } }] } },
      { method: "POST", path: `customers/${CUSTOMER}/googleAds:search`, when: (c) => /FROM conversion_action/.test(c.body.query), reply: { results: [{ conversionAction: { id: "1" } }] } },
    ]);
    const r = await go(["check"], { repo, fetch });
    assert.equal(r.code, 0, r.err);
    assert.match(r.out, /"Co", status ENABLED, ILS/);
    assert.match(r.out, /1 enabled conversion action/);
    assertHygiene(r);
  } finally { clean(repo); }
});

test("login: the loopback catches the code, the refresh token lands in .env and is never printed", async () => {
  const repo = makeRepo({ env: { GOOGLE_ADS_REFRESH_TOKEN: null, GOOGLE_ADS_CUSTOMER_ID: null } });
  try {
    const fetch = mockFetch([{ method: "POST", path: "https://oauth2.googleapis.com/token", reply: (c) => {
      const form = new URLSearchParams(c.rawBody);
      assert.equal(form.get("grant_type"), "authorization_code");
      assert.equal(form.get("code"), "AUTH-CODE-123456");
      assert.ok(form.get("code_verifier").length > 40);
      return { access_token: ACCESS, refresh_token: REFRESH, scope: "https://www.googleapis.com/auth/adwords" };
    } }]);
    let opened = "";
    const openBrowser = (url) => {
      opened = url;
      const u = new URL(url);
      assert.equal(u.searchParams.get("scope"), "https://www.googleapis.com/auth/adwords");
      assert.equal(u.searchParams.get("access_type"), "offline");
      assert.equal(u.searchParams.get("code_challenge_method"), "S256");
      const back = new URL(u.searchParams.get("redirect_uri"));
      back.searchParams.set("code", "AUTH-CODE-123456");
      back.searchParams.set("state", u.searchParams.get("state"));
      globalThis.fetch(back).catch(() => {});
    };
    const r = await go(["login"], { repo, fetch, openBrowser });
    assert.equal(r.code, 0, r.err);
    assert.ok(opened);
    assert.match(r.out, /GOOGLE_ADS_REFRESH_TOKEN saved to \.env \(\d+ characters\)/);
    assert.equal(readEnvFile(join(repo, ".env")).GOOGLE_ADS_REFRESH_TOKEN, REFRESH);
    assert.match(readFileSync(join(repo, ".env"), "utf8"), /SOME_OTHER_SECRET=never-read-0000/);
    assertHygiene(r);
    assert.ok(!r.out.includes("AUTH-CODE-123456") && !r.err.includes("AUTH-CODE-123456"));
  } finally { clean(repo); }
});

test("login refuses a callback with the wrong state", async () => {
  const repo = makeRepo({ env: { GOOGLE_ADS_REFRESH_TOKEN: null } });
  try {
    const openBrowser = (url) => {
      const u = new URL(url);
      const back = new URL(u.searchParams.get("redirect_uri"));
      back.searchParams.set("code", "X");
      back.searchParams.set("state", "forged");
      globalThis.fetch(back).catch(() => {});
    };
    const r = await go(["login"], { repo, openBrowser });
    assert.equal(r.code, 1);
    assert.match(r.err, /without a valid code/);
    assert.equal(readEnvFile(join(repo, ".env")).GOOGLE_ADS_REFRESH_TOKEN, undefined);
  } finally { clean(repo); }
});
