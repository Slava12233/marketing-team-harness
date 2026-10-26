---
name: meta-performance-report
description: "Produce the daily or weekly performance report for the company's Meta campaigns in the account currency with the agreed columns, decision rules and diagnosis order. Use when asked how a campaign is doing, for a report or check-in, or when deciding whether to pause, scale or change anything."
---

# Meta performance report

**Output:** `reports/YYYY-MM-DD-performance.md` (written once, never edited after the Owner has read it) and a short summary in chat. **Language:** the report in English; the chat summary in the chat language from `config/operator.md`; money in the account currency from `config/accounts.md`.

## Pull the data
1. Verify field names once with `ads_get_field_context` if unsure.
2. `ads_get_ad_entities` at `adset` level with `object_ids` of the live ad sets and fields: amount_spent, impressions, reach, frequency, cpm, link_click, outbound_clicks, outbound_clicks_ctr, cost_per_link_click, landing_page_view, cost_per_omni_landing_page_view, lead (or the pixel `Lead` action), cost_per_lead, the messaging result for click-to-WhatsApp cells, learning_stage_info, delivery_sub_status, effective_status. Use `time_range` for the exact window and a second call for the previous window of equal length. (`last_7d` and similar presets exclude today.)
3. Same at `ad` level sorted by amount_spent to rank creatives.
4. Follow any `next_actions` the tool returns (read-only ones) before writing.
5. For trends use `ads_insights_performance_trend`; for peer context `ads_insights_industry_benchmark`; for a running test `ads_experiment_abtest_get_test`.
6. App-side results come from the main session, handed over by the product team (or the Owner) as **counts** by `ref` and `source` per day (each funnel's result as defined in `config/product.md`: sign-ups, bookings, meetings). Never open a database export. If no counts were handed over, the column reads "no data".

## Report format
Header: date range, attribution window (default 7-day click / 1-day view), the account currency, a note that Meta-reported results are platform-attributed and, when `config/product.md` says the pixel fires only after consent, consent-gated (only visitors who accepted send events).

Table per ad set (and a total row): Spend | Impressions | Reach | Frequency | CPM | Outbound clicks | Outbound CTR | CPC | Landing page views | Cost per LPV | Meta results (the funnel's Meta-side result: pixel event, form leads, conversations started) | Cost per Meta result | App results (the funnel's app-side result by ref) | Cost per app result | LPV→result rate.

Second table: previous period, same columns, with deltas.

Third table: ads ranked by spend with CTR, cost per LPV, results, cost per result, frequency.

Then: one paragraph diagnosis, one paragraph recommendation, the list of actions that **Needs the Owner's go**, and the list of requests that **Needs product team** (or the Owner when `config/product-team.md` says there is none).

## Diagnosis order (stop at the first broken link)
1. **Delivery:** is spend pacing to budget? Under 70 % of budget: audience too narrow (special ad category restrictions shrink it), ads in review or disapproved, learning limited. Check `delivery_sub_status`, `ads_get_errors`.
2. **Thumb-stop and click:** outbound CTR. Judge against the account's own first week and the industry benchmark tool, not a borrowed number. Fix order: hook → visual → copy.
3. **Landing page arrival:** LPV ÷ outbound clicks. Below 70 % = slow page or wrong link (check the language path against the destination pages table in `config/product.md`).
4. **Consent and modal friction:** when the destination shows a cookie bar, a popup or a sign-in step before the CTA, paid visitors meet it first. A gap between LPV and results with healthy CTR points at the page, not the ad; the fix is a request to the product team, never an ad edit.
5. **Page conversion:** app results ÷ LPV; for form or meeting funnels, bookings ÷ LPV or bookings ÷ form leads.
6. **Cost per result vs the target the Owner set** (`memory/decisions/` and `memory/business/goals.md`). When `config/company.md` gives no revenue model ("not stated"), there is no break-even to derive; if no target is set, report cost per result and write "no verdict: target not set".

## Decision rules (from the plan, `memory/decisions/` and `memory/business/goals.md`; do not override silently)
- Learning: no judgement on an ad set before 7 days or 1,000+ impressions per ad, whichever is later.
- A/B winner: the pre-registered threshold in `plans/experiments-log.md` (defaults: ≥30 sign-ups or leads per arm and a ≥30 % gap in cost per result; ≥10 meetings or bookings per arm for high-value funnels), confirmed by the experiment tool. Otherwise "no winner yet".
- Frequency above 3 in 7 days with falling CTR = fatigue; recommend new creative, not a budget cut.
- Never recommend a budget change larger than 20 % per step.
- Any change that spends money is a proposal labelled "Needs the Owner's go"; any page or event change is "Needs product team".

## Do not
- Fabricate numbers. If a field returns nothing, write "no data".
- Sum conversions across attribution windows, or add Meta pixel events to app counts (they measure different things).
- Treat a single-day cost spike as a verdict.
- Put PII in the report: counts by `ref` and `source` only.
