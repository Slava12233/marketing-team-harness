---
type: learning
created: 2026-10-20
updated: 2026-10-20
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "The MCP has no lead-form tool and returns no lead rows; instant-form ids come from Meta Business Suite's forms library."
applies_to: [meta, creatives]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# There is no lead-form tool in the MCP; form ids come from Business Suite

**The fact.** No lead-form tool: instant-form ids come from Meta Business Suite's forms library. The MCP also gives no lead rows (leads are read in Meta's Leads Center, or downloaded as CSV from the forms library). Targeting ids come from the account's own earlier ad sets or from the Ads Manager editor ([[2026-10-12-no-targeting-search-tool]]).

**Evidence.** Observed on a single company's ad account on 2026-10-20; ported to this template on 2026-10-26.

**How to apply.** A new instant form is the Owner's console work; record its id in `config/accounts.md` (`lead_form_ids`) and reuse it in the build.
