---
name: audience-research
description: "Find, size and structure Meta audiences for the audiences defined in config/audiences.md, including special-ad-category limits, signals, the retargeting ladder (planned as custom audiences and lookalikes in a dated ladder plan) and geo order. Use when asked about targeting, audience size, who to reach, retargeting, lookalikes or expansion."
---

# Audience research for Meta

Output: `reports/<YYYY-MM-DD>-audiences-<topic>.md` or the audience section of the flight's plan (English); the chat summary is in the chat language from `config/operator.md`.

## The audiences
Read `config/audiences.md` and build this table from it, one row per audience (never from memory):

| Audience | Geo and language | Destination (from `config/product.md`) | Special ad category (from `config/audiences.md` / `config/claims.md`) |
|---|---|---|---|
| … | … | the URL that matches the language and funnel | NONE / HOUSING / CREDIT / EMPLOYMENT / ISSUES_ELECTIONS_POLITICS, with the reason |

Notes per row: where the EU applies, every ad and targeting spec is public (transparency rules); any hard block `config/claims.md` records for that market; any consent text still in draft for that language (confirm with the Owner before that arm goes live).

**Not audiences:** the excluded audiences listed in `config/audiences.md`, and never named individuals (people on any outreach or institution list are reached, if at all, by other channels, not by ads).

## What a special ad category removes
Age (locked to 18–65+), gender, postal-code targeting, detailed targeting on protected signals, and lookalike audiences (Special Ad Audiences, the former replacement, were retired; see the table in "The retargeting ladder, built"). Plan category audiences on geo, language and broad interests or Advantage+ expansion, and expect larger, less precise audiences.

## Advantage+ audience: what is a control
Under Advantage+ audience, **locations, languages, minimum age and excluded custom audiences are controls** (hard limits); interests, age maximum and the other detailed targeting are only suggestions. So a `locales` filter holds, while `age_max` does not. Read the ad set's audience panel in Ads Manager before trusting its spec, especially on conversation-optimised sets (for example click-to-WhatsApp), where Meta may apply Advantage+ detailed targeting automatically.

## Signals to look up (there is no targeting-search tool: use the Ads Manager editor)
1. **Size on an empty paused ad set.** Open an empty PAUSED ad set in the Ads Manager editor (in the Operator's or Owner's signed-in browser), audience section, detailed targeting search box; type the term; read the name, category and size from the dropdown. The sizes shown beside search suggestions are worldwide, not for your geo; the **"Estimated audience size"** card updates per edit and is the number to record.
2. Any edit in the editor is auto-saved as an unpublished draft ("Unpublished edits"); when you are done, discard that object's draft with the editor footer's "Discard draft" (one object), never the account-wide "Discard drafts" (that click is the Owner's). Escape opens a "Publish draft items?" dialog: click Close, never Publish.
3. To get an id: add the signal to a set through the UI, then read the set back with `ads_get_ad_entities` and copy the id. Record ids in the plan (`meta-campaign-build`).
4. Where the account stages drafts, never update `targeting` on a draft ad set through the MCP (the draft vanishes from the table); set targeting at creation and recreate to change it. Where the account creates real PAUSED objects, targeting edits are ordinary edits.
5. Location: set `location_types` to `["home","recent"]` explicitly (or omit for the default); `["home"]` alone is a removed option that the API accepts and the editor then flags as an error.

**Candidates to size:** derive them from `config/audiences.md` per audience: the category's interests (names vary by locale; check the UI in the audience's language), life events and behaviours that fit the pain, plus Advantage+ audience with these as suggestions (`targeting_as_signal` 3). For B2B audiences: job titles, employers (companies in the target industry), industry interests. For language or diaspora audiences: the language as a locale control and intent-based interests, **never** religion, origin or another personal attribute.

