# Go checklist

<!-- Items that must be done before (or while) campaigns run, by owner. Updated by /sync with one line in the sync log. Statuses: open, blocked, done, n/a. Owners: Owner, Operator, Product team, Harness. Never a secret or personal data. -->

| id | item | owner | status | note | updated |
|---|---|---|---|---|---|
| 1 | Page | Owner | done | 108204445697760 "Habait - Home is Habait"; duplicate 720136941422640 never used | 2026-10-29 |
| 2 | Business portfolio | Owner | done | 809438743967672 "הבית של כל הבתים"; unverified | 2026-10-29 |
| 3 | Ad account owned by the portfolio | Owner | done | 1010578430110331 owned by 486542035414450, shared into 809438743967672; shared with another team (decision 2026-10-29) | 2026-10-29 |
| 4 | Payment method on the ad account | Owner | done | live read: has_payment_method true | 2026-10-29 |
| 5 | Phone number verified on the ad account (required before any activation) | Owner | done | the Owner's word; no API read | 2026-10-29 |
| 6 | MCP login (`meta-ads`) | Owner | done | grant also shows 1028189403616245: narrow it at the next re-login (/mcp → meta-ads → re-authenticate, tick only this business) | 2026-10-29 |
| 7 | Pixel / dataset created and installed (or "no website") | Owner | n/a | no website | 2026-10-29 |
| 8 | Developer app (Business type) + System User token in `.env` | Owner | done | app "Habait" 29427574316847178 + habait-uploder; meta-upload and meta-graph checks ok | 2026-10-29 |
| 9 | WhatsApp Business number linked to the Page | Owner | done | "Habait main" (WhatsApp Business App account 916666450823323); linked per the Owner | 2026-10-29 |
| 10 | Lead Ads terms accepted on the Page | Owner | done | live read: leadgen_tos_accepted true | 2026-10-29 |
| 11 | Leads Center access for whoever answers leads | Owner | n/a | first funnel is click-to-WhatsApp | 2026-10-29 |
| 12 | Domain verified | Owner | n/a | no website | 2026-10-29 |
| 13 | Instagram linked for ads (optional) | Owner | open | habait.ai is in the portfolio but not linked to the ad account | 2026-10-29 |
| 14 | People and roles: the Operator has Manage campaigns on the ad account | Owner | n/a | the Owner operates | 2026-10-29 |
| 15 | Two-factor authentication on the Owner's Facebook profile | Owner | open | Accounts Center → Two-factor authentication → Get started (codes are the Owner's) | 2026-10-29 |
| 16 | Confirm "ללא עמלת תיווך" may be used in ads, with a source | Owner | open | config/claims.md "needs clearance"; ask a lawyer | 2026-10-29 |
| 17 | Confirm brand colours (#041F6E, #FFFFFF) and font (Heebo); supply the logo files | Owner | open | read from the Page logo, not confirmed | 2026-10-29 |
| 18 | Say which past ads in the account are Habait's (vs the other team's) | Owner | open | before any past creative is reused | 2026-10-29 |
| 19 | Control room installed (optional) | Owner | open | install line from control-room/README.md | 2026-10-29 |

<!-- Example rows (copy above the comment and edit):
| 1 | Verify a phone number on the ad account (required before any activation) | Owner | open | Ads Manager error #3858013 until done | YYYY-MM-DD |
| 2 | Add a payment method to the ad account (required before any ad can run) | Owner | open | the account shows no payment method yet | YYYY-MM-DD |
| 3 | Leads Center notifications reach <role> | Owner | open | confirmed once in Leads Center before the first lead ad runs; <role> is the replies row in config/operator.md | YYYY-MM-DD |
| 4 | Compliance pass on the first copy batch | Harness | done | plans/YYYY-MM-DD-copy-first-flight.md, all PASS | YYYY-MM-DD |
-->

## Sync log

<!-- One dated line per /sync: YYYY-MM-DD HH:MM: what changed (items moved, ids touched). -->
- 2026-10-29 20:12 Asia/Jerusalem: /setup + /onboard done; rows 1–19 written (keys green; account 1010578430110331 shared, own campaigns only); nothing live, ₪0 of the ₪40 daily cap; open for the Owner: #6 narrow login, #13 Instagram, #15 2FA, #16 fee claim, #17 brand, #18 past ads, #19 control room; next: /morning, then the first flight's copy and creative.
