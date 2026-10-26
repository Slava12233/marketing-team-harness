---
name: client-report
description: "Write the weekly (or on-demand) one-page client report on the company's Meta advertising in the client's language from config/reporting.md: a three-sentence answer, the baseline table against the previous period and the targets in config/goals.md, what changed, what we recommend, what we need from the client, and a short WhatsApp version; then render it to HTML (and PDF) with creatives/tools/report-render.mjs. The harness never sends it: the Owner reads it, the Operator sends it. Use on the cadence in config/reporting.md, or when the Operator asks for the client report."
---

# Client report

The one report written for the person who pays, in their language, on one page. Project rules (`CLAUDE.md`) and the vault contract (`memory/README.md`) win on every conflict with this file. It reads the account; it never writes to it.

**Output:** `reports/YYYY-MM-DD-client-report.md` (written once; a second run the same day is `-2`; never edited after the Owner has read it), its rendered `reports/YYYY-MM-DD-client-report.html` and, when a browser is present, `reports/YYYY-MM-DD-client-report.pdf`; one line in today's session note; the paths and the short version in chat. **Language:** the report file in the **report language** from `config/reporting.md` (this is the one report that is not in English when the client's language differs); the chat around it in the chat language from `config/operator.md`; money in the account currency (`currency` in `config/accounts.md`) written in the **currency format** from `config/reporting.md`; dates absolute.

