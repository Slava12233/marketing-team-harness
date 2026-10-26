---
name: memory-update
description: "Keep the harness memory current: read at session start, write after any publish, pause, budget change or new finding, write at session end, and when the user says 'update memory' or 'remember this'."
---

# Memory update procedure

**Output:** `memory.md`, `plans/`, `checklist.md` (and `docs/meta-platform-notes.md` or `CLAUDE.md` for durable rules). **Language:** files in English; anything said in chat in the chat language from `config/operator.md`.

The harness has five memory layers. Keep them in sync, in this order of durability:

| Layer | File | What goes there | Cadence |
|---|---|---|---|
| Short-term | `memory.md` (repo root; sections fixed by `docs/TEMPLATE-SPEC.md` §9) | Current state (account facts and the campaigns table), how to verify it, dated learnings, decision rules in force, session log, next steps | Read at session start; write after every state change and at session end |
| Plans | `plans/YYYY-MM-DD-<topic>.md`, `plans/experiments-log.md` | Ids, specs, copy, the Owner's decisions, blockers, requests to the product team | Update when that work changes (plans are living documents) |
| Reports | `reports/YYYY-MM-DD-<topic>.md` | Analysis and recommendations as of a date | Write once; never edit after the Owner has read it |
| Go checklist | `checklist.md` (repo root; a table with columns id, item, owner, status, note, updated, then `## Sync log`) | Every gate between now and a go, by owner, with its status | Update an item when the session establishes a fact about it; one Sync log line per `/sync` |
| Rules and facts | `CLAUDE.md` (rules), `docs/meta-platform-notes.md` (how Meta's server behaves), `config/*.md` (company, product, audiences, brand, claims, accounts, operator, product team) | Operating rules, platform behaviour that is always true, account constants, product facts | Only when a rule changes, a durable behaviour is learned, or the product team ships something that changes a fact |

## At session start
1. Read `memory.md` fully. Treat "Current state" as the truth to verify, not to trust: confirm the MCP login (`ads_get_ad_accounts`, `ads_get_user_pages`) shows the ad account and Page in `config/accounts.md`, and confirm the live objects (`ads_get_ad_entities`) with the reads listed under "How to verify" before acting on them.
2. Read `checklist.md` and note the open and blocked items by owner.
3. If `config/product-team.md` names a place where the product team records what it shipped or ruled (a changelog, a news file), read it read-only for changes since the last session-log entry; if a destination page, consent notice, pixel or funnel change appears, update the matching fact in `config/product.md`, `config/claims.md` or `config/accounts.md` before planning, and add a dated "Learnings" line. When there is no product team, ask the Owner whether any page changed only if a destination check fails.
4. Read the plan file named in "Current state" if the task touches that work.
5. If `memory.md` is missing, recreate it with the §9 sections from `CLAUDE.md`, `config/accounts.md` and the latest plan, then continue.

## After any state change (publish, pause, budget, schedule, new object, upload, new finding)
1. Update "Current state" so every line is true now (the campaigns table: campaign id, name, status, daily budget, cap, start, end, ad sets, ads, last verified).
2. Add a one-line dated entry under "Learnings" if a platform or tool behaviour was discovered.
3. If the finding is durable (will be true next month), also add it to `docs/meta-platform-notes.md` (platform behaviour, no account ids) or `CLAUDE.md` (a rule).
4. If the change closes or blocks a gate, update that row of `checklist.md` (status, note, updated date).
5. A rule the Owner sets goes under "Decision rules" with its date.

## At session end
1. Append one dated entry to "Session log" (newest last): what was asked, what was done, what is live, what was left open, which requests to the product team were filed.
2. Rewrite "Next session should" as a short numbered list of concrete first actions.
3. Make sure every id mentioned in the session is in a plan file, not only in chat.
4. Make sure `checklist.md` reflects the session (the `sync` skill writes its Sync log line).

## Rules
- Never put secrets, tokens, passwords or PII (names, emails, phones of sign-ups or leads) in any memory file. Names of secrets only; counts only.
- Never delete history from the session log; correct a wrong line by adding a dated correction.
- Convert relative dates ("tomorrow", "next week") to absolute dates; give times in the timezone from `config/operator.md` when they matter.
- Report money in the account currency from `config/accounts.md`; state the attribution window when quoting results.
- Never write a number into memory that a live read did not give; "no data" is acceptable.
