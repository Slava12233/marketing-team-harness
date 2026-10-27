# Memory routines

Two read-only routines that keep the memory vault honest between sessions. `/setup` (step 5.6) registers them as scheduled tasks in the Claude desktop app; the bootstrap reports whether they are registered. They **recommend and alert only**: they never change the vault (the weekly one writes one new report file), never commit, never touch the ad account and never answer the Owner's Inbox.

| File | Task id | Default time | What it does |
|---|---|---|---|
| `nightly-memory-check.md` | `harness-nightly-memory-check` | 23:00 on working days | Was `/sync` run today, is HOT fresh, lint, proposals waiting, unanswered Inbox lines, uncommitted vault files, open harness items. A phone alert only when something needs attention. |
| `weekly-consolidate-review.md` | `harness-weekly-consolidate-review` | 21:00 the evening before the first working day | Part A of `memory/tools/consolidate.md`, read-only, written to `reports/<date>-consolidate-review.md` for the Operator to approve at `/consolidate`. Always sends a phone alert. |

**How a file becomes a task.** The body below the line `--- prompt ---` is the task prompt. `/setup` replaces `{{HARNESS_DIR}}` with this folder's absolute path and creates the task with `create_scheduled_task` (cron from `config/operator.md`, `## Memory routines`). If the id is taken on the machine (two harnesses), use the free id the tool names and write it into `config/operator.md`.

**Phone alerts.** A run calls `PushNotification`; it reaches the phone when Remote Control is on in the desktop app, otherwise it is a desktop notification. Runs happen while the desktop app is open; a run missed while it was closed runs at the next launch.

**Permission mode.** A task is saved in the permission mode of the session that creates it. The prompts' hard rules and the account guard hook (`.claude/hooks/account-guard.mjs`) are what keep a run read-only; never widen a prompt's rules.

**Without the desktop app** (Claude Code in a terminal only), there is no `create_scheduled_task`: run the same prompts with the machine's scheduler as in `docs/scheduling.md` (no phone alert; the result is the run's log).
