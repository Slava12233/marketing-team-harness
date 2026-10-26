<!-- Written by /setup on 2026-10-26. Edit by hand or re-run /setup. -->
<!-- FICTIONAL EXAMPLE. Every id below is fake and will not resolve in Meta or Google. -->

# Accounts and connections

Ids are public identifiers, not secrets. Secrets (tokens, API keys) never go here: names only. `/setup` fills these from a live read; if a later live read disagrees, the live read wins and this file is corrected.

## Meta

| Field | Value |
|---|---|
| `meta_ad_account_id` | `100000000000001` |
| `business_portfolio_id` | `200000000000001` |
| `page_id` | `300000000000001` |
| `page_duplicates_to_avoid` | none |
| `instagram_account_id` | not linked for ads |
| `pixel_id` (dataset) | `400000000000001` |
| `lead_form_ids` | `500000000000001` (Corporate: "Book a 20-minute call") |
| `whatsapp_number_names` | none |
| `currency` | GBP |
| `min_daily_budget` | 100 (pence) = 1.00 GBP |

## Analytics and attribution

| Field | Value |
|---|---|
| `ga_measurement_id` | `G-EXAMPLE001` |
| Pixel events (event → page → consent) | `PageView` → /join and /corporate/call → after cookie consent; `StartTrial` → /join trial confirmation → after cookie consent; `Schedule` → /corporate/call booking confirmation → after cookie consent; `MemberLogin` → the members' area → after cookie consent |
| `ref` parameter | `?ref=<code>` (lower-case letters, digits, `-`, max 40 characters), stored with the trial sign-up and the call booking |
| `utm_*` parameters | analytics only (Google Analytics); not stored |
| What reaches the database | `ref` only |
| Conversions API | none |

## Lead webhook

| Field | Value |
|---|---|
| `lead_webhook_url` | none |
| Status | not built; corporate leads are downloaded by the Owner from the Page's forms library |

## MCP servers and logins

| Server | Registered name | Login held by |
|---|---|---|
| Meta Ads MCP | `meta-ads` | Jordan Lee (fictional), Owner |
| fal MCP (optional) | `fal` | not connected |
| Vercel CLI (optional) | n/a | not used |
| System User for uploads | `acme-uploader` (not created yet) | Jordan Lee (fictional), Owner |

## Console steps (the Owner's clicks)

| Step | Status | Date | Note |
|---|---|---|---|
| Page | done | 2026-10-26 | |
| Business portfolio | done | 2026-10-26 | |
| Ad account owned by the portfolio | done | 2026-10-26 | payment method present |
| Lead Ads terms accepted on the Page | done | 2026-10-26 | only for instant-form ads |
| Domain verification | open | 2026-10-26 | `acmefitness.example` |
| Developer app + Webhooks (`leadgen`) + Page token | n/a | 2026-10-26 | no webhook; leads downloaded manually |
| Phone verification on the ad account | done | 2026-10-26 | required before any activation |
| System User token in `.env` | open | 2026-10-26 | checked with `meta-upload.mjs --check` |
| MCP login (`meta-ads`) | done | 2026-10-26 | |
