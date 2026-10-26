---
type: business
created: 2026-10-26
updated: 2026-10-26
status: draft
maintained_by: harness
categories: [business]
summary: "The funnels: entry, destination per language, conversion event, what counts as a result, attribution, pixel, analytics and lead delivery; filled by /setup from config/product.md and config/accounts.md."
evidence: "config/product.md; config/accounts.md"
---

# Funnels

Template: `/setup` fills this note from `config/product.md` (the funnels table) and `config/accounts.md` (pixel, attribution, lead delivery) and the interview, then sets `status: active`. Until then every `<fill at /setup>` is empty. After setup, a change is written to `config/product.md` (the funnels table) and `config/accounts.md` (pixel, attribution, lead delivery) first and then here (see [[memory/README|README]] §2).

## The funnels

| Name | Audience | Entry | Destination URL | Conversion event | What counts as a result |
|---|---|---|---|---|---|
| `<fill at /setup>` | | | | | |

## Language and destination match

- `<fill at /setup>` (which ad language goes to which URL; pages that paid traffic must never reach)

## Attribution that reaches the database

- `<fill at /setup>` (the `ref` parameter and its format, `utm_*`, what is stored where)

## Meta pixel

- `<fill at /setup>` (the dataset id from `config/accounts.md`, which events fire on which page, after which consent; or "no website")

## Google Analytics

- `<fill at /setup>` (measurement id and consent mode, or "none")

## Lead delivery

- `<fill at /setup>` (Meta's Leads Center by default; email notifications, CSV, a CRM by name, or a webhook only with a product team)

## Live on the website

- `<fill at /setup>` (what a live check of each destination page showed, with its date)
