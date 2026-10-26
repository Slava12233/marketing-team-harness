#!/usr/bin/env node
// render-stills.mjs: renders a flight's HTML banner builder to PNG, one file per concept x ratio.
//
// Usage (from the repository root; Node 20+; a browser run, so bound it in time and run one at a time):
//   timeout 300 node creatives/tools/render-stills.mjs --src creatives/src/<flight> --out creatives/<flight>/stills \
//     [--only S01,S02] [--ratios 1x1,4x5,9x16] [--brand <file.json>] [--query "variant=a"] \
//     [--browser <path>] [--overflow-selectors ".safe,.headline"]
//
// What the flight folder (--src) holds:
//   index.html   the banner builder. It is opened as index.html?concept=<id>&ratio=<ratio>[&<--query>] at the
//                ratio's exact pixel size, draws that concept, and sets window.__ready (a value or a Promise)
//                once fonts and images are in. Everything brand-specific (colours, fonts, logo, copy) lives in
//                this flight's own files, normally taken from config/brand.md when the builder is written.
//   specs.json   required: [{ "id": "S01", "slug": "short-name", "ratios": ["1x1", "4x5", "9x16"] }, ...].
//                Ratios: 1x1 (1080x1080), 4x5 (1080x1350), 9x16 (1080x1920), cover (1200x628).
//   brand.json   optional (or --brand <file>): { "colors": { "ink": "#...", ... }, "fonts": { "display": "...", ... } }.
//                Each entry becomes a CSS custom property on :root (--color-<name>, --font-<name>) and the whole
//                object is exposed to the page as window.__BRAND before its scripts run, so one builder can be
//                re-skinned without editing it. No brand value is hard-coded in this tool.
//
// Output: <out>/CREATIVE_<id>_<slug>_<ratio>.png (cover files are named _1200x628). Deterministic: fixed
// viewport, device scale 1, reduced motion.
//
// Overflow guard: after each frame is drawn, every element matching the overflow selectors (default ".safe" and
// "[data-safe]") is checked; content taller or wider than its box is reported as OVERFLOW and the run exits 2
// (the files are still written so they can be inspected). Page errors or failed requests abort with exit 1.
//
// Dependencies: playwright-core (or playwright) resolvable from the repository root
// (npm install --no-save --no-package-lock playwright-core; the bootstrap installs it by default) or from the folder in
// $PLAYWRIGHT_MODULE_DIR. Browser: --browser, else $CHROME_PATH, else an installed Chrome or Edge at the usual
// Windows, macOS or Linux path, else Playwright's own Chromium (npx playwright install chromium).
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(SELF), "..", "..");

const argv = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++) {
  const s = argv[i];
  if (!s.startsWith("--")) continue;
  const next = argv[i + 1];
  if (next !== undefined && !next.startsWith("--")) { args[s.slice(2)] = next; i++; } else args[s.slice(2)] = "true";
}
if (args.help || !args.src || !args.out) {
  const all = fs.readFileSync(SELF, "utf8").split(/\r?\n/).slice(1); // skip the #! line
  const end = all.findIndex((l) => !l.startsWith("//"));
  const header = all.slice(0, end === -1 ? all.length : end).map((l) => l.slice(3));
  console.log(header.join("\n"));
  process.exit(args.help ? 0 : 2);
}

// ---------- playwright ----------
function loadChromium() {
  const bases = [process.env.PLAYWRIGHT_MODULE_DIR, REPO, process.cwd()].filter(Boolean);
  for (const base of bases) {
    const req = createRequire(path.join(path.resolve(base), "package.json"));
    for (const mod of ["playwright-core", "playwright"]) {
      try { return req(mod).chromium; } catch { /* try the next */ }
    }
  }
  console.error("playwright-core not found. Run `npm install --no-save --no-package-lock playwright-core` at the repository root, or set PLAYWRIGHT_MODULE_DIR.");
  process.exit(2);
}
const chromium = loadChromium();

function findBrowser() {
  if (args.browser && args.browser !== "true") return args.browser;
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
  ];
  return candidates.find((c) => fs.existsSync(c)) || null; // null: Playwright's own Chromium
}

// ---------- inputs ----------
const SRC = path.resolve(args.src);
const OUT = path.resolve(args.out);
const RATIOS = { "1x1": [1080, 1080], "4x5": [1080, 1350], "9x16": [1080, 1920], cover: [1200, 628] };

