---
type: learning
created: 2026-10-12
updated: 2026-10-12
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "ads_activate_entity publishes only the object_ids it is given; everything else stays in the draft."
applies_to: [meta, activation, drafts]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# Publishing only the listed object_ids leaves the rest in the draft

> [!warning] Draft-mode accounts only
> This note describes an account that stages MCP writes as Ads Manager drafts. Accounts that create real PAUSED objects instead behave differently ([[2026-10-20-some-accounts-create-real-paused-objects]]). Check which mode the account is in (recorded in `memory/state/current.md` after the first create) before relying on this note.

**The fact.** Publishing only the listed `object_ids` leaves the rest in the draft.

**Evidence.** Observed on a single company's ad account on 2026-10-12; ported to this template on 2026-10-26.

**How to apply.** List every object that should go live (ads, ad set, campaign) in the activate call, and read the remainder back as still draft or paused.
