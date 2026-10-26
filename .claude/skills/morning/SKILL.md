---
name: morning
description: "Session opener for the company's paid media: read memory and the go checklist, verify the live Meta account, report overnight changes, review flags, spend against the caps in config/goals.md and open gates, then recommend. Read-only; a breakage is reported with a click list, never paused. Use at the start of a working session or when the Operator types /morning."
---

# /morning: the daily opener (read-only)

One fixed routine, the same shape every day, so one morning compares with the next. Project rules (`CLAUDE.md`) win on every conflict with this file. Takes about five minutes of tool calls.

**Output:** `reports/YYYY-MM-DD-morning.md` and `dashboard/state.json`; a dated correction in `memory.md` only where the live read contradicts it. **Language:** the report file in English; the terminal summary in the chat language from `config/operator.md`; money in the account currency from `config/accounts.md`; dates absolute, times in the timezone from `config/operator.md`.

The routine time for `/morning` (and for `/sync` and `/next-round`) is set in `config/operator.md`.

## Rules that never bend
- **Reads only.** No `ads_activate_entity`, no `ads_update_entity`, no budget, schedule, audience or creative writes, no experiment creation. When this command finds a breakage it **reports it with a click list and the Owner pauses**; the harness pauses only when the Owner asks in chat.
- Never fabricate a number. A metric the account cannot give reads "no data".
- No PII: counts by `source` and `ref` only. No secrets, names only.
- Every spend-affecting recommendation is labelled **Needs the Owner's go**; every page, event or notice change **Needs product team** (or **Needs Owner** when `config/product-team.md` says there is no product team).
- Single bounded calls; never a polling loop. If a review or a process has to be waited for, say so and stop.

## Procedure
1. **Health first.** Run the `health` skill's checks (it is read-only). Its green/yellow/red table becomes section 1 of the report. A red item does not stop the morning run; it is stated at the top and the run continues with what works.
2. **Memory.** `memory.md` ("Current state", "Decision rules", "Next session should", the last session-log entry), the plan it points to, and, when `config/product-team.md` names one, the product team's record of what it shipped or ruled since (launch-day switches, notices, counsel, page changes), read-only.
3. **Checklist.** Read `checklist.md`: the table (`id`, `item`, `owner`, `status`, `note`, `updated`) and the newest line of `## Sync log`. Group the `open` and `blocked` items by owner (Owner, Operator, Product team, Harness; items that wait on outside counsel are owned by the Owner). If `checklist.md` is missing, say so in red and fall back to `memory.md`.
4. **Live account.** With `ads_get_ad_entities` (`ad_account_id` = `meta_ad_account_id` from `config/accounts.md`, `object_type`, `object_ids`, `fields`):
   - every campaign in the `memory.md` campaigns table, including campaigns not made by this harness that memory says to leave running: `status`, `effective_status`, `daily_budget`, `amount_spent`;
   - their ad sets: `status`, `effective_status`, `daily_budget`, `start_time`, `end_time`, `delivery` (sub-status: `in_review`, `pending_process`, `scheduled`, `off`), ad counts;
   - their ads: counts by `effective_status` (PAUSED, ACTIVE, PENDING_REVIEW, DISAPPROVED, WITH_ISSUES, IN_PROCESS); list every ad that is not PAUSED or ACTIVE by name;
   - `ads_get_errors` (`entity_ids`: the campaign ids) must be empty;
   - `ads_account_get_activity_logs` since the time of the last session-log entry (the log comes back in the account's language; `run_status` 1 = active, 9 = pending review, 17 = pending publish; a whole campaign's log can exceed the tool-output limit, so filter the saved file with jq): anything changed by a hand other than this harness is a finding;
   - anything whose `effective_status` is ACTIVE while `memory.md` says PAUSED is a **red finding**, reported, not touched;
   - **lead funnels:** the count of leads comes from the live read (the ad set's results, yesterday and flight-to-date; in the live phase, the analyst's table), never from lead rows: the harness has no tool that reads them and never copies a name, an email or a phone number. The report says where the Operator reads the leads themselves: in Meta Business Suite's Leads Center (`docs/meta-setup-guide.md` has the click path), or in the company's own system when `config/accounts.md` holds a `lead_webhook_url`. Leads arriving while the `checklist.md` row that confirms Leads Center notifications is still open is a finding: nobody may be seeing them.
5. **Phase.**
   - **Pre-launch (no ad set ACTIVE):** sections 2–8 below; spend reads "0 in the account currency, everything PAUSED"; the recommendations are about readiness (gates, wording decisions, counsel, product-team items, render checks).
   - **Live (an ad set ACTIVE):** delegate the numbers to the `performance-analyst` agent (sonnet) with the `meta-performance-report` skill: yesterday vs the previous equal period, flight-to-date vs plan, the ad ranking, the diagnosis order, the decision rules from the flight plan and `memory.md`. Embed its summary table and its recommendations; its file stays its own (`reports/YYYY-MM-DD-performance.md`).
   - **A switch day** (a launch date or a destination change named in the plan or in `config/company.md`, and the day after): also confirm the destination pages from `config/product.md` load in the ad's language, that the ad sets' schedule and the weekly cap behave as planned, and that any CTA the plan says disappears on that day is gone.
   - **Every phase: money vs caps** (the logic of `health` check 15). Read the hard caps in `config/goals.md` (its caps table, columns Cap, Amount, Set by: daily, weekly, monthly, per campaign). Compare yesterday's spend with the daily cap, this week's (Sunday–Saturday, Meta's budget week, unless `config/goals.md` defines it otherwise) with the weekly cap, this month's with the monthly cap, each campaign's spend with its own cap, and the sum of the live daily budgets (converted from the minor unit) with the daily cap; spend only from a live read (step 4's objects, and `ads_insights_performance_trend` for yesterday, this week and this month). A figure at 80 % of a cap or more is a flagged line in the summary labelled **Needs the Owner's attention**; a figure above a cap is a red line with the pause click list from the breakage table (the Owner pauses). Meta may spend more than a daily budget on one day within its weekly ceiling: say so when the week is still under its cap. `config/goals.md` missing or holding placeholders: one yellow line, "no caps set: run /setup round (i)".
