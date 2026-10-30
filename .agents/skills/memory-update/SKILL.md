---
name: memory-update
description: "Keep the harness memory vault (memory/) current: read at session start, write after any publish, pause, budget change, ruling or new finding, close at session end, and when the user says 'update memory' or 'remember this'."
---

# Memory update procedure (the vault)

The harness memory is the Obsidian vault in `memory/`. Its contract is `memory/README.md`: folders, frontmatter, note bodies, caps, who reads and who writes. This skill is that contract as a procedure; the contract wins on conflict. Templates for every note type are in `memory/templates/`.

**Output:** vault notes under `memory/`, `plans/`, `checklist.md`; `config/*.md` only when a company or account fact changed. **Language:** notes in English; the Owner's notes (`memory/HOME.md`, the answers in `memory/inbox/owner.md`, the weekly review) in the chat language from `config/operator.md`; anything said in chat in that language.

## Where things go

| Folder / file | What goes there | Written by |
|---|---|---|
| `memory/HOT.md`, `memory/INDEX.md`, `memory/capabilities/*`, HOME's generated block, `dashboard/state.json` | Generated: what every session must know; one line per note; the capability map; the control-room data | `node memory/tools/build-hot.mjs`, `node memory/tools/build-capabilities.mjs` only; never hand-edited |
| `memory/state/current.md` | Account facts as last verified (the time of the live read in `as_of`), the campaigns table (campaign id, name, status, daily budget, cap, start, end, ad sets, ads, last verified), the plan to read first, the next actions | main session |
| `memory/business/` | Company, product, brand, audiences, claims and compliance, funnels, offers, goals, where product truth lives; first filled by `/setup` from `config/*.md` and the interview (contract §2) | `/setup`, then the main session |
| `memory/open/` | One note per open item (`owner:` owner, operator, harness, product-team or lawyer); HOT and HOME list them by owner; the go gates themselves stay rows of `checklist.md` | main session |
| `memory/campaigns/`, `flights/`, `audiences/`, `experiments/` | Entity notes: `## Current state` (rewritten, true now) and `## Log` (dated, append-only) | main session |
| `memory/decisions/YYYY-MM-DD-slug.md` | One ruling by the Owner per note | main session |
| `memory/learnings/<meta-platform, creative, audiences, tooling, money>/` | One fact per note, `status` confirmed or hint | main session |
| `memory/sessions/YYYY-MM/YYYY-MM-DD.md` | Today's append-only log; PreCompact checkpoints; the `## Close` block | main session, the PreCompact hook |
| `memory/reviews/YYYY-Www.md` | The weekly review, in the chat language | main session (`/next-round`, or `/sync` on the last working day of the week when the round did not run), from `memory/templates/review-he.md` or `review-en.md` |
| `memory/inbox/owner.md` | The Owner writes; the harness answers under each line (`↳`, chat language) | Owner; harness answers only |
| `memory/inbox/proposals.md` | Sub-agents' proposed learnings and corrections | sub-agents append; main session merges at `/sync` |
| `memory/maps/<lane>.md`, `memory/tooling/` | Lane maps (what each lane reads first); hand-kept tool knowledge | main session |
| `memory/archive/` | Superseded notes, closed campaigns after 90 days | `/consolidate` |
| `plans/`, `reports/` | Plans (living, every id) and reports (written once), both with the contract's frontmatter | main session and sub-agents, each its own file |
| `checklist.md` (repo root) | The go checklist: a table `id, item, owner, status, note, updated`, then `## Sync log` (shape in `docs/TEMPLATE-SPEC.md` §9) | main session; one Sync log line per `/sync` |
| `config/*.md` | The company's setup facts, written by `/setup`, imported by `CLAUDE.md` | `/setup`, the Owner by hand, or the main session when a fact changed (the matching `memory/business/` note the same turn) |

## At session start
1. **HOT.** The SessionStart hook injects `memory/HOT.md`. If its lines are not in your context (the hook is not installed, or the session was compacted), read `memory/HOT.md` yourself.
2. **State and plan.** Read `memory/state/current.md` and the plan file it names. Treat it as the truth to verify, not to trust.
3. **Lane map.** Read the map of the work at hand (`memory/maps/build.md` for any create, update or activate; `measure.md` for reports and audits; `create.md` for copy and creative; `gate.md` for compliance and tests; `close.md` for memory work) and the notes it names. Find anything else by grepping `memory/INDEX.md` (never read it whole past 300 lines) or with the Obsidian CLI's `search` when it is registered.
4. **Inbox and checklist.** If `memory/inbox/owner.md` has open lines, answer them as `/morning` step 0 describes (file, answer, never act). Read `checklist.md` and note the open and blocked items by owner.
5. **Product team.** If `config/product-team.md` names a place where the product team records what it shipped or ruled (a changelog, a news file, a shared memory), read it read-only for changes since the newest session note; if a destination page, consent notice, pixel or funnel fact changed, update the matching `config/*.md` field and `memory/business/` note (a new learning or decision note where the change is a ruling) before planning. With no product team, ask the Owner whether a page changed only when a destination check fails.
6. **Verify.** One live read before acting on "Current state": the MCP login (`ads_get_ad_accounts`, `ads_get_user_pages`) shows the account and Page in `config/accounts.md`, and the objects you will touch (`ads_get_ad_entities`). Where the read contradicts a note, the read wins and the note is rewritten at once (below).
7. If `memory/state/current.md` is missing, rebuild it from the campaign notes, `config/accounts.md`, the latest plan and one live read before anything else, and say so. If the whole vault is missing or broken, rebuild it from `memory/README.md` and `memory/templates/`, and tell the Owner.

