# Harness memory

<!-- FICTIONAL EXAMPLE. Acme Fitness Ltd, its people and every id below are invented. -->

<!-- The harness's operational memory. Read it first in every session; update "Current state" and "Learnings" immediately after any publish, pause, budget change, new object or new finding; at session end append to "Session log" and rewrite "Next session should". Never a secret, never personal data. Durable platform behaviour goes to docs/meta-platform-notes.md. -->

## Current state

<!-- Account facts as last verified (with the time of the live read) and every campaign the harness built or manages. Keep it true at all times; the plan file to read first is named here. -->

**Plan file to read first:** `plans/2026-10-26-first-flight-plan.md`

**Account facts (last verified: 2026-10-27 17:10 Europe/London):** ad account `100000000000001` (GBP, active, payment method present, minimum daily budget 1.00 GBP), Business portfolio `200000000000001`, Page `300000000000001` (Lead Ads terms accepted), pixel `400000000000001` (fires `PageView`, `StartTrial` and `Schedule` after cookie consent), lead form `500000000000001`. Domain verification open. No upload token yet.

| Campaign id | Name | Status | Daily budget | Cap | Start | End | Ad sets | Ads | Last verified |
|---|---|---|---|---|---|---|---|---|---|
| `600000000000001` | 2026-11-MEMBERS-Trial | PAUSED | 1.00 GBP placeholder (Needs the Owner's go) | none set | not set | not set | 1 (`Members-GM-25-45`) | 3 (#1, #2, #3), PAUSED | 2026-10-27 17:10 Europe/London |
| `600000000000002` | 2026-11-CORPORATE-Call | PAUSED | 1.00 GBP placeholder (Needs the Owner's go) | none set | not set | not set | 1 (`Corporate-GM-HR`) | 2 (#4, #5), PAUSED | 2026-10-27 17:10 Europe/London |

## How to verify

<!-- The live reads that confirm "Current state", e.g. ads_get_ad_accounts for the account, ads_get_ad_entities by campaign id for status and budgets, ads_get_errors for review flags, ads_get_datasets for the pixel, meta-upload.mjs --check for the token. -->

- `ads_get_ad_accounts`: account `100000000000001` active, GBP.
- `ads_get_ad_entities` on the account, level campaign, `object_ids` `600000000000001` and `600000000000002`, fields id/name/status/effective_status/daily_budget/spend_cap/start_time/stop_time: both rows above, both PAUSED.
- `ads_get_ad_entities` on each campaign at ad level: ad count and statuses match the table.
- `ads_get_errors` on both campaigns: empty.
- `ads_get_dataset_details` on `400000000000001`: the last `StartTrial` received date.
- `node creatives/tools/meta-upload.mjs --check`: fails until the Owner creates the System User token (expected).

## Learnings

<!-- Dated bullets: what worked, what did not, account-specific behaviour. Format: - YYYY-MM-DD: learning (evidence). -->

- 2026-10-27: the members ad set reads "Advantage+ audience" with age 25–45; the age floor is a control, the ceiling only a suggestion. Read the set's audience panel before quoting a size (the ad-set audience panel in Ads Manager, read on the build).

## Decision rules

<!-- The rules the Owner has set, dated: target cost per result, budget step size and spacing, winner thresholds, mid-test edit policy, who pauses. Format: - YYYY-MM-DD: rule. -->

- 2026-10-26: the two funnels never share a campaign.
- 2026-10-26: the corporate campaign stays paused until domain verification is done.
- 2026-10-26: the Owner pauses, on a click list; the harness pauses only when the Owner asks in chat.

## Session log

<!-- Dated entries, newest last: what was asked, what was done, ids created or changed, what is open. Format: ### YYYY-MM-DD HH:MM <timezone> then bullets. -->

### 2026-10-26 14:00 Europe/London

- Asked: `/setup` with Sam Park (fictional), Operator.
- Done: interview in four rounds; `config/` written (all eight files); live Meta check found the ad account, portfolio, Page, pixel and lead form and wrote their ids into `config/accounts.md`; both destination pages fetched and quoted in `config/product.md`.
- Done: first flight plan drafted (`plans/2026-10-26-first-flight-plan.md`) with five proposed ads #1–#5 and every budget, cap and date left as "Needs the Owner's go".
- Nothing built, nothing activated.
- Open: budgets, caps and dates (Owner); domain verification (Owner); System User token (Owner); clearance of "Cancel anytime." (Owner).

### 2026-10-27 16:30 Europe/London

- Asked: the Owner picked by number from the plan's recap: build #1, #2, #3 (members) and #4, #5 (corporate), paused.
- Done: compliance pass on #1–#5, all PASS.
- Done: built two campaigns PAUSED with placeholder budgets: `600000000000001` 2026-11-MEMBERS-Trial (ad set `Members-GM-25-45`, ads #1–#3) and `600000000000002` 2026-11-CORPORATE-Call (ad set `Corporate-GM-HR`, ads #4–#5), from real class photos, an app screenshot and the tour video, uploaded by public URL through the MCP (no upload token yet). Read back by id at 17:10: all PAUSED; `ads_get_errors` empty.
- Ids written into the plan. Nothing activated.
- Open: as on 2026-10-26, plus the signals audit (`StartTrial` in the last 24 h) and render checks sent as images (Harness).

## Next session should

<!-- A short list, rewritten at every session end. -->

1. `/health`, then `/morning`.
2. Run the signals audit: `StartTrial` received on pixel `400000000000001` in the last 24 h.
3. Send renders of #1–#5 to the Owner as images (`ads_get_ad_preview` → `ad-shots.sh`).
4. Ask the Owner for the budgets, caps and dates in the plan and, if agreed, the go in the phrasing from `config/operator.md`.
5. Remind the Owner of domain verification and the System User token; confirm whether "Cancel anytime." is cleared for ads.
