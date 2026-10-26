# Template specification (the contract every file in this repo follows)

Written 2026-10-26 when this template was cut from a working single-company harness. Every generalised file, every agent brief and every skill in this repository follows the vocabulary, the file map and the scrub rules below. If a file disagrees with this page, fix the file.

## 1. What this repository is

A Claude Code harness that acts as a company's marketing and paid-media team on **Meta Ads** (Facebook, Instagram, WhatsApp, Messenger) through Meta's official Ads MCP server. It analyses performance, plans and builds campaigns PAUSED, writes ad copy and creative briefs, audits landing pages and tracking, and advises on positioning, audiences and budget. It never activates anything, never raises a budget and never spends money without the Owner's explicit go in the same message.

The harness is **company-agnostic**. Everything specific to a company lives in `config/` and is written by the `/setup` wizard. The rules, skills, agents and tools never mention a real company.

## 2. Roles (use these words everywhere)

| Word | Meaning |
|---|---|
| **Owner** | The person who gives the go on money, owns the Meta logins and clicks in the Meta consoles (Page, Business portfolio, Ads Manager "Discard drafts", tokens, Lead Ads terms). Named in `config/operator.md`. |
| **Operator** | The person who runs sessions day to day (often a marketer, sometimes the Owner). Named in `config/operator.md`. May be non-technical: every console step is a click list, every engineer step is a copy-paste block. |
| **Product team** | Optional. The people who ship the company's website, pages, consent wording and tracking. Described in `config/product-team.md`. When there is none, page changes are the Owner's. |
| **the company**, **the product** | Never a real name in rules, skills, agents or tools. The names live in `config/company.md` and `config/product.md`. |
| **the account currency** | Taken from `config/accounts.md` (`currency`). Never a hard-coded currency symbol in a rule. |
| **the primary market** | Taken from `config/company.md`. Never a hard-coded country in a rule. |

## 3. File map

```
CLAUDE.md                 rules only; imports config/*.md with @config/<file>.md lines
README.md                 what this is, quick start, "Use this template"
ONBOARDING.md             plain-language manual for a new Operator
THIRD-PARTY.md            sources and licences of the third-party skills
memory.md                 the harness's operational memory (template sections, empty)
checklist.md              the go checklist: items by owner, statuses, a sync log
.env.example              META_MARKETING_TOKEN, META_AD_ACCOUNT_ID, META_GRAPH_VERSION
skills-lock.json          pins of the third-party skills
config/                   written by /setup (see §4); config/README.md explains each file
docs/TEMPLATE-SPEC.md     this page
docs/meta-platform-notes.md  "How Meta's server behaves": platform knowledge, no account ids
.claude/agents/*.md       the ten agents (§6)
.claude/skills/*/SKILL.md the harness skills (§5) + the third-party skills (verbatim)
creatives/README.md       naming, layout, rules
creatives/tools/          render-stills.mjs, ad-shots.sh, ad-card.mjs, meta-upload.mjs
creatives/preview-template/  the Facebook-frame preview site (index.html, ads.js, plan.html, README)
creatives/src/, briefs/, uploads/   empty with .gitkeep
plans/, reports/          empty with .gitkeep; files are dated YYYY-MM-DD-<topic>.md
plans/experiments-log.md  the running log of Meta experiments (sections Tests and Backlog), shipped empty
dashboard/state.json      the control-room data file (empty shape)
control-room/             the generic control-room mod + install how-to
examples/acme-fitness/    a fully filled fictional configuration (config/, memory.md, one plan, one report)
```

## 4. `config/` files and their fields

Each file is Markdown with a short header comment `<!-- Written by /setup on <date>. Edit by hand or re-run /setup. -->` and a fixed set of headed fields. The template copies in `config/` ship with placeholders in the form `{{FIELD_NAME}}` plus a one-line `<!-- setup: what to put here -->` hint after each field.

