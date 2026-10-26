---
type: business
created: 2026-10-26
updated: 2026-10-26
status: active
maintained_by: harness
categories: [business, money]
summary: "FICTIONAL EXAMPLE. Band £600-£1,500 a month; £12 per trial target for Members; caps £60 a day, £420 a week, £1,500 a month, £750 per campaign; success = 40 trials at £12 or less in 30 days."
as_of: 2026-10-26
source: config/goals.md (round (i) of /setup)
---

# Goals and money

> FICTIONAL EXAMPLE. Every amount is invented. Filled by `/setup` from `config/goals.md` on 2026-10-26.

Currency: GBP (from `config/accounts.md`). `build-hot.mjs` copies the caps of `config/goals.md` into `dashboard/state.json`; this note is its fallback.

## What the Owner has set

| Item | Value | Since | Source |
|---|---|---|---|
| Monthly budget band | £600–£1,500 a month | 2026-10-26 | config/goals.md |
| Target cost per result (per funnel) | Members £12 per trial started; Corporate not stated yet (after the first week of data) | 2026-10-26 | config/goals.md |
| First funnel to launch | Members (the pixel already records `StartTrial`) | 2026-10-26 | config/goals.md |
| Budget step | +20 % per step, 48–72 h apart, on the Owner's go | 2026-10-26 | the harness's scaling rules |
| Who pauses | the Owner, on a click list; the harness when the Owner asks in chat | 2026-10-26 | [[2026-10-26-the-owner-pauses]] |

## Caps in force

| Cap | Amount | Set by |
|---|---|---|
| Daily (all campaigns together) | £60 | the Owner, 2026-10-26 |
| Weekly (all campaigns together) | £420 | the Owner, 2026-10-26 |
| Monthly (all campaigns together, calendar month) | £1,500 | the Owner, 2026-10-26 |
| Per campaign (its lifetime spending limit) | £750 | the Owner, 2026-10-26 |

The harness never proposes a budget above a cap; a cap change is the Owner's, in writing. Meta's weekly cap on daily budgets is 7× per Sunday–Saturday week ([[2026-10-21-weekly-cap-is-seven-times-daily-budget]]).

## Success in 30 days

- Within 30 days of the first activation, at least 40 seven-day trials started from Meta (counted by `ref`) at £12 or less on average, every cap respected; and a known cost per booked call once the corporate campaign has run a week. Risk appetite: up to 20 % of the band for tests, none in the first week.

## Review cadence

- `/morning` 08:30 Mon–Fri, `/sync` 18:00 Mon–Fri, `/next-round` Monday 10:00 (Europe/London); the weekly review in `/next-round`.
