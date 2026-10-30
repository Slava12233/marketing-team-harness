---
type: learning
created: 2026-10-30
updated: 2026-10-30
status: confirmed
maintained_by: harness
categories: [learnings, google-platform]
summary: "Since late 2024 a service account added as a user of the Google Ads account (Standard) signs in to the Google Ads API with its key alone: no OAuth client, no consent screen, no refresh token, no Workspace delegation."
applies_to: [google, tooling, auth]
evidence: "Google Ads API docs, Service accounts (direct access, recommended), and the Google Ads Developer Blog, 2024-11 'Improved support for service accounts', read 2026-10-30."
supersedes: ""
superseded_by: ""
---

# A service account signs in to the Google Ads API without OAuth

**The fact.** A service account of the company's Cloud project, added in Google Ads → Admin → Access and security as a user (Standard; Email-only does not work, Admin only when a call needs it), calls the Google Ads API with an access token from its JSON key (a signed JWT exchanged at Google's token endpoint, scope `https://www.googleapis.com/auth/adwords`). No OAuth client, no consent screen, no refresh token, and no Google Workspace domain-wide delegation. The project still needs the Google Ads API enabled and its API access level (Explorer). Adding the service account in Google Ads has no API; the project, the API and the service account and key do (gcloud). An organization created after May 2024 blocks key creation by default (`iam.disableServiceAccountKeyCreation`).

**Evidence.** Google Ads API docs, Service accounts, and the Google Ads Developer Blog post of November 2024, read 2026-10-30. Not yet observed on a company's account: the first live `google-ads.mjs check` with a key confirms it or a new note supersedes it.

**How to apply.** Chapter G of `/connect` makes the Cloud side with `creatives/tools/google-cloud-setup.mjs` (gcloud: the project, the API, the service account, the key into `.secrets/`, its path in `.env` as `GOOGLE_ADS_JSON_KEY_FILE`); the Owner adds the service account in Google Ads and applies for Explorer in the browser. `google-ads.mjs` uses the key whenever it is set. The OAuth client and `login` are the fallback when the organization blocks keys. See [[2026-10-30-oauth-client-in-testing-expires-logins-after-7-days]] for the fallback's trap.