| File | Fields |
|---|---|
| `company.md` | `{{COMPANY_NAME}}`, `{{COMPANY_SHORT_NAME}}`, `{{LEGAL_ENTITY}}` (optional), `{{WEBSITE}}`, `{{HQ_CITY_COUNTRY}}`, `{{PRIMARY_MARKET}}`, `{{OTHER_MARKETS}}`, `{{WHAT_THE_COMPANY_SELLS}}` (one paragraph), `{{STAGE}}` (pre-launch / live / scaling), `{{LAUNCH_DATE}}` (optional: ISO date and time zone of a dated product event, or "none"), `{{REVENUE_MODEL}}` ("not stated" is a valid answer; never invent one) |
| `product.md` | `{{PRODUCT_NAME}}`, `{{ONE_LINE_PROMISE}}`, `{{WHAT_IT_DOES}}`, `{{WHAT_IT_DOES_NOT_DO}}`, a **funnels** table (name, audience, entry, destination URL, conversion event, what counts as a result), a **destination pages** table (language, URL, H1 as written, CTA as written, pixel present yes/no, notes), **key copy in use** (quoted verbatim with the page it comes from), **existing assets** (films, images, brand files, where they are) |
| `audiences.md` | one section per audience: name, who they are, geo, language, pains (with the source and date of any figure), what they must not be addressed as, excluded audiences; a **special ad categories** line per audience (NONE / HOUSING / CREDIT / EMPLOYMENT / ISSUES_ELECTIONS_POLITICS, with the reason) |
| `brand.md` | colours (hex, with role), fonts, logo rules, tone of voice, languages and their direction (LTR/RTL), RTL rules if any, the AI-imagery disclosure rule (badge, wording, ad-level self-disclosure), do-not-do list |
| `claims.md` | allowed claims (each with its source), forbidden words and claims (a list; the wizard seeds it from the interview), lines that need clearance before use in ads, consent and notice ids (quoted by id, never the wording), legal jurisdiction notes dated and labelled "verify with your lawyer", the special-ad-category decision per market |
| `accounts.md` | `meta_ad_account_id`, `business_portfolio_id`, `page_id` (+ duplicates to avoid), `instagram_account_id`, `pixel_id` (dataset), `lead_form_ids`, `whatsapp_number_names` (names only), `currency`, `min_daily_budget`, `ga_measurement_id`, attribution parameters (`ref`, `utm_*`, what reaches the database), `lead_webhook_url`, MCP server names (`meta-ads`, `fal`), who holds each login (names only), console steps and their status (Page, portfolio, ad account, Lead Ads terms, domain verification, developer app + webhook, phone verification) |
| `operator.md` | `{{OWNER_NAME}}`, `{{OPERATOR_NAMES}}`, `{{CHAT_LANGUAGE}}` (the language every chat answer, widget and summary is written in; files stay English), `{{TIMEZONE}}`, `{{WORKING_DAYS}}`, routine times (`morning`, `sync`, `next-round`), the exact phrasing of a go ("turn on X, <amount>/day, cap <amount>"), who clicks what in the consoles |
| `product-team.md` | optional: `{{PRODUCT_REPO_PATH}}`, a table "where product truth lives" (need → path), how a request is filed (dated plan file labelled "Needs product team"), shared memory conventions if any. When the company has no product team the file says so in one line and page changes are the Owner's. |

Skills and agents read these files by name ("read `config/product.md` for the funnels"). They never embed a company fact.

## 5. Harness skills (generalised from the source harness)

