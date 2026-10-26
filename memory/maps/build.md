---
type: map
created: 2026-10-26
updated: 2026-10-26
status: active
maintained_by: harness
categories: [maps, build]
summary: "The Build lane map - media-buyer and the main session read every meta-platform learning listed here before any create, update or activate."
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
- the audience specs in `memory/audiences/`
- [[funnels]] (destinations, conversion events, attribution) and [[business/product|product]] (the copy in use)
- the ids in `config/accounts.md` (ad account, Page, pixel, forms, WhatsApp numbers by name, currency)

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

## Learnings that affect a build
- every note under `learnings/tooling/` and `learnings/money/` (grep `memory/INDEX.md` for `learnings/tooling` and `learnings/money`)

## Rulings
- the decisions in `memory/decisions/` (the decisions base: [[decisions.base]]); a go to spend is valid only in the chat message that contains it

## Procedure
- skill `meta-campaign-build` · `docs/meta-setup-guide.md` (the Owner's console steps) · `docs/meta-platform-notes.md` (the same platform knowledge as one page)
