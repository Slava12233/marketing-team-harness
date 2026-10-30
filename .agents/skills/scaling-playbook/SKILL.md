---
name: scaling-playbook
description: "Rules for scaling, consolidating, pausing and refreshing the company's Meta campaigns once a winner exists: budget steps, learning-phase protection, fatigue and structure. Use when asked to scale, increase budget, do more of what works, or when results plateau."
---

# Scaling playbook

**Output:** a scale proposal in the current plan (`plans/`) or the day's report (`reports/`), labelled "Needs the Owner's go"; after the go, the new budget in `memory.md` "Current state". **Language:** files in English; chat in the chat language from `config/operator.md`; money in the account currency from `config/accounts.md`.

## Preconditions before any scale
- Cost per result at or below the target the Owner set (`memory/decisions/` and `memory/business/goals.md`), for 7 consecutive days, with at least 30 results (sign-ups or leads) or 10 booked meetings in the window (use the funnel's result from `config/product.md`).
- The result event verified (`signals-audit` pass) and the app-side count agreeing in direction with Meta's.
- At least 3 distinct creative concepts live, one of them new in the last 14 days.
- The Owner's go for the budget change, stated as "from X to Y <currency>/day" in the phrasing from `config/operator.md`.

## Budget steps
- +20 % per step, 48–72 h between steps, at a consistent time of day. Larger jumps reset learning.
- Scale the ad set, not a copy of it. Do not duplicate winners into new ad sets (auction overlap).
- Cap: scale until cost per result approaches the target, then hold and work on creative and page conversion (requests to the product team) instead. Without a revenue model in `config/company.md` there is no revenue-based break-even; the target is the Owner's number.
- State the weekly worst case with every step: Meta may spend up to 7× a daily budget per Sunday–Saturday week, prorated.

## Structure as spend grows
- Below the structure threshold the Owner records as a decision note in `memory/decisions/` (ask once when the first scale is proposed; a threshold is a daily spend in the account currency): one campaign per funnel, one or two cold ad sets, one retargeting ad set.
- Above it: consider CBO for the scaling campaign with the proven creatives, and a separate ABO testing campaign at 20–30 % of spend for new concepts.
- Retargeting at 10–20 % of cold spend with a different message per rung (when the pixel is consent-gated the pool is consented visitors only, so it fills slowly).
- Special ad category audiences (`config/claims.md`) are broad by design; scaling them usually means more creative and more geo, not more signals.

## Fatigue and refresh
- Frequency > 3 in 7 days with CTR down 25 % from its first week = fatigue. Replace the creative concept, not only the headline.
- Launch 2–3 new concepts every two weeks while scaling (a new creative is a new ad; creatives are immutable).
- Retire an ad after 1,000+ impressions if its cost per LPV is 2× the ad set average.

## Pausing rules (report immediately; the Owner pauses unless they asked the harness to)
- Disapproved ad, broken landing page, pixel not firing after consent, spend with zero LPV for a day, a destination page whose consent or notice text changed: name the affected object, give the click list, and pause it when the Owner says so in chat. Pausing needs no spend go.
- A switch day (a launch date or a destination change in the plan or `config/company.md`): ad sets that carry a promise the site no longer makes end on schedule; if any still runs after the switch, it is a pause finding.
- A bad day is not a reason to pause; three bad days with the diagnosis pointing at the creative is a reason to replace the creative.

## Reporting a scale decision
State: current daily spend and cost per result, proposed spend, expected results per day at the current cost, the risk (learning reset, cost drift, audience saturation under a special ad category), and the rollback (set the budget back to X).
