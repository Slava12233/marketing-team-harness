---
type: campaign
created: 2026-10-27
updated: 2026-10-27
status: paused
maintained_by: harness
categories: [campaigns]
summary: "FICTIONAL EXAMPLE. Corporate wellness funnel: leads on instant form 500000000000001, one ad set Corporate-GM-HR, ads #4-#5, all PAUSED; stays paused until domain verification."
ids: ["600000000000002"]
funnel: Corporate wellness
plan: "[[2026-10-26-first-flight-plan]]"
daily_budget: 1.00 GBP placeholder
cap: none on Meta; £750 per campaign in config/goals.md
start: 
end: 
as_of: 2026-10-27T17:10+00:00
source: ads_get_ad_entities
---

# 2026-11-CORPORATE-Call

> FICTIONAL EXAMPLE. Every id is fake.

## Current state
<!-- Rewritten by the main session after every change; every line true now; the time of the live read in as_of. -->

Read back by id on 2026-10-27 17:10 Europe/London; `ads_get_errors` empty.

| Object | Id | Status | Budget | Note |
|---|---|---|---|---|
| Campaign 2026-11-CORPORATE-Call | `600000000000002` | PAUSED | — | Leads, instant form `500000000000001`; special ad category NONE |
| Ad set Corporate-GM-HR | (in the plan) | PAUSED | 1.00 GBP/day placeholder (Needs the Owner's go) | Greater Manchester, HR and office-manager job titles, English |
| Ad #4 Team-Class | (in the plan) | PAUSED | — | 4:5 photo, LEARN_MORE |
| Ad #5 Usage-Report | (in the plan) | PAUSED | — | 4:5 type-led card, LEARN_MORE |

## Decision rules
- [[2026-10-26-corporate-waits-for-domain-verification]] · [[2026-10-26-funnels-never-share-a-campaign]] · [[2026-10-26-the-owner-pauses]]

## Links
Plan: [[2026-10-26-first-flight-plan]] · Reports: [[2026-10-28-morning]] · Flight: [[2026-11-first-flight]] · Open: [[domain-verification-gates-corporate]]

## Log
<!-- Dated bullets, append-only, newest last. -->
- 2026-10-27 — built PAUSED on the Owner's numbered picks #4–#5; compliance PASS; read back 17:10, all PAUSED, errors empty
