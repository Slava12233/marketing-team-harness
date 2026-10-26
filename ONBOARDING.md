# The marketing harness: the manual for a new Operator

If something here contradicts `CLAUDE.md`, `CLAUDE.md` wins; tell the Owner so this page gets fixed. This manual is written for someone who has never used Claude Code. You do not need to read code, and you never need to edit a file by hand unless you want to.

## 1. What this is, in one paragraph

This folder turns Claude Code into your company's marketing and paid-media team on Meta (Facebook, Instagram, WhatsApp, Messenger). It is not an app and has no code you need to run. It holds rules (`CLAUDE.md`), your company's facts (`config/`), memory (`memory.md`), a go checklist (`checklist.md`), plans, reports, ad creatives, a set of skills (step-by-step procedures) and a set of agents (specialist helpers). Claude reads them when you open a session here and behaves like a careful media buyer who knows the account, the product, the claims you may make and what happened yesterday. It is connected to your Meta ad account through Meta's official Ads server, so it can read performance, build campaigns and ads, upload creatives and write reports. It never turns anything on and never spends money by itself.

**Why a harness and not just "ask Claude":** a fresh chat knows nothing about your company, your account, your decisions or last week's results. The files in this folder are that knowledge, written down, so every session starts where the last one stopped and follows the same rules.

**Two roles you will see everywhere:**

| Role | Who | What only they do |
|---|---|---|
| **Owner** | The person who answers for the money and holds the Meta logins | Gives the go on anything that spends; clicks in Meta's consoles (Page, Business portfolio, tokens, Lead Ads terms, "Discard drafts", deletes) |
| **Operator** | The person who runs the sessions day to day: often a marketer, sometimes the Owner | Asks for reports, copy, creatives, builds and audits; reads the morning report; closes the day with `/sync` |

Both are named in `config/operator.md`. If you have a **Product team** (the people who ship your website, pages, consent wording and tracking), it is described in `config/product-team.md`; if you do not, page changes are the Owner's.

## 2. The five ideas behind everything

