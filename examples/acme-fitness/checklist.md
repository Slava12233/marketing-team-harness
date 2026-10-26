# Go checklist

<!-- FICTIONAL EXAMPLE. Acme Fitness Ltd, its people and every id below are invented. -->

<!-- Items that must be done before (or while) campaigns run, by owner. Updated by /sync with one line in the sync log. Statuses: open, blocked, done, n/a. Owners: Owner, Operator, Product team, Harness. Never a secret or personal data. -->

| id | item | owner | status | note | updated |
|---|---|---|---|---|---|
| 1 | Phone number verified on the ad account | Owner | done | required before any activation; already verified at setup (Ads Manager error #3858013 otherwise) | 2026-10-26 |
| 2 | Domain verified | Owner | open | acmefitness.example in Business Settings → Brand safety → Domains; gates the corporate campaign per the Owner's decision rule | 2026-10-26 |
| 3 | Developer app (Business type) + System User token in `.env` | Owner | open | System User `acme-uploader`; names only, the value never reaches chat | 2026-10-26 |
| 4 | Leads Center access for whoever answers leads | Owner | open | form `500000000000001`, lead delivery Leads Center (no webhook); the Owner opens Leads Center once and confirms the notification reaches the Operator before the first lead-form ad runs | 2026-10-26 |
| 5 | Compliance pass on the first copy batch | Harness | done | `plans/2026-10-26-first-flight-plan.md` §copy, all PASS | 2026-10-27 |
| 6 | Build members and corporate campaigns PAUSED on the Owner's numbered picks | Harness | done | campaigns `600000000000001`, `600000000000002`; five ads | 2026-10-27 |
| 7 | Budget for both campaigns (daily and cap) | Owner | open | Needs the Owner's go; stated in GBP before activation | 2026-10-27 |

## Sync log

<!-- One dated line per /sync: YYYY-MM-DD HH:MM: what changed (items moved, ids touched). -->
- 2026-10-26 14:10: `/setup` done; item 1 recorded done (phone already verified), items 2–4 opened; nothing built.
- 2026-10-27 17:20: items 5 and 6 done (build session); item 7 opened; both campaigns PAUSED, verified by the 17:10 live read-back.
