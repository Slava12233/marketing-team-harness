---
type: learning
created: 2026-10-12
updated: 2026-10-12
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "On a draft-mode account MCP writes are Ads Manager drafts; a created campaign does not exist live until published and a live read by id returns nothing."
applies_to: [meta, drafts]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# MCP writes are staged as Ads Manager drafts (draft-mode accounts)

> [!warning] Draft-mode accounts only
> This note describes an account that stages MCP writes as Ads Manager drafts. Accounts that create real PAUSED objects instead behave differently ([[2026-10-20-some-accounts-create-real-paused-objects]]). Check which mode the account is in (recorded in `memory/state/current.md` after the first create) before relying on this note.

**The fact.** Writes are staged as Ads Manager DRAFTS, not live objects. A created campaign does not exist live until it is published. Reading it "live" by id returns nothing until then.

**Evidence.** Observed on a single company's ad account on 2026-10-12; ported to this template on 2026-10-26.

**How to apply.** On a draft-mode account verify drafts in Ads Manager, not with a live read; a missing live object is not a failed create.
