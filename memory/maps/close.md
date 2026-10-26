---
type: map
created: 2026-10-26
updated: 2026-10-27
status: active
maintained_by: harness
categories: [maps, close]
summary: "The Close lane map - harness-librarian and the main session at /sync and /consolidate: the contract, the procedure, the generated notes and the inboxes."
---

# Close lane (harness-librarian, the main session at /sync and /consolidate)

## Read first, every lane
- `memory/HOT.md` (in your context from the SessionStart hook; read it if not)
- [[current]] (`memory/state/current.md`: account facts, the campaigns table, next actions)
- [[business/goals|goals]] (money: the band, the targets, the caps)
- [[claims-and-compliance]] and [[business/audiences|audiences]] before any copy, creative or targeting work
- the notes under `memory/tooling/` when a tool question comes up

## The contract and the procedure
- [[memory/README|README]] (`memory/README.md`) · `memory/tools/consolidate.md` · skills `memory-update`, `sync`

## Generated notes (never hand-edit)
- `memory/HOT.md` · `memory/INDEX.md` · `memory/capabilities/` · the generated block of [[HOME]] · `dashboard/state.json`

## Inboxes
- [[owner]] (the Owner writes, the harness answers) · [[proposals]] (agents propose, the main session merges)

## Money ledgers (`memory/money/`, type `ledger`, append-only, newest row last; see [[money/_about|money]])
- [[ledger]] (`memory/money/ledger.md`): what running the harness cost. **Appended at `/sync`**, one row per paid item of the session: `| date | item | kind | amount | currency | source | as_of | note |`, kind one of `fal`, `claude usage`, `media`, `tool`, `hours` (amount in hours, currency `h`), `other`. The amount is the one stated before the Owner's go for a paid step, or the tool's own cost read, or the Operator's word for hours; `source` says which. Ad spend is never a row (it is read live from Meta and held against `config/goals.md`). Then set the note's frontmatter `as_of` to the newest row's time. No session cost: no row.
- [[go-log]] (`memory/money/go-log.md`): every go the Owner gave. **Appended at the go step** (`meta-campaign-build`), in the same turn as the activation and its live re-read, not at `/sync`: `| date | time (tz) | channel | the Owner's words, quoted | objects (ids) | daily | cap | end | who executed |`, channel `chat`, `WhatsApp quoted` or `email quoted`, the words exactly as given, the ids that were activated, the daily budget and the cap from the spend statement the go answered. `/sync` only checks that every activation of the session has its row (step 5) and adds a missing one marked `(added at /sync)`.
- Corrections are new rows naming the row they correct; never a deleted or edited row. Names and public ids only.

## Shared memory with the product team
- only if [[where-product-truth-lives]] (from `config/product-team.md`) names one; read and write it as that note says
