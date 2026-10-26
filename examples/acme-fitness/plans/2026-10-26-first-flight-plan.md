# First flight plan

> FICTIONAL EXAMPLE. Acme Fitness Ltd and every id are invented.

Drafted by `/setup` on 2026-10-26 from `config/` (proposals only; `/setup` builds nothing). Updated on 2026-10-27 with the campaign ids after the build session, in which the Owner's numbered picks #1–#5 were built PAUSED. A living document: every id, amount and decision is recorded here as it happens. Nothing below is active; every amount is a proposal that **Needs the Owner's go**.

## 1. Summary

| Funnel | Campaign | Objective | Result | Destination | Status |
|---|---|---|---|---|---|
| Members | `600000000000001` 2026-11-MEMBERS-Trial | Sales (conversions), optimised for `StartTrial` | A 7-day free trial started | https://acmefitness.example/join?ref=meta-members-f1 | PAUSED |
| Corporate wellness | `600000000000002` 2026-11-CORPORATE-Call | Leads (instant form `500000000000001`) | A booked 20-minute call | Instant form; the thank-you screen links to https://acmefitness.example/corporate/call?ref=meta-corp-f1 | PAUSED |

## 2. Money (from `config/goals.md`)

- **Monthly budget band:** £600–£1,500 (the Owner answered round (i) on 2026-10-26).
- **Share for tests:** up to 20 % of the band (£120–£300 a month) on experiments and new creatives; reviewed weekly in `/next-round`.
- **Hard caps:** £60 a day, £420 a week (Sunday–Saturday, Meta's budget week), £1,500 a month, £750 per campaign. The harness never proposes a budget above a cap; a cap change is the Owner's, in writing.
- **Target cost per result:** Members £12 per trial started (`StartTrial`); Corporate wellness not stated yet (set after the first week of data).
- **Proposals stay inside the caps:** the Members go the Owner has in mind, £20/day with a £300 cap, sits under every cap; the Corporate daily budget is proposed only after the Members cell has a week of data. Every amount still **Needs the Owner's go**.

## 3. Campaign proposal: Members

- **Audience:** Members (`config/audiences.md`): Greater Manchester, radius around the three gyms, 25–45, English; exclude current members (pixel `MemberLogin`, 180 days).
- **Special ad category:** NONE (`config/claims.md`).
- **Placements:** Advantage+ placements; creatives in 4:5 and 9:16.
- **Lead path:** the website (`/join` trial sign-up); the pixel event `StartTrial` is the result; no lead form.
- **Daily budget:** £___ /day. **Needs the Owner's go.**
- **Cap (campaign spend limit):** £___ . **Needs the Owner's go.**
- **Dates:** start ___, end ___ . **Needs the Owner's go.**
- **Ads (fixed numbers):**

| # | Name | Format | Primary text | Headline | Claim source |
|---|---|---|---|---|---|
| 1 | Class-Floor | 4:5 photo | "Small classes, real coaches. Try any of our three Manchester gyms free for 7 days." | "7-day free trial, no card" | /join |
| 2 | App-Pass | 4:5 app screenshot | "Book a class, get your plan, open the door. One app for three gyms." | "Start your free week" | /join |
| 3 | Tour-30s | 9:16 video | "Thirty seconds inside. Then come and train with us free for 7 days." | "7-day free trial, no card" | /join |

- **Decision rule (proposal):** after 7 days or 50 trials, pause any ad above 1.5× the set's cost per trial.

## 4. Campaign proposal: Corporate wellness

- **Audience:** Corporate (`config/audiences.md`): Greater Manchester, HR and office-manager job titles, English.
- **Special ad category:** NONE.
- **Daily budget:** £___ /day. **Needs the Owner's go.**
- **Cap:** £___ . **Needs the Owner's go.**
- **Dates:** start ___, end ___ . **Needs the Owner's go.**
- **Gate:** domain verification done (Owner) before activation (decision rule 2026-10-26).
- **Lead path:** instant form `500000000000001` → Meta Leads Center (no webhook; the Operator reads and answers there); the Owner confirms once that notifications arrive (checklist item 4).
- **Ads (fixed numbers):**

| # | Name | Format | Primary text | Headline | Claim source |
|---|---|---|---|---|---|
| 4 | Team-Class | 4:5 photo | "A perk your team will actually use: small coached classes at three Manchester gyms." | "Book a 20-minute call" | /corporate/call |
| 5 | Usage-Report | 4:5 type-led card | "See how your team uses its wellness budget, by headcount. Let's talk for 20 minutes." | "Book a 20-minute call" | /corporate/call |

## 5. Gates before any go

- Compliance pass: done 2026-10-27, all five ads PASS.
- Signals audit: `StartTrial` received in the last 24 h (open, Harness).
- Domain verification (open, Owner).
- Leads Center notifications for form `500000000000001` confirmed by the Owner (open, Owner; gates the corporate campaign only).
- Renders checked as images (`ads_get_ad_preview` → `ad-shots.sh`) and sent to the Owner (open, Harness).
- The go, in the phrasing from `config/operator.md` (open, Owner).

## 6. Requests to the product team

None yet.
