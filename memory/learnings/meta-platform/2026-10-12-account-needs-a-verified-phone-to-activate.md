---
type: learning
created: 2026-10-12
updated: 2026-10-12
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "Ads Manager error #3858013: the ad account must have a verified phone number before any ad can be activated; an owner-only step."
applies_to: [meta, activation]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# An ad account needs a verified phone number before any ad can be activated (#3858013)

**The fact.** The ad account must have a verified phone number before any ad can be activated (Ads Manager error `#3858013`). Owner-only step.

**Evidence.** Observed on a single company's ad account on 2026-10-12; ported to this template on 2026-10-26.

**How to apply.** On `#3858013` stop and hand the Owner the step (Ads Manager → the ad account settings → verify the phone number); the harness never changes account settings.
