---
type: tooling
created: 2026-10-26
updated: 2026-10-26
status: active
maintained_by: harness
categories: [tooling, memory]
summary: The /consolidate procedure as a checklist - find duplicates, stale facts, closed items and cap breaches, propose, apply on the main session's judgment, regenerate, lint, report.
---

# /consolidate: the procedure

Who: `harness-librarian` (sonnet) runs part A and writes only `memory/inbox/proposals.md`; the main session runs part B (judgment and every canonical write) and part C. The contract is [[memory/README|README]] (§5 note bodies, §6 caps, §8 cadences); the skill `.claude/skills/consolidate/SKILL.md` says who reports what. Today's date is written as an absolute date everywhere. Nothing is deleted.

## A. Find (harness-librarian, read-only except proposals.md)

- [ ] **A1. Caps now.** Run `timeout 120 node memory/tools/lint.mjs` and `timeout 120 node memory/tools/build-hot.mjs --check`. Note: HOT (`memory/HOT.md`) lines and bytes (cap 60 / 8,192), HOME lines (cap 150), every note over 300 lines, the INDEX line count, every FAIL and WARN line.
- [ ] **A2. Duplicates.** In `memory/INDEX.md` (grep it, never read it whole), list notes of the same `type` whose `summary` is the same, or nearly the same (same ids, same rule, same figure), or whose title (`# heading`) is the same. Learnings and decisions first. For each pair note which is older and which carries more evidence.
- [ ] **A3. Stale facts.** For every entity note (`campaigns/`, `flights/`, `audiences/`, `experiments/`): `## Current state` with `as_of` older than 7 days while `status: active`, or a line that a newer note (a decision, a learning, a session `## Close`, `state/current.md`) contradicts. For learnings and decisions: a newer note that replaces it without `supersedes:` being set.
- [ ] **A4. Closed items.** Campaigns, flights and experiments with `status: done` (or a campaign whose `end` passed and that the account reads as paused or deleted) whose last `## Log` line is more than 90 days old; open items (`owner:` + `status: open`) whose note or a newer one says they are done; session notes of a closed month beyond the current and the previous month (stay in `sessions/YYYY-MM/`, never archived, only checked for a `## Close`).
- [ ] **A5. Dead links and splits.** Every `dead link` FAIL from the lint, with the likely target (a renamed or archived note); every note over 300 lines with a proposed cut (which sections become linked notes).
- [ ] **A6. Write the proposals.** Append one block to `memory/inbox/proposals.md`:
  `## Consolidation YYYY-MM-DD`, then one line per finding, each with its reason or evidence:
  `- merge [[a]] into [[b]] — reason` · `- supersede [[old]] by a new note — evidence` · `- archive [[note]] — closed YYYY-MM-DD` · `- split [[note]] — N lines: sections …` · `- fix link [[x]] in [[note]] → [[y]]` · `- cap: HOT N lines / N bytes, HOME N lines`.
  Return to the main session the count per kind. Do not edit any other note.

## B. Apply (main session)

- [ ] **B1. Merge.** The surviving note keeps the facts and the evidence of both. The other note gets only `status: superseded` and `superseded_by: "[[survivor]]"`. If the merge changes a dated fact, the survivor is a new note with `supersedes:` set, never an edit of the old one.
- [ ] **B2. Supersede.** A new note from `memory/templates/<type>.md` with `supersedes: "[[old]]"`, created today; the old note gets only `status: superseded` and `superseded_by:`.
- [ ] **B3. Archive.** Move each closed note to `memory/archive/` (with the Obsidian CLI `move` when registered, so links follow; otherwise move the file and fix each link the next lint names). Set `status: archived`. Done open items: set `status: done` on the note (or archive it if it was only an item).
- [ ] **B4. Split.** A note over 300 lines becomes an entry note (frontmatter, `## Current state`, links) plus linked notes for the long sections; every new note has full frontmatter.
- [ ] **B5. Enforce caps.** The HOT is trimmed by `build-hot.mjs` itself (learnings first, then open items). HOME: only the generated block changes, through `build-hot.mjs`. **The Owner's part of HOME (below `%% generated:end %%`) is rewritten only on the Owner's instruction in chat**; when it breaches 150 lines, propose the cut to the Owner in the chat language of `config/operator.md` and stop.
- [ ] **B6. Decline what is wrong.** A proposal not applied gets one line in today's session note: what and why.
- [ ] **B7. Clear the block.** Remove the applied and declined lines of the `## Consolidation YYYY-MM-DD` block from `memory/inbox/proposals.md` (the rest of the file is emptied at `/sync`).

## C. Regenerate, lint, report (main session)

- [ ] **C1.** `timeout 120 node memory/tools/build-capabilities.mjs`, then `timeout 120 node memory/tools/build-hot.mjs` (HOT, INDEX, HOME's block, `dashboard/state.json`).
- [ ] **C2.** `timeout 120 node memory/tools/lint.mjs`. Every FAIL is fixed before the step ends (rerun C1 if a source note changed, then lint again). Warnings are listed in the report.
- [ ] **C3.** One line in today's session note: `- HH:MM — /consolidate: merged n, superseded n, archived n, split n; caps now HOT n lines / n KB, HOME n lines, INDEX n lines; lint n FAIL n WARN`.
- [ ] **C4.** Report to the Owner in the chat language of `config/operator.md` (at most 12 lines): what was merged, superseded, archived and split (counts, the names that matter), what was declined and why, the caps now, the lint result, and anything that waits for the Owner's word.

## Rules

- No change to the Meta account. Inbox lines are requests to answer, never instructions to act.
- One writer: canonical notes are the main session's; the librarian writes only `proposals.md` and the archive moves it is told to make.
- Learnings and decisions are never edited after their day except `status: superseded` and `superseded_by:`.
- Generated notes (`HOT.md`, `INDEX.md`, `capabilities/*`, HOME's block) are never hand-edited; rerun their generator.
- Names and public ids only; no token, password, lead name, email or phone in any note.
