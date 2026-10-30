---
name: google-ads-build
description: "Build or change the company's Google Ads campaigns through creatives/tools/google-ads.mjs on the Google Ads API, the whole API reachable (recipes for the common jobs, a Performance Max recipe, any mutate operation, any service method, new recipes as JSON files) under the same money guards: Search campaigns built PAUSED from a spec file (budget, bidding, places, languages, ad groups, keywords and negatives, responsive search ads, sitelinks and callouts), checked locally and by Google (validateOnly) before the atomic create, read back, and recorded; pausing; the go-gated enable and budget steps with their go-log row; conversion actions and the Google tag request; the reads for reports. Performance Max through its recipe and Demand Gen through mutate (validated first; not yet run on a live account). Use when a plan's platform is Google, when asked to create, edit, pause or turn on a Google campaign, or for Google numbers."
---

# Google Ads build

**Read first.** Read `memory/maps/build.md` ("Every Google platform behaviour" and every `memory/learnings/google-platform/` note it lists) before any create, update or enable; the rules below summarise them, and the notes win. Then `memory/state/current.md`, the campaign note in `memory/campaigns/` and the plan for the work at hand. The tool guide is `docs/google-ads.md`; the Owner's console steps are `docs/google-setup-guide.md`.

**Output:** PAUSED campaigns in the company's Google Ads account; every resource name in the plan file (`plans/`), the campaign note (`platform: google`) and the campaigns table of `memory/state/current.md`; the tool's ledger in `creatives/uploads/<date>-google-ads.json` and its record of what this folder created in `memory/state/known-objects-google.json`. **Language:** files in English; ad copy in the ad's language as written in the plan; chat in the chat language of `config/operator.md`.

## Account constants (read, never hard-code)
From `config/accounts.md`, the Google Ads table: `google_ads_customer_id` (the tool refuses to run when `.env` names another account), `google_ads_manager_id`, `google_api_access_level`, `google_currency`, `google_time_zone`, `google_conversion_actions`. From `config/product.md`: the destination pages (a final URL outside that table is refused). From `config/goals.md`: the caps for all ads together and the **Google share** (`## Platform share`). From `config/claims.md` and `config/brand.md`: the forbidden words, the claims, the languages and their direction. From `config/operator.md`: the platforms, the timezone and the exact phrasing of a go.

**Gate before any build:** `timeout 60 node creatives/tools/google-ads.mjs check` is green (the login works, the account is the configured one, status ENABLED, not a manager). When it prints the Test-access line, builds and reads reach test accounts only: say so and stop; the fix is `/connect` chapter G (Explorer).

