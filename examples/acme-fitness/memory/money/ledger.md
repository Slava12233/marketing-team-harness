---
type: ledger
created: 2026-10-27
updated: 2026-10-27
status: active
maintained_by: harness
categories: [money]
summary: "FICTIONAL EXAMPLE. What running the harness cost Acme Fitness, one row per item; ad spend is read live from Meta, not kept here. Appended at /sync."
as_of: 2026-10-27T18:05+00:00
source: the Operator's word at /sync
---

# Cost ledger

> FICTIONAL EXAMPLE. The person and the hours are invented.

Append-only, newest row last; one row per item. `kind` is one of: `fal`, `claude usage`, `media`, `tool`, `hours` (amount in hours, currency `h`), `other`. A correction is a new row that names the row it corrects.

| date | item | kind | amount | currency | source | as_of | note |
|---|---|---|---|---|---|---|---|
| 2026-10-27 | build session: creatives #1-#5 compliance-checked and built PAUSED in both campaigns | hours | 3.5 | h | Sam Park (fictional), Operator, at /sync | 2026-10-27T18:05+00:00 | no paid generation: the creatives are the company's own photos, screenshot and video |
