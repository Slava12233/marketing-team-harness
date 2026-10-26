---
type: learning
created: 2026-10-21
updated: 2026-10-21
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "Any edit in the Ads Manager ad-set editor is auto-saved as an unpublished draft (Review and publish (1), Discard drafts); the footer's Discard draft discards one object's draft after an in-page confirm."
applies_to: [meta, drafts]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# Ads Manager editor edits are auto-saved as drafts, even on an account that creates real objects

**The fact.** Ads Manager drafts exist even on an account where the MCP creates real objects: any edit in the ad-set editor is auto-saved as an unpublished draft ("Unpublished edits", "All edits saved"; the top bar shows "Review and publish (1)" and "Discard drafts"); the editor footer's "Discard draft" discards that object's draft after an in-page confirm (used to clean up a sizing test on an empty ad set).

**Evidence.** Observed on a single company's ad account on 2026-10-21; ported to this template on 2026-10-26.

**How to apply.** After any editor visit check the top bar for drafts and leave none behind; never press Publish.
