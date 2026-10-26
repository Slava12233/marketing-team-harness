---
type: ledger
created: 2026-10-27
updated: 2026-10-27
status: active
maintained_by: harness
categories: [money]
summary: "Every go the Owner gave, quoted word for word, with the channel, the objects it turned on, the daily budget, the cap, the end date and who executed it. Appended at the go step."
as_of: 
source: 
---

# Go log

Append-only, newest row last; one row per go, written by the main session in the same turn as the activation and its live re-read (`meta-campaign-build`, the go step). `time` carries the timezone of `config/operator.md`. `channel` is `chat` (the Owner typed it in this session), `WhatsApp quoted` or `email quoted` (the Operator pasted the Owner's message; what counts as a go is `config/operator.md`, "The phrasing of a go"). The Owner's words are quoted exactly, never paraphrased, never corrected. `objects` are the ids activated, in backticks. `daily` and `cap` are in the account currency of `config/accounts.md`, as stated in the spend statement the go answered; `cap` names which cap of `config/goals.md` it stays under. `end` is the schedule end set on Meta (or `none`). A go that was refused or not executed gets a row too, with `who executed` = `not executed: <reason>`. Set the frontmatter `as_of` to the newest row's time when you append.

| date | time (tz) | channel | the Owner's words, quoted | objects (ids) | daily | cap | end | who executed |
|---|---|---|---|---|---|---|---|---|
