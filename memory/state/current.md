---
type: state
created: 2026-10-26
updated: 2026-10-29
status: active
maintained_by: harness
categories: [state]
summary: "Habait on ad account 1010578430110331 (ILS, shared with another team; this harness owns no campaign yet); keys pass green; first flight plan drafted, nothing built."
as_of: 2026-10-29 19:45 Asia/Jerusalem
source: "ads_get_ad_accounts, ads_get_ad_account_pages, ads_get_user_pages, ads_get_ig_accounts; meta-upload.mjs --check; meta-graph.mjs check and lead-forms list; Business Settings screens"
plan: "plans/2026-10-29-first-flight-plan.md"
---

# Current state

Filled by `/setup` on 2026-10-29. Every fact carries the time of the live read that gave it; re-read live before any change.

## Read first

- **Plan file to read first:** `plans/2026-10-29-first-flight-plan.md` (draft; nothing built)
- Campaign notes: `memory/campaigns/`. Flight notes: `memory/flights/`.
- The ad account is shared: [[2026-10-29-shared-ad-account-own-campaigns-only]]

## Campaigns

| Campaign | Id | Status | Daily budget | Cap | Start | End | Ad sets | Ads | Last verified |
|---|---|---|---|---|---|---|---|---|---|
| [[test-harness-pipeline]] (pipeline test, never activate) | `120249096272270532` | PAUSED | ₪25 CBO (never on) | spend cap ₪750 | none | none | 1 (`120249096273870532`) | 2 (`120249096283730532`, `120249096284360532`) | 2026-10-29 20:3x |

The other team's campaigns in the account are not listed here. The real first flight (`plans/2026-10-29-first-flight-plan.md`) is not built yet.

## Money (from the last live read)

- Daily spend: not read yet for Habait's own campaigns (none exist); the whole account's spend is read at the first `/morning`
- Live today: nothing of this harness (the test campaign is PAUSED, ₪0)
- Next go: none pending; the first flight's go comes after the build, the render check and the numbered recap

## Account (names and public ids only)

- **Ad account:** `1010578430110331` "הבית של כל הבתים בע\"מ", ILS, ACTIVE, payment method present, minimum daily budget 314 (₪3.14), Asia/Jerusalem; owned by portfolio `486542035414450`, shared into the company portfolio `809438743967672` (2026-10-29 19:3x, ads_get_ad_accounts and meta-graph check)
- **Drafts or real objects:** real PAUSED objects (first create 2026-10-29, campaign `120249096272270532`), although the MCP tool texts say "draft mode" (see [[2026-10-20-some-accounts-create-real-paused-objects]])
- **Business portfolio, Page, Instagram, WhatsApp numbers (by name):** portfolio `809438743967672` "הבית של כל הבתים" (unverified); Page `108204445697760` "Habait - Home is Habait" (Lead Ads terms accepted), duplicate `720136941422640` never used; Instagram none linked to the ad account (habait.ai is in the portfolio); WhatsApp "Habait main" (WhatsApp Business App account `916666450823323`)

## Tracking and plumbing

- Pixel: none (no website). Upload token: system user habait-uploder (app "Habait" `29427574316847178`), `meta-upload.mjs --check` ok, `meta-graph.mjs check` ok with six permissions, `lead-forms list` ok (2026-10-29 19:37). Lead delivery: WhatsApp chats in "Habait main". Domain verification: n/a.

## Last live reads (figures; re-read before acting)

- 2026-10-29 19:3x — ads_get_ad_accounts: 2 accounts visible to the login (`1010578430110331` and `1028189403616245`); this harness is bound to `1010578430110331`
- 2026-10-29 19:3x — ads_get_ad_account_pages: 2 Pages under the account (`108204445697760`, `720136941422640`); ads_get_ig_accounts: none
- 2026-10-29 19:37 — meta-graph lead-forms list: 51 forms on the Page (the latest, `1810959403440498`, is the other team's)

## Open items by owner (as last recorded)

- Owner: two-factor authentication on his Facebook profile; narrow the `meta-ads` login; clear "ללא עמלת תיווך"; confirm brand colours, font and logo files; say which past ads are Habait's; Instagram link (optional); control room install (optional) — see `checklist.md`

## Next actions

1. `/health` (the full check; the onboarding now runs as `/connect` then `/campaign`, decision [[2026-10-29-onboarding-in-two-parts]])
2. The Owner's open clicks in `checklist.md` (two-factor first)
3. The first flight through `/campaign` steps 2–9: the market research → the plan's recap and the Owner's picks → copy → compliance → still + silent video → upload → build PAUSED → previews (per `plans/2026-10-29-first-flight-plan.md`)
