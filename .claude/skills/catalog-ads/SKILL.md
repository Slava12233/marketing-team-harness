---
name: catalog-ads
description: "Route an e-commerce company's catalog work on Meta: the intake (store platform, feed URL ownership, currency, product count, pixel events), the order of work from catalog to a PAUSED Advantage+ catalog (sales) campaign, the compliance notes for product ads and the weekly catalog health routine. Use when the company sells products from a feed (Shopify, WooCommerce, Wix, a CSV or XML URL), or when asked about a catalog, a product feed, dynamic product ads or Advantage+ shopping."
---

# Catalog ads (e-commerce companies)

A thin routing skill. The build itself, with every call and rule, is in `meta-campaign-build` ("Catalog and Advantage+ shopping campaigns", "Custom audiences"); the audiences in `audience-research` ("The retargeting ladder, built"); the events in `signals-audit`. This page decides whether catalog ads fit, collects what the build needs, and keeps the weekly routine.

**Output:** the intake answers and the catalog section of the flight's plan (`plans/<YYYY-MM-DD>-<flight>-plan.md`, English, vault frontmatter); the catalog, feed, event-source and product-set ids in that plan and in the account facts of `memory/state/current.md` (main session); the chat summary in the chat language from `config/operator.md`.

## When to use
- The company sells products online and `config/product.md` (or the Operator) names a product feed: a store platform with a Meta integration (Shopify, WooCommerce, Wix, others) or a CSV or XML feed URL.
- The site has a pixel (`pixel_id` in `config/accounts.md` is not "none (no website)") and a purchase funnel in `config/product.md`.

**Not for:** a company without a product list (services, lead generation, a single offer: use the funnels in `config/product.md`); products in a special ad category that forbids the targeting a catalog campaign needs (check `config/claims.md` and the table in `audience-research`; when unsure, the Owner); a store whose feed does not exist yet (the first task is then a request to whoever runs the store, or a "Needs product team" plan).

## Intake (one round of four questions through the question tool, English, recommended option first; a second round only if needed)
1. **Store platform and feed.** Which platform runs the store, and does its Meta integration already sync products (recommended: use the integration's feed), or is there a feed URL (CSV, XML) to fetch on a schedule?
2. **Feed URL ownership.** Who owns the feed URL, and does it need credentials (a password, or a token inside the URL)? Credentials are the Owner's: entered by the Owner in Commerce Manager, recorded here by name only, never pasted in chat.
3. **Currency and count.** The feed's currency (it must match the account currency in `config/accounts.md`, or a feed rule maps it) and the product count (all, in stock, the share with images).
4. **Pixel events.** Do `ViewContent`, `AddToCart` and `Purchase` fire on the site with the product ids (`content_ids`) the feed uses, and under which consent (`config/accounts.md`, pixel-events row)? Recommended: confirm with `signals-audit` before any build.

Write the answers into the plan with the date. A missing answer is written as "unknown" and blocks the step that needs it; it is never guessed.

## Order of work (each step in `meta-campaign-build`, "Catalog and Advantage+ shopping campaigns")
1. **Catalog**: find the existing one (the store's integration often made it) before creating one.
2. **Feed**: the integration's feed, or a scheduled fetch of the feed URL; credentials are the Owner's.
3. **Diagnostics and dynamic-ads health clean**: no MUST_FIX issue; a spot check of prices, currency, availability, images and links against the live site.
4. **Event source**: the pixel connected to the catalog; the three events match the catalog ids (`signals-audit` on the same events).
5. **Product sets**: for example all in-stock products, a category, best sellers; an empty set is never used.
6. **Audiences** (optional, for catalog retargeting and exclusions): the ladder plan from `audience-research`, built per `meta-campaign-build`, "Custom audiences".
7. **Copy and creative**: `ad-copy` for the primary text and the template lines, `creative-brief` for any frame or overlay, then `compliance-check` (below).
8. **Campaign, PAUSED**: `OUTCOME_SALES`, an Advantage+ catalog ad set on a product set, a dynamic creative whose `template_data` field names come from `ads_get_field_context` at build time. `media-buyer` builds; the main session asks for the go with the spend statement (caps from `config/goals.md`); the go rule is unchanged.
9. **Record and verify**: read back, `ads_get_errors`, `ads_get_ad_preview` → `ad-shots.sh` → images to the Owner (a dynamic ad renders sample products: check the price and name in each).

## Compliance notes (in addition to `compliance-check`)
- **Prices in ads match the feed.** The dynamic price comes from the feed; any price, discount or "from" figure written in copy or on an overlay must match the feed and the live page on the day it is written, with the source and date in the plan. A stale feed is a pricing problem, not only a delivery one.
- **Sale claims need a dated source.** "Sale", a percentage off, "lowest price", "free shipping", "limited stock" only with a dated source (the store's promotion page, the feed's sale price and its dates) and inside the promotion's dates; the ad's schedule ends with the promotion. Reference or comparison prices follow the market's law in `config/claims.md` ("verify with your lawyer").
- **AI imagery applies to product images too.** A generated or altered product image (a background swap, a model, a scene) carries the visible disclosure of `config/brand.md` and OPT_IN at the ad level, and never shows a feature, colour or variant the real product does not have. Catalog images from the store are used as supplied; Meta's own image enhancements stay opted out (rule 4 of `meta-campaign-build`) unless the Owner chooses otherwise.
- **Forbidden words and restricted products.** The list in `config/claims.md` applies to the template lines; products Meta restricts (for example health products, supplements, adult products, weapons, financial products) are kept out of the product set by a filter, never by hope.
- **No PII.** Purchases are read as counts and values from insights only; no order or customer row enters this repository. Customer-list audiences follow the Owner's ruling (CLAUDE.md §3).

## Weekly catalog health routine (in `/next-round`; `/health` while a catalog campaign exists)
Per `meta-campaign-build`, "Weekly catalog health check": diagnostics (MUST_FIX must be 0), feed staleness (the last fetch against the schedule), product-set coverage (products per set against the catalog total), event-source health and dynamic-ads health. Results with `as_of` in the plan and the campaign note; a MUST_FIX issue or a stale feed is reported to the Owner with the fix (a click list for Commerce Manager, or a request to whoever runs the store), and the Owner decides whether to pause.

**When results are poor, look at the catalog first:** MUST_FIX diagnostics → a stale feed → event match → set coverage → prices and availability against the site; only then creative, audience and budget (`meta-performance-report`).

## Who does what
- `media-buyer` builds the catalog objects and the campaign PAUSED; it cannot delete products, feeds or product sets.
- Deletes of products, feeds, product sets and feed rules, feed credentials, Commerce Manager settings and the go to spend are the Owner's.
- The store, its feed and its pixel code belong to whoever runs the site (`config/product-team.md`, else the Owner); changes there are requests, never edits by the harness.
