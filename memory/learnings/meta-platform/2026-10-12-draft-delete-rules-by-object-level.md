---
type: learning
created: 2026-10-12
updated: 2026-10-12
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "Draft ads: DELETED sticks. Draft ad sets: cannot be deleted (error 1487246). A draft ad under a live ad set: DELETED fails (error 1487839), PAUSED works."
applies_to: [meta, drafts]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# Which draft objects can be deleted: ads yes, ad sets no, ads under a live set only paused

> [!warning] Draft-mode accounts only
> This note describes an account that stages MCP writes as Ads Manager drafts. Accounts that create real PAUSED objects instead behave differently ([[2026-10-20-some-accounts-create-real-paused-objects]]). Check which mode the account is in (recorded in `memory/state/current.md` after the first create) before relying on this note.

**The fact.** Draft **ads** can be removed: `ads_update_entity` status DELETED on a draft ad sticks. Draft ad sets cannot be deleted (error `1487246`). A draft ad under a **live** ad set cannot be set DELETED (error `1487839`); PAUSED works.

**Evidence.** Observed on a single company's ad account on 2026-10-12; ported to this template on 2026-10-26.

**How to apply.** Clean up draft ads with DELETED; leave draft ad sets for the Owner's Discard; under a live set pause the draft ad instead.