## Rules that never bend
- **The harness never sends anything.** No email, no WhatsApp, no upload to a shared folder. The Owner reads the report first; the Operator sends it through the channel in `config/reporting.md`.
- **Never fabricate.** Every figure comes from a live read (or the analyst's report built from one) with its date range and attribution window. Where Meta has no figure, the cell reads "no data" in the report language. A target that is "not stated yet" reads so; no invented target, no invented benchmark.
- **Nothing internal reaches the client.** No ids of any kind (ad, ad set, campaign, account, Page, pixel, form, experiment); no agent, skill, tool, model or command names; no file paths, no vault links, no internal notes; no secrets; no personal data (no lead's or customer's name, email or phone: counts only). Plus every item under "Never include" in `config/reporting.md`. Campaigns and ads are named in plain words ("the trial campaign", "the video with the coach").
- **No spend without a go.** Recommendations that change spend or delivery are written as "needs your go"; the harness changes nothing because a report recommends it. The go comes from the Owner in chat, in the same message, with the spend stated, as `config/operator.md` describes.
- **Claims.** The report quotes no claim about the product that `config/claims.md` does not allow, and no advice the company does not give.

## Procedure
1. **Settings.** Read `config/reporting.md` (report language, direction, cadence, recipient, channel, the sections to include and never to include, what to compare with, the currency format). If it is missing or still holds `{{` placeholders, stop and say so in one line: "run /setup for config/reporting.md, or tell me the report language and what to compare with". Read `config/goals.md` (the target cost per result per funnel, the caps), `config/product.md` (the funnels and **what counts as a result** for each), `config/accounts.md` (`meta_ad_account_id`, `currency`) and `config/company.md` (the stage; the launch date if any).
2. **The period.** The cadence's period ending yesterday (weekly by default: the seven days ending yesterday, or the weekdays the cadence names), unless the Operator names one. The previous period is the one of equal length just before it. Attribution window: the one the performance report uses (default 7-day click, 1-day view); write it under the table.
3. **The numbers.**
   - Use the newest `reports/*-performance.md` whose date range is this period (same start and end) when one exists, and check its spend total against one live read (`ads_get_ad_entities` at campaign level with `time_range`); if they differ, the live read wins and the report says the figures were re-read.
   - Otherwise delegate to the `performance-analyst` agent (sonnet) with the `meta-performance-report` skill: the exact period, the previous equal period, the attribution window, and the columns below per funnel. Its own report stays its own (`reports/YYYY-MM-DD-performance.md`).
   - The baseline columns: spend, results (each funnel's result as `config/product.md` defines it), cost per result, CTR (outbound), CPM, frequency, landing page views. App-side results only as counts handed over by the product team or the Owner; otherwise "no data". Never add pixel events to app counts.
   - A benchmark column only when the analyst's diagnostics give one (`ads_insights_industry_benchmark` or `ads_insights_performance_vs_peers` for this period); otherwise leave the column out.
   - Pre-launch or nothing delivered: the table shows 0 spend and "no data" for the rates, and the three sentences say plainly that no ad has run yet and why.
   - Quote cost per lead and cost per qualified lead per campaign from the flight note's `## Lead counts` (newest rows, with their week and source: Owner's count); "no counts given" when there are none; never edit a written report to add late counts.
4. **What we changed.** Today's and the period's session notes (`memory/sessions/YYYY-MM/YYYY-MM-DD.md` for each day of the period) and the `## Log` lines of the campaign and flight notes dated in the period: launches, pauses, budget steps, new creatives, audience or page changes, each with its date, in plain words. Nothing that did not happen in the period.
5. **What we recommend and what we need.** From the analyst's recommendations, the newest `reports/*-next-round.md` and `reports/*-morning.md` of the period, and `checklist.md` (rows with status `open` or `blocked` and owner Owner: these are "what we need from you"). Each recommendation carries one label, in the report language:
   - **needs your go**: anything that changes spend, budget, schedule, audience or delivery; state the amount per day in the currency format and say it stays under the caps in `config/goals.md`;
   - **we do**: work the harness and the Operator do without spending (new creatives built paused, copy, a report, a check);
   - **needs the website team**: a page, event, consent or notice change (when `config/product-team.md` says there is no product team, it reads **needs your website person**, or the Owner).
   At most five recommendations, ranked. "What we need from you" lists only the Owner's actions (a go, a console click, an answer), each in one line with why it matters.
6. **Write** `reports/YYYY-MM-DD-client-report.md` with the frontmatter and the shape below, in the report language, one printed page (about 450 words of prose plus the table; cut detail before cutting a section). Section headings are translated into the report language; their order is fixed, and a section the client does not want (not under "Sections the client wants" in `config/reporting.md`) is left out, never the three sentences or the table.
7. **Check before rendering.** Grep the file for a run of 10 or more digits (an id), for `@` (an email), for a phone shape, for the words "agent", "skill", "MCP", "Claude", "subagent", "harness" and for any agent, skill or command name (`.claude/agents/*.md`, `.claude/skills/*/`, `/morning`, `/sync`, `/next-round`), and for `{{`. Any hit is removed or rewritten before rendering. Then check every figure against the source it came from once.
8. **Render.** `timeout 120 node creatives/tools/report-render.mjs reports/YYYY-MM-DD-client-report.md --pdf` (the direction comes from `config/reporting.md`; the company name from `config/company.md`). Exit 1 means no PDF (no Edge or Chrome, or it ran out of its 90-second bound): the HTML exists and can be printed to PDF from any browser; say so in one line. Run it once; never loop it.
9. **Say and log.** In chat (the chat language): the three paths (`.md`, `.html`, `.pdf` or "no PDF: <why>"), the short version for WhatsApp quoted as written, and one line: "for the Owner to read before the Operator sends it by <channel>". Append to today's session note: `- HH:MM — client report <period>: reports/YYYY-MM-DD-client-report.md (+ .html, .pdf), not sent`. No vault note changes beyond that line; anything the report found that the vault lacks goes to `memory/inbox/proposals.md`.

## Report shape
Frontmatter (English keys, vault contract `memory/README.md` §4):
```
---
type: report
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: done
maintained_by: harness
categories: [reports, client]
summary: Client report <period start>–<period end>: <the one-line answer, in English>.
as_of: YYYY-MM-DDTHH:MM<offset of the timezone in config/operator.md>
source: ads_get_ad_entities
period: YYYY-MM-DD..YYYY-MM-DD
attribution: 7-day click, 1-day view
---
```
Body (headings in the report language; the English below names what each holds):
```
# <Company short name>: <the period in words>

<Three sentences: what happened (results against the target), what it cost (spend and cost per result), what we do next.>

## Results
| | This period | Previous period | Target | Benchmark |
|---|--:|--:|--:|--:|
| Spend | | | (the cap, if the client wants caps) | |
| <Result name per funnel> | | | | |
| Cost per <result> | | | <target from config/goals.md or "not set yet"> | |
| CTR | | | | |
| CPM | | | | |
| Frequency | | | | |
| Landing page views | | | | |
<one line: the date ranges, the attribution window, "figures reported by Meta, read on <date>"; when the pixel fires only after consent, "only visitors who accepted cookies are counted">

## What we changed this week
- <date>: <change, in plain words>

## What we recommend
1. <recommendation>: <why, one line>. **<needs your go | we do | needs the website team>**

## What we need from you
- <action>: <why it matters>

## Short version for WhatsApp
> <at most 500 characters in the report language: the result, the cost, the one thing we need; no ids, no links>
```
Columns follow `config/reporting.md` "Compare to": previous period, plan targets, or both; the Benchmark column only when step 3 gave one. One row per funnel result when the period had more than one funnel live. Numbers in the currency format, rates with one decimal, counts as whole numbers.

## Do not
- Send, schedule, share or upload the report; post the short version anywhere.
- Edit a report the Owner has read; write a new dated one instead.
- Explain the harness, the vault or the tools to the client; the report talks about the ads, the money and the results.
- Mix attribution windows, sum results across funnels that count different things, or turn a one-day spike into a verdict (the decision rules in `meta-performance-report` apply).
