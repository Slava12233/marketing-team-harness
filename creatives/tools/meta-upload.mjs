#!/usr/bin/env node
// meta-upload.mjs: uploads local ad images and videos straight to the company's Meta ad account through
// Meta's Graph API (no public URL needed). Prints the image hashes and video ids that ads_create_ad consumes
// and appends them to a JSON ledger under creatives/uploads/.
//
// Usage (from the repository root; Node 20+, no dependencies):
//   node creatives/tools/meta-upload.mjs --check                       # token + account sanity check (names only)
//   node creatives/tools/meta-upload.mjs --dry-run <files...>          # what would be uploaded; no network
//   node creatives/tools/meta-upload.mjs <files...> [--out <json>] [--title-prefix "<text>"] [--no-wait]
//
// Options: --chunk-mb <n> (videos above this size go through the resumable start/transfer/finish protocol;
// default 40), --no-wait (do not poll a video until its status is ready), --out <json> (ledger path; default
// creatives/uploads/<YYYY-MM-DD>-meta-upload.json).
//
// Configuration, from the repository-root .env only (template: .env.example):
//   META_AD_ACCOUNT_ID    required; the ad account id, with or without the "act_" prefix. Read from .env only.
//   META_MARKETING_TOKEN  required; a System User token with ads_management + ads_read on that account.
//                         For the token only, a value already set in the process environment wins over the .env line.
//   META_GRAPH_VERSION    optional; default v23.0.
// The token value is never printed and never put in a URL: it travels in an Authorization header, and every
// error text is scrubbed before printing. Generating, rotating or revoking the token is the Owner's click in
// Meta Business Settings (System users); never paste a value into chat.
//
// Images: POST act_<id>/adimages (Meta deduplicates by content, so a re-upload returns the existing hash).
// Videos: POST act_<id>/advideos, single request or chunked, then GET /<video_id>?fields=status until
// video_status is "ready" (10-minute limit).
// Exit codes: 0 ok, 1 upload or API error, 2 missing configuration or bad arguments.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const HERE = path.dirname(SELF);
const REPO = path.resolve(HERE, "..", "..");
const ENV_FILE = path.join(REPO, ".env");

// ---------- arguments ----------
const argv = process.argv.slice(2);
const FLAGS = new Set(["check", "dry-run", "no-wait", "help"]);
const VALUED = new Set(["out", "title-prefix", "chunk-mb"]);
const opts = { files: [] };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) {
    const k = a.slice(2);
    if (FLAGS.has(k)) opts[k] = true;
    else if (VALUED.has(k)) opts[k] = argv[++i];
    else { console.error(`unknown option: ${a} (see --help)`); process.exit(2); }
  } else opts.files.push(a);
}
if (opts.help || (!opts.check && opts.files.length === 0)) {
  const all = fs.readFileSync(SELF, "utf8").split(/\r?\n/).slice(1); // skip the #! line
  const end = all.findIndex((l) => !l.startsWith("//"));
  const header = all.slice(0, end === -1 ? all.length : end).map((l) => l.slice(3));
  console.log(header.join("\n"));
  process.exit(opts.help ? 0 : 2);
}

// ---------- .env (names only ever reach stdout) ----------
function readEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    const q = v[0];
    if ((q === '"' || q === "'") && v.endsWith(q) && v.length >= 2) v = v.slice(1, -1);
    if (v) out[m[1]] = v;
  }
  return out;
}
const ENV = readEnvFile(ENV_FILE);
const envExists = fs.existsSync(ENV_FILE);

let tokenSource = null;
let TOKEN = "";
if (process.env.META_MARKETING_TOKEN) { TOKEN = process.env.META_MARKETING_TOKEN; tokenSource = "process environment"; }
else if (ENV.META_MARKETING_TOKEN) { TOKEN = ENV.META_MARKETING_TOKEN; tokenSource = ".env (repository root)"; }

const rawAccount = String(ENV.META_AD_ACCOUNT_ID || "").trim();
const ACCOUNT = rawAccount.replace(/^act_/i, "");
const VERSION = ENV.META_GRAPH_VERSION || process.env.META_GRAPH_VERSION || "v23.0";
const BASE = `https://graph.facebook.com/${VERSION}`;
const CHUNK_BYTES = Number(opts["chunk-mb"] || 40) * 1024 * 1024;
const scrub = (s) => (TOKEN ? String(s).split(TOKEN).join("[token]") : String(s));

function requireAccount() {
  if (!ACCOUNT) {
    console.error(
      envExists
        ? "META_AD_ACCOUNT_ID is not set in the repository-root .env. Add the line META_AD_ACCOUNT_ID=<id> (with or without act_); see .env.example."
        : "No .env at the repository root. Copy .env.example to .env and fill META_AD_ACCOUNT_ID and META_MARKETING_TOKEN (names only in chat; never paste a value).",
    );
    process.exit(2);
  }
  if (!/^\d+$/.test(ACCOUNT)) {
    console.error("META_AD_ACCOUNT_ID in .env is not a numeric ad account id (expected digits, optionally prefixed act_).");
    process.exit(2);
  }
}
requireAccount();

