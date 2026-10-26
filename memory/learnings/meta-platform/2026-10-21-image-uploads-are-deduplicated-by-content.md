---
type: learning
created: 2026-10-21
updated: 2026-10-21
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "Uploading the same picture again returns the existing image hash."
applies_to: [meta, uploads]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# Meta deduplicates image uploads by content

**The fact.** Meta deduplicates image uploads by content (the same picture returns the existing hash).

**Evidence.** Observed on a single company's ad account on 2026-10-21; ported to this template on 2026-10-26.

**How to apply.** A repeated hash after an upload is not an error; a changed creative must differ in content to get a new hash. Superseded hashes stay recorded in the flight note and never go in an ad.
