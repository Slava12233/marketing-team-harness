# Marketing Team Harness

A Claude Code harness that acts as a company's marketing and paid-media team on **Meta Ads** (Facebook, Instagram, WhatsApp, Messenger). It connects to Meta's official Ads MCP server and works the way a small in-house team would: it reads performance and writes daily and weekly reports, plans flights, writes ad copy and creative briefs, produces still ads, builds campaigns, ad sets and ads (always PAUSED), audits landing pages and tracking, and advises on positioning, audiences and budget.

The harness is company-agnostic. Ten sub-agents (performance analyst, signals auditor, CRO auditor, creative director, copywriter, competitor researcher, compliance reviewer, test designer, media buyer, librarian) and about twenty skills carry the method; everything about your company (name, product, funnels, audiences, brand, claims, accounts, people) lives in `config/` and is written by the `/setup` wizard. Six commands run the day: `/setup` once, `/health` for plumbing, `/morning` to open a day, `/next-round` for the weekly creative round, `/sync` to close a session, `/consolidate` to tidy the memory once a week.

It was cut from a harness that ran real campaigns, so its rules carry what was learned the hard way: how Meta's MCP server really behaves (one note per fact in `memory/learnings/meta-platform/`), a compliance gate before every build, and a money model where nothing spends without the Owner's explicit go.

## What you get

- **A team, not a chat.** Ten agents in five lanes (measure, create, gate, build, close) and about twenty skills, each a written procedure; fourteen third-party craft skills alongside them.
- **Six commands with fixed outputs:** `/setup` (the onboarding wizard), `/health` (a green/yellow/red plumbing table), `/morning` (the daily report), `/next-round` (the weekly creative round and a numbered recap to pick from), `/sync` (the session closer), `/consolidate` (the weekly memory tidy).
- **A memory vault you can open.** The folder is an Obsidian vault (Obsidian is installed by the bootstrap; everything also works as plain files): `memory/HOME.md` is the Owner's page (money against the caps, open items by owner, campaigns), `memory/inbox/owner.md` is an Inbox you write in and the harness answers (it never acts on it without a go in chat), a weekly review lands in `memory/reviews/`, and one note per campaign, flight, decision and lesson keeps the history. Two hooks, shipped turned on in `.claude/settings.json`, load the summary into every new session and save a checkpoint before a long chat is compacted. Nothing to click in Obsidian and nothing to paste: the bootstrap registers the folder as a vault, turns on Obsidian's command line and opens the app on HOME (`memory/tools/obsidian-setup.mjs`). The guide is `docs/obsidian-guide.md`.
- **A setup progress page** (`dashboard/setup.html`) that ticks itself as the wizard confirms each step and shows the Owner's own clicks as "your turn".
- **Money rules that hold:** budgets inside the band and below the caps in `config/goals.md`, everything built PAUSED, nothing activated without the Owner's go in the same message.

## Who it is for

A company that advertises on Meta and wants Claude Code to do the paid-media work under one accountable person. The **Owner** gives the go on money and holds the Meta logins; the **Operator** (often a marketer, sometimes the Owner) runs the sessions and does not need to be technical: every console step comes as a click list and every engineer step as a copy-paste block. A **product team** that ships the website is optional; without one, page changes are the Owner's.

**The Claude plan.** Claude Max is the working plan: the agents run on Opus and Sonnet, and creative rounds and builds use a lot of model time. Claude Pro works for reads and reports but runs into its usage limits on creative rounds and builds. A company that has an Anthropic API key can use that instead. Plans and their limits change; check them on Anthropic's site.

## Quick start

