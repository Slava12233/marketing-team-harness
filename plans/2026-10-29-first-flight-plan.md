---
type: plan
created: 2026-10-29
updated: 2026-10-29
status: draft
maintained_by: harness
categories: [plans]
summary: "First flight for Habait: one paused click-to-WhatsApp campaign to real-estate developers in Israel, ₪25/day for 30 days (₪750, inside the ₪500–₪1,000 band and every cap), one still and one silent video; nothing built."
---

# First flight plan — Habait developers, click-to-WhatsApp

Drafted by `/setup` on 2026-10-29. A living document; nothing in it is built.

## 1. Summary

Habait (הבית של כל הבתים בע"מ, Haifa) is a live PropTech / real-estate marketing company in Israel. This harness markets its service to real-estate developers (B2B): small and mid-size residential developers anywhere in Israel, in Hebrew. There is no website: the one funnel, `developers-whatsapp`, sends a click-to-WhatsApp ad to the chat "Habait main", where the Owner answers within an hour on working days. The ad account `1010578430110331` is shared with another team; this flight is Habait's own campaign, and nothing of the other team's is touched ([[2026-10-29-shared-ad-account-own-campaigns-only]]).

## 2. Money

Quoted from `config/goals.md` (ILS):
- Monthly budget band: ₪500–₪1,000.
- Hard caps (this harness's campaigns): daily ₪40, weekly ₪280, monthly ₪1,000, per campaign ₪1,000. Budget week Sunday–Saturday.
- Target cost per conversation: not stated yet (set after the first week of data).
- Tests: up to 20 % of the band.

Every budget below sits inside the band and below every cap. A cap change is the Owner's, in writing.

## 3. Campaign proposal: developers-whatsapp

| Item | Proposal |
|---|---|
| Objective | `OUTCOME_ENGAGEMENT`, conversion location WhatsApp, optimisation for conversations (confirm the field values with `ads_get_field_context` at build time) |
| Audience and geo | Real-estate developers, Israel (all regions), `location_types ["home","recent"]`; Hebrew; no detailed targeting on click-to-WhatsApp sets (Meta applies Advantage+ detailed targeting itself, [[2026-10-21-whatsapp-ads-have-no-detailed-targeting]]): the audience is held by controls (Israel, Hebrew as an Advantage+ language control per [[2026-10-25-advantage-plus-languages-are-a-control]], minimum age 25) and by the copy speaking to developers; exclude nothing named; read the set's audience panel in Ads Manager before trusting the spec |
| Special ad category | NONE: a B2B service to companies, no home offered to people (config/claims.md). Confirm in Ads Manager before the build; if an ad shows a specific apartment or project, declare HOUSING |
| Placements | Advantage+ placements (Facebook and Instagram feeds, Stories, Reels) |
| Language and destination | Hebrew → WhatsApp "Habait main"; `page_welcome_message` in Hebrew carrying a ref code per ad (`#D1` for ad 1, `#D2` for ad 2); no website, no `utm_*` |
| Lead path | the chat in the WhatsApp Business app "Habait main"; the Owner answers within 1 hour, Sunday–Thursday; off-hours reply and qualification script from the `lead-response-kit` skill before launch |
| Budget | **₪25/day** for 30 days = ₪750 (inside the band; under the ₪40 daily cap; ₪175/week under the ₪280 weekly cap; above Meta's ₪3.14 minimum); campaign spending limit **₪750** (under the ₪1,000 per-campaign cap). **Needs the Owner's go** |
| Schedule | start: on the Owner's go; end: start + 30 days |
| Creative needs | **One still** (1:1 and 4:5, navy #041F6E / white, Heebo, HABAIT logo, one Hebrew hook line, no button drawn, no price or date) and **one silent video** of 10–15 s made from the still and its hook line (a 9:16 master and a 4:5 cut, rendered locally with the HyperFrames plugin per `creative-production` §4a). Real images only, or generated ones with the badge "הדמיה" and OPT_IN |
| Tracking | no pixel (none needed: Meta counts conversations); the ref codes in the pre-filled messages; the Owner's weekly counts (conversations, qualified, meetings) via `lead-quality` |

### Media table (empty until the upload)

| # | File | Format | image_hash / video_id | Thumbnail hash |
|---|---|---|---|---|
| 1 | still | 1:1 + 4:5 | | |
| 2 | silent video | 9:16 + 4:5 | | the still's hash |

## 4. Sequence to launch

1. `signals-audit` (no website: the audited state is "no pixel; Meta counts conversations"; check the WhatsApp link on the Page)
2. Copy (`ad-copy`): hooks, primary text, headline, the pre-filled message, in Hebrew, plural "אתכם"
3. Creative brief and production (`creative-brief`, `creative-production`): the still, then the video from it
4. Compliance gate (`compliance-check`): every string PASS
5. Upload (`meta-upload.mjs`): the still → `image_hash`; the video → `video_id`; the video's thumbnail is the still's hash
6. Build PAUSED (`meta-campaign-build`, "The first flight"): one campaign, one ad set, **two ads** (#1 the still as a single-image ad, #2 the video with its thumbnail), the eleven feature opt-outs, `page_welcome_message` at the `object_story_spec` level
7. Render check: `ads_get_ad_preview` for both ads → `ad-shots.sh`, both in one call → images to the Owner
8. Numbered recap → a grill-me interview if the Owner asks → the spend statement (₪25/day, ₪175/week, spending limit ₪750, end date) → the Owner's go in the same message → activate → re-read live and `ads_get_errors`; one row in `memory/money/go-log.md`

## 5. Compliance gate

- Allowed: only the Page-bio claims in `config/claims.md` (PropTech platform connecting developers in Israel with buyers worldwide; AI agent).
- Blocked: sales, sell-out, prices, yields, returns; "מובטח", "ללא סיכון", "הכי טוב", "מספר 1"; advice or licence claims; figures without a source; any reference to the viewer's finances.
- Needs clearance (HOLD for the Owner or a lawyer): "ללא עמלת תיווך".
- Brokerage: never present Habait as a broker unless the Owner confirms a licence (verify with your lawyer).

## 6. Open questions

| Question | Who answers |
|---|---|
| The developer-facing promise (the bio line is buyer-oriented): final wording | the Owner, from the copywriter's options |
| Any incentive in the ask (a call, a free assessment)? | the Owner |
| May "ללא עמלת תיווך" be used, and on what basis? | the Owner, with a lawyer |
| Brand colours and Heebo confirmed; logo files supplied | the Owner |
| Which past ads in the account are Habait's (reusable media)? | the Owner |
| Revenue model (not stated) | the Owner |
| The special ad category confirmed as NONE in Ads Manager | the harness at build time, the Owner on doubt |
