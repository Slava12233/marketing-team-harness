---
type: learning
created: 2026-10-25
updated: 2026-10-25
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "On WhatsApp ads clicks (all) includes Page-name and \"see more\" taps, link_click is the WhatsApp open, and results (messaging_conversation_started_7d) count only after the person sends the pre-filled message, with up to a few hours' delay."
applies_to: [meta, whatsapp, reads]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# What clicks, link_click and results mean on WhatsApp ads

**The fact.** On WhatsApp ads `clicks` (all) includes Page-name and «see more» taps, `link_click` is the WhatsApp open, and `results` (`messaging_conversation_started_7d`) counts only after the person sends the pre-filled message, with a reporting delay of up to a few hours.

**Evidence.** Observed on a single company's ad account on 2026-10-25; ported to this template on 2026-10-26.

**How to apply.** Report link_click and results separately; do not judge a WhatsApp ad on its first hours of results.
