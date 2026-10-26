---
type: learning
created: 2026-10-25
updated: 2026-10-25
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "ads_update_entity refuses creative and creative_id; a one-word copy change means new ads on the same media hashes plus status DELETED on the old ones, which sticks on paused real objects; record the old ids and strings first."
applies_to: [meta, creatives]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# Creatives are immutable: a copy change means new ads and DELETED old ones

**The fact.** Creatives are immutable: `ads_update_entity` refuses `creative` and `creative_id`, so a one-word change to a primary text means new ads (`ads_create_ad`, same media hashes) plus `status: DELETED` on the old ones, which sticks on paused real objects (`is_draft` false, read back DELETED).

**Evidence.** Observed on a single company's ad account on 2026-10-25; ported to this template on 2026-10-26.

**How to apply.** Record the old ids and strings in the plan first; a new creative is a new ad, never an edit.
