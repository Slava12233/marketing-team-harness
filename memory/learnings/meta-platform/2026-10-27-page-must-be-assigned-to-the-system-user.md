---
type: learning
created: 2026-10-27
updated: 2026-10-27
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform, tokens, lead-forms]
summary: "A System User token with pages_* permissions still gets code 10 on every Page endpoint until the Page itself is assigned to the System User (Business Settings → System users → … → Assign assets → Facebook Pages → Full access 'Everything'); the ad account and the app are not enough; verify with a fresh load of the user's 'can access N business assets'"
applies_to: [tokens, lead-forms, leads, setup]
evidence: "ported from a single-company harness, 2026-10-27 (lead-forms list: code 10 before the assignment, ten forms after it, same token)"
supersedes: ""
superseded_by: ""
---

# The Page must be assigned to the System User, not only the ad account and the app

**Symptom.** `meta-graph.mjs check` reports `leads_retrieval`, `pages_manage_ads`, `pages_read_engagement` and `pages_show_list` granted, yet `lead-forms list` answers `HTTP 400 (code 10): This endpoint requires the 'pages_read_engagement' permission or the 'Page Public Content Access' feature` on `GET /<page id>`. The System User holds two assets: the ad account and the app.

**Cause.** Token permissions say what the token may do; asset assignment says on which objects. Page endpoints need the Page among the System User's assets. The error text blames a permission, which misleads.

**Fix (the Business Settings UI of 2026-10).** Users → System users → the user → "…" (next to Revoke tokens) → Assign assets → Facebook Pages → tick the Page → Full access "Everything" → Assign assets → "Assets assigned: 1 asset was assigned". The same token works at once. (The Page's own screen offers "Assign people" as the other way in.) Assignments reported from another screen or browser may never land: verify with a fresh load of the system user, "can access N business assets", and with the tool.

**Rule for setups.** A System User needs three assets from the start: the ad account (full control), the app, and the Page (Full access). The setup guide step 7, the `setup-console` skill and the tools' fix list say so.
