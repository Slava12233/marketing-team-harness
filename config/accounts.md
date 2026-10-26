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
| `whatsapp_number_names` | {{WHATSAPP_NUMBER_NAMES}} |
| `currency` | {{CURRENCY}} |
| `min_daily_budget` | {{MIN_DAILY_BUDGET}} |
<!-- setup: meta_ad_account_id = digits only, no act_ prefix (the same value goes in .env as META_AD_ACCOUNT_ID); page duplicates = other Pages the login sees that must never be used; instagram = "not linked for ads" is a valid value; lead_form_ids = id and name per form, from Business Suite's forms library; whatsapp_number_names = a label per number (never the number itself in a shared file if the Owner prefers); currency = the account currency (ISO code); min_daily_budget = as the account reports it, in the minor unit and the major unit -->

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

## Lead webhook

| Field | Value |
|---|---|
| `lead_webhook_url` | {{LEAD_WEBHOOK_URL}} |
| Status | {{LEAD_WEBHOOK_STATUS}} |
<!-- setup: the URL Meta's leadgen webhook posts to, and its state (live and idle / live / not built); note any alerting that is off -->

## MCP servers and logins

| Server | Registered name | Login held by |
|---|---|---|
| Meta Ads MCP | `meta-ads` | {{META_LOGIN_HOLDER}} |
| fal MCP (optional) | `fal` | {{FAL_LOGIN_HOLDER}} |
| Vercel CLI (optional) | n/a | {{VERCEL_LOGIN_HOLDER}} |
| System User for uploads | {{SYSTEM_USER_NAME}} | {{SYSTEM_USER_OWNER}} |
<!-- setup: names only, never a token or password; "not connected" is a valid value -->

## Console steps (the Owner's clicks)

| Step | Status | Date | Note |
|---|---|---|---|
| Page | {{STATUS}} | {{DATE}} | |
| Business portfolio | {{STATUS}} | {{DATE}} | |
| Ad account owned by the portfolio | {{STATUS}} | {{DATE}} | |
| Lead Ads terms accepted on the Page | {{STATUS}} | {{DATE}} | only for instant-form ads |
| Domain verification | {{STATUS}} | {{DATE}} | |
| Developer app + Webhooks (`leadgen`) + Page token | {{STATUS}} | {{DATE}} | every running form id registered with the webhook |
| Phone verification on the ad account | {{STATUS}} | {{DATE}} | required before any activation |
| System User token in `.env` | {{STATUS}} | {{DATE}} | checked with `meta-upload.mjs --check` |
| MCP login (`meta-ads`) | {{STATUS}} | {{DATE}} | |
<!-- setup: status is done / open / n/a / unknown; the open ones also go into checklist.md with owner "Owner" -->
