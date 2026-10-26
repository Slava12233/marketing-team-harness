---
type: learning
created: 2026-10-12
updated: 2026-10-12
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "A Planned A/B study with a future start leaves delivery status unchanged; if a study held the ad sets the sub-status would read scheduled."
applies_to: [meta, experiments, reads]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# A Planned A/B study with a future start does not change delivery status

**The fact.** A Planned A/B study with a future start does not change delivery status; if a study held the ad sets the sub-status would read `scheduled`.

**Evidence.** Observed on a single company's ad account on 2026-10-12; ported to this template on 2026-10-26.

**How to apply.** Read the delivery sub-status, not the study's existence, to know whether a study holds delivery. Experiments are created only on the Owner's go.
