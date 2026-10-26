---
type: learning
created: 2026-10-12
updated: 2026-10-12
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "ads_create_creative with a headline adds a deprecated call_to_action.value.link_title; Ads Manager rejects the ad with #1815589 though the MCP says VALIDATED. Build with an inline object_story_spec."
applies_to: [meta, creatives]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# Ads built from ads_create_creative with a headline are rejected (#1815589)

**The fact.** Do not build ads from `ads_create_creative` creatives when a headline is set: the tool adds a deprecated `call_to_action.value.link_title`, and Ads Manager rejects the ad with `#1815589` even though the MCP says VALIDATED and the preview renders.

**Evidence.** Observed on a single company's ad account on 2026-10-12; ported to this template on 2026-10-26.

**How to apply.** Build ads with an inline `object_story_spec` in `ads_create_ad` instead.
