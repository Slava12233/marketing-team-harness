---
type: learning
created: 2026-10-30
updated: 2026-10-30
status: confirmed
maintained_by: harness
categories: [learnings, google-platform]
summary: "Every mutate takes validateOnly: Google checks the whole batch, policy and field errors included, and creates nothing; googleAds:mutate with temporary negative ids is atomic by default."
applies_to: [google, build, api]
evidence: "Google Ads API REST guide (mutating resources), read 2026-10-30."
supersedes: ""
superseded_by: ""
---

# validateOnly is a real server-side dry run

**The fact.** Every Google Ads API mutate accepts `validateOnly: true`: Google validates the request as if it ran and creates nothing. `customers/{id}/googleAds:mutate` takes a list of operations of different types, links them through temporary resource names with negative ids (`customers/{id}/campaigns/-2`), and without `partialFailure` runs them as one set: all or nothing.

**Evidence.** Google Ads API REST guide (mutating resources), read 2026-10-30. Not yet observed on a company's account: the first live call confirms it or a new note supersedes it.

**How to apply.** `google-ads.mjs build` sends the batch with `validateOnly` first and the real create only after Google accepts it, so a rejected build leaves nothing half made. `--dry-run` (no network) prints the batch; `--validate` stops after Google's check.
