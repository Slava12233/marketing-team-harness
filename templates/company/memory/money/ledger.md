---
type: ledger
created: 2026-10-27
updated: 2026-10-27
status: active
maintained_by: harness
categories: [money]
summary: "What running the harness cost the company, one row per item (fal, Claude usage, media, tools, hours, other); ad spend is read live from Meta, not kept here. Appended at /sync."
as_of: 
source: 
---

# Cost ledger

Append-only, newest row last; one row per item. `kind` is one of: `fal` (generation jobs, the cost stated before the Owner's go), `claude usage` (the plan or the usage read for the period), `media` (stock, music, footage bought), `tool` (a subscription or a one-off tool), `hours` (the Operator's hours, amount = hours, currency = `h`), `other` (say what in `note`). `source` says where the amount came from (the tool's own cost read, an invoice by its number, the Operator's word); `as_of` is the date and time it was read. A correction is a new row that names the row it corrects. Never a card number, a token or a lead's personal data. Set the frontmatter `as_of` to the newest row's time when you append.

| date | item | kind | amount | currency | source | as_of | note |
|---|---|---|---|---|---|---|---|
<!-- example row, do not keep: | 2026-11-03 | 4 still variations, flight 2026-11-first-flight #6-#9 | fal | 0.60 | USD | the fal cost estimate stated before the Owner's go | 2026-11-03T11:20+00:00 | the Owner's go in chat 2026-11-03 | -->
