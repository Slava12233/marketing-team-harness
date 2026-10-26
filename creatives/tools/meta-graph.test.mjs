// creatives/tools/meta-graph.test.mjs: unit and flow tests of meta-graph.mjs with a mocked fetch (no network).
// Every test works in throwaway folders under the system temp folder, each with its own fake .env, and never
// touches this repository's .env or creatives/uploads/. All ids are fake. Run: node --test creatives/tools/meta-graph.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  run, readEnvFile, toCsv, csvCell, flattenInsightRows, flattenLeadRows, validateRuleSpec, validateLeadFormSpec,
  scrubText, isInside, MAX_POLLS,
} from "./meta-graph.mjs";

const ACCOUNT = "100000000000001";
const PAGE = "100000000000002";
const FORM = "100000000000003";
const TOKEN = "FAKE-SYSTEM-USER-TOKEN-0000000000000000";
const PAGE_TOKEN = "FAKE-PAGE-TOKEN-1111111111111111111111";

function makeRepo({ page = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "meta-graph-repo-"));
  const lines = [
    `META_AD_ACCOUNT_ID=act_${ACCOUNT}`,
    `META_MARKETING_TOKEN=${TOKEN}`,
    "META_GRAPH_VERSION=v23.0",
    page ? `META_PAGE_ID=${PAGE}` : "",
    "SOME_OTHER_SECRET=never-read-0000",
  ];
  writeFileSync(join(dir, ".env"), lines.join("\n") + "\n");
  return dir;
}
const sink = () => { const s = { text: "", write(x) { s.text += x; return true; } }; return s; };