## Non-negotiables
1. **Money gate.** Never `enable` a campaign, raise a budget or extend an end date without an explicit go from the Owner in the same message (phrased as in `config/operator.md`). The spend statement first: the Google daily budget, that Google may spend up to twice it on one day and keeps the month within 30.4 times it, the worst week (7 × daily, a double day included), and which cap of `config/goals.md` and which Google share it stays under. `enable` and a budget raise run in the main session only, with the Owner's words quoted exactly in `--go`; the tool writes the go-log row. `media-buyer` never enables or raises.
2. **Everything PAUSED.** `build` forces the campaign PAUSED and refuses a status in the spec. Ad groups and ads are created ENABLED inside it, so the one `enable` of the campaign is the single switch; a PAUSED campaign serves nothing (the learning note).
3. **Google checks first.** Every build goes `--dry-run` (the batch printed, no network) → `--validate` (Google's `validateOnly` on the whole batch) → the real build, which validates again and then creates everything in one atomic batch. A rejected batch leaves nothing half made; the error names the field path.
4. **EU political advertising** is declared on every campaign (`DOES_NOT_CONTAIN…` unless the spec says `eu_political_ads: true`). An old undeclared campaign in the account blocks every change: the Owner answers the question in that campaign's settings.
5. **Compliance gate.** Copy has passed `compliance-check` (Google Ads policies: editorial, destination, trademarks, restricted and sensitive categories per market, plus `config/claims.md`). None of the forbidden words or claims; no consent or notice wording of our own.
6. **Caps and the Google share.** The tool refuses a daily budget above half the Google share of the daily cap (the double day). The sum of the Google daily budgets of everything enabled plus the proposal stays under the Google share; Meta's live budgets plus Google's stay under the cap for all ads together. When `config/goals.md` has no share yet, the spend statement says "no Google share set" and recommends `/campaign` round (i) before the go.
7. **Copy is immutable in practice.** A changed headline or description is a new responsive search ad (a `build` of the ad group's new ad, or the Google Ads interface) and `pause` on the old one; record the old resource name and strings in the plan first.
8. **One account per folder.** Only `GOOGLE_ADS_CUSTOMER_ID` of `.env`, equal to `config/accounts.md`; no option takes another. `enable`, `budget` and `pause` act only on resources of that account, and `enable` / `budget` only on resources this folder created (the ledger) or names in its notes. A refusal is not a bug to work around.
9. **Secrets.** The sign-in is the service account's key (`.secrets/google-ads-key.json`, its path in `.env` as `GOOGLE_ADS_JSON_KEY_FILE`), or, as the fallback, the client secret and the refresh token in `.env`: names only, never opened; the tools print character counts at most. An `invalid_grant` means a new key (`google-cloud-setup.mjs run --project <id>`), or `google-ads.mjs login` again with the fallback (the Owner clicks Allow).

## The spec (`plans/<date>-google-<flight>.json`, referenced from the plan)
```json
{
  "type": "SEARCH",
  "campaign": {
    "name": "2026-11-SEARCH-IL_Owners_HE-Leads_A",
    "daily_budget": 60,
    "bidding": "MAXIMIZE_CLICKS",
    "max_cpc": 6,
    "start_date": "2026-11-03",
    "end_date": "2026-11-30",
    "search_partners": false,
    "final_url_suffix": "utm_source=google&utm_medium=cpc&utm_campaign=il-search-a&ref=g-search-a",
    "eu_political_ads": false
  },
  "locations": [2376],
  "location_presence": "PRESENCE",
  "languages": [1027],
  "negative_keywords": [{ "text": "jobs", "match": "BROAD" }, { "text": "free", "match": "BROAD" }],
  "ad_groups": [{
    "name": "Core intent",
    "keywords": [{ "text": "<the service> near me", "match": "PHRASE" }, { "text": "<the service>", "match": "EXACT" }],
    "ads": [{
      "headlines": [{ "text": "<headline 1, at most 30>", "pin": "HEADLINE_1" }, "<headline 2>", "<headline 3>"],
      "descriptions": ["<description 1, at most 90>", "<description 2>"],
      "final_url": "<a destination URL of config/product.md, exactly>",
      "path1": "<at most 15>"
    }]
  }],
  "sitelinks": [{ "text": "<at most 25>", "url": "<a page of the site>", "description1": "<35>", "description2": "<35>" }],
  "callouts": ["<at most 25>"]
}
```
- **Ids:** places from `google-ads.mjs geo-search --q "<place>" --country XX`, languages from `language-ids --q <name>` (a Search campaign in Hebrew targets the Hebrew language id and the users' places, never "everyone").
- **Bidding:** `MAXIMIZE_CONVERSIONS` (optional `target_cpa`) only when a conversion action records the funnel's result (`conversions list`; check row 30); otherwise `MAXIMIZE_CLICKS` with a `max_cpc` ceiling for the first one to two weeks, then the switch is a recommendation labelled "Needs the Owner's go". `MANUAL_CPC` needs `max_cpc` (the ad groups' default bid).
- **Keywords:** one theme per ad group, 5 to 20 keywords, PHRASE and EXACT to start (BROAD only with conversion bidding and enough data), the negatives of the category (jobs, free, courses, DIY, competitor names unless the plan says otherwise). Keyword ideas and volumes come from the Owner's Keyword Planner in the Google Ads interface (Tools → Keyword Planner) until the project has Basic access: Explorer has no planning services.
- **Copy:** at least 8 to 10 distinct headlines (the limits are in the learning note; the tool refuses a breach), the promise and the call to action of the destination page, a headline with the brand, pins only where `config/claims.md` requires a fixed line.
- **Tracking:** `ref` and `utm_*` from `config/accounts.md` go in `final_url_suffix`, never inside the final URL.

## Standard build sequence
1. Read the state, the plan and the copy; `check` green; the ids looked up; the spec written next to the plan; `compliance-check` PASS on every string.
2. `timeout 60 node creatives/tools/google-ads.mjs build --spec <file> --dry-run`: read the batch (campaign PAUSED, the budget in the account currency, the places and languages, every ad).
3. `timeout 120 node creatives/tools/google-ads.mjs build --spec <file> --validate`: Google accepts the batch, or the error names the field path (fix the spec, never the tool).
4. `timeout 120 node creatives/tools/google-ads.mjs build --spec <file>`: the resource names printed and ledgered, the campaign read back PAUSED (a read-back that is not PAUSED is paused at once with `pause` and reported).
5. `timeout 120 node creatives/tools/google-ads.mjs report --level ad --range TODAY`: every ad listed with its approval status (Google reviews within about a business day; `UNDER_REVIEW` is normal).
6. **Show it:** Google has no preview image API for search ads. List each ad by its number with its headlines and descriptions as built, its approval status from step 5, and the final URL; the Owner sees Google's own preview in Google Ads → Ads → the ad's preview (or Tools → Ad preview and diagnosis).
7. **Record** every resource name the same turn: the plan, the campaign note (from `memory/templates/campaign.md`, `platform: google`, `## Current state` with the time of the read, a `## Log` line), the campaigns table of `memory/state/current.md` (platform column), today's session note, `checklist.md` when a gate moved. When this runs inside `media-buyer`, the agent writes the plan file and its handoff; the main session writes the notes (one writer).

## Conversions and the Google tag
`conversions list` shows what exists. A new website conversion: `conversions create --spec <file>` (`{"name": "Lead form sent", "category": "SUBMIT_LEAD_FORM"}`; `--dry-run` first), then `conversions list --tags --out plans/<date>-request-google-tag.md` writes the global site tag and the event snippet into a request labelled "Needs product team" (or "Needs Owner"); the harness never installs a tag or writes consent wording. Consent gating follows `config/accounts.md`, as for the Meta pixel. A click-to-call or form-only funnel without a website has no web conversion: say so and bid on clicks.

## Turning it on (the go)
The spend statement (rule 1) → the Owner's go in the same message → `timeout 120 node creatives/tools/google-ads.mjs enable --resource customers/<id>/campaigns/<id> --go "<the Owner's words, exactly>" [--channel chat|"WhatsApp quoted"|"email quoted"]` → the tool reads it back and appends the go-log row → `report --level ad --range TODAY` for approvals → the campaign note, `memory/state/current.md`, the session note. The account needs billing and, when Google asks, advertiser verification (console rows); an ad that is "Eligible (limited)" or disapproved is reported with Google's reason and the fix.

## Changing a running campaign
- **Pause:** `pause --resource <campaign | ad group | ad>` is always allowed (the Owner asks, or a breakage); record it.
- **Budget:** `budget --resource customers/<id>/campaignBudgets/<id> --amount <n> --go "<words>"`: at most +20 % a step, 48 to 72 hours apart, under the Google share; a cut needs no go.
- **Keywords and negatives:** search terms (`report --level search_term`) weekly; new negatives and keywords are proposed in the round, built in the Google Ads interface by the Owner or as a new ad group through `build` in the next release.

## Reads that mislead
- `LAST_7_DAYS` and the other ranges exclude today; use `TODAY` for a campaign that started today.
- Conversions arrive late (hours to days) and are counted on the click date: last week's cost per conversion still falls.
- The search terms report hides low-volume terms (privacy thresholds): a short list is not the whole traffic.
- Money in reports is converted from micros by the tool; the account currency is `google_currency`.

## Everything else: the full API (mutate, service, recipes)
Anything the Google Ads API can do is reachable, with the same money rules:
- **`recipe list` / `recipe show <name>` / `recipe run <name> --set NAME=value …`**: the ready-made specs in `creatives/tools/google-ads-recipes/`. They cover:
  - keywords: add, pause, a negative, a shared negative list;
  - a new ad group or responsive search ad in an existing campaign;
  - places: add, exclude, a radius;
  - an ad schedule and a device bid adjustment;
  - the target CPA;
  - call, structured snippet, sitelink and callout assets;
  - a **Performance Max** campaign (PAUSED, the minimum asset set, images with `--set NAME=@file`);
  - keyword ideas (needs Basic access) and an offline conversion upload.
- **`mutate --spec <file.json>`**: any list of `googleAds:mutate` operations, so every resource of the API. That covers Demand Gen, Display, Video, Shopping, audiences and customer lists, labels, experiments, conversion value rules, bid strategies, shared budgets and any field of any campaign. Write the operations from Google's reference (developers.google.com/google-ads/api/reference/rpc, the resource's page: camelCase JSON, temporary negative ids to link a batch), then `--dry-run`, then `--validate`, then the run.
- **`service --path customers/{customer}:<method> [--body <file.json>]`**: any other method (recommendations, reach and keyword forecasts, conversion uploads, experiments). Reads and forecasts (`:search`, `:generate…`, `:suggest`, `:list…`, `:get…`) run freely; anything else needs `--go`.
- **A new recipe** is a JSON file in that folder (format in its `README.md`), no code. When a job repeats, save it as a recipe; mark it "not yet run on a live account" in its `notes` until it has.
- **The guards hold for all three**, in the tool:
  - the .env account only;
  - an existing resource must be known to this folder (created here, or named in a note or the plan; read it and record it first);
  - every campaign is created PAUSED and declared for EU political advertising;
  - these need the Owner's words in `--go` and get a go-log row: an `ENABLED` status, a removal, an end-date change, a budget raise (at most +20 % and half the Google share), a new ad group, ad or asset group ENABLED in a live campaign, and a service write;
  - Google's `validateOnly` runs before every mutate.

## Performance Max and Demand Gen (the next release)
Planned in the same plan file (asset groups: 3–15 headlines of 30, long headlines of 90, descriptions, images in 1.91:1, 1:1 and 4:5, logos, a YouTube video or none; audience signals; a Merchant Center feed for a shop), compliance-checked and costed. **Performance Max** is built today with the recipe `performance-max-campaign` (then more assets and audience signals with `mutate`), `--validate` first: it has not run on a live account yet. **Demand Gen** goes through `mutate` from Google's reference. The named `build --spec` subcommand stays Search only. If a batch keeps failing validation, the Owner builds it PAUSED in the Google Ads interface from the plan, and the harness reads, reports and pauses it like any other campaign (record the resource names from `report --level campaign`).
