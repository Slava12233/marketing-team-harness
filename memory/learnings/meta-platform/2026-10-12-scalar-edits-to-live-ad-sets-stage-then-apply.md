---
type: learning
created: 2026-10-12
updated: 2026-10-12
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "Scalar edits (start_time, name) to live ad sets work: ads_update_entity stages, ads_activate_entity with those ad set ids applies."
applies_to: [meta, activation]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# Scalar edits to live ad sets: update stages, activate applies

> [!warning] Draft-mode accounts only
> This note describes an account that stages MCP writes as Ads Manager drafts. Accounts that create real PAUSED objects instead behave differently ([[2026-10-20-some-accounts-create-real-paused-objects]]). Check which mode the account is in (recorded in `memory/state/current.md` after the first create) before relying on this note.

**The fact.** Scalar edits to live ad sets (start_time, name) work: `ads_update_entity` stages, `ads_activate_entity` with those ad set ids applies.

**Evidence.** Observed on a single company's ad account on 2026-10-12; ported to this template on 2026-10-26.

**How to apply.** Treat the applying activate call as a publish step (the Owner's go when it changes delivery).
