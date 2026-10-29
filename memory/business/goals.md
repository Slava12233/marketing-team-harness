---
type: business
created: 2026-10-26
updated: 2026-10-26
status: draft
maintained_by: harness
categories: [business, money]
summary: "Goals and money: the monthly band, the target cost per result per funnel, the first funnel, the hard caps and the caps in force, success in 30 days, the review cadence; filled by /setup from config/goals.md."
as_of: 
source: config/goals.md
---

# Goals and money

Template: `/setup` fills this note from `config/goals.md` and the interview, then sets `status: active`. Until then every `<fill at /setup>` is empty. After setup, a change is written to `config/goals.md` first and then here (see [[memory/README|README]] §2).

Currency: `<fill at /setup>` (from `config/accounts.md`). `build-hot.mjs` copies the caps of `config/goals.md` into `dashboard/state.json`; this note is its fallback.

## What the Owner has set

| Item | Value | Since | Source |
|---|---|---|---|
| Monthly budget band | `<fill at /setup>` | | config/goals.md |
| Target cost per result (per funnel) | `<fill at /setup>` | | config/goals.md |
| First funnel to launch | `<fill at /setup>` | | config/goals.md |
| Budget step | `<fill at /setup>` | | |
| Who pauses | `<fill at /setup>` | | config/operator.md |

## Caps in force

| Cap | Amount | Set by |
|---|---|---|
| Daily (all campaigns together) | `<fill at /setup>` | |
| Weekly (all campaigns together) | `<fill at /setup>` | |
| Monthly (all campaigns together, calendar month) | `<fill at /setup>` | |
| Per campaign (its lifetime spending limit) | `<fill at /setup>` | |

The harness never proposes a budget above a cap; a cap change is the Owner's, in writing. Meta's weekly cap on daily budgets is 7× per Sunday–Saturday week ([[2026-10-21-weekly-cap-is-seven-times-daily-budget]]).

## Success in 30 days

- `<fill at /setup>` (one measurable sentence; and the risk appetite for tests)

## Review cadence

- `<fill at /setup>` (the routine times of `config/operator.md`; the weekly review in `/next-round`)
