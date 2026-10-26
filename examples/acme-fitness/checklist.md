# Go checklist

<!-- FICTIONAL EXAMPLE. Acme Fitness Ltd, its people and every id below are invented. -->

<!-- Items that must be done before (or while) campaigns run, by owner. Updated by /sync with one line in the sync log. Statuses: open, blocked, done, n/a. Owners: Owner, Operator, Product team, Harness. Never a secret or personal data. -->

| id | item | owner | status | note | updated |
|---|---|---|---|---|---|
| 1 | Verify a phone number on the ad account (required before any activation) | Owner | open | Ads Manager error #3858013 until done | 2026-10-26 |
| 2 | Domain verification for acmefitness.example in Business Settings | Owner | open | gates the corporate campaign per the Owner's decision rule | 2026-10-26 |
| 3 | Create the System User `acme-uploader` and paste its token into `.env` | Owner | open | names only; the value never reaches chat | 2026-10-26 |
| 4 | Register lead form `500000000000001` with the lead webhook | Product team | blocked | waits on the developer app + `leadgen` subscription | 2026-10-26 |
| 5 | Compliance pass on the first copy batch | Harness | done | `plans/2026-10-26-first-flight-plan.md` §copy, all PASS | 2026-10-27 |
| 6 | Build members and corporate campaigns PAUSED on the Owner's numbered picks | Harness | done | campaigns `600000000000001`, `600000000000002`; five ads | 2026-10-27 |
| 7 | Budget for both campaigns (daily and cap) | Owner | open | Needs the Owner's go; stated in GBP before activation | 2026-10-27 |

## Sync log

<!-- One dated line per /sync: YYYY-MM-DD HH:MM: what changed (items moved, ids touched). -->
- 2026-10-26 14:10: `/setup` done; items 1–4 opened; nothing built.
- 2026-10-27 16:40: items 5 and 6 done (build session); item 7 opened; both campaigns PAUSED, verified by live read.
