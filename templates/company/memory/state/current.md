---
type: state
created: 2026-10-26
updated: 2026-10-26
status: draft
maintained_by: harness
categories: [state]
summary: "Account facts as last verified (with the time of the live read), the campaigns table, the plan to read first and the next actions; filled by /setup, then kept true by every session."
as_of: 
source: 
plan: 
---

# Current state

Template: `/setup` fills this note from its live Meta check and `config/accounts.md`, then sets `status: active`. Every fact carries the time of the live read that gave it; anything not read live is marked **unverified**. Re-read live before any change.

## Read first

- **Plan file to read first:** `<fill at /setup>` (the first flight plan that `/setup` drafts in `plans/`)
- Campaign notes: `memory/campaigns/`. Flight notes: `memory/flights/`.

## Campaigns

| Campaign | Id | Status | Daily budget | Cap | Start | End | Ad sets | Ads | Last verified |
|---|---|---|---|---|---|---|---|---|---|

`<fill at /setup>`: one row per campaign once built (a wikilink to its campaign note, the id in backticks).

## Money (from the last live read)

- Daily spend: `<fill at /setup>`
- Live today: `<fill at /setup>`
- Next go: `<fill at /setup>`

## Account (names and public ids only)

- **Ad account:** `<fill at /setup>` (id, currency, status, payment method present, minimum daily budget)
- **Drafts or real objects:** `<fill at /setup>` (what the first create returned; see [[2026-10-20-some-accounts-create-real-paused-objects]])
- **Business portfolio, Page, Instagram, WhatsApp numbers (by name):** `<fill at /setup>`

## Tracking and plumbing

- `<fill at /setup>` (the pixel and its events, the upload token by name and its `--check` result, lead delivery, domain verification)

## Last live reads (figures; re-read before acting)

- `<fill at /setup>` (one dated bullet per live read: time, what was read, the figures with their source)

## Open items by owner (as last recorded)

- `<fill at /setup>` (a summary only; each item has its own note in `memory/open/`)

## Next actions

1. Run /connect (Part 1, the connections, ending with /health), then /campaign (Part 2, the first campaign)
