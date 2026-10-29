---
type: learning
created: 2026-10-30
updated: 2026-10-30
status: confirmed
maintained_by: harness
categories: [learnings, google-platform]
summary: "For an External OAuth app in Testing status, Google expires refresh tokens after 7 days; publishing the consent screen (In production) keeps the login."
applies_to: [google, setup, auth]
evidence: "Google Identity OAuth 2.0 documentation (refresh token expiration), read 2026-10-30."
supersedes: ""
superseded_by: ""
---

# A consent screen left in Testing expires the login after 7 days

**The fact.** When the OAuth consent screen of an External app is in **Testing**, Google issues refresh tokens that expire after 7 days; the next call then fails with `invalid_grant`. A published app (In production) keeps the login until it is revoked, unused for six months, or the password changes with Gmail scopes involved. The adwords scope may show an "unverified app" screen to the company's own user, who clicks through it.

**Evidence.** Google Identity OAuth 2.0 documentation (refresh token expiration), read 2026-10-30. Not yet observed on a company's account: the first live call confirms it or a new note supersedes it.

**How to apply.** In `/connect` the Owner publishes the consent screen (Google Auth Platform, Audience, Publish app) before `google-ads.mjs login`. An `invalid_grant` means run `login` again.
