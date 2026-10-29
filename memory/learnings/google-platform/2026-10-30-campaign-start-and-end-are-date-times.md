---
type: learning
created: 2026-10-30
updated: 2026-10-30
status: confirmed
maintained_by: harness
categories: [learnings, google-platform]
summary: "v23 replaced campaign start_date and end_date with start_date_time and end_date_time (\"yyyy-MM-dd HH:mm:ss\" in the account time zone)."
applies_to: [google, build, api]
evidence: "Google's v22 versus v23 diff of the Campaign resource, read 2026-10-30."
supersedes: ""
superseded_by: ""
---

# Campaign start and end are date-times since v23

**The fact.** API v23 removed `campaign.start_date` and `campaign.end_date` and added `start_date_time` and `end_date_time`, as "yyyy-MM-dd HH:mm:ss" in the account's time zone (00:00:00 and 23:59:59 for whole days). A campaign without an end runs until it is paused.

**Evidence.** Google's v22 versus v23 diff of the Campaign resource, read 2026-10-30. Not yet observed on a company's account: the first live call confirms it or a new note supersedes it.

**How to apply.** `google-ads.mjs` writes `startDateTime` / `endDateTime` from the spec's dates. GAQL reads ask for `campaign.end_date_time`.
