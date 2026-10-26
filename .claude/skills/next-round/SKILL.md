---
name: next-round
description: "The weekly creative and copy round for the company's Meta flights: the week's numbers, then creative-director, copywriter and competitor-researcher in parallel, a compliance pass, and a ranked, numbered recommendation that the Owner picks from before media-buyer builds anything, paused. Use once a cell has about a week of delivery, or when the Operator types /next-round."
---

# /next-round: what to change next week

A fixed chain: numbers → three views in parallel → compliance → one ranked recap → the Owner picks → build paused. Project rules (`CLAUDE.md`) win on conflict. Nothing in this command activates, spends or changes delivery; the recap labels what would. The routine's weekly slot is in `config/operator.md`.

**Output:** `reports/YYYY-MM-DD-next-round.md` (the recap), the analyst's `reports/YYYY-MM-DD-performance.md`, the agents' briefs and copy files under `creatives/briefs/` and `plans/`; after the Owner's picks, ids in the plan and `memory.md`. **Language:** files in English, with the ad copy quoted in the ad's language as written; the terminal summary in the chat language from `config/operator.md`.

## When it runs, and what it does before there is data
- **Live mode:** a cell has at least 7 days of delivery (or 2,000 impressions per ad, whichever comes first). Judgments rest on the account's own numbers.
- **Pre-launch mode (before the first flight runs, before a launch date named in `config/company.md` or the plan, or under 7 days of delivery):** it says so in the first line and runs the creative and copy views without numbers, labelled "opinion, no delivery data": a bench review against the launch set, the research rails, the Ad Library. It does not pretend to a verdict.

## Procedure
1. **Numbers** (`performance-analyst`, sonnet, with the `meta-performance-report` skill): the last 7 days vs the previous 7, per ad set and per ad: spend, impressions, reach, frequency, CPM, outbound CTR, cost per result (each funnel's result as defined in `config/product.md`: for example messaging conversations started for click-to-WhatsApp cells, form leads for instant-form cells), landing page views where relevant, app-side counts by `ref` if the product team handed them over. Fatigue flags: frequency above 2.5 with CTR down 20 % week on week; a creative past the flight plan's spend threshold without a result. The report file is the analyst's (`reports/YYYY-MM-DD-performance.md`).
2. **Three views in parallel**, each given the analyst's file, the current flight plan (named in `memory.md` "Current state"), the flight's numbered creatives and copy table (the plan's copy table, and `preview/ads.js` when the flight has a preview site), `CLAUDE.md`, `config/product.md`, `config/audiences.md`, `config/brand.md`, `config/claims.md`, and an exact scope:
   - `creative-director` (opus): which creatives to retire, keep or promote and why; two or three new concepts with briefs on the `creative-brief` and `ad-creative` templates; the visual hook and the headline hook must not repeat each other; nothing on the image but the message unless `config/brand.md` says otherwise; new creatives take the next free number of the flight (numbers are fixed, never reused or renumbered).
   - `copywriter` (opus): three to five variations per concept still in play, within the rails: the pain first, then the promise as worded in `config/product.md`; every figure with a source and a date; none of the forbidden words or claims in `config/claims.md`; lines that need clearance used only once cleared; no personal attributes (`config/audiences.md` "must not be addressed as"); the tone and form of address in `config/brand.md`; the closing line the plan sets for each door (for example the click-to-WhatsApp door).
   - `competitor-researcher` (sonnet): what changed in the Ad Library this week for the company's category, markets and languages (`config/company.md`, `config/audiences.md`); two ideas worth taking as mechanism, never copy (the `viral-reverse-engineering` method).
3. **Compliance** (`compliance-reviewer`, sonnet, the `compliance-check` skill) on the shortlist: Meta policy, special ad categories from `config/claims.md`, the jurisdiction notes in `config/claims.md`, the project rules. A FIX is applied before the recap; a BLOCK drops the item; a HOLD goes to the Owner and is never resolved by an agent.
4. **The recap**, written by the main session in its own judgment: `reports/YYYY-MM-DD-next-round.md`, a numbered list (a numbered recap comes before any build). Each item: the evidence, the proposed action, what it costs (renders, generation, uploads, a new preview deploy), the risk, and the label: **Needs the Owner's go** for anything that changes delivery or spend, **Needs product team** for a page, event or notice, **Harness does now** for paused builds and drafts. Compare the recommended path with the nearest alternative and name the weak link.
5. **The Owner picks by number.** Only the items the Owner names, in their words, go further.
6. **Build, paused** (`media-buyer`, through the `meta-campaign-build` skill, after `creative-production` for new files): new ads PAUSED in the right set, the plan's copy table and the preview's `ads.js` (if any) updated, the preview redeployed only when the Owner asks, ids recorded in the plan and `memory.md`. Activation and budget changes stay in the main session behind the Owner's go in the same message with the spend stated. After a build and before the go, offer the grill-me interview (`grilling`).

## Output (terminal, at most 20 lines, in the chat language)
Mode line (live / pre-launch), the one-line verdict per cell, the top three numbered recommendations with their labels, the path of the recap file, and the question "which numbers do you want built?".

## Rules
- Reads and drafts only; no activation, budget, schedule or audience change.
- Media the plan's media table marks as superseded never go in an ad.
- No metric is invented; "no data" is an acceptable cell.
- No PII; the product's copy in other languages quoted as is.
