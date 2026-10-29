---
type: business
created: 2026-10-26
updated: 2026-10-29
status: active
maintained_by: harness
categories: [business]
summary: "Band ₪500–₪1,000 a month; caps ₪40/day, ₪280/week, ₪1,000/month, ₪1,000 per campaign (Habait's own campaigns on a shared account); target cost not stated yet; filled by /setup 2026-10-29."
evidence: "config/goals.md"
as_of: 2026-10-29
source: "config/goals.md (the Owner's answers in /setup round (i))"
---

# Goals and money

Filled by `/setup` on 2026-10-29 from `config/goals.md`. A change is written to `config/goals.md` first and then here (see [[memory/README|README]] §2).

Currency: ILS (from `config/accounts.md`). `build-hot.mjs` copies the caps of `config/goals.md` into `dashboard/state.json`; this note is its fallback. The caps cover this harness's own campaigns; the ad account is shared with another team ([[2026-10-29-shared-ad-account-own-campaigns-only]]).

## What the Owner has set

| Item | Value | Since | Source |
|---|---|---|---|
| Monthly budget band | ₪500–₪1,000 | 2026-10-29 | config/goals.md |
| Target cost per result (per funnel) | developers-whatsapp: not stated yet, set after the first week of data | 2026-10-29 | config/goals.md |
| First funnel to launch | developers-whatsapp | 2026-10-29 | config/goals.md |
| Budget step | +20 % per step, 48–72 h apart, on the Owner's go | 2026-10-29 | CLAUDE.md |
| Who pauses | the Owner on a click list, or the harness when he asks in chat | 2026-10-29 | config/operator.md |

## Caps in force

| Cap | Amount | Set by |
|---|---|---|
| Daily (all campaigns together) | ₪40 | slava lebovkin, 2026-10-29 |
| Weekly (all campaigns together) | ₪280 | slava lebovkin, 2026-10-29 |
| Monthly (all campaigns together, calendar month) | ₪1,000 | slava lebovkin, 2026-10-29 |
| Per campaign (its lifetime spending limit) | ₪1,000 | slava lebovkin, 2026-10-29 |

The harness never proposes a budget above a cap; a cap change is the Owner's, in writing. Meta's weekly cap on daily budgets is 7× per Sunday–Saturday week ([[2026-10-21-weekly-cap-is-seven-times-daily-budget]]).

## Success in 30 days

- The developers funnel runs 30 days inside the caps, and we know its real cost per conversation and per qualified developer. Tests: up to 20 % of the band.

## Review cadence

- Weekly in `/next-round`, Sunday 10:00 (Asia/Jerusalem); `/morning` 08:30 and `/sync` 18:00 on working days.
