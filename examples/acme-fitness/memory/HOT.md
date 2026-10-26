---
type: state
created: 2026-10-27
status: active
maintained_by: generated
categories: [memory]
summary: What every session must know, generated from the vault notes; injected by the SessionStart hook.
generated_at: 2026-10-27T17:30+00:00
content_hash: 2c07fcf67dff312d
---

# HOT

Never hand-edit; run node memory/tools/build-hot.mjs
Read the note before you act; re-read live before you change; names and public ids only

## Now · [[current]] · as_of 2026-10-27T17:10+00:00
Plan to read first: [[2026-10-26-first-flight-plan]]
Next actions:
1. Harness: `/morning` at 08:30, then the signals audit (`StartTrial` received on pixel `400000000000001` in the last 24 h)
2. Harness: send renders of #1–#5 to the Owner as images (`ads_get_ad_preview` → `ad-shots.sh`)
3. Owner: the budgets, caps and dates in the plan, then the go in the phrasing of `config/operator.md`
Campaigns, active or paused (2):
- [[2026-11-MEMBERS-Trial]] · `600000000000001` · PAUSED · 1.00 GBP placeholder (Needs the Owner's go) · none on Meta (the £750 per-campaign cap of [[business/goals\|goals]] applies) · not set · not set · 1 (`Members-GM-25-45`) · 3 (#1, #2,…
- [[2026-11-CORPORATE-Call]] · `600000000000002` · PAUSED · 1.00 GBP placeholder (Needs the Owner's go) · none on Meta (the £750 per-campaign cap applies) · not set · not set · 1 (`Corporate-GM-HR`) · 2 (#4, #5) PAUSED · 2026-10-27 17:10

## Money vs caps · config/goals.md
- Daily (all campaigns together) · Amount £60 · Set by Jordan Lee (fictional), Owner, 2026-10-26
- Weekly (all campaigns together) · Amount £420 · Set by Jordan Lee (fictional), Owner, 2026-10-26
- Monthly (all campaigns together, calendar month) · Amount £1,500 · Set by Jordan Lee (fictional), Owner, 2026-10-26
- Per campaign (its lifetime spending limit) · Amount £750 · Set by Jordan Lee (fictional), Owner, 2026-10-26

## Open items by owner (3)
- owner · [[budgets-and-go-for-the-first-flight]] · FICTIONAL EXAMPLE. The daily budgets, caps and dates of both campaigns, then the go in the phrasing of config/operator.md; Members first.
- owner · [[domain-verification-gates-corporate]] · FICTIONAL EXAMPLE. Verify acmefitness.example in Business Settings → Brand safety → Domains; the corporate campaign waits for it.
- harness · [[signals-audit-start-trial]] · FICTIONAL EXAMPLE. Signals audit: confirm pixel 400000000000001 received StartTrial in the last 24 h before any go on Members.

## Newest learnings (5)
- 2026-10-27 · [[2026-10-27-age-floor-is-a-control-ceiling-a-suggestion]] · FICTIONAL EXAMPLE. The members ad set reads Advantage+ audience with age 25-45: the floor of 25 holds as a control, the ceiling of 45 is only a suggestion; quote sizes f…
- 2026-10-27 · [[2026-10-27-headline-text-never-repeated-on-the-image]] · FICTIONAL EXAMPLE. The brand rule 'no text on the image that repeats the headline' sent #5 Usage-Report's card back once before the build: the card now shows the report,…
- 2026-10-27 · [[2026-10-27-placeholder-budget-is-the-minimum]] · FICTIONAL EXAMPLE. Paused builds carry the account's minimum daily budget (1.00 GBP) as a placeholder; the real budget is set only with the go, and the Owner's £20/day i…
- 2026-10-27 · [[2026-10-27-uploads-by-public-url-until-the-token]] · FICTIONAL EXAMPLE. Without the System User token meta-upload.mjs --check fails, so the first flight's five files went up by public URL through the MCP; switch to direct…
- 2026-10-26 · [[2026-10-26-page-welcome-message-exact-spec]] · The exact page_welcome_message object a click-to-WhatsApp ad takes at the object_story_spec level (VISUAL_EDITOR v2, autofill_message); inside link_data the call fails w…

## Lane maps
measure `memory/maps/measure.md` · create `memory/maps/create.md` · gate `memory/maps/gate.md` · build `memory/maps/build.md` · close `memory/maps/close.md`
