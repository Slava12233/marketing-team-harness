# Channels roadmap: Meta only, for now

> **Superseded for Google Ads (2026-10-30, the maintainer's ruling).** Google Ads is added now, ahead of the conditions below, because a client installation needs it: the harness's own Node tool `creatives/tools/google-ads.mjs` (the shape this page planned), Search campaigns built PAUSED first, Performance Max and Demand Gen next; the client owns the Google Cloud project and the login; the caps are shared with a per-platform share; `/connect` asks which platforms a company uses and `/campaign` which campaign to build. The guard is the tool's own (the `.env` account must equal `config/accounts.md`; enable and budget only on resources this folder created). GA4 and the other channels below stay as decided.

**Decision (2026-10-27).** The harness runs **Meta Ads only** (Facebook, Instagram, WhatsApp, Messenger through Meta's official Ads MCP). No other ad or analytics channel is added to the template until the conditions below hold. This page records why, the order in which channels would come, and what each one would cost the template. It is a decision record for the maintainer, not a buyer feature list.

## Why one channel

Every rule in this harness was learned on one platform: what PAUSED means, where a budget sits, which field the publisher rejects after the validator said yes, which special ad category applies where, what a "result" is. A second channel does not add one skill; it multiplies the rules, the compliance surface, the memory and the control room (see "What a channel multiplies"). Doing that before Meta is proven with paying companies spreads the same maintenance over twice the surface.

## Conditions before any second channel

All three, in this order:

1. **Three paying Meta clients.** Three companies running the harness on Meta for real money, so the Meta rules are proven on more than one account, market and funnel type. Not before.
2. **The account guard exists and holds.** The PreToolUse/PostToolUse hook that refuses a Meta call aimed at an account other than the one in `config/accounts.md` (`.claude/hooks/account-guard.mjs`, checked by `/health` check 18). A second channel needs the same guard for its own account id before its first write.
3. **The regression run exists and passes.** `docs/regression-run.md` is signed off for a release, the release gate runs the node suites (step (b2)), and the skill evals pass. A new channel adds its own rows and evals to both before it ships.

## The order, and the conditions per channel

### 1. Google Analytics 4: read-only measurement, for every client

- **Why first:** it writes nothing and spends nothing, and it gives every client what Meta cannot: sessions, engagement and conversions on the destination pages by `utm_*`, independent of the Meta pixel's consent gating. It closes the "App results: no data" gap for companies without a product team.
- **Connection:** Google's official Analytics MCP server, published on GitHub under the `googleanalytics` organisation. **Unverified here: verify the current repository, its install command, its runtime (it may need Python, which the bootstrap does not install today) and its tool list before planning.** Read-only by design; the harness gets no write tool there.
- **Owner's steps:** a Google Cloud project with the Analytics Data API (and Admin API, for property discovery) enabled, the credentials the server expects, and read access for that identity on the GA4 property. All console clicks are the Owner's, as with Meta.
- **Config:** a `config/accounts.md` row `ga4_property_id` (the numeric property id the Data API needs; not the same as the existing `ga_measurement_id`, the `G-` tag id), plus the connection row in the MCP table.
- **Where it shows:** `meta-performance-report` gains a GA4 column set (sessions, engaged sessions, key events by `utm_campaign` / `utm_content`), labelled as a separate source and never summed with Meta results or app counts; `signals-audit` compares pixel events with GA4 key events; `/health` gains a GA4 read check.

### 2. Google Ads: the second paid channel

- **Condition:** after GA4 runs for at least the three Meta clients, and only for a client who asks for search or YouTube.
- **Connection:** check at that time whether Google publishes an official Google Ads MCP server with write tools (**not verified here**). If none, a small Node tool in the shape of `creatives/tools/meta-graph.mjs` (one file, no dependencies, `--dry-run` on every subcommand, the token never printed, the account id from `.env` only) over the Google Ads API, with campaigns created `PAUSED`.
- **Owner's steps:** the OAuth client, the developer token (applied for in a Google Ads manager account's API Center, with its access level approved by Google), the refresh token and the customer id. All the Owner's; the harness prepares the click list and stops.
- **Rules to write before the first build:** what PAUSED means there, budgets per campaign and shared budgets, the money gate and caps across both channels, Google's policies and its restricted categories (housing, employment and credit limits in some countries), conversion tracking and consent mode in the EEA.

### 3. TikTok or LinkedIn: by client type

- **LinkedIn** for B2B companies (job title, company size and industry targeting; lead gen forms). Its marketing API needs a developer application approved by LinkedIn; plan weeks, not days.
- **TikTok** for consumer brands with video. Its own business API, its own creative specs and policies.
- **Condition:** a paying client whose audience is demonstrably there, and channels 1 and 2 stable. One of the two, not both at once.

## What a channel multiplies

| Area | What a new channel adds |
|---|---|
| Rules (`CLAUDE.md`) | its PAUSED and go semantics, its budget model, its learned platform behaviour; the money gate and the caps in `config/goals.md` become cross-channel (a cap per channel and one in all) |
| Compliance surface | its ad policies and restricted categories per market in `compliance-check` and `config/claims.md`; a second public ad library where one exists |
| Memory | `memory/learnings/<channel>-platform/`, a section of `memory/maps/build.md` (or its own map), a `platform` property on campaign, flight and experiment notes, the bases and the lint rules that read it |
| Control room | a `platform` key on `dashboard/state.json` campaigns, the money tile split by channel, `build-hot.mjs` and the control-room mod updated |
| Setup and checks | a `/setup` round and its console steps, `checklist.md` rows, the setup progress page items, `/health` checks, `/morning` and `/sync` reads |
| Gates | scrub terms if any, rows in `docs/regression-run.md`, evals for every new or changed skill, the node suite of any new tool in the release gate |

## File map changes per channel

| Channel | New files | Changed files |
|---|---|---|
| GA4 | the server entry in `.mcp.json`; a `ga4-report` section or skill if the report grows past one table | `config/accounts.md` (+ `config/README.md`, the example), `meta-performance-report`, `signals-audit`, `health`, `setup`, `docs/TEMPLATE-SPEC.md` §3 and §4, `README.md` "Connections needed", `.claude/agents/performance-analyst.md` and `signals-auditor.md` tool lists |
| Google Ads | `creatives/tools/google-ads.mjs` and its test (or the official server in `.mcp.json`), a `google-ads-build` skill, `memory/learnings/google-ads-platform/`, `docs/google-ads-setup-guide.md`, evals for the new skill | `CLAUDE.md`, `config/accounts.md`, `config/goals.md`, `config/claims.md`, `compliance-check`, `meta-performance-report` (or a cross-channel report), `media-buyer`, `health`, `morning`, `sync`, `setup`, `dashboard/state.json` shape, the control-room mod, `.env.example`, `release.sh` / `release.ps1` (the new suite is globbed only under `creatives/tools/`), the spec |
| TikTok or LinkedIn | the same set as Google Ads, under its own name | the same set as Google Ads |

## Not verified on this page

- The GA4 MCP server's exact repository, install command and runtime.
- Whether an official Google Ads MCP server exists, and with which tools.
- The current approval steps and access levels of the Google Ads, LinkedIn and TikTok APIs.

Check each against the vendor's own documentation at the time of planning, and date what you find.
