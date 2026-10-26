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
| `lead_delivery` | Leads Center (default); new-lead notifications to Sam Park (fictional), who answers leads within one working day |
| `catalog_id` | none (no catalog ads) |
| `product_feed_ids` | none |
| `product_set_ids` | none |
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

## Lead webhook (advanced, optional)

| Field | Value |
|---|---|
| `lead_webhook_url` | none: leads are read in Leads Center |
| Status | not built; corporate leads are read in Leads Center (the Owner can also download them as CSV from the forms library) |

## MCP servers and logins

The MCP servers are declared in the repository's `.mcp.json` (project scope): opening the folder in Claude Code asks to approve them, and each one is logged in once with `/mcp` → the server → log in. The table names whose login each one holds.

| Server | Registered name | Login held by |
|---|---|---|
| Meta Ads MCP | `meta-ads` | Jordan Lee (fictional), Owner |
| fal MCP (optional) | `fal` | not connected |
| Vercel CLI (optional) | n/a | not used |
| HyperFrames plugin (optional, video) | `hyperframes` | not installed |
| System User for uploads | `acme-uploader` (not created yet) | Jordan Lee (fictional), Owner |

## Console steps (the Owner's clicks)

| Step | Status | Date | Note |
|---|---|---|---|
| Business portfolio | done | 2026-10-26 | |
| Page | done | 2026-10-26 | |
| Ad account owned by the portfolio | done | 2026-10-26 | payment method present |
| Payment method on the ad account | done | 2026-10-26 | present |
| Phone number verified on the ad account | done | 2026-10-26 | required before any activation |
| MCP login (`meta-ads`) | done | 2026-10-26 | |
| Pixel / dataset created and installed (or "no website") | done | 2026-10-26 | `400000000000001` on acmefitness.example, loads after cookie consent |
| Developer app (Business type) + System User token in `.env` | open | 2026-10-26 | `acme-uploader` not created yet; checked with `meta-upload.mjs --check` |
| WhatsApp Business number linked to the Page | n/a | 2026-10-26 | no click-to-WhatsApp funnel |
| Lead Ads terms accepted on the Page | done | 2026-10-26 | only for instant-form ads |
| Leads Center access for whoever answers leads | open | 2026-10-26 | Sam Park (fictional); the Owner confirms the notifications reach Sam before the first corporate lead ad runs |
| Domain verified | open | 2026-10-26 | `acmefitness.example` |
| Instagram linked for ads (optional) | n/a | 2026-10-26 | not linked for ads |
| Lead webhook subscription (advanced, only with a product team) | n/a | 2026-10-26 | no webhook; leads are read in Leads Center |
