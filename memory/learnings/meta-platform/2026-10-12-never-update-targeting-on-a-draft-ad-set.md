---
type: learning
created: 2026-10-12
updated: 2026-10-12
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "A targeting update on a draft ad set makes it vanish from the Ads Manager table and hang its editor while the MCP reports VALIDATED; set targeting at creation."
applies_to: [meta, drafts, targeting]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# Never update targeting on a draft ad set

> [!warning] Draft-mode accounts only
> This note describes an account that stages MCP writes as Ads Manager drafts. Accounts that create real PAUSED objects instead behave differently ([[2026-10-20-some-accounts-create-real-paused-objects]]). Check which mode the account is in (recorded in `memory/state/current.md` after the first create) before relying on this note.

**The fact.** **Never update `targeting` on a draft ad set with `ads_update_entity`.** The draft vanishes from the Ads Manager table and its editor hangs, while the MCP still reports VALIDATED. Scalar updates (name, start_time, status) are safe.

**Evidence.** Observed on a single company's ad account on 2026-10-12; ported to this template on 2026-10-26.

**How to apply.** Set targeting at creation; to change it, the Owner discards the draft and Claude recreates. (On an account that creates real PAUSED objects, targeting edits are ordinary live edits: [[2026-10-20-some-accounts-create-real-paused-objects]].)
