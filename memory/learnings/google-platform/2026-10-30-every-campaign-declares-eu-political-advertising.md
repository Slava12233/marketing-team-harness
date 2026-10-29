---
type: learning
created: 2026-10-30
updated: 2026-10-30
status: confirmed
maintained_by: harness
categories: [learnings, google-platform]
summary: "Since API v19.2/v20.1/v21, creating a campaign without contains_eu_political_advertising fails with FieldError.REQUIRED; since 2026-04-01 one undeclared campaign blocks every campaign mutate in the account."
applies_to: [google, build, compliance]
evidence: "Google's EU political advertising API policy page and ppc.land, read 2026-10-30."
supersedes: ""
superseded_by: ""
---

# Every new campaign must declare EU political advertising

**The fact.** Creating a campaign without `containsEuPoliticalAdvertising` fails with `FieldError.REQUIRED`. Since 2026-04-01, an account with any undeclared campaign fails every campaign-management mutate with `MutateError.EU_POLITICAL_ADVERTISING_DECLARATION_REQUIRED` (reports keep working).

**Evidence.** Google's EU political advertising API policy page and ppc.land, read 2026-10-30. Not yet observed on a company's account: the first live call confirms it or a new note supersedes it.

**How to apply.** `google-ads.mjs build` always sets it (`DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING` unless the spec says `eu_political_ads: true`). An old campaign in the company's account without a declaration is the Owner's click in Google Ads (the campaign settings) before any build.
