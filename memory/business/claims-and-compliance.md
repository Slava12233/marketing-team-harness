---
type: business
created: 2026-10-26
updated: 2026-10-26
status: draft
maintained_by: harness
categories: [business]
summary: "What an ad may and may not say: allowed claims with sources, forbidden words, lines not cleared, consent and notice ids, marketing-message rules, special ad categories, personal attributes, AI imagery, open legal items; filled by /setup from config/claims.md."
evidence: "config/claims.md"
---

# Claims and compliance

Template: `/setup` fills this note from `config/claims.md` and the interview, then sets `status: active`. Until then every `<fill at /setup>` is empty. After setup, a change is written to `config/claims.md` first and then here (see [[memory/README|README]] §2).

## Claims

- **Allowed (each with its source and date):** `<fill at /setup>`
- **Forbidden words and claims:** `<fill at /setup>`
- **Lines that need clearance before use in ads:** `<fill at /setup>`

## Consent and disclosure wording

- `<fill at /setup>` (consent and notice ids, quoted by id only; the harness never writes or paraphrases their wording)

## Marketing messages and lists

- `<fill at /setup>` (marketing email or SMS only with the prior consent the law requires; whether any list may become a Meta custom audience is the Owner's legal question)

## Special ad categories

- `<fill at /setup>` (per market and audience: NONE, HOUSING, CREDIT, EMPLOYMENT or ISSUES_ELECTIONS_POLITICS, with the reason; declared at creation)

## Personal attributes

- Never address the viewer by religion, origin, health, family status or other personal attributes; a language or intent framing is fine.
- `<fill at /setup>` (anything stricter that the company adds)

## AI imagery

- `<fill at /setup>` (the badge and its wording from `config/brand.md`; generated media never shown as a real place, person or product; ad-level AI self-disclosure OPT_IN, see [[2026-10-25-ai-self-disclosure-is-an-object]])

## Open legal items

- `<fill at /setup>` (dated, labelled "verify with your lawyer"; each one also gets a note in `memory/open/` with `owner: lawyer` or `owner: owner`)
