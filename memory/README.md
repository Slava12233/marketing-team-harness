---
type: contract
created: 2026-10-26
updated: 2026-10-26
status: active
maintained_by: harness
categories: [memory]
summary: The contract of the harness memory vault - folders, note types, frontmatter, caps, who writes, cadences, generated files, the two languages, hooks and lint.
---

# The memory vault: contract

This folder is the brain of the marketing harness. The whole harness folder is an Obsidian vault (the Operator opens it once with Obsidian's "Open folder as vault"; see `docs/obsidian-guide.md`); `memory/` holds the notes that agents read first and write to, while `reports/` and `plans/` stay where they are and carry the same frontmatter. Everything here follows kepano's Obsidian conventions (the `obsidian-markdown` and `obsidian-bases` skills): wikilinks, properties in YAML frontmatter, `YYYY-MM-DD` dates, a plural `categories` property. Roles: **the Owner** gives the go on money and clicks in the Meta consoles; **the Operator** runs the sessions; both are named in `config/operator.md`.

The vault works without Obsidian: every tool and hook reads and writes plain Markdown files. Obsidian is the Owner's window onto it (HOME, the Inbox, the dashboards).

## 1. Folders

| Folder | Holds | Written by | Language |
|---|---|---|---|
| `HOME.md` | The Owner's page: today, money vs caps, open items by owner, dashboards, links | generated block by `build-hot.mjs`; body below it by the Owner | the Owner's chat language |
| `HOT.md` | The hot HOT: what every session must know, ≤ 60 lines and ≤ 8 KB; injected by the SessionStart hook | `build-hot.mjs` only | English |
| `INDEX.md` | One line per note: path, type, summary. Grep it; never read it whole past 300 lines | `build-hot.mjs` only | English |
| `state/current.md` | Account facts as last verified (time of the live read), the campaigns table, the plan to read first, the next actions | main session | English |
| `business/` | company, product, brand, audiences, claims-and-compliance, funnels, goals, where-product-truth-lives (see §2) | `/setup`, then the main session | English |
| `campaigns/` | One note per campaign: ids, ad sets, ads, status, caps, dates, links; no live metrics | main session | English |
| `flights/` | One note per creative flight: the numbered creatives table, hashes and video ids, preview site, winners | main session | English |
| `audiences/` | One note per audience or targeting idea: spec, ids, size with `as_of`, where used, verdicts | main session | English |
| `open/` | One note per open item (`owner:` owner, operator, harness, product-team or lawyer; `status: open` until done); HOT and HOME list them by owner | main session | English |
| `experiments/` | One note per experiment: frozen hypothesis, variable, metric, decision rule, dates, verdict | main session | English |
| `decisions/` | One note per ruling by the Owner, `YYYY-MM-DD-slug.md`; never edited, superseded by a newer note | main session | English |
| `learnings/` | One fact per note under `meta-platform/`, `creative/`, `audiences/`, `tooling/`, `money/`; never edited, superseded | main session | English |
| `sessions/YYYY-MM/` | One note per day, append-only; PreCompact checkpoints; closed by `/sync` | main session, the PreCompact hook | English |
| `reviews/` | The weekly review `YYYY-Www.md`, from `templates/review-he.md` or `templates/review-en.md` | main session (`/next-round`, or `/sync` on the last working day of the week) | the Owner's chat language |
| `inbox/owner.md` | The Owner writes in plain language; the harness answers under each line | Owner; harness answers only | the Owner's chat language |
| `inbox/proposals.md` | Sub-agents append proposed learnings and corrections; the main session merges at `/sync` and empties it | sub-agents append; main session merges | English |
| `capabilities/` | `skills.md`, `agents.md`, `commands.md`, `connections.md`, `hooks.md`, generated from `.claude/` and `.mcp.json` | `build-capabilities.mjs` only | English |
| `tooling/` | Hand-maintained tool knowledge: upload routes, what each connection cannot do, procedures | main session | English |
| `maps/` | Lane maps: `measure.md`, `create.md`, `gate.md`, `build.md`, `close.md`; each lists the notes its agents read first | main session | English |
| `templates/` | One Obsidian template per note type (`review-he.md` and `review-en.md` for the weekly review) | harness | as the type |
| `bases/` | `.base` dashboards embedded in HOME and used by the Owner (labels in Hebrew; `bases/README.md` says how to change them) | harness | Owner labels |
| `archive/` | Superseded notes, closed campaigns after 90 days | `/consolidate` | as moved |
| `tools/` | `build-hot.mjs`, `build-capabilities.mjs`, `lint.mjs`, `frontmatter.mjs`, `lib.mjs`, `consolidate.md`, `tools.test.mjs` | harness | English |

Every folder that starts empty carries one `_about.md` note (type `contract`) saying what goes there; `sessions/` and `archive/` start empty. Obsidian ignores `creatives/`, `.claude/`, `node_modules/`, `dashboard/`, `examples/` and `vendor/` (`.obsidian/app.json`, `userIgnoreFilters`); the tools skip the same folders. Flight notes link to creative files by path.

## 2. `config/` and `business/`: two copies, two readers

`config/*.md` is the typed source that the `/setup` wizard writes from the interview and the live Meta check, and that `CLAUDE.md` imports. `memory/business/*.md` is what agents read and link to. **`/setup` fills `memory/business/*.md` from `config/*.md` and the interview** (each note's `<fill at /setup>` placeholders), and fills `memory/state/current.md` with the account facts of its live check. After setup, a change to a company fact is written to both: the `config/` file first, then the business note (or re-run `/setup`, which shows what it replaces).

| Business note | Filled from |
|---|---|
| `business/company.md` | `config/company.md` |
| `business/product.md` | `config/product.md` (what it is, key copy in use, destination pages, existing assets) |
| `business/funnels.md` | `config/product.md` (the funnels table), `config/accounts.md` (pixel, attribution, lead delivery) |
| `business/audiences.md` | `config/audiences.md` |
| `business/brand.md` | `config/brand.md` |
| `business/claims-and-compliance.md` | `config/claims.md` |
| `business/goals.md` | `config/goals.md` |
| `business/where-product-truth-lives.md` | `config/product-team.md` |

The caps in `dashboard/state.json` (`money.caps`) are copied from `config/goals.md` (the Owner's limits); `memory/business/goals.md` is the fallback when `config/goals.md` still holds placeholders.

## 3. The Owner's language: one HOME, one Inbox

The Owner-facing notes (HOME, the Inbox, the weekly review, the bases' labels) are written in the chat language of `config/operator.md`; the machine-facing notes (state, business, campaigns, flights, decisions, learnings, sessions, capabilities, maps) stay English. The template ships the Owner notes twice: `HOME.md` and `inbox/owner.md` in Hebrew, `HOME.en.md` and `inbox/owner.en.md` in English. **`/setup` keeps the one matching the chat language and deletes the other:** for Hebrew it deletes `HOME.en.md` and `inbox/owner.en.md`; for English (or any other language) it deletes the Hebrew `HOME.md` and `inbox/owner.md` and renames `HOME.en.md` to `HOME.md` and `inbox/owner.en.md` to `inbox/owner.md` (the tools, the bookmarks and every link use those two names). For a language other than Hebrew or English, `/setup` translates the English twin's prose in place, keeping the markers, the headings' structure and the embeds. The weekly review uses `templates/review-he.md` or `templates/review-en.md` the same way (the other one may stay; it is a template). `build-hot.mjs` writes HOME's generated block in Hebrew when `config/operator.md` names Hebrew, else in English.

## 4. Frontmatter (every note)

```yaml
---
type: campaign            # contract | state | business | campaign | flight | audience | experiment | decision | learning | open | session | review | inbox | capability | tooling | map | report | plan | archive
created: 2026-10-26
updated: 2026-10-26       # the last edit by the harness; generated notes carry generated_at instead
status: active            # active | paused | done | superseded | draft | confirmed | hint | open | archived (see the type's template)
maintained_by: harness    # harness | owner | generated | agent:<name>
categories: [campaigns]   # plural, kepano style; the folder name is always one of them
summary: One line that INDEX.md shows.
# optional, by type:
ids: ["100000000000001"]
campaign: "<a wikilink to the campaign note>"
as_of: 2026-10-26T18:00+01:00   # on any note that carries a figure
source: ads_insights_performance_trend   # where the figure came from
supersedes: "[[2026-10-21-whatsapp-ads-need-page-welcome-message]]"
superseded_by: ""
owner: owner              # on open items: owner | operator | harness | product-team | lawyer
applies_to: [meta, whatsapp]
evidence: "reports/2026-10-28-morning.md"
---
```

Rules: every figure in a note carries `as_of` and `source`; a figure is re-read live before it drives an action. Names and public ids only, never a token, a password, a lead's name, email or phone (counts by `source` and `ref` only). Relative dates are converted to absolute dates. Ids are written in backticks. Links between notes are wikilinks `[[note-name]]`; a business note whose name is also a `config/` file name is linked by its folder, `[[business/goals|goals]]`, so Obsidian never picks the config file. Links to files outside the vault's index (creatives) are paths.

## 5. Note bodies

- **Entity notes** (campaign, flight, audience, experiment) have `## Current state` (rewritten by the main session so every line is true now, with the time of the live read) and `## Log` (dated bullets, append-only, newest last).
- **Learning and decision notes** are one fact or one ruling each. They are never edited after their day; a correction is a new note with `supersedes:` set, and the old note gets `status: superseded` and `superseded_by:` (the only edit allowed).
- **Session notes** (`sessions/YYYY-MM/YYYY-MM-DD.md`) are append-only dated bullets: `- HH:MM — what was asked / done / decided / left open`, ids in backticks, a `## Checkpoint HH:MM` block from the PreCompact hook, and a `## Close` block written by `/sync` (asked, done, live, open, requests filed, ids).
- **Generated notes** (`HOT.md`, `INDEX.md`, `capabilities/*`, the generated block of `HOME.md`) carry `maintained_by: generated`, `generated_at`, a `content_hash`, and the line `Never hand-edit; run node memory/tools/build-hot.mjs`. The lint fails when the hash does not match the body.
- **Owner notes** (`HOME.md` below the `%% generated:end %%` marker, `inbox/owner.md`) are the Owner's; the harness writes only inside its marked blocks and under the Owner's lines (answers as indented bullets starting with `↳`).
- **Folder notes** (`_about.md`) say what a folder holds; they are not entities, learnings or open items and the tools skip them.

## 6. Caps

| What | Cap | On breach |
|---|---|---|
| `HOT.md` | 60 lines, 8,192 bytes | `build-hot.mjs` trims the learnings digest first, then the open items |
| `HOME.md` | 150 lines | `/consolidate` moves detail to linked notes |
| `INDEX.md` | one line per note | `/consolidate` archives closed items |
| Any note | 300 lines | split into linked notes |
| `sessions/` | one folder per month | rotation by `build-hot.mjs` |
| Learnings digest in HOT | 20 confirmed rows | oldest drop out of HOT, stay in `learnings/` |
| `inbox/proposals.md` | emptied at every `/sync` | lint warns if older than 7 days |

## 7. Who reads what

- The SessionStart hook prints `HOT.md` into every new session, sub-agents included. The HOT holds: the current state summary, money vs caps, the next three actions, open items by owner, the five newest learnings, the lane maps, and the rule "read the note before you act, re-read live before you change".
- A skill or agent reads its lane map (`maps/<lane>.md`) and the entity notes it touches. `meta-campaign-build`, `health` and `morning` read `maps/build.md`, which lists every `learnings/meta-platform/` note, before any build.
- Lanes: Measure = performance-analyst, signals-auditor, cro-auditor. Create = creative-director, copywriter, competitor-researcher. Gate = compliance-reviewer, test-designer. Build = media-buyer. Close = harness-librarian.
- Everything else is found by grepping `INDEX.md`, or with the Obsidian CLI's `search` when the CLI is turned on.

## 8. Who writes what, and when

- **One writer.** Only the main session writes canonical notes (`state/`, `business/`, `campaigns/`, `flights/`, `audiences/`, `open/`, `experiments/`, `decisions/`, `learnings/`, `sessions/`, `reviews/`, `maps/`, `tooling/`, HOME's generated block). Sub-agents write their own outputs (`reports/`, `plans/`, briefs) with full frontmatter and append to `inbox/proposals.md`. No two writers on one note.
- **At once.** A state change rewrites the entity note's `## Current state`, appends to its `## Log` and to today's session note. A ruling creates a decision note. A finding creates a learning note after a grep of `INDEX.md` for an existing one.
- **`/setup`.** Fills `business/*.md` and `state/current.md` from `config/` and the live check (§2), keeps the HOME and Inbox of the chat language (§3), then runs `build-capabilities.mjs`, `build-hot.mjs` and `lint.mjs`.
- **`/morning`.** Reads and answers `inbox/owner.md`, files facts, live read, report, `node memory/tools/build-hot.mjs`.
- **`/sync`.** Merges `inbox/proposals.md`, answers `inbox/owner.md`, closes the session note, runs `build-hot.mjs` (HOT, INDEX, HOME's block, `dashboard/state.json`) and `build-capabilities.mjs`, runs `lint.mjs` (fails the sync on a secret, a PII shape, a dead link, a cap breach or a hand-edited generated note), commits locally when the folder is a git repository, regenerates the setup page.
- **`/consolidate`.** Weekly before `/next-round`, and whenever lint reports a cap breach: duplicates merged, stale facts superseded, closed items archived, HOME and the learnings digest rewritten. The procedure is `tools/consolidate.md`; the mechanical part is `harness-librarian` (sonnet); the main session judges and writes.
- **PreCompact hook.** Appends a `## Checkpoint HH:MM` block to today's session note: the last assistant messages' text scrubbed by the secrets scanner, so the post-compaction session resumes from the note.

Every tool runs with a time bound from the harness root: `timeout 120 node memory/tools/<tool>.mjs`. Times and dates are in the timezone of `config/operator.md` (UTC until it is set).

## 9. Lint (`node memory/tools/lint.mjs`, exit 1 on a failure)

Fails: a token shape, an email outside the allow-list (the addresses written in `config/operator.md` and `config/company.md`, plus `noreply@anthropic.com` and `@users.noreply.github.com`), a phone number of any country, or an `.env` name with a value in any note; a wikilink to a note that does not exist; a note over 300 lines; `HOT.md` over its cap; a generated note whose hash does not match; a dated entry (learning, decision) edited after its day without `status: superseded`; a note without `type`, `created`, `summary`. Warns: a figure without `as_of`; `proposals.md` older than 7 days; a campaign note whose `## Current state` is older than 7 days while the campaign is active; HOME's generated block not built yet.

## 10. The windows that read the vault

`dashboard/state.json` (the control-room pane) is generated by `build-hot.mjs` from `state/current.md`, `campaigns/`, the open items, `.claude/agents/` and `config/` (company, launch date, routines, currency, caps), in the shape `control-room/marketing-team` reads (`docs/TEMPLATE-SPEC.md` §9); never a number that a live read did not give, except the caps, which are the Owner's limits. The setup progress page (`dashboard/setup-page.mjs`) keeps its own generator. Hooks are installed by the Owner from `docs/hooks-paste-block.md`.
