---
type: map
created: 2026-10-26
updated: 2026-10-27
status: active
maintained_by: harness
categories: [maps, measure]
summary: "The Measure lane map - performance-analyst, signals-auditor and cro-auditor: what to read before a report, an audit or a signals check."
---

# Measure lane (performance-analyst, signals-auditor, cro-auditor)

## Read first, every lane
- `memory/HOT.md` (in your context from the SessionStart hook; read it if not)
- [[current]] (`memory/state/current.md`: account facts, the campaigns table, next actions)
- [[business/goals|goals]] (money: the band, the targets, the caps)
- [[claims-and-compliance]] and [[business/audiences|audiences]] before any copy, creative or targeting work
- the notes under `memory/tooling/` when a tool question comes up

## Campaigns and their verdicts
- every campaign note in `memory/campaigns/` and the campaigns base [[campaigns.base]]

## Experiments (pre-registered rules and verdicts)
- every note in `memory/experiments/` (the experiments base: [[experiments.base]]) and `plans/experiments-log.md`

## Funnels, pixel, attribution
- [[funnels]] · [[where-product-truth-lives]] · `config/accounts.md` (pixel, attribution parameters, lead delivery)

## Learnings on reads and money
- every note under `learnings/money/`
- [[2026-10-25-last-n-day-presets-exclude-today]] · [[2026-10-25-whatsapp-ad-metrics-meaning]] · [[2026-10-25-mixed-optimisation-goals-show-multiple-conversions]] · [[2026-10-21-weekly-cap-is-seven-times-daily-budget]]

## Meta's own diagnostics (reads; parameters in the `meta-performance-report` skill)
| Tool | What it answers | Where the readout goes |
|---|---|---|
| `ads_insights_anomaly_signal` | spikes and drops on the account, campaigns, ad sets or ads (observations, not causes) | the morning report's section 4a and the breakage row "Anomaly flagged by Meta"; the performance report under its table |
| `ads_insights_performance_vs_peers` | a percentile per metric against similar ad sets (higher is better, cost metrics included; within one ad set only) | the Benchmark column; the next-round peers readout and recap |
| `ads_insights_industry_benchmark` | above or below the benchmark per metric for the ad set's optimisation goal | the Benchmark column; section 4a |
| `ads_insights_auction_ranking_benchmarks` | auction rank, bid and ad-quality factors, overlap between ad sets | the auction note (section 4a, the performance report, the next-round brief) |
| `ads_get_opportunity_score` | the account-level score 0–100 and recommendations by points | one line in section 4a and in the performance report; never a campaign's score |
| `ads_account_get_activity_logs` | who changed what (`budget`, `status`, `targeting` first) | section 2 of the morning report; a change by another hand is a finding |

Readouts go into the report only. They never enter a campaign, flight or state note as figures; a finding worth keeping goes to [[proposals]] with `as_of` and `source` (the tool and the window). "No data" is a valid readout; a guess is not.

## Output
Reports go to `reports/YYYY-MM-DD-<topic>.md` with the contract frontmatter (`type: report`, `campaign_ids`); proposed learnings to [[proposals]].
