---
type: learning
created: 2026-10-12
updated: 2026-10-12
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "The Ads Manager editor takes about 20 seconds to render MCP-made draft ad sets and ads; grey placeholders for that long are not a hang."
applies_to: [meta, drafts, reads]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# Ads Manager takes about 20 s to render MCP-made ad sets and ads

> [!warning] Draft-mode accounts only
> This note describes an account that stages MCP writes as Ads Manager drafts. Accounts that create real PAUSED objects instead behave differently ([[2026-10-20-some-accounts-create-real-paused-objects]]). Check which mode the account is in (recorded in `memory/state/current.md` after the first create) before relying on this note.

**The fact.** Ads Manager's editor takes about 20 s to render MCP-made draft ad sets and ads; grey placeholders for that long are not a hang.

**Evidence.** Observed on a single company's ad account on 2026-10-12; ported to this template on 2026-10-26.

**How to apply.** Wait about 20 seconds before judging an editor screen; do not click away or retry.
