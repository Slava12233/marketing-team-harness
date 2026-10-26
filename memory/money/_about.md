---
type: contract
created: 2026-10-27
updated: 2026-10-27
status: active
maintained_by: harness
categories: [money]
summary: "Two running ledgers: ledger.md (what running the harness cost: fal, Claude usage, media, tools, hours) and go-log.md (every go the Owner gave, quoted, with objects, daily budget, cap and end)."
---

# money/

The money the harness itself costs, and the audit trail of every go. Two notes, both type `ledger`, both append-only tables (newest row last, a wrong row is corrected by a new row that says so, never edited away):

- [[ledger]] (`memory/money/ledger.md`): what running the harness for the company cost, one row per item: generation on fal, Claude usage, media bought, tools, the Operator's hours, other. **Ad spend is not here**: it is read live from Meta and reported against the caps in `config/goals.md`. Appended by the main session at `/sync` from the session's facts (a paid step's cost was stated before the Owner's go, so it is known; hours come from the Operator's word). Used for invoicing and for the monthly cost of the service.
- [[go-log]] (`memory/money/go-log.md`): every go the Owner gave, the Owner's words quoted exactly, with the channel it came through, the objects it turned on (ids), the daily budget, the cap it stays under, the end date and who executed it. Appended by the main session at the go step of `meta-campaign-build`, in the same turn as the activation and its live re-read. What counts as a go is `config/operator.md` ("The phrasing of a go"); the log records it, it never makes one.

Rules: amounts in the currency of the row (the account currency of `config/accounts.md` for Meta budgets; a tool's own billing currency for the ledger), every row with `as_of` and `source`, and the note's frontmatter `as_of` set to the newest row's time. Names and public ids only: never a token, an invoice's card digits, a lead's name, email or phone. Only the main session writes here (one writer); a sub-agent proposes a row in `memory/inbox/proposals.md`.
