// creatives/tools/google-cloud-setup.test.mjs: flow tests of google-cloud-setup.mjs with a fake gcloud (no network, no
// Google account). Every test works in a throwaway folder under the system temp folder.
// Run: node --test creatives/tools/google-cloud-setup.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run, isProjectId, suggestProject, findGcloud, serviceEmail } from "./google-cloud-setup.mjs";

const PROJECT = "acme-ads-1a2b";
const EMAIL = serviceEmail("harness-google-ads", PROJECT);

function makeRepo({ env = "META_AD_ACCOUNT_ID=1\n", company = "Acme Fitness" } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "gcloud-setup-"));
  if (env !== null) writeFileSync(join(dir, ".env"), env);
  mkdirSync(join(dir, "config"));
  writeFileSync(join(dir, "config", "company.md"), `# Company\n\n**Short name:** ${company}\n`);
  return dir;
}
const clean = (d) => rmSync(d, { recursive: true, force: true });

// A fake gcloud: state in an object; each call is recorded. The key create writes a service account key file.
function fakeGcloud({ signedIn = "owner@example.com", project = false, api = false, account = false, keyError = "", projectError = "" } = {}) {
  const st = { project, api, account, calls: [] };
  const exec = (args) => {
    st.calls.push(args.join(" "));
    const a = args.join(" ");
    const r = (status, stdout = "", stderr = "") => ({ status, stdout, stderr });
    if (a.startsWith("auth list")) return r(0, signedIn ? signedIn + "\n" : "");
    if (a.startsWith("projects describe")) return st.project ? r(0, PROJECT + "\n") : r(1, "", "NOT_FOUND");
    if (a.startsWith("projects create")) { if (projectError) return r(1, "", projectError); st.project = true; return r(0); }
    if (a.startsWith("services list")) return r(0, st.api ? "googleads.googleapis.com\n" : "");
    if (a.startsWith("services enable")) { st.api = true; return r(0); }
    if (a.startsWith("iam service-accounts describe")) return st.account ? r(0, EMAIL + "\n") : r(1, "", "NOT_FOUND");
    if (a.startsWith("iam service-accounts create")) { st.account = true; return r(0); }
    if (a.startsWith("iam service-accounts keys create")) {
      if (keyError) return r(1, "", keyError);
      writeFileSync(args[4], JSON.stringify({ type: "service_account", client_email: EMAIL, private_key: "-----BEGIN PRIVATE KEY-----\nFAKE\n-----END PRIVATE KEY-----\n" }));
      return r(0);
    }
    return r(2, "", `unexpected: ${a}`);
  };
  return { st, exec };
}
function go(argv, { repo, gcloud = "gcloud", exec, now } = {}) {
  let out = "", err = "";
  const code = run(argv, { repo, env: { PATH: "" }, gcloud, exec, now: now || (() => new Date("2026-10-30T10:00:00Z")),
    out: (s) => { out += s + "\n"; }, err: (s) => { err += s + "\n"; } });
  return { code, out, err };
}

test("project ids and the suggested id", () => {
  assert.ok(isProjectId(PROJECT));
  for (const bad of ["Acme-ads-1", "1acme-ads", "acme-", "abc", "a".repeat(31)]) assert.ok(!isProjectId(bad), bad);
  const repo = makeRepo();
  try { assert.match(suggestProject(repo, () => 0.5), /^acme-fitness-ads-[0-9a-f]{4}$/); assert.ok(isProjectId(suggestProject(repo))); }
  finally { clean(repo); }
  assert.equal(findGcloud({ PATH: "" }, "win32", () => false), "");
  assert.match(findGcloud({ PATH: "", LOCALAPPDATA: "C:\\U\\AppData\\Local" }, "win32", (p) => /Cloud SDK/.test(p)), /gcloud\.cmd$/);
});

