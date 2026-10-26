---
type: campaign
created: 2026-10-27
updated: 2026-10-27
status: paused
maintained_by: harness
categories: [campaigns]
summary: "FICTIONAL EXAMPLE. Members funnel: sales optimised for StartTrial, one ad set Members-GM-25-45, ads #1-#3, all PAUSED with a placeholder budget; waits for the Owner's go."
ids: ["600000000000001"]
funnel: Members
plan: "[[2026-10-26-first-flight-plan]]"
daily_budget: 1.00 GBP placeholder
cap: none on Meta; £750 per campaign in config/goals.md
start: 
end: 
as_of: 2026-10-27T17:10+00:00
source: ads_get_ad_entities
---

# 2026-11-MEMBERS-Trial

> FICTIONAL EXAMPLE. Every id is fake.

## Current state
<!-- Rewritten by the main session after every change; every line true now; the time of the live read in as_of. -->

Read back by id on 2026-10-27 17:10 Europe/London; `ads_get_errors` empty.

| Object | Id | Status | Budget | Note |
|---|---|---|---|---|
| Campaign 2026-11-MEMBERS-Trial | `600000000000001` | PAUSED | — | Sales (conversions), optimised for `StartTrial`; special ad category NONE |
| Ad set Members-GM-25-45 | (in the plan) | PAUSED | 1.00 GBP/day placeholder (Needs the Owner's go) | Greater Manchester radius, 25–45, English, Advantage+ placements, exclude `MemberLogin` 180 days |
| Ad #1 Class-Floor | (in the plan) | PAUSED | — | 4:5 photo, [[2026-11-first-flight]] |
| Ad #2 App-Pass | (in the plan) | PAUSED | — | 4:5 app screenshot |
| Ad #3 Tour-30s | (in the plan) | PAUSED | — | 9:16 video |

## Decision rules
- [[2026-10-26-funnels-never-share-a-campaign]] · [[2026-10-26-the-owner-pauses]]

## Links
Plan: [[2026-10-26-first-flight-plan]] · Reports: [[2026-10-28-morning]] · Flight: [[2026-11-first-flight]] · Experiments: [[2026-11-members-photo-vs-app-screen]] (planned)

## Log
<!-- Dated bullets, append-only, newest last. -->
- 2026-10-27 — built PAUSED on the Owner's numbered picks #1–#3; compliance PASS; read back 17:10, all PAUSED, errors empty
