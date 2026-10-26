---
type: learning
created: 2026-10-20
updated: 2026-10-20
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "On some ad accounts every create returns a real PAUSED object and draft reads say \"being gradually rolled out\"; paused objects spend nothing, edits are live edits, activate is the only step that makes anything run."
applies_to: [meta, drafts, activation]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# Some accounts have no draft staging: creates return real PAUSED objects

**The fact.** On some accounts every create returns a real object in status PAUSED (not DRAFT), and `object_state: draft` reads answer "being gradually rolled out". Paused objects spend nothing; edits to them (targeting included) are ordinary live edits; `ads_activate_entity` is the only step that makes anything run and stays behind the Owner's go. The draft rules of 2026-10-12 describe draft-mode accounts and may return if Meta enables drafts on the account.

**Evidence.** Observed on a single company's ad account from 2026-10-20 (the 2026-10-12 draft rules came from a different account); ported to this template on 2026-10-26.

**How to apply.** Check which mode the account is in with the first create and record it in `memory/state/current.md`. Verify builds with live reads by id; never call `ads_activate_entity` without the Owner's go in the same message with the spend statement. Editor edits still create drafts: [[2026-10-21-editor-edits-autosave-as-drafts]].
