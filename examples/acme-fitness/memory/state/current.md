---
type: state
created: 2026-10-26
updated: 2026-10-27
status: active
maintained_by: harness
categories: [state]
summary: "FICTIONAL EXAMPLE. Acme Fitness account facts as last verified (live read-back 2026-10-27 17:10 Europe/London), two PAUSED campaigns, the plan to read first and the next actions."
as_of: 2026-10-27T17:10+00:00
source: ads_get_ad_entities, ads_get_errors (read-back after the build)
plan: "[[2026-10-26-first-flight-plan]]"
launch_at: 2026-11-16T00:00:00
---

# Current state

> FICTIONAL EXAMPLE. Acme Fitness Ltd, its people and every id are invented.

Every fact carries the time of the live read that gave it. Re-read live before any change.

## Read first

- **Plan file to read first:** [[2026-10-26-first-flight-plan]] (drafted by `/setup` on 2026-10-26, ids added after the build on 2026-10-27).
- Campaign notes: [[2026-11-MEMBERS-Trial]], [[2026-11-CORPORATE-Call]]. Flight note: [[2026-11-first-flight]].

## Campaigns

| Campaign | Id | Status | Daily budget | Cap | Start | End | Ad sets | Ads | Last verified |
|---|---|---|---|---|---|---|---|---|---|
| [[2026-11-MEMBERS-Trial]] | `600000000000001` | PAUSED | 1.00 GBP placeholder (Needs the Owner's go) | none on Meta (the £750 per-campaign cap of [[business/goals\|goals]] applies) | not set | not set | 1 (`Members-GM-25-45`) | 3 (#1, #2, #3) PAUSED | 2026-10-27 17:10 |
| [[2026-11-CORPORATE-Call]] | `600000000000002` | PAUSED | 1.00 GBP placeholder (Needs the Owner's go) | none on Meta (the £750 per-campaign cap applies) | not set | not set | 1 (`Corporate-GM-HR`) | 2 (#4, #5) PAUSED | 2026-10-27 17:10 |

## Money (from the last live read)

- Daily spend: 0.00 GBP (everything PAUSED, read 2026-10-27 17:10)
- Live today: nothing running
- Next go: 2026-11-MEMBERS-Trial at £20/day, cap £300 (the Owner's idea in the plan; Needs the Owner's go)

## Account (names and public ids only)

- **Ad account:** `100000000000001`, GBP, active, payment method present, minimum daily budget 1.00 GBP (read 2026-10-27 17:10).
- **Drafts or real objects:** real objects; every create returned a PAUSED campaign, ad set and ad (see [[2026-10-20-some-accounts-create-real-paused-objects]]).
- **Business portfolio, Page, Instagram, WhatsApp numbers:** portfolio `200000000000001`; Page `300000000000001` (Lead Ads terms accepted); Instagram not linked for ads; no WhatsApp number.

## Tracking and plumbing

- Pixel `400000000000001`: `PageView`, `StartTrial`, `Schedule` and `MemberLogin` after cookie consent; `StartTrial` not yet seen in the last 24 h (signals audit open: [[signals-audit-start-trial]]).
- Upload token: no System User token in `.env` yet; `meta-upload.mjs --check` fails as expected; media went up by public URL ([[2026-10-27-uploads-by-public-url-until-the-token]]).
- Lead delivery: Leads Center for form `500000000000001`; the Owner still has to confirm that notifications reach the Operator.
- Domain verification: open ([[domain-verification-gates-corporate]]).

## Last live reads (figures; re-read before acting)

- **2026-10-27 17:10 Europe/London (read-back after the build):** campaigns `600000000000001` and `600000000000002`, both ad sets and all five ads PAUSED; `ads_get_errors` empty on both; 0.00 GBP spent.

## Open items by owner (as last recorded)

- **Owner:** the budgets, caps and dates of both campaigns, then the go ([[budgets-and-go-for-the-first-flight]]); domain verification ([[domain-verification-gates-corporate]]); the System User token; whether "Cancel anytime." is cleared for ads; Leads Center notifications confirmed.
- **Harness:** the signals audit ([[signals-audit-start-trial]]); renders of #1–#5 sent to the Owner as images.

## Next actions

1. Harness: `/morning` at 08:30, then the signals audit (`StartTrial` received on pixel `400000000000001` in the last 24 h)
2. Harness: send renders of #1–#5 to the Owner as images (`ads_get_ad_preview` → `ad-shots.sh`)
3. Owner: the budgets, caps and dates in the plan, then the go in the phrasing of `config/operator.md`
4. Owner: domain verification and the System User token
