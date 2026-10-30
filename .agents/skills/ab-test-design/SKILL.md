---
name: ab-test-design
description: "Design, size and judge the company's Meta experiments (creative, audience, destination, offer) with pre-registered decision rules, run through Meta Experiments. Use when planning a test, asking which arm won, or deciding whether to extend or stop a test."
---

# A/B test design on Meta

**Output:** every test in `plans/experiments-log.md` (design, dates, arms, result, decision); verdicts in the weekly report (`reports/`). **Language:** files in English; chat in the chat language from `config/operator.md`; money in the account currency from `config/accounts.md`.

## Design
1. Hypothesis template: Because [observation], we believe [change] will [effect] for [audience]; we will know when [primary metric] moves by [minimum detectable effect] with [secondary metrics] unchanged and [guardrail] not worse.
2. One variable per test. Arms identical in everything else (audience, creative, budget, schedule, pixel, attribution, destination language).
3. Primary metric per funnel, from the result definitions in `config/product.md`: a website sign-up with no pixel event = cost per sign-up (app count by `ref`) with cost per landing page view as the Meta-side proxy until an event exists; a sign-up with a pixel event = cost per that event; a booking or meeting funnel = cost per booked meeting (app count), with cost per form lead or per conversation started as the proxy. Secondary: outbound CTR, cost per LPV, LPV→result rate. Guardrail: spend pacing and frequency.
4. Use Meta Experiments (`ads_experiment_abtest_create_test`) so the split is randomized and non-overlapping. Cells = ad set ids. Earliest start is tomorrow in the account timezone, so give ad sets tomorrow's start when you can. Check eligibility first with `ads_experiment_check_eligibility`. Creating an experiment that changes delivery needs the Owner's go in the same message; `test-designer` designs and judges, it never creates.
5. Budget: equal per arm (ABO). Never CBO inside a test.
6. Page-side variables (hero, popup sequence, fields) are the product team's to build; design the test, file the request in `plans/experiments-log.md` labelled "Needs product team", and run the ad-side half only when the page variant exists.

## Sizing (rules of thumb until the account has history)
- Results are the unit of evidence. Volumes are unknown before the first flight; after the first week, replace these defaults with the measured rates.
- Minimum evidence to call a winner on cost per result: ≥30 sign-ups or leads per arm and a ≥30 % relative gap, or ≥10 booked meetings per arm, or Meta's experiment tool reporting ≥80 % confidence with both conditions. Below that: "no winner, extend or stop".
- For CTR-type tests (creative hooks): ≥1,000 impressions per ad and ≥7 days, judge on outbound CTR and cost per LPV, confirm on results later.
- Duration: 14 days default; do not peek-and-stop before day 7. A test whose destination or offer changes on a switch day (a launch date in `config/company.md` or the plan) ends the day before, whatever its state; log it as truncated. Do not extend a finished fixed-horizon test "until significant"; design a new one.

## While running
- Daily: delivery, disapprovals, pacing, frequency. No edits except critical fixes; log any fix in the plan with the date.
- Weekly: write the report (`meta-performance-report`), restate "no winner yet" plainly if so.

## Judging and next step
- Winner: move the losing arm's budget to the winner only on the Owner's go; then test the next variable (creative concept, then destination language, then audience). Keep a test running at all times once the account is live.
- Loser or no difference: keep control, record why, pick the next hypothesis from the backlog (ICE score: impact, confidence, ease, each 1–10).
- Log every test in `plans/experiments-log.md`: name, dates, hypothesis, arms, spend, results per arm, cost per result, result, decision, learning.

## Backlog seeds
Keep the backlog in `plans/experiments-log.md` "Backlog", ICE-scored. Typical first seeds: pain-led hooks against promise-led hooks (pains from `config/audiences.md`), film against static card, instant form against the website page, the destination page's headline (a product-team request), one language against another for a bilingual audience, a new market's arm once `config/claims.md` clears it.
