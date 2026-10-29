<!-- Written by /setup on {{DATE}}. Edit by hand or re-run /setup. -->

# Accounts and connections

Ids are public identifiers, not secrets. Secrets (tokens, API keys) never go here: names only. `/setup` fills these from a live read; if a later live read disagrees, the live read wins and this file is corrected.

## Meta

| Field | Value |
|---|---|
| `meta_ad_account_id` | {{META_AD_ACCOUNT_ID}} |
| `business_portfolio_id` | {{BUSINESS_PORTFOLIO_ID}} |
| `page_id` | {{PAGE_ID}} |
| `page_duplicates_to_avoid` | {{PAGE_DUPLICATES}} |
| `instagram_account_id` | {{INSTAGRAM_ACCOUNT_ID}} |
| `pixel_id` (dataset) | {{PIXEL_ID}} |
| `lead_form_ids` | {{LEAD_FORM_IDS}} |
| `lead_delivery` | {{LEAD_DELIVERY}} |
| `catalog_id` | {{CATALOG_ID}} |
| `product_feed_ids` | {{PRODUCT_FEED_IDS}} |
| `product_set_ids` | {{PRODUCT_SET_IDS}} |
| `whatsapp_number_names` | {{WHATSAPP_NUMBER_NAMES}} |
| `currency` | {{CURRENCY}} |
| `min_daily_budget` | {{MIN_DAILY_BUDGET}} |
<!-- setup: meta_ad_account_id = digits only, no act_ prefix (the same value goes in .env as META_AD_ACCOUNT_ID); page duplicates = other Pages the login sees that must never be used; instagram = "not linked for ads" is a valid value; pixel_id = "none (no website)" is a valid value when every funnel is click-to-WhatsApp or an instant form; lead_form_ids = id and name per form, from Business Suite's forms library; lead_delivery = how instant-form leads reach the person who answers them: Leads Center (default) / email notifications / CSV download / CRM: <name> / webhook (advanced; URL below), or "n/a (no instant forms)"; catalog_id, product_feed_ids, product_set_ids = "none" unless the company runs catalog ads; whatsapp_number_names = a label per number (never the number itself in a shared file if the Owner prefers); currency = the account currency (ISO code); min_daily_budget = as the account reports it, in the minor unit and the major unit -->

## Google Ads

Only when Google is one of the platforms in `config/operator.md`; otherwise every value below is "n/a (Meta only)". Secrets (the OAuth client secret, the refresh token) never go here: they are names in `.env`, written by `env-set.mjs` and `google-ads.mjs login`.

| Field | Value |
|---|---|
| `google_ads_customer_id` | {{GOOGLE_ADS_CUSTOMER_ID}} |
| `google_ads_manager_id` | {{GOOGLE_ADS_MANAGER_ID}} |
| `google_cloud_project_id` | {{GOOGLE_CLOUD_PROJECT_ID}} |
| `google_api_access_level` | {{GOOGLE_API_ACCESS_LEVEL}} |
| `google_currency` | {{GOOGLE_CURRENCY}} |
| `google_time_zone` | {{GOOGLE_TIME_ZONE}} |
| `google_conversion_actions` | {{GOOGLE_CONVERSION_ACTIONS}} |
| `google_merchant_center_id` | {{GOOGLE_MERCHANT_CENTER_ID}} |
| `google_login_holder` | {{GOOGLE_LOGIN_HOLDER}} |
<!-- setup: google_ads_customer_id = 10 digits as Google Ads shows it (123-456-7890; the same value goes in .env as GOOGLE_ADS_CUSTOMER_ID), the company's own account, never a manager; google_ads_manager_id = the manager account (MCC) the login reaches it through, or "none"; google_cloud_project_id = the company's own Cloud project that owns the OAuth client; google_api_access_level = Test / Explorer / Basic / Standard, as the Cloud Console's Google Ads API overview shows it (Test reaches test accounts only); google_currency and google_time_zone = from google-ads.mjs check; google_conversion_actions = id and name per conversion action, or "none yet"; google_merchant_center_id = "none" unless the company runs Performance Max for a shop; google_login_holder = the Google user who clicked Allow in google-ads.mjs login -->

## Analytics and attribution

| Field | Value |
|---|---|
| `ga_measurement_id` | {{GA_MEASUREMENT_ID}} |
| Pixel events (event → page → consent) | {{PIXEL_EVENTS}} |
| `ref` parameter | {{REF_PARAMETER}} |
| `utm_*` parameters | {{UTM_PARAMETERS}} |
| What reaches the database | {{ATTRIBUTION_IN_DATABASE}} |
| Conversions API | {{CONVERSIONS_API}} |
<!-- setup: pixel events = which event fires on which page and under which consent (e.g. PageView after cookie consent); ref = its allowed format and the table/field it lands in; utm = analytics only or stored; "none" and "not verified" are valid values -->

