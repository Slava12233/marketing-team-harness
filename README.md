# Marketing Team Harness

A Claude Code harness that acts as a company's marketing and paid-media team on **Meta Ads** (Facebook, Instagram, WhatsApp, Messenger). It connects to Meta's official Ads MCP server and works the way a small in-house team would: it reads performance and writes daily and weekly reports, plans flights, writes ad copy and creative briefs, produces still ads, builds campaigns, ad sets and ads (always PAUSED), audits landing pages and tracking, and advises on positioning, audiences and budget.

The harness is company-agnostic. Ten sub-agents (performance analyst, signals auditor, CRO auditor, creative director, copywriter, competitor researcher, compliance reviewer, test designer, media buyer, librarian) and about twenty skills carry the method; everything about your company (name, product, funnels, audiences, brand, claims, accounts, people) lives in `config/` and is written by the onboarding, in two parts: `/connect` (every connection, ending with `/health` green) and `/campaign` (the interview, the market research, the first campaign built PAUSED). Seven commands run the day: `/connect` and `/campaign` once, `/health` for plumbing, `/morning` to open a day, `/next-round` for the weekly creative round, `/sync` to close a session, `/consolidate` to tidy the memory once a week.

It was cut from a harness that ran real campaigns, so its rules carry what was learned the hard way: how Meta's MCP server really behaves (one note per fact in `memory/learnings/meta-platform/`), a compliance gate before every build, and a money model where nothing spends without the Owner's explicit go.

## What you get

- **A team, not a chat.** Ten agents in five lanes (measure, create, gate, build, close) and about twenty skills, each a written procedure; fourteen third-party craft skills alongside them.
- **Seven commands with fixed outputs:** `/connect` (Part 1 of the onboarding: your language first, then every connection, `/health` green at the end), `/campaign` (Part 2: the long interview in your language, the market research, the first campaign built PAUSED and shown), `/health` (a green/yellow/red plumbing table), `/morning` (the daily report), `/next-round` (the weekly creative round and a numbered recap to pick from), `/sync` (the session closer), `/consolidate` (the weekly memory tidy).
- **A memory vault you can open.** The folder is an Obsidian vault (Obsidian is installed by the bootstrap; everything also works as plain files): `memory/HOME.md` is the Owner's page (money against the caps, open items by owner, campaigns), `memory/inbox/owner.md` is an Inbox you write in and the harness answers (it never acts on it without a go in chat), a weekly review lands in `memory/reviews/`, and one note per campaign, flight, decision and lesson keeps the history. Three hooks (the HOT loader, the compaction checkpoint and the account guard that keeps every Meta call inside the one ad account in `config/accounts.md`), shipped turned on in `.claude/settings.json`, load the summary into every new session, save a checkpoint before a long chat is compacted, and refuse any Meta call on another ad account. Nothing to click in Obsidian and nothing to paste: the bootstrap registers the folder as a vault, turns on Obsidian's command line and opens the app on HOME (`memory/tools/obsidian-setup.mjs`). The guide is `docs/obsidian-guide.md`.
- **More than the MCP alone:** lead forms, targeting search, audience estimates, insights breakdowns and pause-only rules through the Graph tool (`creatives/tools/meta-graph.mjs`, guide `docs/meta-graph.md`); a one-page client report in the client's language; a landing page when the company has none (`creatives/landing-template/`).
- **A live setup wizard** (`dashboard/setup.html`) that opens at the bootstrap's first step, ticks every install and every wizard step as it lands, with an animation, and shows the Owner's own clicks as "your turn". When a tool is missing later, the harness installs it itself.
- **Google Ads too, when the company wants it.** `/connect` asks where to advertise (Meta, Google or both) and `/campaign` asks what campaign to build. Google Search campaigns are built PAUSED by the harness's own tool (`creatives/tools/google-ads.mjs`, guide `docs/google-ads.md`): Google validates the whole batch first, enabling or raising a budget needs the Owner's words, and the caps are shared with a per-platform share. Performance Max and Demand Gen come next.
- **Money rules that hold:** budgets inside the band and below the caps in `config/goals.md`, everything built PAUSED, nothing activated without the Owner's go in the same message.

