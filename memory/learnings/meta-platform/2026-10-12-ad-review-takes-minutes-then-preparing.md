---
type: learning
created: 2026-10-12
updated: 2026-10-12
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "Review took 2-6 minutes per ad; after approval delivery reads pending/preparing with ads_get_errors empty, a normal warm-up and not a blocker."
applies_to: [meta, activation, reads]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# Ad review takes 2–6 minutes; "pending / preparing" afterwards is normal warm-up

**The fact.** Ad review took 2–6 minutes per ad after publish. After approval and before first impressions, `ads_get_ad_entities` `delivery` shows `{"status":"pending","substatuses":["preparing"]}` and `ads_get_errors` stays empty: normal warm-up, not a blocker.

**Evidence.** Observed on a single company's ad account on 2026-10-12; ported to this template on 2026-10-26.

**How to apply.** Do not report "preparing" as a breakage; re-read after some minutes.
