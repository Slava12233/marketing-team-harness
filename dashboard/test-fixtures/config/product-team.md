<!-- Written by /setup on {{DATE}}. Edit by hand or re-run /setup. -->

# Product team

Optional. The people who ship the company's website, pages, consent wording and tracking. Their files are read-only from this harness.

**Product repository:** {{PRODUCT_REPO_PATH}}
<!-- setup: a path or URL the harness may read (never write); "none" or "not shared" are valid answers -->

## Where product truth lives

| Need | Path |
|---|---|
| Rules, legal gate, standing rulings | {{PATH}} |
| What shipped, what is owed, what was decided | {{PATH}} |
| Page copy (each language) | {{PATH}} |
| Consent and notice texts and their ids | {{PATH}} |
| Pixel and analytics code | {{PATH}} |
| Lead webhook and funnel plans | {{PATH}} |
| Customer research and pains | {{PATH}} |
| Brand kit, RTL rules | {{PATH}} |
| Legal notes | {{PATH}} |
| Films, images, print | {{PATH}} |
<!-- setup: one row per need; delete rows that do not apply; paths are relative to the product repository above -->

## How a request is filed

A change to a page, event or notice is a dated plan file in `plans/` (`plans/YYYY-MM-DD-request-<topic>.md`) with the exact wording or spec, labelled **"Needs product team"**. {{REQUEST_HAND_OFF}}
<!-- setup: how the request reaches the product team (the Owner carries it to their board, a ticket system, an email address) -->

## Shared memory conventions

{{SHARED_MEMORY}}
<!-- setup: if the product team keeps a shared memory or changelog the harness should read at session start (and write one entry to at session end), name the file and the rule; otherwise "none" -->

If the company has no product team, write: `No product team. Page, wording and tracking changes are the Owner's; file them in plans/ as 'Needs Owner'.`
