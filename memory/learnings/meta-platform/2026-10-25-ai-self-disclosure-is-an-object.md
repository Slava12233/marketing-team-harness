---
type: learning
created: 2026-10-25
updated: 2026-10-25
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "The AI self-disclosure OPT_IN is accepted only as \"generative_asset_spec\":{\"transparency_metadata\":{\"self_disclosure\":{\"enroll_status\":\"OPT_IN\"}}}; the bare string returns code 100."
applies_to: [meta, creatives]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# The ad-level AI self-disclosure is accepted only as an object

**The fact.** The ad-level AI self-disclosure is accepted only as the object `"generative_asset_spec":{"transparency_metadata":{"self_disclosure":{"enroll_status":"OPT_IN"}}}` (the bare string → code 100).

**Evidence.** Observed on a single company's ad account on 2026-10-25; ported to this template on 2026-10-26.

**How to apply.** Every ad with generated or altered media carries this object, plus the AI-disclosure badge on the image that `config/brand.md` defines ([[claims-and-compliance]]).
