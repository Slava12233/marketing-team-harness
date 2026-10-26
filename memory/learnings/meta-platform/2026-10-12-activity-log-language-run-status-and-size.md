---
type: learning
created: 2026-10-12
updated: 2026-10-12
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "ads_account_get_activity_logs answers in the account language; run_status 1 active, 9 pending review, 17 pending publish; a whole campaign's log exceeds the output limit, so filter the saved file with jq."
applies_to: [meta, reads]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# The activity log: account language, run_status codes, too big for one read

**The fact.** The activity log (`ads_account_get_activity_logs`) comes back in the account's language; `run_status` codes: 1 = active, 9 = pending review, 17 = pending publish. A whole campaign's log exceeds the tool-output limit; filter the saved file with jq.

**Evidence.** Observed on a single company's ad account on 2026-10-12; ported to this template on 2026-10-26.

**How to apply.** Expect field values in the account's language; filter the saved log by object id with jq rather than reading it whole.
