<!-- Written by /setup on 2026-10-26. Edit by hand or re-run /setup. -->
<!-- FICTIONAL EXAMPLE. Acme Fitness Ltd, its people and every amount below are invented. -->

# Goals and money

The money limits the harness works within. Amounts are in the account currency (`currency` in `config/accounts.md`). `/morning` and `/sync` copy the caps below into `dashboard/state.json` (`money.caps`) and flag spend above 80 % of a cap; the first flight plan proposes budgets inside the band and below the caps, each labelled "Needs the Owner's go".

**Monthly budget band:** £600–£1,500 a month (the middle of the three bands the wizard offered: 300–600, 600–1,500 and 1,500–3,000 times the account's minimum daily budget of 1.00 GBP)

## Target cost per result

| Funnel | Result | Target cost | Source of the target |
|---|---|---|---|
| Members | A 7-day free trial started | £12 per trial | the Owner's estimate, 2026-10-26: about one trial in three becomes a member (the gyms' own trial records, July–September 2026); reviewed after the first week of data |
| Corporate wellness | A booked 20-minute call | not stated yet: set after the first week of data | no past campaign to compare with |

**First funnel to launch:** Members. The simplest conversion: a trial started on the page, which the pixel already records as `StartTrial` after cookie consent; the corporate campaign also waits for domain verification (decision rule 2026-10-26).

## Hard caps

| Cap | Amount | Set by |
|---|---|---|
| Daily (all campaigns together) | £60 | Jordan Lee (fictional), Owner, 2026-10-26 |
| Weekly (all campaigns together) | £420 | Jordan Lee (fictional), Owner, 2026-10-26 |
| Monthly (all campaigns together, calendar month) | £1,500 | Jordan Lee (fictional), Owner, 2026-10-26 |
| Per campaign (its lifetime spending limit) | £750 | Jordan Lee (fictional), Owner, 2026-10-26 |

**Budget week:** Sunday–Saturday (Meta's budget week)

The harness never proposes a budget above a cap; a cap change is the Owner's, in writing.

## Success, tests and review

**Success in 30 days:** within 30 days of the first activation, at least 40 seven-day trials started from Meta (counted by `ref` in the trial sign-ups) at an average of £12 or less, with every cap respected; and a known cost per booked call once the corporate campaign has run for a week.

**Risk appetite for tests:** up to 20 % of the band on experiments and new creatives (at most £300 in a month at the top of the band); none in the first week, while the first flight learns.

**Review cadence:** weekly, in `/next-round` on Monday 10:00 Europe/London: spend against the caps and cost per trial against the target; every `/morning` also flags spend above 80 % of a cap.