// routes: [{ method, path, reply }] where path is the Graph path without the version; reply is a body or
// { status, body } or a function of the recorded call.
function mockFetch(routes) {
  const calls = [];
  const fn = async (url, init = {}) => {
    const u = new URL(url);
    const call = { url: String(url), method: init.method || "GET", headers: init.headers || {}, body: init.body,
      path: u.pathname.replace(/^\/v\d+\.\d+\//, ""), query: u.searchParams };
    calls.push(call);
    const route = routes.find((r) => r.method === call.method && r.path === call.path && (!r.when || r.when(call)));
    let reply = route ? (typeof route.reply === "function" ? route.reply(call) : route.reply)
      : { status: 404, body: { error: { message: "no mock route", code: 803 } } };
    if (!(reply && "status" in reply && "body" in reply)) reply = { status: 200, body: reply };
    return { ok: reply.status < 400, status: reply.status, text: async () => JSON.stringify(reply.body) };
  };
  fn.calls = calls;
  return fn;
}
async function go(argv, { repo, fetch = mockFetch([]), cwd } = {}) {
  const stdout = sink();
  const stderr = sink();
  const code = await run(argv, { fetch, env: {}, cwd: cwd || repo, repo, stdout, stderr, sleep: async () => {} });
  return { code, out: stdout.text, err: stderr.text, fetch };
}
const ledgerFiles = (repo) => {
  const d = join(repo, "creatives", "uploads");
  return existsSync(d) ? readdirSync(d).filter((f) => f.endsWith("-meta-graph.json")) : [];
};
function assertTokenHygiene(fetch, res) {
  for (const c of fetch.calls) {
    assert.ok(!c.url.includes(TOKEN) && !c.url.includes(PAGE_TOKEN), `a token reached a URL: ${c.method} ${c.path}`);
    assert.ok(!c.query.has("access_token"), `an access_token parameter in a URL: ${c.url}`);
    assert.match(c.headers.Authorization, /^Bearer /);
  }
  if (res) for (const t of [TOKEN, PAGE_TOKEN]) assert.ok(!res.out.includes(t) && !res.err.includes(t), "a token was printed");
}

// ---------- pure helpers ----------
test("readEnvFile keeps only the four META_ keys", () => {
  const repo = makeRepo();
  try {
    const env = readEnvFile(join(repo, ".env"));
    assert.deepEqual(Object.keys(env).sort(), ["META_AD_ACCOUNT_ID", "META_GRAPH_VERSION", "META_MARKETING_TOKEN", "META_PAGE_ID"]);
    assert.equal(env.SOME_OTHER_SECRET, undefined);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("scrubText hides tokens and access_token parameters", () => {
  const s = scrubText(`bad ${TOKEN} at https://graph.facebook.com/x?access_token=abc123&after=1`, [TOKEN]);
  assert.ok(!s.includes(TOKEN));
  assert.ok(!s.includes("abc123"));
  assert.match(s, /\[token\]/);
});

test("toCsv writes a BOM, quotes and neutralises formulas", () => {
  const csv = toCsv(["a", "b"], [{ a: 'say "hi", ok', b: "=SUM(A1)" }, { a: "-12.5", b: "שלום" }]);
  assert.ok(csv.startsWith("﻿"));
  assert.match(csv, /"say ""hi"", ok"/);
  assert.match(csv, /'=SUM\(A1\)/);
  assert.match(csv, /-12\.5,שלום/);
  assert.equal(csvCell(null), "");
});

test("flattenInsightRows turns actions and cost_per_action_type into columns", () => {
  const { headers, rows } = flattenInsightRows([
    { campaign_name: "C1", spend: "10.00", actions: [{ action_type: "lead", value: "2" }], cost_per_action_type: [{ action_type: "lead", value: "5.00" }] },
    { campaign_name: "C2", spend: "4.00", actions: [{ action_type: "link_click", value: "7" }] },
  ]);
  assert.deepEqual(headers, ["campaign_name", "spend", "action:lead", "action:link_click", "cpa:lead"]);
  assert.equal(rows[0]["action:lead"], "2");
  assert.equal(rows[0]["cpa:lead"], "5.00");
  assert.equal(rows[1]["action:link_click"], "7");
});

test("flattenLeadRows turns field_data into one column per question", () => {
  const { headers, rows } = flattenLeadRows(
    [{ id: "1", created_time: "t", field_data: [{ name: "email", values: ["a@example.com"] }, { name: "id", values: ["x"] }] }],
    ["id", "created_time", "field_data"],
  );
  assert.deepEqual(headers, ["id", "created_time", "email", "field:id"]);
  assert.equal(rows[0].email, "a@example.com");
});

test("validators: rules allow only PAUSE and NOTIFICATION; lead forms need a privacy URL", () => {
  const rule = (t) => ({ name: "r", evaluation_spec: { evaluation_type: "SCHEDULE", filters: [{ field: "entity_type", value: "ADSET", operator: "EQUAL" }] }, execution_spec: { execution_type: t } });
  assert.deepEqual(validateRuleSpec(rule("PAUSE")), []);
  assert.deepEqual(validateRuleSpec(rule("NOTIFICATION")), []);
  for (const t of ["CHANGE_BUDGET", "UNPAUSE", "CHANGE_BID", "ROTATE", undefined]) assert.ok(validateRuleSpec(rule(t)).length > 0, String(t));
  const form = { name: "f", questions: [{ type: "EMAIL" }], privacy_policy: { url: "https://www.example.com/privacy", link_text: "Privacy" } };
  assert.deepEqual(validateLeadFormSpec(form), []);
  assert.ok(validateLeadFormSpec({ ...form, privacy_policy: { link_text: "Privacy" } }).some((p) => p.includes("privacy_policy.url")));
  assert.ok(validateLeadFormSpec({ ...form, extra: 1 }).length > 0);
});

test("isInside", () => {
  const a = mkdtempSync(join(tmpdir(), "meta-graph-in-"));
  try {
    assert.equal(isInside(join(a, "x", "y.csv"), a), true);
    assert.equal(isInside(a, a), true);
    assert.equal(isInside(join(a, "..", "elsewhere.csv"), a), false);
  } finally { rmSync(a, { recursive: true, force: true }); }
});

// ---------- flows ----------
test("--dry-run prints the requests with [token], never the token, and makes no call", async () => {
  const repo = makeRepo();
  try {
    for (const argv of [
      ["insights", "--level", "campaign", "--preset", "last_7d", "--out", "reports/data/x.csv", "--dry-run"],
      ["lead-forms", "list", "--dry-run"],
      ["check", "--dry-run"],
      ["insights", "--level", "ad", "--since", "2026-01-01", "--until", "2026-01-07", "--async", "--json", "--dry-run"],
    ]) {
      const res = await go(argv, { repo });
      assert.equal(res.code, 0, `${argv.join(" ")}: ${res.err}`);
      assert.equal(res.fetch.calls.length, 0);
      const all = res.out + res.err;
      assert.ok(!all.includes(TOKEN), "token printed");
      assert.match(all, /Authorization: Bearer \[token\]/);
      assert.match(all, new RegExp(`act_${ACCOUNT}|${PAGE}|/me`));
    }
    assert.deepEqual(ledgerFiles(repo), []);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("leads refuses an --out inside the repository, a missing --out and --json", async () => {
  const repo = makeRepo();
  try {
    const inside = await go(["leads", "--form", FORM, "--out", join(repo, "exports", "leads.csv")], { repo });
    assert.equal(inside.code, 2);
    assert.match(inside.err, /inside the repository/);
    const relative = await go(["leads", "--form", FORM, "--out", "leads.csv", "--dry-run"], { repo });
    assert.equal(relative.code, 2);
    assert.equal((await go(["leads", "--form", FORM], { repo })).code, 2);
    assert.equal((await go(["leads", "--form", FORM, "--out", join(tmpdir(), "x.csv"), "--json"], { repo })).code, 2);
    assert.equal(inside.fetch.calls.length + relative.fetch.calls.length, 0);
    assert.equal(existsSync(join(repo, "exports", "leads.csv")), false);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("leads writes rows only to the CSV outside the repository and prints no row", async () => {
  const repo = makeRepo();
  const away = mkdtempSync(join(tmpdir(), "meta-graph-away-"));
  try {
    const fetch = mockFetch([
      { method: "GET", path: PAGE, reply: { access_token: PAGE_TOKEN, id: PAGE } },
      { method: "GET", path: `${FORM}/leads`, reply: (c) => {
        assert.equal(c.headers.Authorization, `Bearer ${PAGE_TOKEN}`);
        assert.match(c.query.get("filtering"), /time_created/);
        return { data: [{ id: "900000000000001", created_time: "2026-01-02T10:00:00+0000", field_data: [{ name: "email", values: ["person@example.com"] }, { name: "full_name", values: ["Test Person"] }] }] };
      } },
    ]);
    const out = join(away, "leads.csv");
    const res = await go(["leads", "--form", FORM, "--out", out, "--since", "2026-01-01"], { repo, fetch });
    assert.equal(res.code, 0, res.err);
    assert.match(res.out, /1 lead\(s\) written/);
    assert.match(res.out, /fields: .*email.*full_name/);
    assert.ok(!res.out.includes("person@example.com") && !res.out.includes("Test Person"), "a row reached stdout");
    const csv = readFileSync(out, "utf8");
    assert.ok(csv.startsWith("﻿"));
    assert.match(csv, /person@example\.com/);
    assert.deepEqual(ledgerFiles(repo), [], "a read wrote the ledger");
    assertTokenHygiene(fetch, res);
  } finally { rmSync(repo, { recursive: true, force: true }); rmSync(away, { recursive: true, force: true }); }
});

test("rules create refuses CHANGE_BUDGET and accepts PAUSE (created DISABLED, ledgered)", async () => {
  const repo = makeRepo();
  try {
    const spec = (t) => ({ name: "Pause ad set on high cost", evaluation_spec: { evaluation_type: "SCHEDULE", filters: [{ field: "entity_type", value: "ADSET", operator: "EQUAL" }, { field: "time_preset", value: "LAST_3_DAYS", operator: "EQUAL" }] }, execution_spec: { execution_type: t }, schedule_spec: { schedule_type: "DAILY" } });
    writeFileSync(join(repo, "budget.json"), JSON.stringify(spec("CHANGE_BUDGET")));
    writeFileSync(join(repo, "pause.json"), JSON.stringify(spec("PAUSE")));
    const refused = await go(["rules", "create", "--spec", "budget.json"], { repo });
    assert.equal(refused.code, 2);
    assert.match(refused.err, /CHANGE_BUDGET" is refused/);
    assert.equal(refused.fetch.calls.length, 0);
    assert.deepEqual(ledgerFiles(repo), []);

    const fetch = mockFetch([{ method: "POST", path: `act_${ACCOUNT}/adrules_library`, reply: { id: "100000000000004" } }]);
    const ok = await go(["rules", "create", "--spec", "pause.json"], { repo, fetch });
    assert.equal(ok.code, 0, ok.err);
    assert.match(ok.out, /rule created: id 100000000000004/);
    const body = new URLSearchParams(fetch.calls[0].body);
    assert.equal(body.get("status"), "DISABLED");
    assert.equal(JSON.parse(body.get("execution_spec")).execution_type, "PAUSE");
    const files = ledgerFiles(repo);
    assert.equal(files.length, 1);
    const ledger = JSON.parse(readFileSync(join(repo, "creatives", "uploads", files[0]), "utf8"));
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].command, "rules create");
    assert.equal(ledger[0].id, "100000000000004");
    assertTokenHygiene(fetch, ok);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("insights follows paging.next, flattens actions and writes a CSV with a BOM", async () => {
  const repo = makeRepo();
  try {
    const next = `https://graph.facebook.com/v23.0/act_${ACCOUNT}/insights?after=CURSOR2&access_token=SHOULD-BE-STRIPPED`;
    const fetch = mockFetch([
      { method: "GET", path: `act_${ACCOUNT}/insights`, when: (c) => !c.query.get("after"), reply: (c) => {
        assert.equal(c.query.get("level"), "campaign");
        assert.deepEqual(JSON.parse(c.query.get("action_attribution_windows")), ["7d_click", "1d_view"]);
        assert.deepEqual(JSON.parse(c.query.get("time_range")), { since: "2026-01-01", until: "2026-01-07" });
        assert.equal(c.query.get("breakdowns"), "age,gender");
        return { data: [{ campaign_name: "Campaign A", spend: "12.50", actions: [{ action_type: "lead", value: "3" }], cost_per_action_type: [{ action_type: "lead", value: "4.17" }] }], paging: { next } };
      } },
      { method: "GET", path: `act_${ACCOUNT}/insights`, when: (c) => c.query.get("after") === "CURSOR2", reply: {
        data: [{ campaign_name: "Campaign B", spend: "3.00", actions: [{ action_type: "link_click", value: "9" }] }],
      } },
    ]);
    const res = await go(["insights", "--level", "campaign", "--since", "2026-01-01", "--until", "2026-01-07", "--breakdowns", "age,gender", "--out", "reports/data/insights.csv"], { repo, fetch });
    assert.equal(res.code, 0, res.err);
    assert.equal(fetch.calls.length, 2);
    assert.match(res.out, /2 row\(s\)/);
    const csv = readFileSync(join(repo, "reports", "data", "insights.csv"), "utf8");
    assert.ok(csv.startsWith("﻿"));
    const header = csv.slice(1).split("\r\n")[0];
    assert.equal(header, "campaign_name,spend,action:lead,action:link_click,cpa:lead");
    assert.match(csv, /Campaign B,3\.00,,9,/);
    assert.deepEqual(ledgerFiles(repo), [], "a read wrote the ledger");
    assertTokenHygiene(fetch, res);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("insights --async polls a bounded number of times", async () => {
  const repo = makeRepo();
  try {
    let polls = 0;
    const fetch = mockFetch([
      { method: "POST", path: `act_${ACCOUNT}/insights`, reply: { report_run_id: "100000000000005" } },
      { method: "GET", path: "100000000000005", reply: () => { polls++; return { async_status: "Job Running", async_percent_completion: 40 }; } },
    ]);
    const res = await go(["insights", "--level", "ad", "--preset", "last_7d", "--async", "--out", "reports/data/a.csv"], { repo, fetch });
    assert.equal(res.code, 1);
    assert.equal(polls, MAX_POLLS);
    assert.match(res.err, /not finished after/);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("targeting-search renders a table", async () => {
  const repo = makeRepo();
  try {
    const fetch = mockFetch([{ method: "GET", path: `act_${ACCOUNT}/targetingsearch`, reply: { data: [
      { id: "6003000000000001", name: "Example interest", type: "interests", audience_size_lower_bound: 1000, audience_size_upper_bound: 2000, path: ["Interests", "Example interest"] },
    ] } }]);
    const res = await go(["targeting-search", "--q", "example"], { repo, fetch });
    assert.equal(res.code, 0, res.err);
    assert.match(res.out, /\| id \| name \| type \| audience_size_lower_bound \| audience_size_upper_bound \| path \|/);
    assert.match(res.out, /\| 6003000000000001 \| Example interest \| interests \| 1000 \| 2000 \| Interests > Example interest \|/);
    assert.equal(fetch.calls[0].query.get("q"), "example");
    assertTokenHygiene(fetch, res);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("check maps code 200 to the Owner's fix list, exit 1, no retry", async () => {
  const repo = makeRepo();
  try {
    const fetch = mockFetch([{ method: "GET", path: "me", reply: { status: 400, body: { error: { message: "(#200) Requires ads_read permission", code: 200 } } } }]);
    const res = await go(["check"], { repo, fetch });
    assert.equal(res.code, 1);
    assert.equal(fetch.calls.length, 1);
    assert.match(res.err, /fix list/);
    assert.match(res.err, /App mode/);
    assert.match(res.err, /System User asset access/);
    assert.match(res.err, /Token permissions/);
    assertTokenHygiene(fetch, res);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("check exits 2 when ads_management is missing and prints names only", async () => {
  const repo = makeRepo();
  try {
    const fetch = mockFetch([
      { method: "GET", path: "me", reply: { id: "100000000000006", name: "Example System User" } },
      { method: "GET", path: `act_${ACCOUNT}`, reply: { name: "Example Account", account_status: 1, currency: "USD", timezone_name: "Etc/UTC" } },
      { method: "GET", path: "me/permissions", reply: { data: [{ permission: "ads_read", status: "granted" }] } },
    ]);
    const res = await go(["check"], { repo, fetch });
    assert.equal(res.code, 2);
    assert.match(res.out, /Example System User/);
    assert.match(res.err, /ads_management/);
    assertTokenHygiene(fetch, res);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("the ledger gets a line on a write and none on a read", async () => {
  const repo = makeRepo();
  try {
    const fetch = mockFetch([
      { method: "GET", path: `act_${ACCOUNT}/customaudiences`, reply: { data: [{ id: "100000000000007", name: "Site visitors", subtype: "WEBSITE" }] } },
      { method: "POST", path: `act_${ACCOUNT}/customaudiences`, reply: { id: "100000000000008" } },
    ]);
    const read = await go(["audiences", "list"], { repo, fetch });
    assert.equal(read.code, 0, read.err);
    assert.deepEqual(ledgerFiles(repo), []);
    const write = await go(["audiences", "lookalike", "--origin", "100000000000007", "--ratio", "0.01", "--country", "gb", "--name", "LAL 1% visitors"], { repo, fetch });
    assert.equal(write.code, 0, write.err);
    const body = new URLSearchParams(fetch.calls[1].body);
    assert.equal(body.get("subtype"), "LOOKALIKE");
    assert.deepEqual(JSON.parse(body.get("lookalike_spec")), { ratio: 0.01, country: "GB" });
    const files = ledgerFiles(repo);
    assert.equal(files.length, 1);
    const ledger = JSON.parse(readFileSync(join(repo, "creatives", "uploads", files[0]), "utf8"));
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].id, "100000000000008");
    assertTokenHygiene(fetch, write);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("rules delete needs --yes and refuses a rule of another account", async () => {
  const repo = makeRepo();
  try {
    assert.equal((await go(["rules", "delete", "--id", "100000000000009"], { repo })).code, 2);
    const fetch = mockFetch([{ method: "GET", path: "100000000000009", reply: { id: "100000000000009", name: "x", account_id: "100000000000099" } }]);
    const res = await go(["rules", "delete", "--id", "100000000000009", "--yes"], { repo, fetch });
    assert.equal(res.code, 2);
    assert.equal(fetch.calls.length, 1, "a DELETE was sent");
    assert.deepEqual(ledgerFiles(repo), []);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("lead-forms create refuses a spec without privacy_policy.url and posts a valid one with the Page token", async () => {
  const repo = makeRepo();
  try {
    writeFileSync(join(repo, "bad.json"), JSON.stringify({ name: "f", questions: [{ type: "EMAIL" }] }));
    const bad = await go(["lead-forms", "create", "--spec", "bad.json"], { repo });
    assert.equal(bad.code, 2);
    assert.match(bad.err, /privacy_policy\.url is missing/);
    writeFileSync(join(repo, "good.json"), JSON.stringify({ name: "f", questions: [{ type: "EMAIL" }], privacy_policy: { url: "https://www.example.com/privacy", link_text: "Privacy" } }));
    const fetch = mockFetch([
      { method: "GET", path: PAGE, reply: { access_token: PAGE_TOKEN, id: PAGE } },
      { method: "POST", path: `${PAGE}/leadgen_forms`, reply: (c) => {
        assert.equal(c.headers.Authorization, `Bearer ${PAGE_TOKEN}`);
        return { id: "100000000000010" };
      } },
    ]);
    const ok = await go(["lead-forms", "create", "--spec", "good.json"], { repo, fetch });
    assert.equal(ok.code, 0, ok.err);
    assert.match(ok.out, /lead form created: id 100000000000010/);
    assert.equal(ledgerFiles(repo).length, 1);
    assertTokenHygiene(fetch, ok);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("a missing .env value is exit 2 before any call", async () => {
  const repo = mkdtempSync(join(tmpdir(), "meta-graph-empty-"));
  try {
    mkdirSync(join(repo, "x"));
    const res = await go(["audiences", "list"], { repo });
    assert.equal(res.code, 2);
    assert.equal(res.fetch.calls.length, 0);
    assert.match(res.err, /No \.env/);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});
