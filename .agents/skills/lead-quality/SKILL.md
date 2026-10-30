---
name: lead-quality
description: "The weekly loop that turns cost per lead into cost per qualified lead: the Owner or the Operator gives counts only (per campaign and week: leads or conversations, qualified, booked, closed), the skill pairs them with a live spend read for the same days, appends a row to the flight note's Lead counts table, compares with the targets in config/goals.md and puts both numbers into the performance and client reports. A campaign whose cost per qualified lead is above target two weeks running becomes a labelled recommendation to the Owner, never an action. Use once a week (before /next-round or the weekly report), when the Owner sends lead counts, or when asked what a qualified lead costs."
---

# Lead quality: cost per qualified lead

Meta counts conversations and form leads; the company pays for customers. This loop puts the company's own count of what happened to those leads next to the money, every week, so a campaign is judged by **cost per qualified lead** and not only by cost per lead.

**Output:** a row per campaign and week in the flight note's `## Lead counts` table (`memory/flights/<flight>.md`, section from `memory/templates/lead-counts.md`); `reports/YYYY-MM-DD-lead-quality.md` (written once, never edited after the Owner has read it); the two numbers in the week's performance report and client report; a short chat summary in the chat language of `config/operator.md`. Money in the account currency of `config/accounts.md`.

## The hard rule: counts only, from people
The counts come from the Owner or the Operator, typed in chat, written as a line in `memory/inbox/owner.md`, or pasted as a small table: per campaign and week, **leads** (or conversations), **qualified**, **booked**, **closed**. They are recorded with `source: Owner's count`.

**The harness never reads a lead row, an inbox, a chat, Leads Center, a CSV or a CRM to make these counts**, even when a tool or a browser could reach them. Nothing is counted on the Owner's behalf. When a message carries a name, a phone number, an email or a chat excerpt, nothing of it is copied anywhere: take the numbers, say in chat that the rest was not kept, and ask for counts only next time. A week with no counts given reads "no data", never an estimate.

## Read first
- The funnel's flight note (`memory/flights/`) and its `## Lead counts` table, if any; the campaign notes (`memory/campaigns/`) for the campaign ids and names.
- The definitions of lead, qualified, booked and closed: section 3 of the funnel's lead response kit (`plans/*lead-response-kit*.md`, the `lead-response-kit` skill); without a kit, ask the Owner once for the definitions (AskUserQuestion, English, recommended option first: "qualified = meets what the product is for, in the service area, ready within the funnel's horizon") and write them above the table.
- `config/goals.md`: the target cost per result per funnel, the budget week, the review cadence; `memory/business/goals.md` when the config still holds placeholders.
- `config/product.md` (what counts as a result for the funnel) and `config/accounts.md` (currency and its minor unit).

## Procedure
1. **Collect the counts** for the week just ended (the budget week of `config/goals.md`, Sunday–Saturday by default, labelled by its first day `YYYY-MM-DD`). Missing numbers are asked for in one round (at most four questions, recommended option first). When the counter used other days, write those days in the `week` cell (`2026-11-02..08`) and read spend for the same days.
2. **Read spend live** for the same days and campaigns: `ads_get_ad_entities` at `campaign` level with `object_ids` and a `time_range` of those days, field `amount_spent` (plus the funnel's Meta result, for the report only). `last_7d` presets exclude today; use the explicit range. A spend that cannot be read is "no data", and the row waits.
3. **Compute**, per campaign: cost per lead = spend ÷ leads; cost per qualified = spend ÷ qualified; `—` when the divisor is 0 (with "0 qualified" said in words in the report). Two decimals in the account currency. Never mix Meta's attributed results into these divisions: the counts are the company's, Meta's numbers sit beside them in the report, never summed with them.
4. **Append the rows** to the flight note's `## Lead counts` table (insert `memory/templates/lead-counts.md` first when the section is missing): `| week | campaign | leads | qualified | booked | closed | spend | cost per lead | cost per qualified | as_of | source |`, with `as_of` the time of step 2's read and `source` `Owner's count; spend ads_get_ad_entities`. Set the flight note's frontmatter `as_of` to that time and add a `## Log` line. A correction is a new row naming the row it corrects. Only the main session writes the flight note; when this runs inside a sub-agent (`performance-analyst`), the agent writes the report and proposes the rows in `memory/inbox/proposals.md`.
5. **Compare with the targets** in `config/goals.md`:
   - **cost per qualified** against the row of the target table whose result is a qualified lead for this funnel. When there is no such row, write "no target per qualified lead" and propose one in the report as a question for the Owner (a target is the Owner's, written into `config/goals.md` by the Owner or on the Owner's word; never derived by the harness).
   - the funnel's own result (booked or closed, per `config/product.md`) against its target cost per result, when the counts include it: spend ÷ booked or spend ÷ closed, in the report only.
   - "Not stated yet" targets give "no verdict: target not set", never a borrowed benchmark.
6. **The two-week rule.** A campaign whose cost per qualified is above its target in **two consecutive weeks** gets a recommendation in the report and the chat summary, labelled **"Needs the Owner's go"**, with the two weeks' numbers and the volume they rest on (say "based on N qualified" when N is under 10), and options in order of cost: fix the response first (the reply SLA, the scripts, the qualification questions: `lead-response-kit`), then the promise that brings the wrong people (ad copy or form questions: `ad-copy`, `offer-design`), then budget moves between campaigns inside the caps (`scaling-playbook`), then a pause. **The harness takes none of these actions itself**, pauses included, unless the Owner asks in chat.
7. **Write the report** `reports/YYYY-MM-DD-lead-quality.md` (frontmatter `type: report`, `status: done`, `as_of`, `source`): per campaign this week and last week, leads, qualified, booked, closed, spend, cost per lead, cost per qualified, the qualified rate (qualified ÷ leads), the target and the verdict, Meta's own result count for the same days beside it (labelled platform-attributed), the two-week flags, the recommendations labelled "Needs the Owner's go", and the counts' source and as_of.
8. **Into the other reports.** The week's performance report (`meta-performance-report`) and client report (`client-report`, when `config/reporting.md` exists) quote cost per lead and cost per qualified per campaign from the flight note's `## Lead counts` (the newest rows, with their week and `source: Owner's count`). A report already written is never edited: when the counts arrive after it, the next report carries them, and this skill's own report stands for the week.
9. **Close the loop:** an Inbox line that carried counts gets its `↳` answer ("filed to [[<flight>]]"); a line in today's session note; when the Owner rules on a recommendation, a decision note (`memory/decisions/`), per `memory-update`.

## Chat summary (chat language, at most 8 lines)
Per campaign: cost per lead and cost per qualified this week (and last week), against the target; the qualified rate; any campaign over target two weeks running with its "Needs the Owner's go" recommendation; what counts are still missing.

## Do not
- Read, open, export or scrape leads, chats, Leads Center, a CRM or a spreadsheet of leads; nor ask for one to be pasted.
- Estimate a missing count, back-fill a week, or turn Meta's reported results into "qualified".
- Act on a verdict: no pause, budget change or edit comes out of this skill without the Owner's word in chat (a pause on the Owner's ask, a spend change on a go in the same message).
- Write a lead's name, phone, email or message text anywhere in this folder.