## Lead webhook (advanced, optional)

| Field | Value |
|---|---|
| `lead_webhook_url` | {{LEAD_WEBHOOK_URL}} |
| Status | {{LEAD_WEBHOOK_STATUS}} |
<!-- setup: lead_webhook_url defaults to "none: leads are read in Leads Center"; a URL only when config/product-team.md names a product team that runs an endpoint for Meta's leadgen webhook; Status = not built / live and idle / live, and note any alerting that is off -->

## MCP servers and logins

The MCP servers are declared in the repository's `.mcp.json` (project scope): opening the folder in Claude Code asks to approve them, and each one is logged in once with `/mcp` → the server → log in. The table names whose login each one holds.

| Server | Registered name | Login held by |
|---|---|---|
| Meta Ads MCP | `meta-ads` | {{META_LOGIN_HOLDER}} |
| fal MCP (optional) | `fal` | {{FAL_LOGIN_HOLDER}} |
| Google Ads tool (only with Google) | n/a (`creatives/tools/google-ads.mjs`, the login in `.env`) | {{GOOGLE_LOGIN_HOLDER}} |
| Vercel CLI (optional) | n/a | {{VERCEL_LOGIN_HOLDER}} |
| HyperFrames plugin (optional, video) | `hyperframes` | {{HYPERFRAMES_PLUGIN}} |
| System User for uploads | {{SYSTEM_USER_NAME}} | {{SYSTEM_USER_OWNER}} |
<!-- setup: names only, never a token or password; "not connected" is a valid value; the HyperFrames plugin has no login: write "installed" or "not installed" -->

## Console steps (the Owner's clicks)

| Step | Status | Date | Note |
|---|---|---|---|
| Business portfolio | {{STATUS}} | {{DATE}} | |
| Page | {{STATUS}} | {{DATE}} | |
| Ad account owned by the portfolio | {{STATUS}} | {{DATE}} | |
| Payment method on the ad account | {{STATUS}} | {{DATE}} | required before any ad can run |
| Phone number verified on the ad account | {{STATUS}} | {{DATE}} | required before any activation (Ads Manager error #3858013) |
| MCP login (`meta-ads`) | {{STATUS}} | {{DATE}} | |
| Pixel / dataset created and installed (or "no website") | {{STATUS}} | {{DATE}} | `pixel_id` above; "no website" is valid for click-to-WhatsApp and instant-form funnels |
| Developer app (Business type) + System User token in `.env` | {{STATUS}} | {{DATE}} | checked with `meta-upload.mjs --check` |
| WhatsApp Business number linked to the Page | {{STATUS}} | {{DATE}} | only for click-to-WhatsApp |
| Lead Ads terms accepted on the Page | {{STATUS}} | {{DATE}} | only for instant-form ads |
| Leads Center access for whoever answers leads | {{STATUS}} | {{DATE}} | only for instant-form ads; the person under replies in `config/operator.md`; notifications confirmed before the first lead ad runs |
| Domain verified | {{STATUS}} | {{DATE}} | the website's domain in Business Settings; n/a with no website |
| Instagram linked for ads (optional) | {{STATUS}} | {{DATE}} | |
| Lead webhook subscription (advanced, only with a product team) | {{STATUS}} | {{DATE}} | developer app with Webhooks (`leadgen`) + a Page token, every running form id registered; n/a while `lead_webhook_url` is none |
| Google Ads account (only with Google) | {{STATUS}} | {{DATE}} | the company's own account, made in Expert mode without a first campaign; n/a when the platforms in `config/operator.md` leave Google out |
| Billing on the Google Ads account | {{STATUS}} | {{DATE}} | required before any Google ad can run |
| Advertiser verification on Google Ads | {{STATUS}} | {{DATE}} | Google asks for it within days of the first ad; the identity documents are the Owner's |
| Cloud project with the Google Ads API enabled | {{STATUS}} | {{DATE}} | the company's own project; `google_cloud_project_id` above |
| OAuth consent screen and Desktop client | {{STATUS}} | {{DATE}} | External, published (in production), the adwords scope; the client id and secret moved into `.env` by `env-set.mjs` |
| Google Ads API access level Explorer | {{STATUS}} | {{DATE}} | applied for in the Cloud Console; Test reaches test accounts only |
| Google login (refresh token in `.env`) | {{STATUS}} | {{DATE}} | `google-ads.mjs login`, the Owner clicks Allow; checked with `google-ads.mjs check` |
| Google conversion action and Google tag | {{STATUS}} | {{DATE}} | `google-ads.mjs conversions create`; the tag on the site is a request to the product team (or the Owner) |
<!-- setup: status is done / open / n/a / unknown; every row also goes into checklist.md (status open, done or n/a) with owner "Owner" unless named -->