6. **Recommend.** Three to five items, ranked, each with evidence → action → label. Cover three points of view: creative (fatigue, which creative to retire or promote; the rotation rules live in the plan, do not restate them), copy (which pain line or closing line is pulling; wording decisions pending), optimization (pacing, audience panel, placements, budget steps per the `scaling-playbook`). Compare the chosen path with the alternative and name the weak link; raise a gap unprompted with a costed fix.
7. **Write and say.** The full report goes to `reports/YYYY-MM-DD-morning.md` (never overwrite: a second run the same day is `-2`). The terminal gets at most 25 lines: health in one line, review and errors in one, spend and delivery in one, money vs caps in one (plus a flagged or red line per cap at 80 % or above), the top three recommendations, and the two lists "Needs the Owner's go" and "Needs product team". Then update `memory.md` only where the live read contradicts it (a dated correction under "Current state"); the morning run is not a state change.
8. **Control-room board.** Rewrite `dashboard/state.json` (the control-room mod reads it) from this run's live read, keeping the keys fixed by `docs/TEMPLATE-SPEC.md` §9: `company` (the short name from `config/company.md`), `generatedAt` (ISO with the offset of the timezone in `config/operator.md`), `launch` (the launch date or null), `routines` (`{"timezone": <IANA zone from config/operator.md>, "items": [{"id", "label", "command": "morning|sync|next-round", "time": "HH:MM", "days": [0-6, 0 = Sunday, from the working days]}]}`), `working` (agent ids running now; empty at the end of the run), `tasks` (`[{"title", "owner"}]` in priority order, at most five, from step 3, owners as in `checklist.md`), `money` (`{"currency", "dailySpend", "caps", "liveToday", "nextGo"}`: `dailySpend` and the other figures only from this run's live read; `caps` copied from `config/goals.md` as `[{"label": "daily" | "weekly" | "monthly" | "<campaign name>", "amount": <number>, "period": "day" | "week" | "month" | "campaign"}]`, the amounts in the account currency exactly as the file has them, never invented, and `[]` while the file is missing or holds placeholders), `campaigns` (`[{"id", "name", "label", "status", "spent", "result"}]`), `team` (`{"<lane>": ["agent-id"]}`), `skillsUsed` (`[{"name", "count"}]` for this run). The full shape with comments is in `control-room/README.md`. Numbers only from the read (the caps only from `config/goals.md`); null when there is none. Valid JSON, UTF-8. Then run `node dashboard/setup-page.mjs` so the setup progress page (`dashboard/setup.html`) matches the board.

## Report template (fixed headings)
```
# Morning report, YYYY-MM-DD HH:MM <timezone from config/operator.md>
Phase: pre-launch | live (flight N, day N of N) | switch day

## 1. Health            green / yellow / red lines from /health
## 2. Changed since the last session   activity log + differences from memory.md
## 3. Review and errors  pending / disapproved / with issues; ads_get_errors
## 4. Spend and delivery pre-launch: "0 <currency>, everything PAUSED"; live: the analyst's table, leads per ad set and where the Operator reads them
## 5. Money vs caps      each cap in config/goals.md: spend, % of the cap, green / flagged at 80 % / red above
## 6. Open gates by owner   Owner / Operator / Product team / Harness, from checklist.md
## 7. Recommendations    ranked; evidence → action → label
## 8. Needs the Owner's go · Needs the Owner's attention · Needs product team · Harness does now
```

## Breakage definitions and the click list the Owner gets
| Finding | How it shows | What the report gives the Owner |
|---|---|---|
| Disapproved ad or a policy notice (social issues, a special ad category) | `effective_status` DISAPPROVED / WITH_ISSUES, the activity log | The ad's name and id, the Ads Manager path (Ads → the ad → Review feedback), the harness's reading of the notice; no appeal, no declaration by an agent |
| Broken destination | `health` finds a non-200 or the wrong language on a destination page from `config/product.md` | The URL, the status, the request text for the product team |
| Pixel dark while ads run | no `PageView` in 24 h on the pixel (`pixel_id` in `config/accounts.md`) with an ACTIVE set; never raised when `pixel_id` is `none (no website)` | A `signals-audit` run offered, the consent-gating caveat stated when the pixel fires only after consent |
| Spend anomaly | spend over 120 % of a daily budget, or 0 with an ACTIVE set after 6 h | The set's name, budget, spend; the pause is the Owner's click (Ads Manager toggle) |
| Spend above a cap | money vs caps (step 5): spend above a cap in `config/goals.md`, or the live daily budgets summing above the daily cap | The cap, the spend and its period, the campaigns and ad sets that carry it, and the pause click list (Ads Manager → Campaigns → the toggle of each live campaign or ad set); the Owner pauses, or asks the harness to in chat |
| An object changed by another hand | the activity log | What changed, when, by which account label |

## What this command is not
- Not the weekly creative round (`next-round`), not the session closer (`sync`), not a build. If the morning read calls for a build or a change, it ends as a labelled recommendation.
