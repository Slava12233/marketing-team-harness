---
name: sync
description: "The session closer (the context sync): verify the session's state changes by one live read, write the memory layers per memory-update, update the go checklist (item statuses and notes, plus one Sync log line) in checklist.md, refresh the control-room board, and give the Owner the short closing message. Use at the end of a session, after a big state change, or when the Operator types /sync."
---

# /sync: close the session and fill the checklist

Project rules (`CLAUDE.md`) win on conflict. No PII, no secrets (names only), counts only, absolute dates.

**Output:** `memory.md`, the flight's plan file, `checklist.md`, `dashboard/state.json` (and `docs/meta-platform-notes.md` or `CLAUDE.md` only for a durable rule). **Language:** memory, plan and checklist text in English; the closing message in the chat language from `config/operator.md`; money in the account currency from `config/accounts.md`.

## Procedure
1. **Collect the facts of this session**, each with its evidence: state changes (object ids, statuses, budgets, schedules, uploads with image hashes and video ids), decisions the Owner made (their words, quoted), requests filed to the product team (file names), reports written, open items and their owners, timings learned (review durations, platform behaviour). A fact that cannot be verified is written as "unverified".
2. **One live read** of every changed Meta object (`ads_get_ad_entities`, `ads_get_errors`) before anything is recorded; the record says what the read showed, not what was requested. When anything is ACTIVE, the same read takes today's and this week's spend and the live daily budgets, so they can be held against the caps in `config/goals.md` (the logic of `health` check 15).
3. **Memory layers**, per the `memory-update` skill's "At session end" (the `harness-librarian` agent, sonnet, can do steps 3–4 from the facts list):
   - `memory.md`: "Current state" true now (the campaigns table re-verified with step 2's read); a dated "Learnings" line per discovered behaviour; a dated "Decision rules" line per rule the Owner set; the dated "Session log" entry; "Next session should" rewritten as numbered first actions.
   - the plan file: every id from the session.
   - `docs/meta-platform-notes.md`: only a durable platform behaviour, without account ids; `CLAUDE.md`: only a durable rule; `config/*.md`: only a company or account fact that changed.
4. **The go checklist** (`checklist.md`, repo root).
   - Read the table first.
   - Update only the rows the session established a fact about: `status` (open / blocked / done / n/a), `note` (one or two sentences, counts and ids allowed, starting with the date and time), `updated` (the date). An item owned by the Owner, the Operator or the Product team is never set to done by the harness; it gets a note. Items the harness owns may be set to done with the evidence in the note.
   - Add a new row for a gate the session discovered (next free id, owner, status `open`).
   - Append one line under `## Sync log`: `- YYYY-MM-DD HH:MM <timezone>: <what changed, what is open, what is next>` (at most 400 characters). A second sync the same day gets its own line. When spend above a cap in `config/goals.md` was observed this session (step 2's read, a `/morning` or a `/health` run), the line names it: the cap, the spend and its period, and whether the Owner paused.
   - Never rewrite or delete an earlier Sync log line or a teammate's note; add a dated line instead. If `checklist.md` is missing, recreate it with the shape in `docs/TEMPLATE-SPEC.md` §9 from `memory.md`, and say so in the closing message.
5. **Control-room board.** Rewrite `dashboard/state.json` as `/morning` step 8 describes, from step 2's live read and the rewritten "Next session should": the first open task in `tasks` is the next session's first action. `money.caps` is copied from `config/goals.md` in the same shape, `[{"label": "daily" | "weekly" | "monthly" | "<campaign name>", "amount": <number>, "period": "day" | "week" | "month" | "campaign"}]` (amounts exactly as the file has them, never invented; `[]` while the file is missing or holds placeholders), and `money.dailySpend` comes only from step 2's read (null when it gave none).
6. **Closing message to the Owner**, at most 15 lines, in the chat language: what changed (with ids), what is live and what it costs (per day in the account currency and the cap; "nothing live, 0" when so), any cap in `config/goals.md` crossed or at 80 % or more, what is open and who owns it, the first action for the next session, the paths of the day's report files and `checklist.md`.

## Rules
- Reports are written once; a correction is a new dated file or a dated line, never an edit of a read report.
- A sync never activates, pauses, deletes or changes delivery; it records. A pause the Owner asked for in chat is executed by the main session before the sync, then recorded.
- Relative dates become absolute; times carry the timezone from `config/operator.md` when they matter.
- Never write a number into memory, the checklist or the board that a live read did not give; the one exception is the board's `money.caps`, copied from the Owner's numbers in `config/goals.md`.