test("run creates the project, the API, the service account and its key, and writes only the key's path to .env", () => {
  const repo = makeRepo();
  try {
    const g = fakeGcloud();
    const r = go(["run", "--project", PROJECT], { repo, exec: g.exec });
    assert.equal(r.code, 0, r.err);
    assert.ok(g.st.calls.every((c) => c.endsWith("--quiet")), "every gcloud call is non-interactive");
    assert.ok(g.st.calls.some((c) => c.startsWith(`projects create ${PROJECT}`)));
    assert.ok(g.st.calls.some((c) => c.startsWith("services enable googleads.googleapis.com")));
    assert.ok(existsSync(join(repo, ".secrets", "google-ads-key.json")));
    const env = readFileSync(join(repo, ".env"), "utf8");
    assert.match(env, /^GOOGLE_ADS_JSON_KEY_FILE=\.secrets\/google-ads-key\.json$/m);
    assert.match(env, /^META_AD_ACCOUNT_ID=1$/m, "the other lines are kept");
    assert.ok(!r.out.includes("PRIVATE KEY") && !r.err.includes("PRIVATE KEY"), "the key was printed");
    assert.match(r.out, new RegExp(`Access and security > \\+ > ${EMAIL.replace(/\./g, "\\.")}`));
    assert.match(r.out, /apis\/api\/googleads\.googleapis\.com\/overview\?project=acme-ads-1a2b/);
    const ledger = JSON.parse(readFileSync(join(repo, "creatives", "uploads", "2026-10-30-google-cloud.json"), "utf8"));
    assert.deepEqual(ledger[0].done, ["project created", "Google Ads API enabled", "service account created", "key created"]);
    // A second run reuses everything and makes no new key.
    const again = go(["run", "--project", PROJECT], { repo, exec: g.exec });
    assert.equal(again.code, 0, again.err);
    assert.match(again.out, /exists, reused/);
    assert.match(again.out, /this account's key, kept/);
    assert.equal(g.st.calls.filter((c) => c.startsWith("iam service-accounts keys create")).length, 1);
    assert.equal(g.st.calls.filter((c) => c.startsWith("projects create")).length, 1);
    // check agrees.
    const ck = go(["check", "--project", PROJECT], { repo, exec: g.exec });
    assert.equal(ck.code, 0, ck.out + ck.err);
  } finally { clean(repo); }
});

test("refusals: no gcloud, not signed in, no project id, a taken id, an organization that blocks keys", () => {
  const repo = makeRepo();
  try {
    let r = go(["run", "--project", PROJECT], { repo, gcloud: "" });
    assert.equal(r.code, 2); assert.match(r.err, /install/);
    r = go(["run", "--project", PROJECT], { repo, exec: fakeGcloud({ signedIn: "" }).exec });
    assert.equal(r.code, 2); assert.match(r.err, /run node creatives\/tools\/google-cloud-setup\.mjs login/);
    r = go(["run"], { repo, exec: fakeGcloud().exec });
    assert.equal(r.code, 2); assert.match(r.err, /acme-fitness-ads-[0-9a-f]{4}/);
    r = go(["run", "--project", "Bad_Id"], { repo, exec: fakeGcloud().exec });
    assert.equal(r.code, 2);
    r = go(["run", "--project", PROJECT], { repo, exec: fakeGcloud({ projectError: "ERROR: (gcloud.projects.create) Project creation failed. The project ID you specified is already in use by another project." }).exec });
    assert.equal(r.code, 1); assert.match(r.err, /is taken/);
    const blocked = fakeGcloud({ keyError: "ERROR: FAILED_PRECONDITION: Key creation is not allowed on this service account. constraints/iam.disableServiceAccountKeyCreation" });
    r = go(["run", "--project", PROJECT], { repo, exec: blocked.exec });
    assert.equal(r.code, 1);
    assert.match(r.err, /disable-enforce iam\.disableServiceAccountKeyCreation --project=acme-ads-1a2b/);
    assert.match(r.err, /OAuth fallback/);
    assert.doesNotMatch(readFileSync(join(repo, ".env"), "utf8"), /GOOGLE_ADS_JSON_KEY_FILE/, ".env untouched after a refusal");
    // --dry-run prints the gcloud lines and runs nothing.
    const dry = fakeGcloud();
    r = go(["run", "--project", PROJECT, "--dry-run"], { repo, exec: dry.exec });
    assert.equal(r.code, 0); assert.equal(dry.st.calls.length, 0);
    assert.match(r.out, /gcloud iam service-accounts keys create .*--iam-account=harness-google-ads@acme-ads-1a2b\.iam\.gserviceaccount\.com/);
    assert.ok(!existsSync(join(repo, ".secrets", "google-ads-key.json")), "no key after a refusal or a dry run");
  } finally { clean(repo); }
});
