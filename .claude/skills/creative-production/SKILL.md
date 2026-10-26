---
name: creative-production
description: "How this harness produces the actual ad files for the company (static banners, short silent videos, form covers) from the real product UI, generated pictures or supplied footage, with the still renderer in creatives/tools, the fal MCP and the HyperFrames plugin (shipped in vendor/hyperframes) when installed. Use after a creative brief is approved and before media-buyer uploads anything."
---

# creative-production: turning a brief into files

Output: finished files in `creatives/<flight>/stills/` and `creatives/<flight>/video/`, the file list in the flight's plan file (English); the chat summary is in the chat language from `config/operator.md`.

Scope: the files Meta receives (PNG, JPG, MP4) for a flight that `creative-brief` has specified. Nothing here publishes. Uploads happen only after the Owner has seen the files, with `creatives/tools/meta-upload.mjs` (`meta-campaign-build`, "Media uploads"). Paid generation (fal, any other paid model) happens only on a stated cost and the Owner's go for that round.

Read first: the approved brief, `config/brand.md` (colours, fonts, logo files, RTL rules, the AI-imagery disclosure rule), `config/product.md` (existing assets and where they are), `config/claims.md`.

## 1. Where things live

| Thing | Path |
|---|---|
| Still banner sources (one HTML builder per flight) | `creatives/src/<flight>/index.html` + `fonts/`, `logo/`, `img/` |
| Still renderer (headless Chrome) | `creatives/tools/render-stills.mjs` |
| Finished files per flight | `creatives/<flight>/stills/`, `creatives/<flight>/video/` |
| Upload to Meta (after the Owner has seen the files) | `creatives/tools/meta-upload.mjs` (Graph API; token `META_MARKETING_TOKEN` in the repo-root `.env`, never opened or printed); ledger `creatives/uploads/` |
| Preview site (Facebook-frame mock-up for the team) | copy `creatives/preview-template/` to `creatives/<flight>/preview/`, fill its `ads.js` |
| A planned ad drawn as a card | `creatives/tools/ad-card.mjs <number> <flight>` |
| Meta's rendering of a built ad as PNG | `creatives/tools/ad-shots.sh <outdir> <number-name>=<preview_url> ...` |
| Source product frames and films | the existing assets listed in `config/product.md` (screen recordings, films, brand files) |
| Video projects | a HyperFrames project per flight when the plugin is installed (see §4); otherwise the supplied files |
| The HyperFrames video plugin (optional) | `vendor/hyperframes/` in this repository (Apache-2.0, `THIRD-PARTY.md`); installing it: §4 |

Rendering and QA are done by the main session or a `general-purpose` sub-agent (`model: opus` for building comps and renders, `sonnet` for a fresh-context QA pass). Never `inherit`.

## 2. Stills (banners, form covers)

1. **One HTML builder per flight** (`creatives/src/<flight>/index.html`): `render-stills.mjs` opens it as `index.html?concept=<id>&ratio=<ratio>` at the ratio's exact pixel size (1x1 1080², 4x5 1080×1350, 9x16 1080×1920 with 250/300 px safe zones, cover 1200×628); the builder draws that concept, marks each safe box with `.safe` or `[data-safe]` (the overflow guard checks them) and sets `window.__ready` once fonts and images are in. A `specs.json` beside it lists the concepts and their ratios (`[{"id":"S01","slug":"short-name","ratios":["1x1","4x5"]}]`); an optional `brand.json` (or `--brand`) injects colours and fonts as `--color-*` / `--font-*` CSS variables and `window.__BRAND`. The renderer needs `playwright-core` once in the repo root (`npm install --no-save --no-package-lock playwright-core`; the bootstrap offers it) and Chrome or Edge. Fonts from `config/brand.md` via `@font-face`, with the unicode-ranges each language needs. When a language is RTL (`config/brand.md`): `dir="rtl"` on the canvas and `<bdi>` around every Latin token, number, date and currency amount.
2. **Product frames** come from the real recordings listed in `config/product.md`: grab one with `timeout 300 ffmpeg -ss <s> -i <mp4> -frames:v 1 <out.png>`, crop to the window the brief names, cover or blur what the brief lists (names, prices, counters, any word the brief bans), keep the product's own source lines legible (24 px or more at 1080 wide).
3. **Render:**
   `timeout 300 node creatives/tools/render-stills.mjs --src creatives/src/<flight> --out creatives/<flight>/stills [--only <ids>] [--ratios 1x1,4x5,9x16]`
   - The script fails on any page error. A top-level `const top` / `name` / `status` shadows a window global and kills the page silently; use distinct names.
   - **Overflow guard:** the script warns and exits 2 when a frame's type overflows the safe box. Exit 2 is a layout bug, not a flaky run: shorten the line or resize the type, then render again.
