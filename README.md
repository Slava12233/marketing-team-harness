# Marketing Team Harness

A Claude Code harness that acts as a company's marketing and paid-media team on **Meta Ads** (Facebook, Instagram, WhatsApp, Messenger). It connects to Meta's official Ads MCP server and works the way a small in-house team would: it reads performance and writes daily and weekly reports, plans flights, writes ad copy and creative briefs, produces still ads, builds campaigns, ad sets and ads (always PAUSED), audits landing pages and tracking, and advises on positioning, audiences and budget.

The harness is company-agnostic. Ten sub-agents (performance analyst, signals auditor, CRO auditor, creative director, copywriter, competitor researcher, compliance reviewer, test designer, media buyer, librarian) and about twenty skills carry the method; everything about your company (name, product, funnels, audiences, brand, claims, accounts, people) lives in `config/` and is written by the `/setup` wizard. Five commands run the day: `/setup` once, `/health` for plumbing, `/morning` to open a day, `/next-round` for the weekly creative round, `/sync` to close a session.

It was cut from a harness that ran real campaigns, so its rules carry what was learned the hard way: how Meta's MCP server really behaves (`docs/meta-platform-notes.md`), a compliance gate before every build, and a money model where nothing spends without the Owner's explicit go.

## Who it is for

A company that advertises on Meta and wants Claude Code to do the paid-media work under one accountable person. The **Owner** gives the go on money and holds the Meta logins; the **Operator** (often a marketer, sometimes the Owner) runs the sessions and does not need to be technical: every console step comes as a click list and every engineer step as a copy-paste block. A **product team** that ships the website is optional; without one, page changes are the Owner's.

## Quick start

1. Clone this repository, or press **Use this template** on GitHub and clone your copy.
2. Connect the tools (below) and open the folder in Claude Code.
3. Run `/setup`: the wizard interviews you in rounds of four questions, writes `config/*.md`, checks the Meta account live and drafts a first-flight plan.
4. Run `/health`: a green/yellow/red table of every connection and file.
5. Run `/morning` at the start of each working day.

New Operators: read `ONBOARDING.md`. A fully filled fictional configuration is in `examples/acme-fitness/`.

## Folder map

```
CLAUDE.md               the rules; imports config/*.md
config/                 your company, written by /setup (see config/README.md)
memory.md, checklist.md the harness's memory and the go checklist
plans/, reports/        dated Markdown, YYYY-MM-DD-<topic>.md
creatives/              sources, finished files, tools, the preview-site template
docs/                   the template spec and Meta platform notes
.claude/agents, skills  the ten agents and the skills
control-room/, dashboard/  the optional status pane and its data file
examples/               a filled example company
```

## Safety model

- **Built paused.** Every campaign, ad set and ad is created PAUSED. Nothing runs until it is activated.
- **Go in the same message.** Activating, raising a budget, extending a schedule or starting an experiment needs the Owner's explicit go in the same message, after the harness states the daily spend and the cap. Pausing and reads are always allowed.
- **Console clicks are the Owner's.** Pages, the Business portfolio, tokens, Lead Ads terms, discarding drafts and deleting live objects are prepared as click lists; the harness stops before them.
- **No secrets.** Tokens live in `.env` (never committed) and Claude Code's credential store; chat, memory, plans and reports carry names only.
- **No PII.** Lead, sign-up and customer rows never enter the repository; the harness works with counts by source and ref.
- **No made-up numbers.** "No data" is an acceptable answer; every figure in an ad carries a source and a date.

## Connections needed

- **Meta Ads MCP** (required):
  ```
  claude mcp add --transport http --scope user meta-ads https://mcp.facebook.com/ads
  claude mcp login meta-ads
  ```
  The login is the Owner's Facebook Login for Business. Start a new Claude Code session afterwards so the tools load.
- **Direct uploads** (recommended): copy `.env.example` to `.env`, set `META_AD_ACCOUNT_ID`, and have the Owner paste a System User token as `META_MARKETING_TOKEN`. Check it with `node creatives/tools/meta-upload.mjs --check`.
- **fal MCP** (optional, for generated pictures and video; paid):
  ```
  claude mcp add --transport http --scope user fal https://mcp.fal.ai/mcp-relay
  ```
- **Node 20+** for the creative tools.
- **Microsoft Edge or Google Chrome** for the ad screenshots and still renders.
- **`playwright-core`** (`npm i -D playwright-core` in the repo root) only if you render stills with `creatives/tools/render-stills.mjs`.
- **Vercel CLI** (optional) to publish a flight's preview site.

Third-party skills shipped with this repository, with their sources and licences, are listed in `THIRD-PARTY.md`.

## Licence

Private repository; all rights reserved by its owner. Copies for other companies are made with GitHub's "Use this template" by people the owner grants access to; each copy keeps this notice and `THIRD-PARTY.md`.
