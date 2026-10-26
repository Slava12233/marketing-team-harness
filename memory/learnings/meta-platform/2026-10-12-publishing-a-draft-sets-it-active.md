---
type: learning
created: 2026-10-12
updated: 2026-10-12
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "Publishing a draft sets it ACTIVE; the PAUSED status requested at creation is not honored. Safe pattern: the Owner reviews, publishes, pauses at once if it should not run."
applies_to: [meta, drafts, activation]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# Publishing a draft sets it ACTIVE; the paused status at creation is ignored

> [!warning] Draft-mode accounts only
> This note describes an account that stages MCP writes as Ads Manager drafts. Accounts that create real PAUSED objects instead behave differently ([[2026-10-20-some-accounts-create-real-paused-objects]]). Check which mode the account is in (recorded in `memory/state/current.md` after the first create) before relying on this note.

**The fact.** Publishing a draft sets it ACTIVE. The paused status requested at creation is not honored by the draft flow. Safe pattern: stage the draft, have the Owner review it in Ads Manager, publish there, then pause immediately if it should not run yet.

**Evidence.** Observed on a single company's ad account on 2026-10-12; ported to this template on 2026-10-26.

**How to apply.** Never publish a draft that should not spend without a pause ready; publishing is the Owner's go in the same message.
