# creatives/: the ad files

What goes here: the exact image and video files uploaded to Meta for the company's ads, one file per concept and aspect ratio, the sources they were rendered from, the preview site of each flight, and the ledger of every upload. Nothing here is a source of truth for the brand: that is `config/brand.md`. How the files are made is the `creative-production` skill; what they must say is the `creative-brief` and `ad-copy` skills; whether they may run is the `compliance-check` skill.

## Naming

`CREATIVE_<id>_<slug>_<ratio>.<ext>`

- `<id>`: `S01`, `S02` … for stills, `V01`, `V02` … for videos; a letter suffix for a close variant (`S01a`, `S01b`).
- `<slug>`: a short lower-case name of the idea (`question-card`, `before-after`).
- `<ratio>`: `1x1` (1080×1080), `4x5` (1080×1350), `9x16` (1080×1920), or `1200x628` for a lead-form cover.
- Examples: `CREATIVE_S01a_question-card_4x5.png`, `CREATIVE_V02_before-after_9x16.mp4`.

## Layout

```
creatives/
  README.md                this page
  tools/                   the tools below
  preview-template/        the Facebook-frame preview site, copied into each flight's preview/
  src/<flight>/            sources: the HTML banner builder (index.html), specs.json, optional brand.json, raw media
  briefs/                  creative briefs (dated)
  uploads/                 <YYYY-MM-DD>-meta-upload.json, the upload ledger written by meta-upload.mjs
  <flight>/                one folder per flight, named <YYYY-MM>-<audience>-flight-<n>
    stills/                the rendered PNG/JPEG files that go to Meta
    video/                 the finished MP4 files that go to Meta
    preview/               the flight's copy of preview-template/ (media/ holds compressed copies only)
    review.html            the creative review page for the Owner (optional)
    compliance-review.md   the compliance-check verdict for this flight's copy and files (or a dated report in reports/ linked from here)
    README.md              what the flight is, its plan file, its numbering
```

Record every uploaded file's `image_hash` or `video_id` in the plan file of that campaign (the ledger in `uploads/` is the backup, not the record).

## The fixed-number rule

Every creative in a flight carries a fixed number (`#1`, `#2` …) from the moment it is first shown to the Owner. The number is a label, not a rank: it never changes, is never reused, and a new creative takes the next free number. The same number appears in the preview site (`ads.js` field `n`), in the plan's copy table, in the numbered recap before a build and in the ad name in Meta. Removing a creative leaves a gap.

## Rules every file obeys

- **Brand** from `config/brand.md`: its colours in their stated roles, its fonts, its logo rules (a logo is never mirrored in a right-to-left layout). No colour or font that the file does not list.
- **Right-to-left languages.** When `config/brand.md` marks a language RTL, follow its RTL rules: no letter-spacing and no faux italics on RTL script, isolate Latin words, numbers and currency amounts, flip directional icons but not play or external-link icons, and check every line by eye after render.
- **AI disclosure.** Every generated or altered image or video of a person, place or product carries the disclosure badge described in `config/brand.md` (its wording, colour and position), generated media is never presented or captioned as a real place, product or person, and the ad carries Meta's AI self-disclosure at the ad level.
- **Nothing extra on the image.** No button or call to action drawn on the picture (Meta renders the ad's own button), no dates, page headings or labels the brief did not ask for. One idea per frame.
- **Claims.** Every figure on a frame carries a visible source and date; nothing from the forbidden list in `config/claims.md`; lines that `config/claims.md` marks "needs clearance" stay off until cleared.
- **Real product screens** blur names, prices and personal data that are not the company's to show.
- **Safe zones.** Keep text inside the central safe box of the builder (the overflow guard enforces it); 9:16 files keep the top and bottom 14 % free of text.

## Tools (`creatives/tools/`)

| Tool | What it does | Run |
|---|---|---|
| `render-stills.mjs` | Renders a flight's HTML banner builder (`creatives/src/<flight>/index.html` + `specs.json`, optional `brand.json`) to `CREATIVE_<id>_<slug>_<ratio>.png`; exits 2 when a frame's type overflows its safe box | `timeout 300 node creatives/tools/render-stills.mjs --src creatives/src/<flight> --out creatives/<flight>/stills` |
| `meta-upload.mjs` | Uploads local images and videos to the ad account named by `META_AD_ACCOUNT_ID` in the repository-root `.env`; prints `image_hash` / `video_id`; writes the ledger in `uploads/`; `--check` verifies the token and account (names only); `--dry-run` | `node creatives/tools/meta-upload.mjs <files...>` |
| `ad-shots.sh` | Captures Meta's own previews (`ads_get_ad_preview` → `preview_url`) as 520×680 PNGs with headless Edge or Chrome: the way an ad in the account is shown to the Owner | `bash creatives/tools/ad-shots.sh <out_dir> <name>=<url> ...` |
| `ad-card.mjs` | Prints a planned ad (not yet in the account) from a flight's `preview/ads.js` as JSON with a small JPEG, for a chat widget card | `node creatives/tools/ad-card.mjs <number> <flight>` |

Run renders and browser sweeps with a time bound (`timeout N` first) and one at a time. Each tool prints its full usage with `--help` (or no arguments).
