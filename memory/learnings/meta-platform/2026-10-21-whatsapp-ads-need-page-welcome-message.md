---
type: learning
created: 2026-10-21
updated: 2026-10-21
status: superseded
maintained_by: harness
categories: [learnings, meta-platform]
summary: "Without page_welcome_message a WhatsApp ad opens with Meta's English default; pass it at object_story_spec level as a JSON string (VISUAL_EDITOR v2, autofill_message); inside link_data the MCP returns INTERNAL."
applies_to: [meta, whatsapp, creatives]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: "[[2026-10-26-page-welcome-message-exact-spec]]"
---

# Click-to-WhatsApp ads need page_welcome_message at the object_story_spec level

**The fact.** Click-to-WhatsApp ads built inline without `page_welcome_message` open the chat with Meta's English default ("Hello! Can I get more info on this?"): set a pre-filled message in the ad's language or ice-breakers (up to four, 80 characters) at creation. Pass `page_welcome_message` at the `object_story_spec` level of the inline creative (a JSON string, VISUAL_EDITOR v2, `autofill_message`); inside `link_data` the MCP returns a bare INTERNAL error.

**Evidence.** Observed on a single company's ad account on 2026-10-21; ported to this template on 2026-10-26.

**How to apply.** Every WhatsApp ad carries a `page_welcome_message` in its own language at `object_story_spec` level. Whether people actually see it is not guaranteed: [[2026-10-26-whatsapp-inbox-reads]]; check it with one tap on the ad's preview from a phone.