| Skill | Role |
|---|---|
| `setup` | **New.** The onboarding wizard: interviews the Operator in rounds of four questions (English, recommended option first), writes `config/*.md`, prints the `claude mcp add` blocks, runs the live Meta check and writes ids into `config/accounts.md`, fetches each destination page, drafts `plans/<date>-first-flight-plan.md`, offers to load the example. |
| `memory-update` | Session start/end and after any state change |
| `meta-campaign-build` | Any create/rebuild/edit/pause/publish through the MCP, with all learned rules; media uploads with `creatives/tools/meta-upload.mjs` |
| `meta-performance-report` | Daily/weekly reports, diagnosis order, decision rules |
| `ad-copy` | Primary text, headlines, hooks, variations in the company's languages |
| `creative-brief` | Creative review and briefs, brand specs from `config/brand.md`, RTL rules when a language is RTL, diversity rules |
| `creative-production` | Making the files: stills via `render-stills.mjs`; pictures via the fal MCP on a stated cost and the Owner's go; video via the HyperFrames plugin if installed, otherwise "bring your own files" |
| `landing-page-cro` | Page audits, message match, policy risk, requests to the product team (or the Owner) |
| `audience-research` | Signals, structure, retargeting ladder, geo order, special ad categories |
| `ab-test-design` | Hypotheses, sizing, Meta Experiments, judging |
| `signals-audit` | Pixel, events, consent gating, attribution, webhook, domain |
| `competitor-research` | Ad Library scans and positioning |
| `offer-design` | What each funnel offers the visitor and what to change |
| `scaling-playbook` | Budget steps, consolidation, fatigue, pausing rules |
| `marketing-psychology` | Principles to apply in copy and pages |
| `compliance-check` | Meta policy, the market's law (from `config/claims.md`), the company's own rules |
| `morning`, `health`, `next-round`, `sync` | The four workflow commands (daily opener, plumbing check, weekly round, session closer). `health` checks `checklist.md` exists instead of a claude.ai artifact; the preview site URL comes from the flight's plan. |

Third-party skills shipped verbatim with `skills-lock.json`: `ad-creative`, `image`, `banner-design`, `frontend-design`, `find-skills`, `grill-me`, `grilling`, `viral-reverse-engineering`. Their sources and licences are listed in `THIRD-PARTY.md`.

## 6. Agents (same lanes, same models)

| Agent | Model | Lane |
|---|---|---|
| `performance-analyst`, `signals-auditor`, `cro-auditor` | sonnet | Measure |
| `creative-director`, `copywriter`, `competitor-researcher` | opus (creative-director, copywriter), sonnet (competitor-researcher) | Create |
| `compliance-reviewer`, `test-designer` | sonnet, opus | Gate |
| `media-buyer` | opus | Build |
| `harness-librarian` | sonnet | Close |

Reading and verifying → sonnet; drafting and judging → opus; never `inherit`. An agent declares either `tools` (an allow list) or `disallowedTools` (a deny list), as the source harness did. Publishing, budgets and experiments stay in the main session after the Owner's go.

## 7. Generalisation rules (what changed from the source harness)

