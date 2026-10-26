---
type: learning
created: 2026-10-26
updated: 2026-10-26
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: The exact page_welcome_message object a click-to-WhatsApp ad takes at the object_story_spec level (VISUAL_EDITOR v2, autofill_message); inside link_data the call fails with a bare INTERNAL error.
applies_to: [meta, whatsapp, creatives]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: "[[2026-10-21-whatsapp-ads-need-page-welcome-message]]"
superseded_by: ""
---

# page_welcome_message: the exact spec that Meta accepts

**The fact.** On a click-to-WhatsApp ad built inline with `ads_create_ad`, the pre-filled first message is passed as `page_welcome_message` at the **`object_story_spec` level** (for `link_data` and `video_data` alike), as a JSON string:

```json
{"type":"VISUAL_EDITOR","version":2,"landing_screen_type":"welcome_message","media_type":"text","text_format":{"customer_action_type":"autofill_message","message":{"autofill_message":{"content":"<the pre-filled line, in the ad's language>"}}}}
```

Inside `link_data` the same object makes the MCP return a bare INTERNAL error (three tries). The read-back carries `effective_object_story_id` (with the Page id) and `status_forced_to_paused` (harmless).

**Evidence.** Observed on a single company's ad account in two builds of click-to-WhatsApp ads (2026-10-21 and 2026-10-25), read back by id; ported to this template on 2026-10-26.

**How to apply.** Always set it at creation (creatives are immutable, see [[2026-10-25-creatives-are-immutable]]); the chat may still open with Meta's default for many people, cause unverified (see [[2026-10-26-whatsapp-inbox-reads]]); check with one tap on the ad's preview from a phone.
