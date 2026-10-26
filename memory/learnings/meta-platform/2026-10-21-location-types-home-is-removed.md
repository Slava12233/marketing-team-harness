---
type: learning
created: 2026-10-21
updated: 2026-10-21
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "location_types [\"home\"] was removed by Meta in 2023 yet is accepted at creation and stored when location_types is omitted; set [\"home\",\"recent\"] explicitly (WhatsApp sets keep frequently_in)."
applies_to: [meta, targeting, whatsapp]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# location_types ["home"] is a removed option; set ["home","recent"] explicitly

**The fact.** `location_types: ["home"]` is a removed option (Meta, 2023): the API accepts it at creation and `ads_get_errors` stays empty, but the editor shows "Review 1 error: Your audience contains a location targeting option that has been removed (people living in, …)" on any edit and stops re-estimating. `location_types` omitted at creation is stored as the removed `["home"]` (ON_AD) or `["frequently_in","home"]` (WhatsApp).

**Evidence.** Observed on a single company's ad account on 2026-10-21; ported to this template on 2026-10-26.

**How to apply.** Set `location_types ["home","recent"]` explicitly on every ad set; WhatsApp sets keep `frequently_in`.
