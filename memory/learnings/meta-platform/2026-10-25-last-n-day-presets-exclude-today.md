---
type: learning
created: 2026-10-25
updated: 2026-10-25
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "In the MCP and in Ads Manager the last_7d, last_14d and last_30d presets exclude today; a campaign that started today shows an empty row; use today or maximum."
applies_to: [meta, reads]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# last_7d / last_14d / last_30d exclude today

**The fact.** `last_7d` / `last_14d` / `last_30d` exclude today in the MCP and in Ads Manager (a campaign that started today shows an empty row under them; use `today` or `maximum`).

**Evidence.** Observed on a single company's ad account on 2026-10-25; ported to this template on 2026-10-26.

**How to apply.** For a new campaign read `today` or `maximum`; never report "no data" from a `last_*` preset on day one.