1. **Names.** The source company, its product, its AI persona, its people, its domain, its city, its legal entity: all gone. Rules say "the company", "the product", "the Owner", "the Operator", "the destination page". Config placeholders say `{{FIELD}}`.
2. **Ids.** No ad account, portfolio, Page, pixel, form, campaign, ad set, ad, GA or artifact id survives anywhere except as a placeholder in `config/accounts.md` or as an obviously fake id in `examples/`. `meta-upload.mjs` reads the account id from `.env` only.
3. **Paths.** No path outside this repository. No sibling repo, no laptop path, no drive letter. The product team, if any, is described in `config/product-team.md`.
4. **Currency, market, language.** Never hard-coded in a rule. Currency from `config/accounts.md`; market from `config/company.md`; languages, direction and RTL rules from `config/brand.md`; chat language from `config/operator.md`.
5. **History.** "On <date> the Owner ruled …" lines are dropped; the rule stays, dated only when the date matters for platform behaviour (Meta changes things). `docs/meta-platform-notes.md` keeps the dated platform observations with the account facts removed.
6. **Legal.** Market-specific law (spam law sections, brokerage acts, DSA) is not in the rules. `config/claims.md` carries the company's jurisdiction notes, dated and labelled "verify with your lawyer". The rules keep the mechanism: a compliance gate before every build, special ad categories declared from `config/claims.md`, consent wording never written by the harness, marketing email/SMS only with prior written consent where the law requires it.
7. **Memory.** One file, `memory.md`, plus dated plans and reports. No collective memory of another repo. `checklist.md` replaces the claude.ai artifact checklist.
8. **Machine rules.** Not shipped. `creative-production` and `health` say "run renders and sweeps with a time bound (`timeout N` first) and one at a time" as a recommendation, nothing more.
9. **Tool inventory.** The Meta Ads MCP, the direct Graph upload tool, the fal MCP (optional), the creative tools, the Vercel CLI (optional, the company's login), the HyperFrames plugin (optional), browser tools (optional), the session's inline widget tool when the host has one (optional). No HeyGen, no video division, no REA.
10. **The control room.** `control-room/` ships the generic mod with a README; `dashboard/state.json` ships the empty shape. Both read company names from `config/`.

## 8. Scrub gate (zero hits required before any commit)

Case-insensitive, across the whole repository except `docs/TEMPLATE-SPEC.md` §8 itself:

```
habait, הבית, slava, labovkin, ziv, yazame, realestateteam, agentteams, "d:\\", "d:/",
1010578430110331, 486542035414450, 108204445697760, 720136941422640, 1028189403616245,
1454114615374498, 1810959403440498, 120248, NNW74661HP, 513462408,
habait-ads-preview, habait-uploder, habait-team, office@, @habait, claude.ai/artifact,
5V1KraZH9a49UTXbrd95W9, VNZK5XZmbWuve55WZun1Kh, HOT.md, OWED-0, OWED-3, OWED-4, R-LJ-, D-DL-, D-VID-,
interest-2026, beta-2026, meeting-2026, cookies-2026,
hyperframes/frame.md, video/projects, Video Division, HeyGen, heygen
```

Plus a manual read of every `config/*.md` template and every `examples/` file for leaked facts (dates of launches, budgets, counts).

## 9. Fixed shapes of the shared files

**`memory.md`** has exactly these top-level sections, in this order: `# Harness memory`, `## Current state` (account facts as last verified, a campaigns table: campaign id, name, status, daily budget, cap, start, end, ad sets, ads, last verified), `## How to verify` (the live reads that confirm "Current state"), `## Learnings` (dated bullets), `## Decision rules` (the rules the Owner has set, dated), `## Session log` (dated entries, newest last), `## Next session should` (a short list, rewritten at every session end).

**`checklist.md`** has a table `| id | item | owner | status | note | updated |` (statuses: open, blocked, done, n/a; owners: Owner, Operator, Product team, Harness) followed by `## Sync log` with one dated line per `/sync`.

**`dashboard/state.json`** keys: `company`, `generatedAt`, `launch` (date or null), `routines` (next morning/sync/next-round with times from `config/operator.md`), `working` (agents now running), `tasks` (by owner), `money` (daily spend, caps, from a live read only), `campaigns` (id, name, status), `team` (lanes → agents), `skillsUsed`. Numbers come only from a live read; the shipped file holds nulls and empty arrays.

## 10. Conventions kept from the source harness (because they work)

- Everything is built PAUSED; the go is explicit, in the same message, with the spend stated first.
- A numbered recap before any build; a grill-me interview after a build and before the go.
- Every creative carries a fixed number for its flight, never renumbered; new ones take the next number.
- A new creative is a new ad, never an edit (creatives are immutable on Meta).
- Reports are written once; plans are living documents; memory is updated after every state change, not at the end.
- Showing an ad to the Owner means Meta's own rendering as images (`ads_get_ad_preview` → `ad-shots.sh`), never a browser pane.
- Questions to the Owner through the question tool: English, four at a time, recommended option first; answers in the chat language.
- Secrets: names only, never a value in chat, memory, plans or reports.
- No PII in the repository: counts by source and ref only.
- Never fabricate metrics; "no data" is an acceptable answer.
