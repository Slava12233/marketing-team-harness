---
type: learning
created: 2026-10-25
updated: 2026-10-25
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "Scalar start_time edit on the ad set, then ads_activate_entity on the ads, the ad set and the campaign; ads still IN_PROCESS went active within three minutes; a set with start_time minutes ahead reads scheduled."
applies_to: [meta, activation]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# The activation sequence that worked on an account with real PAUSED objects

**The fact.** Activation sequence that worked: scalar `start_time` edit on the ad set, then `ads_activate_entity` on the ads, the ad set and the campaign; ads still `IN_PROCESS` / `pending_process` at activation went `active` within three minutes once review passed, and a set whose `start_time` is minutes ahead reads `scheduled` until it ticks.

**Evidence.** Observed on a single company's ad account on 2026-10-25; ported to this template on 2026-10-26.

**How to apply.** Only on the Owner's go in the same message with the spend statement; re-read live and run `ads_get_errors` after.