1. **Get the files.** Download the release zip (or clone this repository, or press **Use this template** on GitHub and clone your copy, kept private) and unzip it into a folder you own, for example inside your Documents folder.
2. **Run the bootstrap** in that folder. Windows: `powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1`. macOS: `bash bootstrap.sh`. It checks Git, Node 20+ and Claude Code, reports whether a browser (Edge or Chrome) is present, lists what is missing and installs all of it after one confirmation (Git, Node LTS, Claude Code, FFmpeg, `playwright-core`, the HyperFrames plugin from `vendor/hyperframes`, Obsidian), copies `.env.example` to `.env`, sets Obsidian up for the vault with no click (`memory/tools/obsidian-setup.mjs`: the vault registered, the command line interface on, the app opened on HOME), offers the optional extras and prints what remains. With `-Check` (Windows) or `--check` (macOS) it only reports. Flags: `-Check` / `--check` reports without installing; `-Yes` / `--yes` installs without the question; `-Ask` / `--ask` asks per item; `-Help` / `--help`. A progress page (`dashboard/setup.html`) opens in your browser at the end of the bootstrap and ticks itself as the wizard confirms each step (your own Meta clicks show as "your turn"); keep it beside Claude Code.
3. **Open the folder in Claude Code** (type `claude` in a terminal in the folder) and approve the two MCP servers it brings in `.mcp.json`: `meta-ads` and `fal`.
4. **Log in:** `/mcp` → `meta-ads` → log in with the Owner's Facebook profile, granting this company's business, ad account and Page. Optional: `/mcp` → `fal` → log in with the company's fal account.
5. **Start a new session** (Meta's tools load only into sessions started after the login) and run `/setup`: the wizard interviews you in rounds of four questions, prints the Meta console click lists and checks each outcome live, writes `config/*.md` and drafts a first-flight plan.
6. Run `/health`: a green/yellow/red table of every connection and file, the bootstrap's prerequisites, and spend against the caps in `config/goals.md`.
7. Run `/morning` at the start of each working day.
8. **The vault in Obsidian:** nothing to click. The bootstrap already registered the folder as a vault, turned on the command line interface and opened Obsidian on `memory/HOME.md`; the hooks ship in `.claude/settings.json` (Claude Code asks once to trust the folder). The Owner's only Obsidian action is to use it: HOME and the Inbox. `/health` checks both.

**Guided setup.** An A-Z explainer video, in chapters, and a screenshot guide walk a non-technical Owner through every step, from an empty laptop to a first campaign built PAUSED in the company's own Meta account. The text half of the guide is `docs/meta-setup-guide.md`. [link to the explainer video and the setup guide]

New Operators: read `ONBOARDING.md`. A fully filled fictional configuration is in `examples/acme-fitness/`.

## Folder map

```
CLAUDE.md                 the rules; imports config/*.md
config/                   your company, written by /setup (see config/README.md)
config/goals.md           budget band, target costs, caps, the first funnel (round (i) of /setup)
memory/                   the memory vault: HOME, the Inbox, state, business notes, campaigns, decisions, learnings, day notes, weekly reviews; the contract is memory/README.md
.obsidian/                Obsidian's settings for the vault
checklist.md              the go checklist
plans/, reports/          dated Markdown, YYYY-MM-DD-<topic>.md
creatives/                sources, finished files, tools, the preview-site template
docs/                     the template spec, the Obsidian guide, the hooks block to restore, the older Meta platform notes
docs/meta-setup-guide.md  the Owner's Meta console steps, in order, with what the harness checks
.claude/agents, skills    the ten agents and the skills
.claude/settings.json     the memory hooks, shipped; Claude Code asks once to trust the folder
.mcp.json                 the two MCP servers (meta-ads, fal) Claude Code asks you to approve
bootstrap.ps1, .sh        first-run check and install (Windows, macOS)
release.ps1, .sh          cuts a release: scrub gate, version tag, zip (for whoever publishes releases)
CHANGELOG.md              what changed in each release
LICENSE, THIRD-PARTY.md   the licence; the third-party skills and their licences
control-room/, dashboard/ the optional status pane, its data file, and setup-page.mjs (the setup progress page)
examples/                 a filled example company
```

## Safety model

- **Built paused.** Every campaign, ad set and ad is created PAUSED. Nothing runs until it is activated.
- **Go in the same message.** Activating, raising a budget, extending a schedule or starting an experiment needs the Owner's explicit go in the same message, after the harness states the daily spend and the cap. Pausing and reads are always allowed.
- **Console clicks are the Owner's.** Pages, the Business portfolio, tokens, Lead Ads terms, discarding drafts and deleting live objects are prepared as click lists; the harness stops before them.
- **No secrets.** Tokens live in `.env` (never committed) and Claude Code's credential store; chat, memory, plans and reports carry names only.
- **No PII.** Lead, sign-up and customer rows never enter the repository; the harness works with counts by source and ref.
- **No made-up numbers.** "No data" is an acceptable answer; every figure in an ad carries a source and a date.

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
- **Direct uploads** (recommended): `.env` (the bootstrap copies it from `.env.example`) holds `META_AD_ACCOUNT_ID` and the Owner's System User token as `META_MARKETING_TOKEN`, pasted by the Owner with a text editor and never into chat (`docs/meta-setup-guide.md`, step 7). Check it with `node creatives/tools/meta-upload.mjs --check`.
- **Node 20+** for the creative tools.
- **Microsoft Edge or Google Chrome** for the ad screenshots and still renders.
- **`playwright-core`** (optional; the bootstrap installs it by default, or run `npm install --no-save --no-package-lock playwright-core` in the repo root) only if you render stills with `creatives/tools/render-stills.mjs`.
- **HyperFrames plugin** (optional, for short silent ad videos): the plugin's files ship in `vendor/hyperframes/` (Apache-2.0, see `THIRD-PARTY.md`) and the bootstrap installs them from there by default. By hand, from this folder: `claude plugin marketplace add ./vendor/hyperframes`, then `claude plugin install hyperframes@hyperframes`. The renderer itself (`npx hyperframes`) is fetched from npm on first use and needs Node 22+ and FFmpeg.
- **Vercel CLI** (optional) to publish a flight's preview site, with the company's own Vercel login.
- **Lead delivery** needs no connection: instant-form leads arrive in Meta's Leads Center by default (or by email, CSV download or a CRM). A lead webhook is an advanced option, only for a company whose product team runs one.

## Versions

`CHANGELOG.md` lists what changed in each release. Releases are tagged `vX.Y.Z`; the first release after the beta run is 1.0.0. When you update, keep your own `config/`, `memory/`, `checklist.md`, `plans/`, `reports/` and `.env`: a release ships the first five as empty templates, and no `.env` at all.

## Licence

A single-company licence: a copy may be used, copied internally and modified to run the marketing of one company, the one that obtained it. No resale, no redistribution, no publishing of modified copies, and no service to third parties built on it (an agency serving clients needs a separate agreement). The licence is a draft, to be reviewed by a lawyer; its text is in `LICENSE`. The third-party skills keep their own licences (MIT and Apache-2.0), listed with their sources in `THIRD-PARTY.md`.

**No warranty, no guarantee of results.** Nothing here guarantees any ad result, cost, approval or account standing, and AI output can be wrong. You are responsible for your Meta accounts and spend, for Meta's advertising policies and for the law in your markets.