// ---------- files ----------
const MIME = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp",
  ".mp4": "video/mp4", ".mov": "video/quicktime", ".m4v": "video/x-m4v", ".webm": "video/webm",
};
const mimeOf = (file) => MIME[path.extname(file).toLowerCase()] || "";
const kindOf = (file) => mimeOf(file).split("/")[0] || null;
const mb = (n) => (n / 1024 / 1024).toFixed(1) + " MB";
const rel = (p) => path.relative(REPO, p).split(path.sep).join("/");

const items = [];
for (const f of opts.files) {
  const file = path.resolve(f);
  if (!fs.existsSync(file)) { console.error(`missing file: ${f}`); process.exit(2); }
  const kind = kindOf(file);
  if (!kind) { console.error(`unsupported type: ${f} (images: jpg png gif webp; videos: mp4 mov m4v webm)`); process.exit(2); }
  const size = fs.statSync(file).size;
  const route = kind === "image" ? "adimages" : size > CHUNK_BYTES ? "advideos (chunked)" : "advideos (single POST)";
  items.push({ file, rel: rel(file), kind, size, route });
}

if (opts["dry-run"]) {
  const tokenLine = TOKEN ? `present (${tokenSource})` : "MISSING (looked in the process environment and the repository-root .env)";
  console.log(`account act_${ACCOUNT}, Graph ${VERSION}, token: ${tokenLine}`);
  console.log("");
  console.log("| file | kind | size | route |");
  console.log("|---|---|---|---|");
  for (const it of items) console.log(`| ${it.rel} | ${it.kind} | ${mb(it.size)} | ${it.route} |`);
  console.log(`\n${items.length} file(s); nothing uploaded (dry run).`);
  process.exit(0);
}

if (!TOKEN) {
  console.error("META_MARKETING_TOKEN is not set. Looked in the process environment and in the repository-root .env.");
  console.error("The Owner generates it in Meta Business Settings > System users and writes it into .env (names only; never paste a value in chat).");
  process.exit(2);
}

