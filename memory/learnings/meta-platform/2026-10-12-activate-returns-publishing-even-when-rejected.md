---
type: learning
created: 2026-10-12
updated: 2026-10-12
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "ads_activate_entity returns PUBLISHING even when objects are then rejected and nothing reports it back; always re-read live objects and the draft; the reason is under Review and publish → details."
applies_to: [meta, activation, drafts]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# ads_activate_entity reports PUBLISHING even when the publisher rejects objects

> [!warning] Draft-mode accounts only
> This note describes an account that stages MCP writes as Ads Manager drafts. Accounts that create real PAUSED objects instead behave differently ([[2026-10-20-some-accounts-create-real-paused-objects]]). Check which mode the account is in (recorded in `memory/state/current.md` after the first create) before relying on this note.

**The fact.** `ads_activate_entity` returns PUBLISHING even when the publisher then rejects objects; nothing reports it back. Always re-read live objects and the draft afterwards. Ads Manager shows the reason under "Review and publish" → details.

**Evidence.** Observed on a single company's ad account on 2026-10-12; ported to this template on 2026-10-26.

**How to apply.** Verify after every publish: re-read by id and run `ads_get_errors`; never report "live" on the activate response alone.
