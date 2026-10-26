---
type: business
created: 2026-10-26
updated: 2026-10-26
status: active
maintained_by: harness
categories: [business]
summary: "FICTIONAL EXAMPLE. A two-person web team ships the site, notices and pixel; no shared repository; product truth is read from the live pages; requests go as dated plan files the Operator emails."
evidence: "config/product-team.md"
---

# Where product truth lives

> FICTIONAL EXAMPLE. The web team is invented. Filled by `/setup` from `config/product-team.md` on 2026-10-26.

Everything listed here is read-only for the harness.

| Need | Path |
|---|---|
| Rules, legal gate, standing rulings | not shared |
| What shipped, what is owed, what was decided | not shared (the web team tells the Operator) |
| Page copy (each language) | https://acmefitness.example/join, https://acmefitness.example/corporate/call |
| Consent and notice texts and their ids | `join-notice-v1` on /join; `corporate-notice-v1` on /corporate/call |
| Pixel and analytics code | not shared |
| Lead delivery and funnel plans | Leads Center; no webhook |
| Customer research and pains | the Operator's interview notes (see [[business/audiences|audiences]]) |
| Brand kit, RTL rules | the website's brand folder (ask the web team) |
| Legal notes | https://acmefitness.example/terms |
| Films, images, print | held by the web team |

## How a request is filed

- A dated plan file `plans/YYYY-MM-DD-request-<topic>.md` with the exact wording or spec, labelled "Needs product team"; the Operator emails it to the web team; the harness never edits the site.

## Shared memory with the product team

- none; the web team tells the Operator when a page or notice changes, and the Operator mentions it at the next `/morning`.

## Related

- [[funnels]] · [[business/product|product]] · [[claims-and-compliance]]
