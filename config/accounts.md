<!-- Written by /setup on 2026-10-29. Edit by hand or re-run /setup. -->

# Accounts and connections

Ids are public identifiers, not secrets. Secrets (tokens, API keys) never go here: names only. `/setup` fills these from a live read; if a later live read disagrees, the live read wins and this file is corrected.

## Meta

| Field | Value |
|---|---|
| `meta_ad_account_id` | 1010578430110331 |
| `business_portfolio_id` | 809438743967672 ("הבית של כל הבתים", the company portfolio, where the System User lives; the ad account itself is owned by portfolio 486542035414450 "גליה זיו" and shared into it) |
| `page_id` | 108204445697760 ("Habait - Home is Habait", owned by portfolio 809438743967672; Lead Ads terms accepted per ads_get_ad_account_pages 2026-10-29) |
| `page_duplicates_to_avoid` | 720136941422640 ("Habait - Home is Habait", same name, promoted under the ad account, Lead Ads terms not accepted; never use) |
| `instagram_account_id` | none linked (ads_get_ig_accounts 2026-10-29 returned none) |
| `pixel_id` (dataset) | none (no website) |
| `lead_form_ids` | 51 forms already on Page 108204445697760 (meta-graph lead-forms list, 2026-10-29); the flight's form is chosen in /setup |
| `lead_delivery` | n/a (no instant forms: the first funnel is click-to-WhatsApp; chats arrive in the WhatsApp Business app "Habait main", answered by the Owner) |
| `catalog_id` | none |
| `product_feed_ids` | none |
| `product_set_ids` | none |
| `whatsapp_number_names` | Habait main (WhatsApp Business App account "הבית" 916666450823323, owned by portfolio 809438743967672; linked to the Page per the Owner, 2026-10-29) |
| `currency` | ILS |
| `min_daily_budget` | 314 (minor unit) = 3.14 ILS; live read 2026-10-29, ads_get_ad_accounts |

## Analytics and attribution

| Field | Value |
|---|---|
| `ga_measurement_id` | none (no website) |
| Pixel events (event → page → consent) | none (no website; Meta counts WhatsApp conversations itself) |
| `ref` parameter | a short ref code per ad inside the pre-filled WhatsApp message (page_welcome_message), e.g. "#D1"; the Owner sees it in the first message of the chat |
| `utm_*` parameters | n/a (no website) |
| What reaches the database | none (no database; the ref code is read in the WhatsApp chat) |
| Conversions API | none |

## Lead webhook (advanced, optional)

| Field | Value |
|---|---|
| `lead_webhook_url` | none: leads arrive as WhatsApp chats in "Habait main" |
| Status | n/a |

## MCP servers and logins

The MCP servers are declared in the repository's `.mcp.json` (project scope): opening the folder in Claude Code asks to approve them, and each one is logged in once with `/mcp` → the server → log in. The table names whose login each one holds.

| Server | Registered name | Login held by |
|---|---|---|
| Meta Ads MCP | `meta-ads` | slava lebovkin (the Owner) |
| fal MCP (optional) | `fal` | the Owner (fal login live, status ready, 2026-10-29) |
| Vercel CLI (optional) | n/a | not used (no website) |
| HyperFrames plugin (optional, video) | `hyperframes` | installed (0.8.160, user scope; 2026-10-29) |
| System User for uploads | habait-uploder (id 61595878706083, Employee; assets: Page 108204445697760 full, ad account 1010578430110331 full, app "Habait" 29427574316847178 full; screen 2026-10-29) | the Owner (portfolio 809438743967672) |

## Console steps (the Owner's clicks)

| Step | Status | Date | Note |
|---|---|---|---|
| Business portfolio | done | 2026-10-29 | 809438743967672, Owner is admin; unverified (screen, 2026-10-29) |
| Page | done | 2026-10-29 | 108204445697760 (screen + ads_get_user_pages, 2026-10-29); duplicate 720136941422640 to avoid |
| Ad account owned by the portfolio | done | 2026-10-29 | 1010578430110331 owned by 486542035414450 and shared into 809438743967672 (screen + ads_get_ad_accounts, 2026-10-29) |
| Payment method on the ad account | done | 2026-10-29 | required before any ad can run |
| Phone number verified on the ad account | done | 2026-10-29 | required before any activation (Ads Manager error #3858013) |
| MCP login (`meta-ads`) | done | 2026-10-29 | |
| Pixel / dataset created and installed (or "no website") | n/a | 2026-10-29 | `pixel_id` above; "no website" is valid for click-to-WhatsApp and instant-form funnels |
| Developer app (Business type) + System User token in `.env` | done | 2026-10-29 | app "Habait" 29427574316847178 + system user habait-uploder (reused); meta-upload --check ok (adimages, advideos), meta-graph check ok (6 permissions), lead-forms list ok; checked with `meta-upload.mjs --check` |
| WhatsApp Business number linked to the Page | done | 2026-10-29 | only for click-to-WhatsApp |
| Lead Ads terms accepted on the Page | done | 2026-10-29 | only for instant-form ads |
| Leads Center access for whoever answers leads | n/a | 2026-10-29 | only for instant-form ads; the person under replies in `config/operator.md`; notifications confirmed before the first lead ad runs |
| Domain verified | n/a | 2026-10-29 | the website's domain in Business Settings; n/a with no website |
| Instagram linked for ads (optional) | open | 2026-10-29 | Instagram habait.ai is in portfolio 809438743967672 but not linked to the ad account (ads_get_ig_accounts returned none) |
| Lead webhook subscription (advanced, only with a product team) | n/a | 2026-10-29 | developer app with Webhooks (`leadgen`) + a Page token, every running form id registered; n/a while `lead_webhook_url` is none |
