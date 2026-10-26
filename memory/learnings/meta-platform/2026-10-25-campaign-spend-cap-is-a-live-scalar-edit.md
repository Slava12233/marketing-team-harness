---
type: learning
created: 2026-10-25
updated: 2026-10-25
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "A campaign spend_cap (in the currency's minor unit, e.g. cents) is changed as a live scalar edit."
applies_to: [meta, activation]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# A campaign spend_cap is a live scalar edit

**The fact.** A campaign `spend_cap` (in the account currency's minor unit, for example cents or pence) is a live scalar edit on an account with real objects.

**Evidence.** Observed on a single company's ad account on 2026-10-25; ported to this template on 2026-10-26.

**How to apply.** A spend-cap change affects money: the Owner's go in the same message, then read it back; never above a cap in `config/goals.md`.
