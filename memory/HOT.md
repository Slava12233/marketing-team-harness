---
type: state
created: 2026-10-29
status: active
maintained_by: generated
categories: [memory]
summary: What every session must know, generated from the vault notes; injected by the SessionStart hook.
generated_at: 2026-10-29T21:14+02:00
content_hash: 15a396279119cef5
---

# HOT

Never hand-edit; run node memory/tools/build-hot.mjs
Read the note before you act; re-read live before you change; names and public ids only

## Now · [[current]] · as_of 2026-10-29 19:45 Asia/Jerusalem
Plan to read first: plans/2026-10-29-first-flight-plan.md
Next actions:
1. `/health` (the full check; the onboarding now runs as `/connect` then `/campaign`, decision [[2026-10-29-onboarding-in-two-parts]])
2. The Owner's open clicks in `checklist.md` (two-factor first)
3. The first flight through `/campaign` steps 2–9: the market research → the plan's recap and the Owner's picks → copy → compliance → still + silent video → upload → build PAUSED → previews (per `plans/2026-10-29-first-flight-plan.md`)
Campaigns, active or paused (1):
- [[test-harness-pipeline]] (pipeline test, never activate) · `120249096272270532` · PAUSED · ₪25 CBO (never on) · spend cap ₪750 · none · none · 1 (`120249096273870532`) · 2 (`120249096283730532`, `120249096284360532`) · 2026-10-29 20:3x

## Money vs caps · config/goals.md
- Daily (all campaigns together) · Amount ₪40 · Set by slava lebovkin, 2026-10-29
- Weekly (all campaigns together) · Amount ₪280 · Set by slava lebovkin, 2026-10-29
- Monthly (all campaigns together, calendar month) · Amount ₪1,000 · Set by slava lebovkin, 2026-10-29
- Per campaign (its lifetime spending limit) · Amount ₪1,000 · Set by slava lebovkin, 2026-10-29

## Open items by owner (0)
- none

## Newest learnings (5)
- 2026-10-27 · [[2026-10-27-code-200-api-access-blocked-is-the-developer-account]] · HTTP 400 code 200 'API access blocked' on GET /me with a System User token means Meta blocked the developer account of the app's admin ('Account confirmation needed'), n…
- 2026-10-27 · [[2026-10-27-page-must-be-assigned-to-the-system-user]] · A System User token with pages_* permissions still gets code 10 on every Page endpoint until the Page itself is assigned to the System User (Business Settings → System u…
- 2026-10-26 · [[2026-10-26-page-welcome-message-exact-spec]] · The exact page_welcome_message object a click-to-WhatsApp ad takes at the object_story_spec level (VISUAL_EDITOR v2, autofill_message); inside link_data the call fails w…
- 2026-10-26 · [[2026-10-26-whatsapp-inbox-reads]] · In WhatsApp Business Web each click-to-WhatsApp chat carries the ad card above the first message, the only per-lead attribution; many chats open with Meta's default pre-…
- 2026-10-25 · [[2026-10-25-activation-sequence-that-worked]] · Scalar start_time edit on the ad set, then ads_activate_entity on the ads, the ad set and the campaign; ads still IN_PROCESS went active within three minutes; a set with…

## Lane maps
measure `memory/maps/measure.md` · create `memory/maps/create.md` · gate `memory/maps/gate.md` · build `memory/maps/build.md` · close `memory/maps/close.md`
