---
type: learning
created: 2026-10-12
updated: 2026-10-12
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "Status DELETED on a draft campaign returns success but Meta rejects it (error 1487564); drafts are discarded only in Ads Manager, an all-or-nothing click that is the Owner's."
applies_to: [meta, drafts]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# Unpublished draft campaigns cannot be discarded through the MCP

> [!warning] Draft-mode accounts only
> This note describes an account that stages MCP writes as Ads Manager drafts. Accounts that create real PAUSED objects instead behave differently ([[2026-10-20-some-accounts-create-real-paused-objects]]). Check which mode the account is in (recorded in `memory/state/current.md` after the first create) before relying on this note.

**The fact.** Unpublished draft campaigns cannot be discarded through the MCP. Setting status DELETED on a draft returns `success: true` but Meta rejects it with error `1487564` and the draft stays. Drafts are discarded only in Ads Manager (Review and Publish → Discard), and that click is all-or-nothing for the account and is blocked for Claude by the permission classifier; the Owner clicks it.

**Evidence.** Observed on a single company's ad account on 2026-10-12; ported to this template on 2026-10-26.

**How to apply.** Do not report a draft campaign as deleted on the MCP's word. Prepare the click list and stop; the Discard click is the Owner's.