## Who it is for

A company that advertises on Meta and wants Claude Code to do the paid-media work under one accountable person. The **Owner** gives the go on money and holds the Meta logins; the **Operator** (often a marketer, sometimes the Owner) runs the sessions and does not need to be technical: the Meta consoles are set up in one guided pass (`/connect`) in which the harness drives the Owner's own Chrome through the Claude in Chrome extension and stops at every password, code, card and terms screen (the upload token moves from Meta's Copy button into `.env` by a tool, unseen by anyone); every other console step comes as a click list and every engineer step as a copy-paste block. The baseline is the Claude desktop app's Code tab, with Google Chrome beside it. A **product team** that ships the website is optional; without one, page changes are the Owner's.

**The Claude plan.** Claude Max is the working plan: the agents run on Opus and Sonnet, and creative rounds and builds use a lot of model time. Claude Pro works for reads and reports but runs into its usage limits on creative rounds and builds. A company that has an Anthropic API key can use that instead. Plans and their limits change; check them on Anthropic's site.

## Quick start

**The one-page guide:** `START-HERE.html` (Hebrew): every command, the install for Claude Code or Codex, the iron rules and what to do when something breaks. It opens by itself in the first session in a folder.

1. **Get the files.** Download the release zip (or clone this repository, or press **Use this template** on GitHub and clone your copy, kept private) and unzip it into a folder you own, for example inside your Documents folder. **One folder per business:** every copy is a new business, even a folder copied from another company's harness on the same computer; the bootstrap and `/connect` archive whatever another company left in it (in `.previous-company/`) and start from the blank templates, and the logins already on the computer are checked again for this business.
2. **Run the bootstrap** in that folder. Windows: `powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1`. macOS: `bash bootstrap.sh`. It checks Git, Node 20+ and Claude Code, then the Claude desktop app and Google Chrome, lists what is missing and installs all of it after one confirmation (on a fresh Mac Homebrew first, whose installer asks for your Mac password in the same window; then Git, Node LTS, Claude Code, the desktop app, Chrome, FFmpeg, `playwright-core`, the HyperFrames plugin from `vendor/hyperframes`, Obsidian; with Node 20 or 21, an optional Node LTS upgrade for the video plugin), copies `.env.example` to `.env`, sets Obsidian up for the vault with no click (`memory/tools/obsidian-setup.mjs`: the vault registered, the command line interface on, the app opened on HOME) and prints what remains (`/connect`, then `/campaign`). A Node.js it installs is used by the later steps of the same run; each install is stopped after 20 minutes instead of hanging; every run, the check included, writes `bootstrap.log` and `dashboard/bootstrap-result.json` and checks that every harness file listed in `docs/release-manifest.txt` is present. Flags: `-Check` / `--check` reports without installing; `-Yes` / `--yes` installs without the question; `-Ask` / `--ask` asks per item; `-Help` / `--help`. A progress page (`dashboard/setup.html`) opens in your browser at the end and ticks itself as the harness confirms each step of Part A and Part B (your own clicks show as "your turn"); keep it beside the app.
3. **Open the folder in the Claude desktop app:** sign in, the **Code** tab, **Open folder…**, trust the folder, and approve the two MCP servers it brings in `.mcp.json`, `meta-ads` and `fal`, when Claude Code asks (if the Code tab does not ask, `/mcp` lists them). (A terminal works too: type `claude` in the folder.)
4. **Install the Claude in Chrome extension** and sign in to it with the same Claude account (in the app: your initials → Settings → Customize → Connectors → Claude in Chrome → Configure; or `claude --chrome` from a terminal in the folder); then start a new session on the folder.
5. **Type `/connect`: Part 1, the connections.** It asks your language first (Hebrew or English, or another) and speaks it from then on. Then it asks what you already have in Meta, verifies it in your own Chrome, and leads every connection chapter by chapter (the Meta business basics, the Meta login, the pixel, the developer app and the System User with full access, the upload token moved from Meta's Copy button into `.env` by a tool so nobody sees it, WhatsApp, lead forms, the domain, fal), stopping only where you must click (passwords, codes, the card, terms). It ends with `/health` green. The logins go through `/mcp`, or through `claude mcp login meta-ads` and `claude mcp login fal` from a terminal in the folder when the Code tab offers no login. Nothing is turned on and nothing spends.
6. **Type `/campaign`: Part 2, the first campaign.** A long interview in your language (as many rounds of four questions as it takes: the company, the product, the audience in depth, competitors, creative preferences, goals and money, the campaign's own rules), then market research by the agents (the Ad Library, the web, audience sizes, the offer, your past ads), a plan whose choices cite it, your numbered picks, the copy through compliance, the creatives, the uploads, the campaign built PAUSED and shown as Meta's own previews. Nothing is activated; the go is a separate message.
7. Run `/health`: a green/yellow/red table of every connection and file, the bootstrap's prerequisites, and spend against the caps in `config/goals.md`.
8. Run `/morning` at the start of each working day.
9. **The vault in Obsidian:** nothing to click. The bootstrap already registered the folder as a vault, turned on the command line interface and opened Obsidian on `memory/HOME.md`; the hooks ship in `.claude/settings.json` (Claude Code asks once to trust the folder). The Owner's only Obsidian action is to use it: HOME and the Inbox. `/health` checks both.

**Guided setup.** An A-Z explainer video in two parts (Part A, `/connect`: accounts and keys, chapters A0–A10; Part B, `/campaign`: the interview, the research, the first campaign, the control room, B1–B5) and a screenshot guide walk a non-technical Owner through every step, from an empty laptop to two ads built PAUSED in the company's own Meta account. The chapter list is `ONBOARDING.md` §3d; the text half of the guide is `docs/meta-setup-guide.md`. [link to the explainer video and the setup guide]

**OpenAI Codex instead of Claude.** The harness runs in the Codex app or CLI too. The bootstrap's first question is Claude Code or Codex (`-Codex` / `--codex` answers it; with Codex it installs the Codex CLI and app instead of Claude, and the setup wizard shows the Codex steps). Then open the folder in Codex, trust the project and its hooks (`/hooks`), log in with `codex mcp login meta-ads` and `codex mcp login fal`, and type `$connect`, then `$campaign`. `AGENTS.md`, `.agents/skills/` and `.codex/` are generated from the Claude files; the guide is `docs/codex.md`.

New Operators: read `ONBOARDING.md`. A fully filled fictional configuration is in `examples/acme-fitness/`.

## Folder map

```
CLAUDE.md                 the rules; imports config/*.md
config/                   your company, written by /connect and /campaign (see config/README.md)
config/goals.md           budget band, target costs, caps, the first funnel (round (i) of the /campaign interview)
config/reporting.md       the client report's language, cadence, recipient, channel and sections
memory/                   the memory vault: HOME, the Inbox, state, business notes, campaigns, decisions, learnings, day notes, weekly reviews; the contract is memory/README.md
memory/money/             the cost ledger and the go log (every go the Owner gave, quoted)
.obsidian/                Obsidian's settings for the vault
checklist.md              the go checklist
plans/, reports/          dated Markdown, YYYY-MM-DD-<topic>.md
creatives/                sources, finished files, tools, the preview-site template
creatives/tools/meta-graph.mjs  Graph API reads and safe writes the MCP lacks (lead forms, targeting, insights breakdowns, rules)
creatives/landing-template/  a one-page landing site for paid traffic, copied per flight
docs/                     the template spec, the Obsidian guide, the hooks block to restore, the older Meta platform notes
docs/meta-setup-guide.md  the Owner's Meta console steps, in order, with what the harness checks
docs/client-intake.md     the intake pack a new client fills before /campaign
docs/meta-graph.md        the Graph tool: subcommands, the Owner's token steps, specs
docs/scheduling.md        running /morning and the client report on a schedule with the machine's own scheduler
docs/upgrade.md           upgrading to a new release, the backup, rolling back
docs/regression-run.md    the maintainer's pre-release regression and sign-off
docs/channels-roadmap.md  why Meta only for now, and the order other channels would come in
.claude/agents, skills    the ten agents and the skills
.claude/settings.json     the memory hooks and the account guard, shipped; Claude Code asks once to trust the folder
.mcp.json                 the two MCP servers (meta-ads, fal) Claude Code asks you to approve
bootstrap.ps1, .sh        first-run check and install (Windows, macOS): Git, Node, Claude Code, the desktop app, Chrome, the extras
upgrade.ps1, .sh          upgrade this copy to a new release without touching the company's files (Windows, macOS)
release.ps1, .sh          cuts a release: scrub gate, test suites, release manifest, version tag, zip (for whoever publishes releases); upgrade.ps1, .sh bring a working copy up to a new release
CHANGELOG.md              what changed in each release
LICENSE, THIRD-PARTY.md   the licence; the third-party skills and their licences
control-room/, dashboard/ the optional status pane, its data file, the setup wizard (setup.html) and setup-page.mjs (its data)
examples/                 a filled example company
```

## Safety model

- **Built paused.** Every campaign, ad set and ad is created PAUSED. Nothing runs until it is activated.
- **Go in the same message.** Activating, raising a budget, extending a schedule or starting an experiment needs the Owner's explicit go in the same message, after the harness states the daily spend and the cap. Pausing and reads are always allowed.
- **Console clicks are the Owner's.** Pages, the Business portfolio, tokens, Lead Ads terms, discarding drafts and deleting live objects are prepared as click lists; the harness stops before them.
- **No secrets.** Tokens live in `.env` (never committed) and Claude Code's credential store; chat, memory, plans and reports carry names only.
- **No PII.** Lead, sign-up and customer rows never enter the repository; the harness works with counts by source and ref.
- **No made-up numbers.** "No data" is an acceptable answer; every figure in an ad carries a source and a date.

## Updating

A new release never touches your company's files. Download the new zip, close Claude Code, and run in the harness folder `powershell -ExecutionPolicy Bypass -File .\upgrade.ps1 <path to the zip>` (Windows) or `bash upgrade.sh <path to the zip>` (macOS); add `-Check` / `--check` first to see the plan without changing anything. The upgrade replaces the harness's own files (rules, skills, agents, tools, docs), adds what is new (a new `config/` file included; a filled one is never overwritten), and never writes `.env`, your vault notes, plans, reports or creatives; every file it overwrites is backed up in `.upgrade-backup/<date-time>/`. Then open a new session and run `/health`. The full guide, including how to roll back, is `docs/upgrade.md`.

## Quality gates

A release is checked before it ships. The release scripts refuse to tag a version unless the working tree is clean, the scrub gate finds no leaked name or id, the node test suites pass, each with a time limit, and the release manifest matches the files. The three skills that touch money and policy (`meta-campaign-build`, `compliance-check`, `meta-performance-report`) carry evals in `.claude/skills/<skill>/evals/`: dry-run cases on a fictional company that check, among other things, that everything is built PAUSED, that nothing is activated without the Owner's go in the same message, that a forbidden claim or a consent sentence is stopped, and that a report writes "no data" instead of a guess. The account guard (`.claude/hooks/account-guard.mjs`) refuses, before anything is sent, any Meta call on an ad account other than the one in `config/accounts.md`. Before each release the maintainer runs `docs/regression-run.md` on the example company and on a demo ad account, and signs it off. The harness is Meta-only for now; `docs/channels-roadmap.md` says when and in what order other channels would come.

## Connections needed

The folder brings its two MCP servers in `.mcp.json`; the bootstrap checks or installs the local tools.

- **Meta Ads MCP** (`meta-ads`, required). Approve it when Claude Code first opens the folder, then `/mcp` → `meta-ads` → log in. The login is the Owner's Facebook Login for Business; grant this company's business, ad account and Page. Start a new Claude Code session afterwards so the tools load.
- **fal MCP** (`fal`, optional, for generated pictures and video; paid per run on the company's own fal account). Approve it with `meta-ads`, and `/mcp` → `fal` → log in when you want it.
- **Typed fallback**, if the servers were not approved or not offered. Run these in a terminal, then `/mcp` → the server → log in, then start a new session:
  ```
  claude mcp add --transport http --scope user meta-ads https://mcp.facebook.com/ads
  claude mcp add --transport http --scope user fal https://mcp.fal.ai/mcp-relay
  ```
  To be asked again about the folder's own servers instead, run `claude mcp reset-project-choices` and reopen the folder.
- **Direct uploads** (recommended): `.env` (the bootstrap copies it from `.env.example`) holds `META_AD_ACCOUNT_ID` and the Owner's System User token as `META_MARKETING_TOKEN`, written by `creatives/tools/env-set.mjs --from-clipboard` after the Copy click in `/connect` (the clipboard is cleared; nobody sees the value; never into chat; `docs/meta-setup-guide.md`, step 7). Check it with `node creatives/tools/meta-upload.mjs --check`.
- **The Claude desktop app** (the Code tab): where the harness runs; the memory routines, Remote Control and the pairing with the extension live there. The bootstrap installs it (winget `Anthropic.Claude`, the Homebrew cask `claude`).
- **Google Chrome with the Claude in Chrome extension** for the connections pass (`/connect`) and, later, Ads Manager reads; the extension signs in with the same Claude account as the app. The bootstrap installs Chrome (`Google.Chrome`, the cask `google-chrome`) when neither Chrome nor Edge is present (the extension also runs in Microsoft Edge; the guided setup and the video use Chrome); the extension comes from the Chrome Web Store, through the app's Connectors. Chrome or Edge serve the ad screenshots and still renders.
- **Google Ads** (optional, only when Google is a platform): the company's own Google Ads account and its own Google Cloud project, with the Google Ads API enabled and a service account (both made from the command line by `creatives/tools/google-cloud-setup.mjs` through gcloud; the service account is then added to the Google Ads account in one form), and API access at Explorer (applied for in the Cloud Console). `/connect` chapter G drives it in the Owner's Chrome (`docs/google-setup-guide.md`); the client id and secret move into `.env` by `env-set.mjs`, and the login is `google-ads.mjs login` (the Owner clicks Allow), unseen.
- **Node 20+** for the creative tools.
- **`playwright-core`** (optional; the bootstrap installs it by default, or run `npm install --no-save --no-package-lock playwright-core` in the repo root) only if you render stills with `creatives/tools/render-stills.mjs`.
- **HyperFrames plugin** (optional, for short silent ad videos): the plugin's files ship in `vendor/hyperframes/` (Apache-2.0, see `THIRD-PARTY.md`) and the bootstrap installs them from there by default. By hand, from this folder: `claude plugin marketplace add ./vendor/hyperframes`, then `claude plugin install hyperframes@hyperframes`. The renderer itself (`npx hyperframes`) is fetched from npm on first use and needs Node 22+ and FFmpeg.
- **Vercel CLI** (optional) to publish a flight's preview site, with the company's own Vercel login.
- **Lead delivery** needs no connection: instant-form leads arrive in Meta's Leads Center by default (or by email, CSV download or a CRM). A lead webhook is an advanced option, only for a company whose product team runs one.

## Versions

`CHANGELOG.md` lists what changed in each release. Releases are tagged `vX.Y.Z`; the first release after the beta run is 1.0.0. When you update, keep your own `config/`, `memory/`, `checklist.md`, `plans/`, `reports/` and `.env`: a release ships the first five as empty templates, and no `.env` at all.

## Licence

A single-company licence: a copy may be used, copied internally and modified to run the marketing of one company, the one that obtained it. No resale, no redistribution, no publishing of modified copies, and no service to third parties built on it (an agency serving clients needs a separate agreement). The licence is a draft, to be reviewed by a lawyer; its text is in `LICENSE`. The third-party skills keep their own licences (MIT and Apache-2.0), listed with their sources in `THIRD-PARTY.md`.

**No warranty, no guarantee of results.** Nothing here guarantees any ad result, cost, approval or account standing, and AI output can be wrong. You are responsible for your Meta accounts and spend, for Meta's advertising policies and for the law in your markets.
