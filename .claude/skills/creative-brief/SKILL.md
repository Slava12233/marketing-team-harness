---
name: creative-brief
description: "Write creative briefs and review the company's Meta ad images and videos (statics, video, carousels) so each set is genuinely diverse, on brand, direction-correct for right-to-left languages and compliant. Use when planning new creatives, reviewing assets, or briefing the Owner, a designer or a video producer."
---

# Creative brief and review

Output: briefs in `creatives/briefs/<YYYY-MM-DD>-<flight>.md` (or the flight's plan file), written in English with on-image text in its own language; the chat summary is in the chat language from `config/operator.md`.

Read first: `config/brand.md` (colours, fonts, logo rules, tone, languages and direction, RTL rules, AI-imagery disclosure, do-not-do list), `config/product.md` (funnels, destination pages, key copy, existing assets), `config/audiences.md`, `config/claims.md`.

## Why diversity matters
Meta's delivery de-duplicates near-identical creative. Five cards with one layout and one headline count as one ad. A test set needs concepts that differ in **format, visual subject and message**, not only in headline. Options shown to the Owner are **different ideas, not restyles** of one idea: if two options would be described with the same sentence, one of them is not an option.

## Fixed creative numbering
Every creative in a flight carries a fixed number (1, 2, 3 …) from the moment it is first shown. The number is mirrored on the preview site (`creatives/preview-template/`, the flight's `ads.js`), in the plan, in the ad name and in every recap. Numbers are never reused or renumbered; a new creative takes the next free number, and a retired one keeps its number in the record.

## Minimum set for a cold-traffic test round
| # | Concept | Format | What the viewer sees first |
|---|---|---|---|
| 1 | The film | 9:16 cut, 15–30 s, from an existing company film if `config/product.md` lists one (also 1:1 and 16:9) | A person or the product in motion, captions on; any open rights question (real names, music licence, AI voice) closed first |
| 2 | Real product | 9:16 or 1:1 screen recording of the product in use, with private data (names, prices, counters) blurred as the public pages do | A real interaction, a real answer with its source line |
| 3 | Pain card | 1:1 static, text-first, in the brand's main colour with its ink colour from `config/brand.md` | One pain in words (from `config/audiences.md`) and one answer line |
| 4 | The path | 4:5 static or 10 s motion graphic | The steps from the first wish to the outcome as the page lists them, one step highlighted |
| 5 | Launch card (pre-launch only) | 1:1 and 9:16 static | The pre-launch line as written on the page; no date on the image (see below) |

B2B funnels (when `config/product.md` has one): a card with the meeting page's own heading and the call's promise; a 15 s cut showing what the product does for a prospect (only real or clearly badged material).

## Nothing extra on the image
- **No date** on the image or a video frame. Dates live in the primary text, where they can be changed.
- **No button, no call-to-action line and no button shape** on any image or video frame, end card included. Meta renders the ad's own button under the creative; a drawn one is a second button that does nothing and reads as nonexistent functionality under Meta's standards. The image's words end on the message; the ad's button and the form's thank-you button carry the action.
- **No page heading** copied onto the image when it is not the message.
- **AI disclosure is ad-level** (self-disclosure OPT_IN, see `compliance-check`). Whether the on-asset badge from `config/brand.md` is also drawn is the company's rule in `config/brand.md`; when it says "badge on every generated asset", draw it, and it is the only extra element allowed.
- One message per image. No second idea, no platform name, no feature list.

## Video structure (15–30 s)
0–3 s hook (the pain or the product, no logo), 3–8 s the problem, 8–20 s the mechanism on screen, 20–30 s the close.
- The lines must be readable by about 1.5 s: the pain at about 0.3 s, the answer at about 1.2 s. Captions that arrive late are not seen.
- No solid brand-colour end card: the picture stays to the end, a dark mask dims it from about 8.5 s, the lines stay in place and the logo fades in on the mask.
- Captions always on; sound-off first.
- Vertical safe zones: keep text out of the top 250 px and the bottom 300 px on 1080×1920.

## Brand specs (from `config/brand.md`)
- **Colours:** use the roles `config/brand.md` assigns (main, hover, dark ground, ink, accent, text, muted, link). An accent reserved for one role (for example the AI-disclosure badge) is used for nothing else. Text on an accent colour uses the ink `config/brand.md` names for it.
- **Type:** the fonts `config/brand.md` names, per surface. Type on a photograph is white (or the light ink `config/brand.md` names), never the main brand colour; on a pale ground it rests on a dark soft shadow or sits over a darker area of the picture.
- **Logo:** the files and fills `config/brand.md` points to; single fill; **never mirrored** in an RTL layout. The brand name inside each language is written as `config/brand.md` prescribes.
- **Do-not-do list** from `config/brand.md` and the forbidden words from `config/claims.md` apply on the image too. Figures only with a visible source and date on the frame.

## RTL rules (apply when any language in `config/brand.md` is RTL)
- `dir="rtl"` on the canvas; text direction checked on the rendered file, not in the source.
- **No letter-spacing and no italics** on RTL scripts.
- **Isolate** every Latin word, number, date and currency amount per word (`<bdi>` in HTML) so it does not flip or jump to the wrong end of the line.
- **Directional icons flip** in RTL (arrows, chevrons, progress); play and external-link icons do not.
- **The logo is never mirrored.**
- Check at phone size (50% zoom) for clipped glyphs, especially diacritics and descenders.

## Specs and upload
- Feed: 1:1 1080×1080 or 4:5 1080×1350. Stories and Reels: 9:16 1080×1920. Keep text under about 20% of the image for Reels.
- File: PNG or JPG under 30 MB; MP4 H.264 under 4 GB, 30 fps.
- Upload path: `node creatives/tools/meta-upload.mjs <files>` sends images and videos straight to the ad account and returns the image hash or video id (`meta-campaign-build`, "Media uploads"); fallback: a public URL (for example fal's CDN) → `ads_creative_upload_media`. Record hashes and ids in the plan. Files live in `creatives/` with the names in `creatives/README.md`.

## Review checklist for any creative
1. Does the first frame or the top third stop the intended viewer (the audience in `config/audiences.md` at its decision moment), not a generic browser of the category?
2. Is the message one of the approved angles (`ad-copy`), in the destination page's language?
3. Are claims consistent with the page (its steps, its dates, its limits)? Any line from the "needs clearance" list in `config/claims.md`, any figure without a source and date? Remove or HOLD.
4. If any element is AI-generated or altered: the disclosure per `config/brand.md` (badge where required), no real item, place, address or person implied, ad-level self-disclosure OPT_IN.
5. Real screen recordings: private data (names, prices, counters) blurred.
6. Brand: the colour roles, the correct logo, no mirrored logo, no text on a colour `config/brand.md` forbids, a reserved accent only in its role.
7. RTL (when applicable): text direction, isolated numbers and currency amounts, no clipped glyphs at phone size.
8. Legibility on a phone; nothing extra on the image (no date, no button shape, no call-to-action line, no end-card button); type on a photograph is white.
9. Film or reel material: every rights question (real names, music licence, AI voice) closed before public use.
10. Diversity: across the set, the concepts differ in format, visual subject and message.

## Output
A brief per concept: its fixed number, goal, audience moment, hook (text on screen), shot list or layout, copy on the image, aspect ratios to export, file names (`CREATIVE_<NN>_<slug>_<ratio>.<ext>`), the primary text it pairs with (from `ad-copy`), and who produces it (the harness with `creative-production`, a designer, a video producer). Plus a one-table review of existing assets with pass/fix per checklist item.
