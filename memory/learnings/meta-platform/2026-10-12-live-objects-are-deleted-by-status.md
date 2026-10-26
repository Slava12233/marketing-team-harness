---
type: learning
created: 2026-10-12
updated: 2026-10-12
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "Live objects can be deleted by setting status DELETED; a deleted campaign still returns on read with status DELETED."
applies_to: [meta, reads]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# Live objects are deleted by setting status DELETED and still read back

**The fact.** Live objects can be deleted by setting status DELETED. A deleted campaign still returns on read with status DELETED.

**Evidence.** Observed on a single company's ad account on 2026-10-12 and again on 2026-10-25 for paused real objects ([[2026-10-25-creatives-are-immutable]]); ported to this template on 2026-10-26.

**How to apply.** Deleting a live object is a destructive step: the Owner's click or the Owner's explicit approval in chat. Filter DELETED objects out of reads.
