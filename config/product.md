<!-- Written by /setup on {{DATE}}. Edit by hand or re-run /setup. -->

# Product

**Product name:** {{PRODUCT_NAME}}
<!-- setup: the product's name as used in copy (and the name of any assistant or persona inside it) -->

**One-line promise:** {{ONE_LINE_PROMISE}}
<!-- setup: the headline promise as it appears on the site, quoted verbatim -->

**What it does:** {{WHAT_IT_DOES}}
<!-- setup: a short paragraph on what the visitor actually gets -->

**What it does not do:** {{WHAT_IT_DOES_NOT_DO}}
<!-- setup: limits that copy must never imply (no advice, no sales, no guarantees, can be wrong, etc.) -->

## Funnels

| Name | Audience | Entry | Destination URL | Conversion event | What counts as a result |
|---|---|---|---|---|---|
| {{FUNNEL_NAME}} | {{FUNNEL_AUDIENCE}} | {{FUNNEL_ENTRY}} | {{FUNNEL_DESTINATION_URL}} | {{FUNNEL_CONVERSION_EVENT}} | {{FUNNEL_RESULT}} |
<!-- setup: one row per funnel; audience names match config/audiences.md; entry = ad type (link ad, instant form, click-to-WhatsApp, ...); conversion event as the pixel or the database records it ("none" is a valid answer) -->

## Destination pages

| Language | URL | H1 as written | CTA as written | Pixel present | Notes |
|---|---|---|---|---|---|
| {{PAGE_LANGUAGE}} | {{PAGE_URL}} | {{PAGE_H1}} | {{PAGE_CTA}} | {{PAGE_PIXEL_YES_NO}} | {{PAGE_NOTES}} |
<!-- setup: one row per page that receives paid traffic, fetched live by /setup; quote H1 and CTA verbatim; notes = consent gating, redirects, "not for paid traffic" (e.g. a sign-in screen), dated changes such as a CTA that disappears at launch -->

## Key copy in use

- {{KEY_COPY_LINE}} ({{KEY_COPY_PAGE}})
<!-- setup: quote verbatim, one bullet per line of copy, each with the page and language it comes from; lines that need clearance before use in ads are also listed in config/claims.md -->

## Existing assets

| Asset | What it is | Where it is | Cleared for ads |
|---|---|---|---|
| {{ASSET_NAME}} | {{ASSET_DESCRIPTION}} | {{ASSET_LOCATION}} | {{ASSET_CLEARED_YES_NO}} |
<!-- setup: films, images, screen recordings, brand files, print, demos; location is a path inside this repo or a URL; "cleared" = rights, music licence, real names and AI-voice questions answered -->