const specsFile = path.join(SRC, "specs.json");
if (!fs.existsSync(path.join(SRC, "index.html"))) { console.error(`no index.html in ${SRC}`); process.exit(2); }
if (!fs.existsSync(specsFile)) { console.error(`no specs.json in ${SRC} (expected [{ id, slug, ratios }])`); process.exit(2); }
const SPEC_LIST = JSON.parse(fs.readFileSync(specsFile, "utf8"));
if (!Array.isArray(SPEC_LIST)) { console.error("specs.json must be an array of { id, slug, ratios }"); process.exit(2); }

const brandFile = args.brand && args.brand !== "true" ? path.resolve(args.brand) : path.join(SRC, "brand.json");
const BRAND = fs.existsSync(brandFile) ? JSON.parse(fs.readFileSync(brandFile, "utf8")) : null;
const cssName = (s) => String(s).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
const brandCss = BRAND
  ? `:root{${[
      ...Object.entries(BRAND.colors || {}).map(([k, v]) => `--color-${cssName(k)}:${v};`),
      ...Object.entries(BRAND.fonts || {}).map(([k, v]) => `--font-${cssName(k)}:${v};`),
    ].join("")}}`
  : "";

const only = args.only ? new Set(args.only.split(",")) : null;
const ratiosFilter = args.ratios ? new Set(args.ratios.split(",")) : null;
const extraQuery = args.query && args.query !== "true" ? `&${args.query.replace(/^[?&]/, "")}` : "";
const OVERFLOW_SELECTORS = (args["overflow-selectors"] && args["overflow-selectors"] !== "true"
  ? args["overflow-selectors"].split(",")
  : [".safe", "[data-safe]"]).map((s) => s.trim()).filter(Boolean);
fs.mkdirSync(OUT, { recursive: true });

// ---------- render ----------
const executablePath = findBrowser();
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  headless: true,
  // --allow-file-access-from-files: CSS mask-image and fonts are fetched in CORS mode, which file:// denies without it.
  args: ["--force-color-profile=srgb", "--hide-scrollbars", "--allow-file-access-from-files"],
});
const ctx = await browser.newContext({ deviceScaleFactor: 1, reducedMotion: "reduce" });
if (BRAND) await ctx.addInitScript((b) => { window.__BRAND = b; }, BRAND);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("requestfailed", (r) => errors.push(`request failed: ${r.url()}`));
const index = pathToFileURL(path.join(SRC, "index.html")).href;
const written = [];
const overflows = [];
try {
  for (const s of SPEC_LIST) {
    if (only && !only.has(s.id)) continue;
    for (const r of s.ratios || []) {
      if (ratiosFilter && !ratiosFilter.has(r)) continue;
      if (!RATIOS[r]) { console.warn(`skipping unknown ratio ${r} for ${s.id}`); continue; }
      const [w, h] = RATIOS[r];
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`${index}?concept=${encodeURIComponent(s.id)}&ratio=${r}${extraQuery}`, { waitUntil: "load" });
      if (brandCss) await page.addStyleTag({ content: brandCss });
      await page.evaluate(() => window.__ready);
      await page.evaluate(() => (document.fonts ? document.fonts.ready.then(() => true) : true));
      if (errors.length) throw new Error(`page errors for ${s.id} ${r}: ${errors.join(" | ")}`);
      const ov = await page.evaluate((sels) => {
        for (const sel of sels) {
          for (const e of document.querySelectorAll(sel)) {
            if (e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1) {
              return `${sel} ${e.scrollWidth}x${e.scrollHeight} in ${e.clientWidth}x${e.clientHeight}`;
            }
          }
        }
        return null;
      }, OVERFLOW_SELECTORS);
      if (ov) { overflows.push(`${s.id} ${r}: ${ov}`); console.warn("OVERFLOW", s.id, r, ov); }
      await page.waitForTimeout(150);
      const file = path.join(OUT, `CREATIVE_${s.id}_${s.slug}_${r === "cover" ? "1200x628" : r}.png`);
      await page.screenshot({ path: file, type: "png", clip: { x: 0, y: 0, width: w, height: h } });
      written.push(file);
      console.log("wrote", path.relative(process.cwd(), file), `${w}x${h}`);
    }
  }
} catch (err) {
  console.error(err.message || String(err));
  process.exitCode = 1;
} finally {
  await browser.close();
}
console.log(`${written.length} files -> ${path.relative(process.cwd(), OUT)}`);
if (overflows.length) {
  console.warn(`OVERFLOW in ${overflows.length} frame(s): ${overflows.join("; ")}`);
  if (!process.exitCode) process.exitCode = 2;
}
