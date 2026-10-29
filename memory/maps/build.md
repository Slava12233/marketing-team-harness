---
type: map
created: 2026-10-26
updated: 2026-10-30
status: active
maintained_by: harness
categories: [maps, build]
summary: "The Build lane map - media-buyer and the main session read every meta-platform (and, for Google, google-platform) learning listed here before any create, update, activate or enable."
---

# Build lane (media-buyer, the main session on a build)

## Read first, every lane
- `memory/HOT.md` (in your context from the SessionStart hook; read it if not)
- [[current]] (`memory/state/current.md`: account facts, the campaigns table, next actions)
- [[business/goals|goals]] (money: the band, the targets, the caps)
- [[claims-and-compliance]] and [[business/audiences|audiences]] before any copy, creative or targeting work
- the notes under `memory/tooling/` when a tool question comes up

## The notes you touch
- every campaign note in `memory/campaigns/` (one per campaign; ids, ad sets, ads, caps, dates)
- every flight note in `memory/flights/` (fixed creative numbers, hashes, video ids)
- the audience specs in `memory/audiences/` (one note per custom audience or lookalike, named as the audience: id, size and readiness with `as_of` and `source`) and the ladder plan `plans/<date>-audience-ladder.md`
- the catalog, feed, event-source and product-set ids (the account facts of `memory/state/current.md` and the flight's plan) when the company runs catalog ads
- [[funnels]] (destinations, conversion events, attribution) and [[business/product|product]] (the copy in use)
- the ids in `config/accounts.md` (ad account, Page, pixel, forms, WhatsApp numbers by name, currency)
- [[go-log]] (`memory/money/go-log.md`): at the go step, one row per go, the Owner's words quoted, in the same turn as the activation (shape in [[close]])

## Every Meta platform behaviour (read all before a build; the notes win over any summary)
Every note under `learnings/meta-platform/`. The template ships these; add each new platform note here the day it is written.
- [[2026-10-12-account-needs-a-verified-phone-to-activate]]
- [[2026-10-12-activate-returns-publishing-even-when-rejected]]
- [[2026-10-12-activity-log-language-run-status-and-size]]
- [[2026-10-12-ad-review-takes-minutes-then-preparing]]
- [[2026-10-12-create-creative-with-headline-breaks-the-ad]]
- [[2026-10-12-draft-campaigns-cannot-be-discarded-through-the-mcp]]
- [[2026-10-12-draft-delete-rules-by-object-level]]
- [[2026-10-12-editor-renders-mcp-objects-in-about-20-seconds]]
- [[2026-10-12-live-objects-are-deleted-by-status]]
- [[2026-10-12-never-update-targeting-on-a-draft-ad-set]]
- [[2026-10-12-no-targeting-search-tool]]
- [[2026-10-12-planned-ab-study-does-not-change-delivery-status]]
- [[2026-10-12-publishing-a-draft-sets-it-active]]
- [[2026-10-12-publishing-listed-object-ids-leaves-the-rest-in-draft]]
- [[2026-10-12-scalar-edits-to-live-ad-sets-stage-then-apply]]
- [[2026-10-12-standard-enhancements-is-deprecated]]
- [[2026-10-12-writes-staged-as-drafts]]
- [[2026-10-20-mcp-upload-route-is-public-url-only]]
- [[2026-10-20-no-lead-form-tool]]
- [[2026-10-20-some-accounts-create-real-paused-objects]]
- [[2026-10-21-editor-edits-autosave-as-drafts]]
- [[2026-10-21-empty-paused-ad-set-is-a-sizing-sandbox]]
- [[2026-10-21-escape-in-the-editor-opens-a-publish-dialog]]
- [[2026-10-21-image-uploads-are-deduplicated-by-content]]
- [[2026-10-21-instant-form-button-types]]
- [[2026-10-21-location-types-home-is-removed]]
- [[2026-10-21-weekly-cap-is-seven-times-daily-budget]]
- [[2026-10-21-whatsapp-ads-have-no-detailed-targeting]]
- [[2026-10-21-whatsapp-ads-need-page-welcome-message]] (superseded; read its successor)
- [[2026-10-23-direct-graph-uploads-are-the-default-route]]
- [[2026-10-25-activation-sequence-that-worked]]
- [[2026-10-25-advantage-plus-languages-are-a-control]]
- [[2026-10-25-ai-self-disclosure-is-an-object]]
- [[2026-10-25-campaign-spend-cap-is-a-live-scalar-edit]]
- [[2026-10-25-creatives-are-immutable]]
- [[2026-10-25-last-n-day-presets-exclude-today]]
- [[2026-10-25-mcp-cannot-set-a-whatsapp-number]]
- [[2026-10-25-mixed-optimisation-goals-show-multiple-conversions]]
- [[2026-10-25-whatsapp-ad-metrics-meaning]]
- [[2026-10-26-page-welcome-message-exact-spec]]
- [[2026-10-26-whatsapp-inbox-reads]]
- [[2026-10-27-code-200-api-access-blocked-is-the-developer-account]]
- [[2026-10-27-page-must-be-assigned-to-the-system-user]]

## Every Google platform behaviour (read all before a Google build; the notes win over any summary)
Every note under `learnings/google-platform/`, read by `google-ads-build` before any Google create, update or enable. Add each new Google note here the day it is written.
- [[2026-10-30-developer-tokens-sunset-access-follows-the-cloud-project]]
- [[2026-10-30-new-project-gets-test-access-explorer-is-applied-for]]
- [[2026-10-30-every-campaign-declares-eu-political-advertising]]
- [[2026-10-30-daily-budget-can-spend-twice-on-one-day]]
- [[2026-10-30-responsive-search-ad-limits]]
- [[2026-10-30-validate-only-is-the-dry-run]]
- [[2026-10-30-campaign-start-and-end-are-date-times]]
- [[2026-10-30-a-paused-campaign-serves-nothing]]
- [[2026-10-30-oauth-client-in-testing-expires-logins-after-7-days]]
- [[2026-10-30-official-google-ads-mcp-is-read-only]]

## Learnings that affect a build
- every note under `learnings/tooling/` and `learnings/money/` (grep `memory/INDEX.md` for `learnings/tooling` and `learnings/money`)

## Rulings
- the decisions in `memory/decisions/` (the decisions base: [[decisions.base]]); a go to spend is valid only in the chat message that contains it

## Procedure
- skill `meta-campaign-build` (Meta) and `google-ads-build` (Google) · `docs/meta-setup-guide.md` and `docs/google-setup-guide.md` (the Owner's console steps) · `docs/meta-platform-notes.md` (the same platform knowledge as one page)
- **Custom audiences and lookalikes:** `meta-campaign-build` "Custom audiences" (the `rule` JSON string, the templates, lookalikes, readiness, customer lists only on the Owner's ruling, deletes the Owner's), built only from the ladder plan `plans/<date>-audience-ladder.md` that `audience-research` "The retargeting ladder, built" writes (rungs, naming, minimum source size, exclusions, the special-ad-category table, consent per rung, the weekly check)
- **Catalog and Advantage+ shopping:** skill `catalog-ads` (intake, order of work, compliance, the weekly health routine) → `meta-campaign-build` "Catalog and Advantage+ shopping campaigns" (catalog → feed → diagnostics clean → event source → product sets → `OUTCOME_SALES` PAUSED; `template_data` field names from `ads_get_field_context`; the weekly catalog health check)