// ---------- Graph API ----------
async function graph(method, p, { query = {}, form } = {}) {
  const endpoint = String(p).replace(/^\//, "");
  const url = new URL(`${BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url, { method, headers: { Authorization: `Bearer ${TOKEN}` }, body: form });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok || json.error) {
    const e = json.error || {};
    const code = [e.code, e.error_subcode].filter(Boolean).join("/");
    const msg = e.error_user_msg || e.message || text.slice(0, 300);
    throw new Error(scrub(`Graph ${method} /${endpoint} -> HTTP ${res.status}${code ? ` (code ${code})` : ""}: ${msg}`));
  }
  return json;
}

async function check() {
  const me = await graph("GET", "me", { query: { fields: "id,name" } });
  const acct = await graph("GET", `act_${ACCOUNT}`, { query: { fields: "name,account_status,currency,business" } });
  const imgs = await graph("GET", `act_${ACCOUNT}/adimages`, { query: { fields: "hash", limit: "1" } });
  const vids = await graph("GET", `act_${ACCOUNT}/advideos`, { query: { fields: "id", limit: "1" } });
  console.log(`token source : ${tokenSource}`);
  console.log(`token holder : ${me.name} (id ${me.id})`);
  const biz = acct.business ? `, business ${acct.business.id}` : "";
  console.log(`ad account   : act_${ACCOUNT} "${acct.name}", status ${acct.account_status}, ${acct.currency}${biz}`);
  console.log(`read access  : adimages ${Array.isArray(imgs.data) ? "ok" : "?"}, advideos ${Array.isArray(vids.data) ? "ok" : "?"}`);
  console.log("Write access is proven by the first real upload; run the script on one image to confirm.");
}

async function uploadImage(it) {
  const blob = new Blob([await fs.promises.readFile(it.file)], { type: mimeOf(it.file) });
  const form = new FormData();
  form.append("filename", blob, path.basename(it.file));
  const res = await graph("POST", `act_${ACCOUNT}/adimages`, { form });
  const entry = res.images ? Object.values(res.images)[0] : null;
  if (!entry || !entry.hash) throw new Error(`adimages returned no hash: ${scrub(JSON.stringify(res)).slice(0, 300)}`);
  return { hash: entry.hash, url: entry.url, width: entry.width, height: entry.height };
}

async function fileBlob(file) {
  // fs.openAsBlob streams from disk (Node 19.8+); fall back to reading into memory.
  if (typeof fs.openAsBlob === "function") return fs.openAsBlob(file, { type: mimeOf(file) });
  return new Blob([await fs.promises.readFile(file)], { type: mimeOf(file) });
}

async function uploadVideoSingle(it, title) {
  const blob = await fileBlob(it.file);
  const form = new FormData();
  form.append("source", blob, path.basename(it.file));
  form.append("title", title);
  const res = await graph("POST", `act_${ACCOUNT}/advideos`, { form });
  if (!res.id) throw new Error(`advideos returned no id: ${scrub(JSON.stringify(res)).slice(0, 300)}`);
  return res.id;
}

async function uploadVideoChunked(it, title) {
  const name = path.basename(it.file);
  const blob = await fileBlob(it.file);
  let form = new FormData();
  form.append("upload_phase", "start");
  form.append("file_size", String(it.size));
  const start = await graph("POST", `act_${ACCOUNT}/advideos`, { form });
  const session = start.upload_session_id;
  const videoId = start.video_id;
  if (!session || !videoId) throw new Error(`chunked start returned no session: ${scrub(JSON.stringify(start)).slice(0, 300)}`);
  let s = Number(start.start_offset);
  let e = Number(start.end_offset);
  while (s < e) {
    form = new FormData();
    form.append("upload_phase", "transfer");
    form.append("upload_session_id", session);
    form.append("start_offset", String(s));
    form.append("video_file_chunk", blob.slice(s, e), name);
    const r = await graph("POST", `act_${ACCOUNT}/advideos`, { form });
    s = Number(r.start_offset);
    e = Number(r.end_offset);
    process.stdout.write(`\r  transfer ${Math.min(100, Math.round((100 * s) / it.size))}%   `);
  }
  process.stdout.write("\n");
  form = new FormData();
  form.append("upload_phase", "finish");
  form.append("upload_session_id", session);
  form.append("title", title);
  const fin = await graph("POST", `act_${ACCOUNT}/advideos`, { form });
  if (fin.success !== true) throw new Error(`chunked finish did not report success: ${scrub(JSON.stringify(fin)).slice(0, 300)}`);
  return videoId;
}

async function waitForVideo(id, timeoutMs = 10 * 60 * 1000) {
  const t0 = Date.now();
  for (;;) {
    const r = await graph("GET", id, { query: { fields: "status,title,length" } });
    const st = r.status && r.status.video_status;
    if (st === "ready") return { status: "ready", length: r.length };
    if (st === "error") throw new Error(`video ${id} failed processing: ${scrub(JSON.stringify(r.status)).slice(0, 300)}`);
    if (Date.now() - t0 > timeoutMs) return { status: st || "unknown", timedOut: true };
    const pct = r.status && r.status.processing_progress != null ? ` ${r.status.processing_progress}%` : "";
    process.stdout.write(`\r  processing (${st || "..."})${pct}   `);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

// ---------- main ----------
const date = new Date().toISOString().slice(0, 10);
const OUT = path.resolve(opts.out || path.join(REPO, "creatives", "uploads", `${date}-meta-upload.json`));

(async () => {
  if (opts.check) { await check(); return; }
  const prefix = opts["title-prefix"] ? `${opts["title-prefix"]} ` : "";
  const results = [];
  let failed = 0;
  for (const it of items) {
    const title = `${prefix}${path.basename(it.file, path.extname(it.file))}`.slice(0, 250);
    process.stdout.write(`${it.rel} (${it.kind}, ${mb(it.size)}, ${it.route}) ... `);
    const row = { file: it.rel, kind: it.kind, bytes: it.size, uploaded_at: new Date().toISOString(), account: `act_${ACCOUNT}` };
    try {
      if (it.kind === "image") {
        const r = await uploadImage(it);
        Object.assign(row, { image_hash: r.hash, url: r.url, width: r.width, height: r.height, status: "ok" });
        console.log(`hash ${r.hash}${r.width ? ` (${r.width}x${r.height})` : ""}`);
      } else {
        const videoId = it.size > CHUNK_BYTES ? await uploadVideoChunked(it, title) : await uploadVideoSingle(it, title);
        row.video_id = videoId;
        row.title = title;
        if (opts["no-wait"]) {
          row.status = "uploaded (processing not awaited)";
          console.log(`video_id ${videoId} (processing not awaited)`);
        } else {
          const w = await waitForVideo(videoId);
          row.status = w.timedOut ? `still ${w.status} after 10 min` : "ready";
          if (w.length) row.length_s = w.length;
          process.stdout.write("\n");
          console.log(`  video_id ${videoId}, ${row.status}`);
        }
      }
    } catch (err) {
      failed++;
      row.status = "FAILED";
      row.error = scrub(err.message);
      console.log(`FAILED\n  ${row.error}`);
    }
    results.push(row);
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  let ledger = [];
  if (fs.existsSync(OUT)) {
    try { ledger = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch { ledger = []; }
  }
  fs.writeFileSync(OUT, JSON.stringify([...ledger, ...results], null, 2) + "\n");
  console.log("\n| # | file | kind | hash / video_id | status |\n|---|---|---|---|---|");
  results.forEach((r, i) => console.log(`| ${i + 1} | ${r.file} | ${r.kind} | ${r.image_hash || r.video_id || ""} | ${r.status} |`));
  console.log(`\nledger: ${rel(OUT)} (${results.length - failed} ok, ${failed} failed)`);
  // process.exitCode, not process.exit(): on Windows, recent Node versions can abort with a libuv assertion
  // when exit() runs while a fetch handle is still closing. Letting the loop drain exits with the same code.
  process.exitCode = failed ? 1 : 0;
})().catch((err) => {
  console.error(scrub(err.message || String(err)));
  process.exitCode = 1;
});
