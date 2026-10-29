---
type: learning
created: 2026-10-30
updated: 2026-10-30
status: confirmed
maintained_by: harness
categories: [learnings, google-platform]
summary: "A responsive search ad takes 3 to 15 headlines of at most 30 characters and 2 to 4 descriptions of at most 90, two display paths of 15; full-width characters count twice; sitelinks 25 (descriptions 35), callouts 25."
applies_to: [google, build, copy]
evidence: "Google Ads help (responsive search ads, sitelink and callout assets), read 2026-10-30."
supersedes: ""
superseded_by: ""
---

# Responsive search ads: 3 to 15 headlines of 30, 2 to 4 descriptions of 90

**The fact.** A responsive search ad takes 3 to 15 headlines (30 characters each) and 2 to 4 descriptions (90 each), with two optional display paths of 15. Full-width characters (Chinese, Japanese, Korean) count as two; Hebrew and Latin count one. Sitelink text 25 (its two descriptions 35 each, both or neither), callouts 25. A keyword is at most 80 characters and 10 words. Pinning a headline to position 1 narrows Google's combinations.

**Evidence.** Google Ads help (responsive search ads, sitelink and callout assets), read 2026-10-30. Not yet observed on a company's account: the first live call confirms it or a new note supersedes it.

**How to apply.** `ad-copy` writes Google copy to these limits; `google-ads.mjs build` refuses a spec that breaks one before anything is sent. Pin only what the claims rules require.
