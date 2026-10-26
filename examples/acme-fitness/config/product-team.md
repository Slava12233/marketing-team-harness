<!-- Written by /setup on 2026-10-26. Edit by hand or re-run /setup. -->
<!-- FICTIONAL EXAMPLE. The web team (two people) is invented. -->

# Product team

Optional. The people who ship the company's website, pages, consent wording and tracking. Their files are read-only from this harness.

**Product repository:** not shared (a small in-house web team ships the website, the app's store listing, the consent notices and the pixel; product truth is read from the live pages below)

## Where product truth lives

| Need | Path |
|---|---|
| Rules, legal gate, standing rulings | not shared |
| What shipped, what is owed, what was decided | not shared (the web team tells the Operator) |
| Page copy (each language) | https://acmefitness.example/join, https://acmefitness.example/corporate/call |
| Consent and notice texts and their ids | `join-notice-v1` on https://acmefitness.example/join; `corporate-notice-v1` on https://acmefitness.example/corporate/call |
| Pixel and analytics code | not shared |
| Lead webhook and funnel plans | none (no webhook) |
| Customer research and pains | the Operator's interview notes (see `config/audiences.md`) |
| Brand kit, RTL rules | the website's brand folder (ask the web team) |
| Legal notes | https://acmefitness.example/terms (membership terms, cookie and privacy policy) |
| Films, images, print | held by the web team (see `config/product.md`) |

## How a request is filed

A change to a page, event or notice is a dated plan file in `plans/` (`plans/YYYY-MM-DD-request-<topic>.md`) with the exact wording or spec, labelled **"Needs product team"**. The Operator emails the file to the web team; the harness never edits the site.

## Shared memory conventions

none. The web team tells the Operator when a page or notice changes; the Operator mentions it at the next `/morning`.
