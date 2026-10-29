---
type: learning
created: 2026-10-30
updated: 2026-10-30
status: confirmed
maintained_by: harness
categories: [learnings, google-platform]
summary: "A new project gets Test access (test accounts only); Explorer (production accounts, 2,880 operations a day) is applied for in the Cloud Console and is usually reviewed automatically; Explorer excludes the planning services (Keyword Planner, Reach Planner) and billing."
applies_to: [google, api, access, setup]
evidence: "Google's API access levels page, read 2026-10-30."
supersedes: ""
superseded_by: ""
---

# A new Cloud project reaches test accounts only until Explorer is approved

**The fact.** Turning the Google Ads API on in a new Cloud project grants **Test** access: requests reach test accounts only. **Explorer** (production and test accounts; 2,880 operations a day on production, 15,000 on test) is applied for in the Cloud Console (Google Ads API, Overview, Upgrade access level); the review is "automated in most cases", not guaranteed or instant. Explorer excludes account creation, user management, the planning services (Keyword Planner, Audience Insights, Reach Planner) and billing; Basic needs brand verification first. Google lists a known issue where some upgrades done in the Cloud Console are not honoured yet.

**Evidence.** Google's API access levels page, read 2026-10-30. Not yet observed on a company's account: the first live call confirms it or a new note supersedes it.

**How to apply.** Apply for Explorer early in `/connect` (before the login), so the review runs while the rest is set up. Keyword ideas come from the Google Ads interface (Tools, Keyword Planner) until the project has Basic; `google-ads.mjs` never calls a planning service.
