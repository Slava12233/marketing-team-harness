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
5. For trends use `ads_insights_performance_trend`; for a running test `ads_experiment_abtest_get_test`.
6. **Meta's own diagnostics** (reads; each call carries `client_conversation_id`, `client_model`, `advertiser_job` and `advertiser_request`, with `ad_account_id` from `config/accounts.md`; dates as `date_preset` or `date_from` + `date_to`, never both; the same window as the report):
   - `ads_insights_anomaly_signal` (`entity_ids` optional, all of one entity type; omitted = the whole account): spikes and drops, observations not causes.
   - `ads_insights_performance_vs_peers` (`entity_ids` = the ad sets or campaigns; `analysis_metric` `CPR`|`CTR`|`CPM`|`CPC`|`ROAS` only when a question names one): a percentile per metric against a cohort of similar ad sets; higher is always better, cost metrics included; compare within one ad set only; lead with cost per result, the rest are funnel diagnostics.
   - `ads_insights_industry_benchmark` (`entity_ids`; `optimization_goal_override` = the ad set's goal, for example `AD_OPTIMIZATION_GOAL_LEAD_GENERATION`, `_REPLIES`, `_OFFSITE_CONVERSIONS`, `_LANDING_PAGE_VIEWS`; `sub_vertical` only when `config/company.md` states it; `analysis_metric` `CPR`|`RESULT`|`CPC`|`CTR`|`ROAS`|`CPM`|`CVR`; `cas_segment` left out): above the benchmark is always the better standing, so an ad set above it on a cost metric pays less than peers and reads "below benchmark" in cost.
   - `ads_insights_auction_ranking_benchmarks` (`entity_ids`; when two or more ad sets run): auction rank, the bid and ad-quality factors, overlap between ad sets (overlap → consolidate, per the `scaling-playbook`).
   - `ads_get_opportunity_score` (`ad_account_id` only; after `ads_get_ad_entities`, never first): the account-level score 0–100 and a subset of recommendations by `opportunity_score_lift` in points, each with `lift_estimate` and `url`; never a campaign's score.
   - An empty, "not available" or failed answer (common on a small account) is "no data" in its cell, never a guess.
7. App-side results come from the main session, handed over by the product team (or the Owner) as **counts** by `ref` and `source` per day (each funnel's result as defined in `config/product.md`: sign-ups, bookings, meetings). Never open a database export. If no counts were handed over, the column reads "no data".

8. Quote cost per lead and cost per qualified lead per campaign from the flight note's `## Lead counts` (newest rows, with their week and source: Owner's count); "no counts given" when there are none; never edit a written report to add late counts.

## Report format
Header: date range, attribution window (default 7-day click / 1-day view), the account currency, a note that Meta-reported results are platform-attributed and, when `config/product.md` says the pixel fires only after consent, consent-gated (only visitors who accepted send events).

Table per ad set (and a total row): Spend | Impressions | Reach | Frequency | CPM | Outbound clicks | Outbound CTR | CPC | Landing page views | Cost per LPV | Meta results (the funnel's Meta-side result: pixel event, form leads, conversations started) | Cost per Meta result | App results (the funnel's app-side result by ref) | Cost per app result | LPV→result rate | Benchmark (percentile vs peers for cost per result, CTR and CPM where available, as `CPR pN · CTR pN · CPM pN`, plus the industry benchmark standing; "no data" where the tools gave none; empty on the total row, since each ad set has its own cohort).

Under the table: Meta's anomaly flags (entity, metric, direction), the auction note (rank, factor, overlap) and one line "Opportunity score: N/100; top recommendation: <name>, +N points, <url>" (or "no data").

Second table: previous period, same columns, with deltas.

Third table: ads ranked by spend with CTR, cost per LPV, results, cost per result, frequency.

Then: one paragraph diagnosis, one paragraph recommendation, the list of actions that **Needs the Owner's go**, and the list of requests that **Needs product team** (or the Owner when `config/product-team.md` says there is none).

## Diagnosis order (stop at the first broken link)
0. **Meta's view first, before blaming creative or targeting:** anomaly signal (what moved, where) → performance vs peers (which funnel stage trails its cohort: CPM points at the auction, CTR at the ad, the stages after the click at the page) → auction ranking (bid, ad quality, overlap between ad sets) → the activity log (`ads_account_get_activity_logs`, `event_category` `budget`, `status`, `targeting` first; a change by another hand explains a jump before any creative theory does). These are evidence for the steps below, not verdicts.
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
- A percentile vs peers below 25 on the main KPI (cost per result) for 7 days (`date_preset` `last_7d`, past the learning rule above) is a labelled recommendation (**Needs the Owner's go** when it changes spend or delivery, otherwise a creative or page item), never an action. One day below 25 is a note, not a trigger.
- Any change that spends money is a proposal labelled "Needs the Owner's go"; any page or event change is "Needs product team".

## Do not
- Fabricate numbers. If a field returns nothing, write "no data".
- Compare percentiles across ad sets (each has its own cohort), or call the opportunity score a campaign's or an ad set's.
- Sum conversions across attribution windows, or add Meta pixel events to app counts (they measure different things).
- Treat a single-day cost spike as a verdict.
- Put PII in the report: counts by `ref` and `source` only.

## Google Ads (when Google is a platform in `config/operator.md`)
Google gets its own table with the same baseline columns, from `timeout 120 node creatives/tools/google-ads.mjs report --level campaign --range LAST_7_DAYS --out reports/data/<date>-google-campaign.csv` and the previous equal period (`--since` / `--until`): cost, conversions, cost per conversion, CTR, average CPC, impressions, clicks, in `google_currency`. Then one line for both platforms together against the caps, and each against its share. Diagnosis order for Search: impressions (budget, bids, keyword match, approvals) → CTR (the headlines against the searches; the search terms report) → conversion rate (the page, the tag firing) → cost per conversion. Conversions arrive late and on the click date: say so when last week's numbers are young.
