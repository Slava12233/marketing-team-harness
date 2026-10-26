---
type: inbox
created: 2026-10-26
updated: 2026-10-26
status: active
maintained_by: harness
categories: [inbox]
summary: Sub-agents append proposed learnings and corrections here; the main session merges them at /sync and empties the list.
---

# Proposals

Sub-agents append one line per proposal under "Open", newest last, in this format:

`- YYYY-MM-DD HH:MM agent:<name> — proposed learning: … (evidence: …)`

A correction uses the same shape with `proposed correction:` and names the note it corrects as a wikilink. Names and public ids only: never a token, a lead's name, email or phone. The main session merges every line at `/sync` (a learning note, a superseding note, or a dropped line with the reason in the session note) and then empties the list; the lint warns when a line is older than 7 days.

## Open
