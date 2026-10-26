---
type: contract
created: 2026-10-26
updated: 2026-10-27
status: active
maintained_by: harness
categories: [audiences]
summary: "One note per audience or targeting idea: spec, ids, size with as_of, where used, verdicts."
---

# audiences/

One note per audience or targeting idea, made from `memory/templates/audience.md`: the spec (locations, languages, ages, exclusions, custom audiences by name), the targeting ids, the size with `as_of` and `source` (sizes come from the Ads Manager editor, never invented), where it is used and its verdicts. Who the company markets to is in [[business/audiences|the audiences business note]]; this folder holds the Meta-side specs.

A custom audience or lookalike gets its note the turn it is created, named exactly as the audience (`<company short>_<source>_<window>_<date>.md`): its id in `ids`, the subtype and rule in words, the retention, `size` (`approximate_count`) and readiness (`delivery_status`) with `as_of` and `source` (the live `ads_get_custom_audience` read), and the ladder plan row it came from (`plans/<date>-audience-ladder.md`). Sizes and statuses are re-read live before they drive an action.