1. **Everything is built paused.** Campaigns, ad sets and ads are created in PAUSED state. Turning something on is a separate step, done only on the Owner's go. *Why:* a mistake in a paused object costs nothing.
2. **The Owner's go, in the same message, with the money.** Claude activates, raises a budget, extends a schedule or starts an experiment only when the Owner writes the go and the spend in one message, in the phrasing set in `config/operator.md` (its shape is "turn on <campaign>, <amount>/day, cap <amount>", in the account currency). An earlier yes does not carry over. *Why:* money moves only on an explicit, auditable instruction.
3. **Product truth lives with whoever ships the website.** Page copy, consent wording, the pixel and legal notices belong to the product team (or the Owner). The harness reads them and never edits them. A page or wording change is written up as a dated request file labelled "Needs product team". *Why:* one owner per fact; marketing never ships a website change by accident.
4. **Memory first, memory last.** Every session begins by reading `memory.md` and ends by writing to it. *Why:* the next session, or the next person, inherits the state, the ids and the open questions instead of guessing.
5. **A compliance gate before every build.** New copy, creatives and page requests go through the compliance check (Meta's advertising policies, the claims and legal notes in `config/claims.md`, the harness rules) before anything is built. *Why:* a rejected ad costs a day; a policy strike can cost the account.

## 3. Before your first session

| You need | Why | How |
|---|---|---|
| Claude Code installed, opened in this folder | The rules, config and memory load from this folder | In a terminal: go to this folder, then type `claude` |
| Node.js 20 or newer | The local tools (still renderer, ad screenshots, upload tool) run on it | Install the LTS version from nodejs.org; `node --version` checks it |
| `playwright-core` (optional) | Only the still renderer needs it | `npm i -D playwright-core` once in this folder; skip it if you bring finished image files |
| The Meta Ads server added and logged in | Every account read and build goes through it | Run once in a terminal: `claude mcp add --transport http --scope user meta-ads https://mcp.facebook.com/ads`. Then start Claude Code, type `/mcp`, pick `meta-ads` and log in; the consent screen opens in the browser where the Owner is signed in to Facebook. **Tools load only into sessions started after the server was added or logged in**: if the `meta-ads` tools are missing, close the session and start a new one |
| The upload token in `.env` (optional at first) | Local image and video files go straight into the ad account with `creatives/tools/meta-upload.mjs` | The Owner creates a System User token in Meta Business Settings and pastes it into `.env` under `META_MARKETING_TOKEN` (template: `.env.example`). Claude never opens, prints or asks for the value |
| fal (optional) | Generates pictures and short clips; paid per run | The `/setup` wizard prints the add-and-login block; every paid round is stated in money first and runs on the Owner's go |
| Vercel (optional) | Hosts a preview site where the team sees every creative in a Facebook-style frame | `npx vercel@latest login` with the company's own Vercel account; deploys happen only when asked |
| The control room (optional) | A side pane in Claude Code with the next routine, tasks by owner, money and campaigns | See `control-room/README.md`; installing it is the Owner's click |

## 4. Your first session: `/setup`, then the first ten minutes

**The very first time, type `/setup`.** The wizard interviews you in rounds of four questions (in English, with the recommended answer first) and writes your company's facts into `config/`:

| File | What it holds |
|---|---|
| `config/company.md` | Company name, website, home market, other markets, what you sell, stage, revenue model ("not stated" is a fine answer) |
| `config/product.md` | The product, its promise, what it does and does not do, the funnels (audience, destination page, what counts as a result), the destination pages, the key copy in use, existing assets |
| `config/audiences.md` | Each audience: who, where, language, pains, what they must never be addressed as, exclusions, special ad category |
| `config/brand.md` | Colours, fonts, logo rules, tone, languages and direction, the AI-imagery disclosure rule |
| `config/claims.md` | Allowed claims with sources, forbidden words, lines that need clearance, consent notice ids, legal notes ("verify with your lawyer") |
| `config/accounts.md` | Meta ids (ad account, portfolio, Page, pixel, forms), currency, minimum daily budget, analytics, who holds which login, console steps and their status |
| `config/operator.md` | The Owner and Operators, the chat language, timezone, working days, routine times, the exact phrasing of a go |
| `config/product-team.md` | Where product truth lives and how requests are filed, or one line saying there is no product team |

The wizard then prints the connection blocks you still need, reads the live Meta account and writes the ids it finds, opens each destination page, and drafts `plans/<date>-first-flight-plan.md`: one campaign proposal per funnel, with the budgets left as "Needs the Owner's go". It can also show you the fictional example in `examples/acme-fitness/` (in a scratch copy, never over your own config) so you can see a configured harness first. You can re-run `/setup` or edit any `config/` file by hand at any time.

**Every day after that:**

1. Type `/health`. It checks the plumbing (Meta login and account, objects against memory, review flags, pixel, destination pages, preview site, credits, `checklist.md`, memory files) and prints a green/yellow/red table. It changes nothing.
2. Type `/morning`. It reads memory and the checklist, reads the live account, reports what changed overnight, what is in review, what is spending, which gates are open and who owns them, and gives ranked recommendations. The full report lands in `reports/YYYY-MM-DD-morning.md`.
3. Read the two lists at the end: **Needs the Owner's go** (anything that moves money or delivery) and **Needs product team** (anything on the website). Those are the decisions; everything else Claude can do now.
4. Work: ask for what you need (§6).
5. Type `/sync` before you close. It verifies what changed, writes `memory.md`, updates `checklist.md` and prints a short closing summary.

**Why this order:** health catches a dead login before you trust a number; morning gives everyone the same picture; sync makes sure tomorrow starts from today.

## 5. The daily commands and the rhythm

The times are set in `config/operator.md`; the control room, if installed, reminds you.

| When | Command | What you get |
|---|---|---|
| Every working day, first thing | `/health` then `/morning` | The plumbing table and the daily report with recommendations. Read-only: a broken ad is reported with a click list, and the pause is the Owner's |
| Every working day, last thing | `/sync` | Memory written, checklist updated, closing summary |
| Once a week, once a campaign has about a week of data | `/next-round` | The week's numbers, three specialist views (creative, copy, competitors) run in parallel, a compliance pass, and a numbered list you pick from. Only the picked items are built, paused. Before there is data it runs as a labelled opinion |
| Before any launch | `checklist.md` (§8) | Every gate done, or consciously marked n/a by its owner |
| Once, or when the company changes | `/setup` | `config/` rewritten from a fresh interview |

## 6. How to ask for things

Write in plain language. Claude answers in the chat language set in `config/operator.md`; files stay in English. Every creative carries a fixed number in its flight (#1, #2, ...), never renumbered; use the number, not a description.

| You ask | Example | What Claude will do | What Claude will not do |
|---|---|---|---|
| A report | "How did the sign-up campaign do this week?" | Pull the numbers from the live account and write a report in the account currency (spend, results, cost per result, CTR, CPM, frequency, landing page views) against the previous equal period, save it in `reports/`, and lead with the answer | Fill a gap with an estimate; "no data yet" is an acceptable answer |
| A new creative round | "We need fresh ads for the first funnel." | Run a brief, several genuinely different concepts and copy variations, a compliance pass, then a numbered recap for you to pick from | Build anything before you pick; use a claim that is not in `config/claims.md` |
| A build | "Build #4 and #5 into the sign-up ad set." | Build them PAUSED, read them back, check for errors, record every id in the plan and `memory.md`, then show you Meta's rendering as images | Turn them on |
| A page audit | "Why do people click but not sign up?" | Audit the destination page for message match, the offer, friction and tracking, and write any change as a dated request labelled "Needs product team" | Edit the website or write consent wording |
| Showing an ad as images | "Show me ad #3 as it looks on Facebook." | Fetch Meta's own preview of the built ad, capture it with `creatives/tools/ad-shots.sh` and send you the pictures, saying whether the ad is paused or live | Open a browser pane instead, or redraw a built ad by hand |
| A budget change (needs the go) | The Owner writes the go in the phrasing from `config/operator.md`: "turn on <campaign>, <amount>/day, cap <amount>" | Restate the daily spend and the cap, activate exactly what was written, re-read it live, check errors, record it in `memory.md` | Act on an Operator's request, on an earlier yes, or on a go without the amounts; go beyond what was written |
| An explanation | "Why is the second funnel on a lead form and not the page?" | Find the decision and point to where it is written down | Invent a reason that is not written anywhere |

**What Claude prepares and hands to the Owner instead of doing:** turning anything on or changing spend; deleting live objects and discarding drafts; anything in Meta's consoles (Page, Business portfolio, Lead Ads terms, developer app, tokens, domain verification); a decision on using sign-up lists as custom audiences; appeals on policy notices. It writes the exact click list and stops.

## 7. What the harness will never do

- **Activate anything or spend money** without the Owner's go, with the amounts, in the same message.
- **Write consent or disclosure wording.** It quotes the shipped notices by their id from `config/claims.md`.
- **Edit the website**, the pixel or any page. It files a request.
- **Export personal data.** No names, emails or phone numbers of leads or sign-ups ever land in this folder; it works with counts by source.
- **Invent numbers.** Every metric comes from a live read; "no data" is a valid answer.
- **Print a secret.** Keys and tokens are referred to by name only; a value pasted into chat is treated as exposed and should be rotated.

## 8. The go checklist (`checklist.md`)

A table of everything that must be true before a campaign runs: each item has an owner (Owner, Operator, Product team, Harness), a status (open, blocked, done, n/a), a note and the date it was last updated. A sync log at the bottom gets one line at every `/sync`.

- Anyone on the team can edit it; Claude fills the Harness items and adds notes during `/sync`.
- Claude never marks an Owner or Product-team item done; it adds a note and leaves the status to that owner.

## 9. The map of the folder

| Path | What it is | Who edits |
|---|---|---|
| `CLAUDE.md` | The rulebook: money and safety, claims, compliance, skills, agents, the campaign from A to Z | Claude, only when a rule changes |
| `config/` | Your company's facts, written by `/setup` (§4); `config/README.md` explains each file | `/setup`, or you by hand |
| `memory.md` | The working memory: current state, how to verify it, learnings, decision rules, a session log, "next session should" | Claude, at every state change and at every sync |
| `checklist.md` | The go checklist (§8) | Claude and the team |
| `ONBOARDING.md` | This manual | Claude, on request |
| `plans/` | Living plans with every id, spec, copy table and decision; requests to the product team | Claude |
| `reports/` | Dated reports: performance, compliance reviews, recaps, the daily morning report. Written once, never edited after the Owner has read them | Claude |
| `creatives/src/<flight>/` | Creative sources (the HTML banner builder) | Claude |
| `creatives/<flight>/` | Finished files and, if used, the flight's preview site folder | Claude |
| `creatives/tools/` | `render-stills.mjs` (banners to PNG), `ad-shots.sh` (Meta previews as pictures), `ad-card.mjs` (a planned ad as a card), `meta-upload.mjs` (files straight into the ad account) | Claude |
| `creatives/preview-template/` | The Facebook-frame preview site, copied per flight | Claude |
| `creatives/uploads/` | The upload ledger: one JSON per day with every image hash and video id | the upload tool |
| `.env`, `.env.example` | The upload token `META_MARKETING_TOKEN` and its template. Only the Owner pastes into `.env` | the Owner |
| `docs/` | The template contract and the notes on how Meta's server behaves | Claude |
| `.claude/skills/` | The procedures, one folder each (§10) | Claude |
| `.claude/agents/` | The specialists (§11) | Claude |
| `dashboard/state.json`, `control-room/` | The optional control room and its data file | Claude; installing the mod is the Owner's |
| `examples/acme-fitness/` | A fully filled fictional configuration to look at | nobody; reference only |

### 9a. The connections

| Connection | In plain words | Who holds the key |
|---|---|---|
| Meta Ads MCP (`meta-ads`) | Meta's own link into the ad account: reads, reports, building paused campaigns, ad sets and ads, previews, audiences, pixel, experiments. Activation only on the Owner's go | the Owner's Facebook login, renewed through `/mcp` |
| Direct upload tool | Sends image and video files from this computer into the ad account and returns the ids the ads need | the Owner's token in `.env` |
| fal (optional) | Generates pictures and clips; paid, each round on the Owner's go | the company's fal account |
| Vercel (optional) | The preview site for the team | the company's Vercel login |
| Browser tools (optional) | Reads of Ads Manager screens and public pages; console clicks stay the Owner's | the Owner's browser |

`CLAUDE.md` → "Tool inventory" is the technical version, and "The campaign from A to Z" says which tool does which step.

## 10. The skills

Commands you type: `/setup`, `/morning`, `/health`, `/next-round`, `/sync`. The craft skills below run inside those or when a task needs them; you can name one ("use the ad-copy skill") but you rarely need to.

| Skill | One line |
|---|---|
| `setup` | The onboarding interview that writes `config/` and drafts the first flight plan |
| `memory-update` | How memory is read at the start and written at every change and at the end |
| `meta-campaign-build` | How campaigns, ad sets and ads are built and changed through Meta's server, with every learned platform rule; uploads |
| `meta-performance-report` | The report: columns, the diagnosis order, the decision rules |
| `ad-copy` | Primary text, headlines, hooks in your languages, inside the claims rules |
| `creative-brief` | Briefs and reviews of images and videos against `config/brand.md` |
| `creative-production` | Making the actual files: stills with the renderer, pictures through fal, video with a video tool if one is installed or from your own files |
| `audience-research` | Signals, audience structure, retargeting ladder, special ad categories |
| `compliance-check` | The gate: Meta policy, the legal notes in `config/claims.md`, the harness rules |
| `landing-page-cro` | Audits of the pages the ads send to; requests to the product team |
| `signals-audit` | Pixel, consent gating, events, attribution, the lead webhook |
| `ab-test-design` | Experiments with pre-registered decision rules |
| `offer-design`, `scaling-playbook`, `marketing-psychology`, `competitor-research` | What each funnel offers; how to scale and pause; principles for copy; Ad Library scans |
| Third-party: `ad-creative`, `image`, `banner-design`, `frontend-design`, `viral-reverse-engineering`, `find-skills`, `grill-me`, `grilling` | Craft references (sources in `THIRD-PARTY.md`); the harness rules win on any conflict |

## 11. The agents (who does what)

Claude delegates to these when a task is big or needs a second, independent read. They report back; Claude relays the result in its own words.

| Agent | Does | Cannot |
|---|---|---|
| `media-buyer` | Builds and edits paused objects, uploads media | Activate, change budgets, delete |
| `performance-analyst` | Pulls insights, writes reports | Write to the account |
| `copywriter` | Copy batches | Account access, consent wording |
| `creative-director` | Reviews assets, writes briefs | Account access |
| `cro-auditor` | Page and funnel audits | Account writes, website edits |
| `compliance-reviewer` | The last policy and legal gate | Rewrites, account access |
| `competitor-researcher` | Ad Library and web scans | Account writes |
| `signals-auditor` | Pixel, consent, attribution checks | Account writes |
| `test-designer` | Experiment design and verdicts | Creating objects or experiments |
| `harness-librarian` | Keeps memory, plans, the checklist and the rulebook consistent | Account writes |

## 12. When something goes wrong

| Symptom | What it usually means | What to do |
|---|---|---|
| No `meta-ads` tools in the session | The server was added or logged in after this session started | Start a new session; if `/mcp` shows it needs a login, the Owner logs in |
| `/health` says a `config/` file is missing or still holds `{{...}}` placeholders | Setup was not finished | Run `/setup` again, or fill the field by hand |
| An upload fails with a token error | The token in `.env` is missing, expired or lacks access to the ad account | Tell the Owner; they rotate it in Business Settings. Claude does not retry blindly |
| An ad shows DISAPPROVED or "with issues" | Meta's review flagged it | Claude reports the ad and the Ads Manager path; the pause and any appeal are the Owner's |
| A long render or check was stopped | Heavy commands run with a time limit, one at a time | Normal; Claude reports the partial result and does not loop |
| A number looks wrong | Often consent gating (only visitors who accepted cookies send events) or a different attribution window | Ask for the `signals-audit`; compare with the counts the product team hands over |
| Claude says "Needs the Owner's go" | The action moves money or delivery | The Owner writes the go with the amounts in one message, or decides not to |

## 13. Glossary

- **Harness:** this folder; the rules, config, memory, skills and agents that make Claude behave as the team.
- **Owner / Operator:** the person who gives the go and holds the logins / the person who runs the sessions.
- **Config:** the `config/` files with your company's facts; the rules never contain them.
- **Skill:** a written procedure Claude follows; the ones you type start with `/`.
- **Agent:** a specialist sub-session with its own tools and limits.
- **MCP / the Meta server:** the official connection to the ad account.
- **Paused:** built and reviewed by Meta, spending nothing.
- **Funnel:** one path from an ad to a result (a sign-up, a booked call), listed in `config/product.md`.
- **Flight:** one round of campaigns with its numbered creatives and its plan.
- **Go:** the Owner's written instruction with the spend stated, in the same message.
- **Gate:** an item in `checklist.md` that must be done before a campaign is turned on.
- **Sync:** the end-of-session write to memory and the checklist.
- **Needs product team:** a request file for a page, event or notice change, carried to whoever ships the website (the Owner when there is no product team).