## Structure rules
- One cold ad set per language arm during a test; otherwise one consolidated cold ad set per audience. Do not fragment below the daily budget per ad set the Owner set in `memory/business/goals.md` and `memory/decisions/` (as a rule of thumb, an ad set needs about 50 results a week to leave learning).
- Advantage+ audience ON with signals as suggestions (where the special ad category allows); hard caps only when the Owner asks.
- **Retargeting ladder** once traffic exists: site visitors 30 days (consented pixel traffic only, so the pool is a fraction of visitors), 90-day visitors, video viewers 25%+. Budget 10–20% of cold spend. A different message per rung (the film → the product's steps → the date or the offer). Built from a plan, rung by rung: "The retargeting ladder, built" below.
- **Custom audiences from any sign-up, lead or customer list: not without the Owner's ruling.** A sign-up consent that covers contact about the person's interest does not cover sharing with Meta.
- **Lookalikes:** only outside special ad categories, from a seed of 100+ people (1,000+ preferred; see the minimum source size below); none for category ads.
- **Exclusions:** once a result event exists, exclude recent converters from cold ad sets that ask for the same result.

## The retargeting ladder, built
The ladder above becomes Meta custom audiences only through a dated plan, `plans/<YYYY-MM-DD>-audience-ladder.md` (vault frontmatter, `type: plan`), one row per rung. `meta-campaign-build` ("Custom audiences") creates audiences from that plan and from nothing else, and writes each id back into the row and into `memory/audiences/<name>.md`. This skill writes the plan; it creates nothing.

**Before the plan:** read `config/accounts.md` (`pixel_id`, `page_id`, `instagram_account_id`, `lead_form_ids`, the pixel-events row with its consent gating), `config/product.md` (each funnel's conversion page and conversion event), `config/audiences.md` and `config/claims.md` (the special ad category per audience and market, and the custom-audience ruling), and the existing audiences (`ads_get_ad_account_custom_audiences`) so nothing is built twice.

**The standard rungs** (keep the ones the funnels and the special ad category allow; mark the rest `n/a` with the reason):

| # | Rung | Subtype | Rule in words | Retention |
|---|---|---|---|---|
| 1 | Website visitors, hot | WEBSITE | all visitors of the pixel (template `ALL_VISITORS`) | 30 d |
| 2 | Website visitors, warm | WEBSITE | all visitors of the pixel | 90 d |
| 3 | Website visitors, cool | WEBSITE | all visitors of the pixel | 180 d (the website maximum; verify in Ads Manager) |
| 4 | Conversion-page visitors | WEBSITE | visitors whose URL contains the conversion page's path (template `VISITORS_BY_URL`) | 30 d |
| 5 | Converters | WEBSITE | people who fired the funnel's conversion event (event filter, for example `Lead`) | 180 d |
| 6 | Page engagers | ENGAGEMENT | people who engaged with the Page (source `page`) | 365 d |
| 7 | Instagram engagers | ENGAGEMENT | people who engaged with the Instagram account (source `ig_business`); n/a when no Instagram is linked | 365 d |
| 8 | Lead-form openers | ENGAGEMENT | people who opened an instant form and did not submit (source `lead`, or `ig_lead_generation` for forms on Instagram; needs the Page or account as `owner_id`) | 90 d (verify the maximum) |
| 9 | Lead-form submitters | ENGAGEMENT | people who submitted an instant form (same sources) | 90 d (verify the maximum) |
| 10 | Video viewers | ENGAGEMENT | people who watched a share of the company's videos | 365 d; only when the tool's schema at build time lists a video source, else the Operator creates it in Ads Manager and the id is read back with `ads_get_ad_account_custom_audiences` |
| 11 | Lookalike 1 % | LOOKALIKE | the closest 1 % to the best source (rung 5 or 9 when big enough, else the ruled customer list, else rung 2) | n/a |
| 12 | Lookalike 3 % | LOOKALIKE | the closest 3 % to the same source | n/a |

Optional rung: top time spenders (WEBSITE, template `TOP_TIME_SPENDERS`, the top 25 % by time on site, 30 d) when the site has enough traffic to split.

**Naming:** `<company short>_<source>_<window>_<date>`: the short name from `config/company.md`, a source token (`web-all`, `web-convpage`, `ev-<event>`, `page-eng`, `ig-eng`, `form-open`, `form-submit`, `video`, `lal1-<source token>`, `lal3-<source token>`), the window (`30d`, `90d`, `180d`, `365d`; `na` for lookalikes) and the creation date `YYYY-MM-DD`. Example: `acme_web-all_30d_2026-11-02`. The audience note in `memory/audiences/` takes the same name.

**Minimum source size before a lookalike:** Meta's rule of thumb is a source of at least 100 people, and 1,000–50,000 people for a useful lookalike ("verify in Ads Manager"; Meta changes the floor). Below 1,000, the plan marks the lookalike `waiting for source` and names the size it waits for. The lookalike's geography is set by Meta automatically from the ad set; the plan never asks for a country.

**Exclusions:**
- Converters (rung 5, and a ruled customer list when one exists) are excluded from every prospecting ad set that asks for the same result.
- Each rung's ad set excludes the rung above it, so a person sees one message: the 90-day set excludes the 30-day visitors, the 180-day set excludes the 90-day visitors, and every retargeting set excludes the converters.
- Lookalike ad sets exclude the source they were built from and the converters.
- Under Advantage+ audience, excluded custom audiences are a control and hold (see above).

**Special ad categories** ("verify the current rule in Ads Manager"; Meta changes these, and `config/claims.md` says per market whether a category applies):

| Category | Lookalikes | Age, gender, postal code | Location | Detailed targeting | The ladder |
|---|---|---|---|---|---|
| HOUSING | not allowed | age locked to 18–65+, no gender, no postal-code targeting | a minimum radius around a point (about 15 miles / 25 km) | many options removed; no protected signals | website and engagement custom audiences only |
| CREDIT | not allowed | same | same | same | website and engagement custom audiences only |
| EMPLOYMENT | not allowed | same | same | same | website and engagement custom audiences only |

Meta's Special Ad Audiences (the old lookalike substitute for these categories) were retired, so for these three categories rungs 11 and 12 are `n/a`, and a customer list stays subject to the Owner's ruling like everywhere else. ISSUES_ELECTIONS_POLITICS does not lock targeting in the same way but needs the advertiser's authorisation and a "Paid for by" disclaimer; confirm in Ads Manager before planning a ladder for it.

**Consent basis per rung** (written into the plan's row):
- **Pixel rungs (1–5, top time spenders):** only as lawful as the site's consent gating recorded in `config/accounts.md` (the pixel-events row: which event fires on which page under which consent). Where the pixel fires only after cookie consent, the pool is the consented share of visitors and expected sizes are small. Where `config/accounts.md` records no gating and the market's law in `config/claims.md` requires it, the rung is `blocked: consent` and the gap goes to the Owner (and, when there is one, as a request to the product team).
- **Engagement rungs (6–10):** on-platform activity under Meta's own terms; no rows leave Meta. Lead-form rungs are Meta's engagement audiences, never the lead rows themselves.
- **Customer lists (CUSTOM):** not in the ladder unless `config/claims.md` ("Custom audiences from company lists") records the Owner's ruling that the named list may be used (CLAUDE.md §3); the rows are never stored in this repository.
- **Lookalikes:** inherit the basis of their source.

**Weekly check** (in `/next-round`, or `meta-performance-report` when asked): for every built rung, `ads_get_custom_audience` → `approximate_count` (a size band, as the tool returns it) and `delivery_status` with `as_of`; `ads_get_custom_audience_adsets` → where it is used; the insights by ad set → the share of spend on retargeting vs prospecting (the target is 10–20 % of cold spend on retargeting; a rung below Meta's minimum delivery size or a lookalike not yet ready is flagged, never padded). Changes go into the plan's rows and the audience notes.

**The plan's table** (one row per rung; `expected size` comes from `ads_get_dataset_stats` or the Page's own figures with `as_of`, or "unknown until built", never invented):

| # | Name | Subtype | Rule in words | Retention | Expected size | Consent basis | Status | Id (when built) |
|---|---|---|---|---|---|---|---|---|

Statuses: `planned`, `built`, `ready`, `waiting for source`, `too small`, `blocked: consent`, `blocked: category`, `n/a`. Below the table: the exclusions per ad set, the ad set each rung feeds, and the message per rung.

## Geo order
Take the order from `config/company.md` (primary market first, then other markets) and the Owner's decision rules in `memory/decisions/`: the primary market in its main language → the primary market in its second language arm → each other market in its own language, only after that market's legal and consent questions in `config/claims.md` are closed.

## Output
A table of signals with type, size (the editor's estimate, with the date), id (if known), category impact and recommendation (suggest / hard cap / skip); the proposed ad set structure; the exact `targeting` JSON for `meta-campaign-build`, with `special_ad_categories` stated per campaign. When retargeting is in scope: the ladder plan `plans/<YYYY-MM-DD>-audience-ladder.md` (above).
