---
type: campaign
created: 2026-10-29
updated: 2026-10-29
status: paused
maintained_by: harness
categories: [campaigns]
summary: "Pipeline test campaign 'TEST — harness pipeline — do not activate': fal creatives → compliance → upload → PAUSED click-to-WhatsApp build; never activated, left paused by the Owner's choice."
ids: ["120249096272270532", "120249096273870532", "120249096283730532", "120249096284360532"]
funnel: developers-whatsapp
plan: "plans/2026-10-29-test-flight-0.md"
daily_budget: "₪25 (CBO, never switched on)"
cap: "spend cap ₪750"
start: none
end: none
as_of: 2026-10-29 20:3x Asia/Jerusalem
source: ads_get_ad_entities, ads_get_errors
---

# TEST — harness pipeline — do not activate

## Current state

Read live 2026-10-29 20:3x (ads_get_ad_entities by id; ads_get_errors returned none). Nothing of this campaign may be activated: it is a test, and the Owner chose to leave it paused (deleting it is his click in Ads Manager).

| Object | Id | Status | Budget | Note |
|---|---|---|---|---|
| Campaign | `120249096272270532` | PAUSED | ₪25/day CBO, spend cap ₪750 | OUTCOME_ENGAGEMENT, special ad categories none |
| Ad set "TEST — IL developers — WhatsApp" | `120249096273870532` | PAUSED | — | CONVERSATIONS → WHATSAPP, Page `108204445697760`, IL home+recent, age 25+, Advantage+ audience on |
| Ad #T1 still | `120249096283730532` | PAUSED (effective IN_PROCESS) | — | creative `1153570963992768`, image `591e20b896ac3fd4bea0d0d41612ab67`, pre-filled message "#T1" |
| Ad #T2 video | `120249096284360532` | PAUSED (effective IN_PROCESS) | — | creative `1145090911200566`, video `1840705657062222`, thumbnail `591e20b896ac3fd4bea0d0d41612ab67`, pre-filled message "#T2" |

## Decision rules

- [[2026-10-29-shared-ad-account-own-campaigns-only]]
- Never activated (the Owner's ask: a pipeline test only).

## Links

Plan: `plans/2026-10-29-test-flight-0.md` · Compliance: `creatives/2026-10-test-developers-flight-0/compliance-review.md` · Files: `creatives/2026-10-test-developers-flight-0/`

## Log

- 2026-10-29 — created PAUSED as real objects (not drafts) although the MCP tool texts said "draft mode"; two ads built with inline `object_story_spec`, `page_welcome_message` at the `object_story_spec` level, the eleven opt-outs and AI self-disclosure OPT_IN; read back by id, no errors.
- 2026-10-29 — render check: Meta's Facebook Feed preview shows #T1 with the headline "דברו איתנו בוואטסאפ" and the WhatsApp button; #T2 shows Meta's default headline "Contact Habait - Home is Habait" instead of the `video_data.title` sent (unverified cause).