## After any state change (publish, pause, budget, schedule, new object, upload, ruling, finding)
Do it in the same turn, not at the end.
1. **Entity note.** Rewrite the note's `## Current state` so every line is true now, with `as_of` set to the time of the live read and `source` to the tool; append a dated bullet to its `## Log` (`- YYYY-MM-DD HH:MM — what changed, ids in backticks`). A new campaign, flight, audience or experiment gets a note from its template in `memory/templates/` the same turn. Update `memory/state/current.md` where the change touches the campaigns table or the account facts.
2. **Session note.** Append `- HH:MM — asked / done / decided / open` to `memory/sessions/YYYY-MM/YYYY-MM-DD.md` (create it from `memory/templates/session.md` if it does not exist; `YYYY-MM` is a folder).
3. **A ruling by the Owner** → a new note in `memory/decisions/YYYY-MM-DD-slug.md` from the decision template, the Owner's words quoted; when it replaces an older ruling, set `supersedes:` on the new note, and on the old one only `status: superseded` and `superseded_by:`. A ruling that changes a money limit is also a change to `config/goals.md` (the Owner's, in writing) and `memory/business/goals.md`.
4. **A finding** → grep `memory/INDEX.md` for an existing note first. None: a new learning note from the template under the right `learnings/` subfolder, with `evidence` and `applies_to`. One exists and the finding contradicts it: a new note that supersedes it (never edit the old body).
5. **Durable Meta behaviour** (will be true next month) → a learning note in `memory/learnings/meta-platform/` (no account ids in the body when it is platform behaviour), and its link added to the list in `memory/maps/build.md` the same turn so `meta-campaign-build`, `health` and `morning` read it before the next build. When it changes how builds must be done, also update the summary in `CLAUDE.md` → "Meta platform behaviour". (`docs/meta-platform-notes.md` is superseded by these notes and is not written to.)
6. **Ids.** Every new id goes into its campaign or flight note the same turn, and into the plan file.
7. **Gates.** If the change closes or blocks a gate, update that row of `checklist.md` (status, note, updated date).

## At session end
Run `/sync` (the `sync` skill). It merges `memory/inbox/proposals.md`, answers the Inbox, closes today's session note with the `## Close` block, updates `checklist.md`, regenerates the capability map, HOT, INDEX, HOME's block and `dashboard/state.json`, runs the lint, and commits locally when the folder is a git repository.

## Rules
- **One writer.** Only the main session writes canonical notes (`memory/state`, `business`, `campaigns`, `flights`, `audiences`, `open`, `experiments`, `decisions`, `learnings`, `sessions`, `reviews`, `maps`, `tooling`, HOME's generated block). Sub-agents write their own outputs (reports, plans, briefs) with the contract's frontmatter and append proposals to `memory/inbox/proposals.md` as `- YYYY-MM-DD HH:MM agent:<name> — proposed learning: … (evidence: …)`. No two writers on one note.
- **Generated notes are never hand-edited.** `HOT.md`, `INDEX.md`, `capabilities/*`, HOME's block between its markers and `dashboard/state.json` change only through the tools; a hand edit fails the lint.
- **The Owner's notes are the Owner's.** `memory/HOME.md` below `%% generated:end %%` and the Owner's lines in `memory/inbox/owner.md` are not edited; the harness writes only inside its marked blocks and as `↳` answers under the Owner's lines.
- **Dated notes are never edited.** Learning and decision notes stay as written on their day; a correction is a new note with `supersedes:`; the old note gets only `status: superseded` and `superseded_by:`. Session logs and `## Log` sections are append-only; a wrong line gets a dated correction below it.
- **Figures.** Every figure in a note carries `as_of` and `source` in the frontmatter (or inline beside it); a figure is re-read live before it drives an action. Live metrics stay in reports, not in entity notes. Money in the account currency from `config/accounts.md`, with the attribution window when quoting results. Never a number a live read did not give; "no data" is acceptable.
- **Names and public ids only.** Never a secret, token, password or `.env` value; never a lead's or sign-up's name, email or phone (counts by `source` and `ref` only). The lint fails on those shapes.
- **Dates absolute.** "Tomorrow", "next week", "Monday" become `YYYY-MM-DD`; times carry the timezone from `config/operator.md` when they matter.
- **Caps.** HOT ≤ 60 lines / 8 KB, HOME ≤ 150 lines, any note ≤ 300 lines (split into linked notes), HOT's learnings digest ≤ 20 rows; a breach is fixed by `/consolidate`.
- **Config and vault agree.** `config/*.md` is what `/setup` writes and `CLAUDE.md` imports; `memory/business/` carries the same facts as linked notes with dates and sources. When the two disagree, `config/*.md` wins: correct the business note in the same turn and say so in the session note.
- **Links.** Wikilinks `[[note-name]]` between notes, ids in backticks, creative files by path.
