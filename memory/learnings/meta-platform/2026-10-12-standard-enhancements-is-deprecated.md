---
type: learning
created: 2026-10-12
updated: 2026-10-12
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "standard_enhancements fails at the publisher (error 3858504, not caught by the validator); opt out of the eleven creative features individually in creative_features_spec."
applies_to: [meta, creatives]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# standard_enhancements is deprecated: opt out of the eleven features one by one

**The fact.** **`standard_enhancements` is deprecated** (publisher error `3858504`, not caught by the MCP validator). In `degrees_of_freedom_spec.creative_features_spec` opt out of individual features instead: image_brightness_and_contrast, enhance_cta, text_optimizations, image_templates, inline_comment, image_touchups, image_uncrop, image_background_gen, add_text_overlay, site_extensions, video_auto_crop.

**Evidence.** Observed on a single company's ad account on 2026-10-12; ported to this template on 2026-10-26.

**How to apply.** Every `ads_create_ad` carries the eleven opt-outs.
