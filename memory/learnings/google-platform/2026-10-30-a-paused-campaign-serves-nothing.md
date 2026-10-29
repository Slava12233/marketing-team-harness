---
type: learning
created: 2026-10-30
updated: 2026-10-30
status: confirmed
maintained_by: harness
categories: [learnings, google-platform]
summary: "Serving needs the campaign, the ad group and the ad all enabled; the harness creates the campaign PAUSED and its ad groups and ads ENABLED, so the one go-gated enable of the campaign starts it."
applies_to: [google, build, safety]
evidence: "Google Ads help (campaign, ad group and ad status), read 2026-10-30."
supersedes: ""
superseded_by: ""
---

# A PAUSED campaign serves nothing, whatever its ad groups and ads say

**The fact.** A Google ad serves only when its campaign, ad group and ad are all enabled (and the ad is approved). A PAUSED campaign serves nothing and spends nothing, whatever the status of what is inside it.

**Evidence.** Google Ads help (campaign, ad group and ad status), read 2026-10-30. Not yet observed on a company's account: the first live call confirms it or a new note supersedes it.

**How to apply.** `google-ads.mjs build` forces the campaign PAUSED and creates its ad groups and ads ENABLED, so `enable --go` on the campaign is the single switch, written to the go log. Pausing an ad group or an ad is still free with `pause`.
