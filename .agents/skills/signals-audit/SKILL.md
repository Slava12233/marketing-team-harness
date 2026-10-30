---
name: signals-audit
description: "Verify the company's Meta pixel (dataset), consent gating, events, attribution parameters, lead delivery (Leads Center, or the lead webhook when one exists) and domain verification for its destination pages; no pixel and no website is a valid audited state for click-to-WhatsApp and instant-form funnels. Use before any launch, when results look wrong, or when asked about tracking, pixel, leads or attribution."
---

# Signals audit

Output: `reports/<YYYY-MM-DD>-signals-audit.md` (English); requests to the product team in a dated plan file; the chat summary is in the chat language from `config/operator.md`.

## Tools
`ads_get_datasets`, `ads_get_dataset_details`, `ads_get_dataset_quality`, `ads_get_dataset_stats`, `ads_pixel_event_read`, `ads_pixel_parameter_read`, `ads_get_customconversions`, `ads_get_ad_account_custom_audiences`, `ads_get_ad_entities`. A browser for the live pages, the cookie bar, the network panel and Events Manager → Test Events. For lead forms: Meta's lead ads testing tool (one test lead per form) and Leads Center in Meta Business Suite; both are clicks in the Owner's login, so the harness prepares the click list and records what the Owner reports. The source of truth for what should fire: the pixel and consent code named in `config/product-team.md` "where product truth lives" (when a product team exists), else what `config/accounts.md` and `config/product.md` record.

## What is designed to happen (fill from config before auditing)
Write this block from `config/accounts.md` and `config/product.md`, dated, at the top of the report:
- **Pixel (dataset):** `pixel_id` from `config/accounts.md`; on which hosts and pages it loads; whether it loads only after consent (and how consent is given: opt-in, two equal buttons, nothing pre-selected); which events fire where (`PageView`, `Lead`, `CompleteRegistration`, …) and how often (once per device, per session); whether a `<noscript>` beacon exists; what withdrawal of consent does (cookies such as `_fbp`, `_fbc` expired).
- **Pages with no tracker by the company's rule**, and pages where an event is missing today.
- **Conversions API:** present or not.
- **Domain verification:** status from `config/accounts.md` (console steps).
- **Attribution parameters** from `config/accounts.md`: `ref` (where it lands in the company's database), `utm_*` (analytics only, or more), `fbclid` handling.
- **Lead delivery:** `lead_delivery` from `config/accounts.md` (Leads Center by default; email notifications, a CSV download from the forms library or a CRM integration) and who answers the leads (the replies row in `config/operator.md`). Only when `lead_webhook_url` holds a URL: the webhook and the console steps it waits for (Page, Lead Ads terms, developer app, `leadgen` subscription, Page token).
- **No website:** when every funnel is click-to-WhatsApp or an instant form and the company has no website or no pixel, write "no pixel, no website" here. It is a valid design, not a failure: results are counted by Meta (conversations, leads), and the pixel, consent, event, domain and website-attribution checks below read **n/a (no website)**.

## Checklist (score pass / fail / unknown / n/a; never pass without evidence)
1. The pixel is attached to the ad account in `config/accounts.md` (`ads_get_datasets` on the account) and shows activity today (`ads_get_dataset_stats`).
2. On every consent-gated page: no request to `connect.facebook.net` before agreement; `PageView` after agreement; nothing after refusal. Verify in the browser's network panel, not from code alone.
3. On every page that is tracker-free by the company's rule: no tracker loads (report as a fact; results there are counted in the product's own data).
4. The success event each funnel optimises for (`config/product.md` funnels table) fires once, on success, consent-gated. When it does not exist: file the request (a consent-gated `Lead` or `CompleteRegistration` on success, registered like `PageView`) and use counts by `ref` meanwhile.
5. In-product events (for example `Lead` on sign-up): confirm in Test Events with a fresh account; confirm it fires once (its once-per-device mark).
6. Conversions API: recommend only when volume justifies it and the consent model allows a server event (a product-team and counsel question, not an agent's call).
7. Domain: the company domain verified in the Business portfolio (the Owner's console step); `conversion_domain` on every ad.
8. Attribution: a test visit with `?ref=mt-test-<date>` produces a result row with that `ref` (the product team or the Owner confirms the count, never the row); `utm_*` visible in analytics real-time.
9. Lead path, per form. **Leads Center (the default):** a test lead created with Meta's lead ads testing tool on the form shows in Leads Center, and the notification reaches the person under replies in `config/operator.md` (the Owner confirms; the harness never sees the lead's details); the Owner deletes the test lead in the tool afterwards. A test lead that does not show where `lead_delivery` says leads are read is the finding, not a pass. **Webhook (only when `lead_webhook_url` holds a URL):** the same test lead reaches the company's system (the product team or the Owner confirms), and the follow-up message (email, link) arrives; when the follow-up lane is switched off, say so.
10. Attribution setting on ad sets: 7-day click / 1-day view (default) unless the plan says otherwise. State it in every report.
11. Custom audiences: none built from sign-up or customer lists without the Owner's ruling; website audiences only from consented pixel traffic.
12. Dataset quality: `ads_get_dataset_quality` (event match quality, deduplication) where the account exposes it.

## Output
A table of checks with evidence (the read, the request, the screenshot) and the fix owner (the Owner / the product team / the harness), ordered by impact on optimisation and reporting; a "no pixel, no website" state is recorded at the top as the designed state, never as a fix. Then **the one thing to do first**. Requests to the product team go into a dated plan file labelled "Needs product team" per `config/product-team.md` ("Needs Owner" when there is no product team). Pixel or event changes that need a console click go to the Owner as a click list.
