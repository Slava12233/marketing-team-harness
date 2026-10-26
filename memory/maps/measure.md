---
type: map
created: 2026-10-26
updated: 2026-10-26
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

## Output
Reports go to `reports/YYYY-MM-DD-<topic>.md` with the contract frontmatter (`type: report`, `campaign_ids`); proposed learnings to [[proposals]].
