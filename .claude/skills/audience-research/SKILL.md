---
name: audience-research
description: "Find, size and structure Meta audiences for the audiences defined in config/audiences.md, including special-ad-category limits, signals, retargeting and geo order. Use when asked about targeting, audience size, who to reach, or expansion."
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
Age (locked to 18–65+), gender, postal-code targeting, detailed targeting on protected signals, and lookalike audiences (replaced by Special Ad Audiences where available). Plan category audiences on geo, language and broad interests or Advantage+ expansion, and expect larger, less precise audiences.

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
- **Retargeting ladder** once traffic exists: site visitors 30 days (consented pixel traffic only, so the pool is a fraction of visitors), 90-day visitors, video viewers 25%+. Budget 10–20% of cold spend. A different message per rung (the film → the product's steps → the date or the offer).
- **Custom audiences from any sign-up, lead or customer list: not without the Owner's ruling.** A sign-up consent that covers contact about the person's interest does not cover sharing with Meta.
- **Lookalikes:** only outside special ad categories, from a seed of 100+ results; none for category ads.
- **Exclusions:** once a result event exists, exclude recent converters from cold ad sets that ask for the same result.

## Geo order
Take the order from `config/company.md` (primary market first, then other markets) and the Owner's decision rules in `memory/decisions/`: the primary market in its main language → the primary market in its second language arm → each other market in its own language, only after that market's legal and consent questions in `config/claims.md` are closed.

## Output
A table of signals with type, size (the editor's estimate, with the date), id (if known), category impact and recommendation (suggest / hard cap / skip); the proposed ad set structure; the exact `targeting` JSON for `meta-campaign-build`, with `special_ad_categories` stated per campaign.
