#!/usr/bin/env node
// ad-card.mjs: prints one planned ad of a flight as JSON, for drawing it as a card in a chat widget when the
// ad is not in the Meta account yet (an ad that exists is shown with ads_get_ad_preview + ad-shots.sh instead).
//
// Usage (from the repository root):
//   node creatives/tools/ad-card.mjs <ad number> <flight folder>
//   e.g. node creatives/tools/ad-card.mjs 12 2026-11-buyers-flight-1
//
// Reads creatives/<flight>/preview/ads.js (the schema is documented in creatives/preview-template/ads.js) and
// prints { n, id, set, role, status, adId, note, mediaType, primary, headline, description, cta, pageName, dir,
// media } where `media` is the picture as a small JPEG data URI (widget sandboxes load no image from another
// host). A video gives its poster frame. Needs ffmpeg on the PATH.
// Exit codes: 0 ok, 1 ad or file not found, 2 bad arguments.
import { readFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const n = Number(process.argv[2]);
const flight = process.argv[3];
if (!Number.isInteger(n) || !flight) { console.error("usage: node creatives/tools/ad-card.mjs <ad number> <flight folder>"); process.exit(2); }

const creatives = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const preview = join(creatives, flight, "preview");
const adsFile = join(preview, "ads.js");
if (!existsSync(adsFile)) { console.error(`no ads.js at creatives/${flight}/preview/ads.js`); process.exit(1); }

const sandbox = { window: {} };
vm.runInNewContext(readFileSync(adsFile, "utf8"), sandbox);
const W = sandbox.window;
const ad = (W.ADS || []).find((a) => a.n === n);
if (!ad) { console.error(`ad #${n} is not in creatives/${flight}/preview/ads.js`); process.exit(1); }

const m = ad.media || {};
const rel = m.type === "video" ? m.poster : m.src;
if (!rel) { console.error(`ad #${n} has no media ${m.type === "video" ? "poster" : "src"}`); process.exit(1); }
const source = join(preview, rel);
if (!existsSync(source)) { console.error(`media file missing: creatives/${flight}/preview/${rel}`); process.exit(1); }

const tmp = mkdtempSync(join(tmpdir(), "ad-card-"));
const out = join(tmp, "card.jpg");
try {
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", source, "-frames:v", "1", "-vf", "scale=360:-2", "-q:v", "7", out]);
  const media = "data:image/jpeg;base64," + readFileSync(out).toString("base64");
  const meta = W.ADS_META || {};
  console.log(JSON.stringify({
    n: ad.n, id: ad.id, set: ad.set, role: ad.role, status: ad.status ?? null, adId: ad.adId ?? null, note: ad.note,
    mediaType: m.type, primary: ad.primary, headline: ad.headline, description: ad.description,
    cta: ad.cta ?? meta.cta ?? null, pageName: meta.pageName ?? null, dir: meta.dir ?? "ltr", media,
  }));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
