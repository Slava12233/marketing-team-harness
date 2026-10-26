---
type: learning
created: 2026-10-25
updated: 2026-10-25
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "whatsapp_phone_number is unknown to the MCP and a promoted_object update returns INTERNAL; a number is connected in Page settings or the ad-set editor, only once it is on the WhatsApp Business app, chosen per ad set, and a second number must not become primary."
applies_to: [meta, whatsapp]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# The MCP cannot set or change a click-to-WhatsApp ad set's number

**The fact.** The MCP cannot set or change a click-to-WhatsApp ad set's number (`whatsapp_phone_number` is unknown to `ads_get_field_context`; a `promoted_object` update returns a bare INTERNAL error). A number is connected in Page settings → Linked accounts → WhatsApp → «Connect another number» or in the ad-set editor (Conversion → WhatsApp), only once it already lives on the WhatsApp Business app (Meta stops with «install WhatsApp Business for this number» otherwise), and it is selected per ad set in the editor; a second number must not become the Page's primary (sets without an explicit choice follow the primary).

**Evidence.** Observed on a single company's ad account on 2026-10-25; ported to this template on 2026-10-26.

**How to apply.** A new WhatsApp number is the Owner's console work; MCP-built WhatsApp sets go to the Page's primary number unless the Owner selects another one in the editor.
