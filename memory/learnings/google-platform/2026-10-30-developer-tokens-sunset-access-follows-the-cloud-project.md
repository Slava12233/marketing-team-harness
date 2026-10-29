---
type: learning
created: 2026-10-30
updated: 2026-10-30
status: confirmed
maintained_by: harness
categories: [learnings, google-platform]
summary: "Google sunset Google Ads API developer tokens on 2026-09-09; the access level now belongs to the Google Cloud project that owns the OAuth client, and a token in a request header is ignored."
applies_to: [google, api, access]
evidence: "Google's developer-token and access-levels pages, and the trade press (ppc.land, 2026-09-10), read 2026-10-30."
supersedes: ""
superseded_by: ""
---

# Developer tokens are gone: API access follows the Cloud project

**The fact.** Google sunset the Google Ads API developer tokens on 2026-09-09. The API access level (Test, Explorer, Basic, Standard) now belongs to the Google Cloud project whose OAuth client signed the user in, not to a token; a developer-token header is optional and ignored (the REST auth page still lists it, so `google-ads.mjs` sends it only when `GOOGLE_ADS_DEVELOPER_TOKEN` is set). Pending Basic applications were closed at the switch.

**Evidence.** Google's developer-token and access-levels pages, and the trade press (ppc.land, 2026-09-10), read 2026-10-30. Not yet observed on a company's account: the first live call confirms it or a new note supersedes it.

**How to apply.** Every company uses its own Cloud project, so its access level is its own: check it in the Cloud Console (Google Ads API, Overview) and record it as `google_api_access_level` in `config/accounts.md`.