4. **Open every PNG and check:** message match with the destination page (its heading and CTA wording as `config/product.md` quotes them, when the brief calls for them), safe zones, the reserved accent colour only in its role, no forbidden word (`config/claims.md`), source strips legible, nothing clipped, nothing extra on the image (`creative-brief`). Then `compliance-check`.

## 3. Generated pictures (fal MCP, optional)

1. **Cost first.** State the model, the number of images and the cost (`mcp__fal__get_pricing` or `estimate_cost`) and wait for the Owner's go for that round. `check_account_status` for credits. Never start paid work that was not asked for.
2. **Prompt** with the formula in the `image` skill (Subject + Setting + Style + Lighting + Composition + Technical); follow its test → pick → template → batch consistency workflow.
3. **Text inside a generated picture: run the bake-off for your language.** Before relying on any model to set words in the image, test one short display line in each target language on the candidate models, one run each, then a reliability pass (the same line about five times) on the ones that passed. **The by-eye letter check is the gate**: read every letter of every output against the intended line; one wrong letter fails the image. Record the result (model, language, pass count) in the plan, and when no model passes, set the text in the HTML builder over the picture instead.
4. **Disclosure.** Every generated or altered image of an item, place, unit or person carries the badge `config/brand.md` prescribes (when it prescribes one); the ad carries the self-disclosure OPT_IN; generated media never depicts, or is captioned as, a real item, project, address or person.
5. Save the chosen outputs into `creatives/src/<flight>/img/` with the prompt and model in the plan, then compose them in the HTML builder (§2) when the image needs type or a logo.

## 4. Videos (silent, text-led, 20 s or less each; 9:16 master + 4:5 + 1:1)

**When the HyperFrames plugin is installed** (its `hyperframes` entry skill is listed): start from that entry skill; it captures intent, picks the workflow (`motion-graphics` for a short text-led unit, `general-video` for multi-scene pieces, `talking-head-recut` / `embedded-captions` for footage with a person) and owns the composition contract, checks and renders.
1. One project per flight. Write the storyboard (beats, seconds, source windows, blur lists, overlays, the closing beat per `creative-brief`) and record the Owner's go for the cut in the project notes with their words and the date. Nothing is captured for the cut or paid before that.
2. Brand tokens from `config/brand.md` go into the project's design spec; RTL rules apply per §2.
3. Check the composition with the plugin's check command, then render locally; one bounded call per step. The plugin's cloud rendering and hosted voices are paid services: the same rule as any paid generation (a stated cost and the Owner's go for that round).
4. Keep a manifest of every asset: real screen recordings need no disclosure; anything generated carries the disclosure per §3, and an asset whose disclosure is undecided blocks delivery until the Owner rules.
5. QA pass in a fresh context (the plugin's checks plus a by-eye pass: readable by about 1.5 s, safe zones, nothing extra on the frame, captions correct letter by letter). Fix, re-render, then copy the masters to `creatives/<flight>/video/` as `CREATIVE_V<NN>_<slug>_<ratio>.mp4` with a closing-frame thumbnail.

**When it is not installed:** the plugin ships with this repository, verbatim, in `vendor/hyperframes/` (see its `VENDOR.md`). Installing a plugin changes Claude Code itself, so it is the Owner's or the Operator's step and the harness only prepares the lines: answer yes to the plugin's item in the bootstrap (`bash bootstrap.sh`, or `bootstrap.ps1` on Windows), or run from the repository root

```
claude plugin marketplace add ./vendor/hyperframes
claude plugin install hyperframes@hyperframes
```

then start a new session so its skills load. It needs Node.js 22 or newer and FFmpeg; the renderer itself (`npx hyperframes`) is fetched from the npm registry the first time a video is made. Until it is installed, bring your own files: a designer or video producer delivers the masters to the brief's spec; the harness runs the same QA pass and the disclosure check, then names and files them as above.

## 5. Running heavy work (recommendation)
Run renders, encodes, browser captures and sweeps with a time bound (`timeout N` as the first word: about 300 s for stills and QA, about 540 s for captures, renders and encodes), in the foreground, one at a time. On exit 124 (the bound), report the tail, stop any leftover process from your run, and run once more on a smaller chunk; never loop a failing command.

## 6. Upload and record
When a flight's files are final and the Owner has seen them:
1. `node creatives/tools/meta-upload.mjs --check` once per session, then `node creatives/tools/meta-upload.mjs <files>` → image hashes and video ids (ledger `creatives/uploads/<date>-meta-upload.json`).
2. List the files with sizes, numbers, hashes and video ids in the plan file's media table.
3. Update the flight's preview site (`ads.js` in step with the plan's copy table; compressed copies only, never the upload files).
4. Note the storyboard version and QA verdict in `memory.md` (`memory-update`).
