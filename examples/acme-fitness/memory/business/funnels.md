---
type: business
created: 2026-10-26
updated: 2026-10-26
status: active
maintained_by: harness
categories: [business]
summary: "FICTIONAL EXAMPLE. Two funnels: Members (link ad → /join, StartTrial) and Corporate wellness (instant form or /corporate/call, a booked call); ref attribution, the consent-gated pixel, GA, Leads Center."
evidence: "config/product.md; config/accounts.md"
---

# Funnels

> FICTIONAL EXAMPLE. Every id is fake. Filled by `/setup` from `config/product.md` and `config/accounts.md` on 2026-10-26.

## The funnels

| Name | Audience | Entry | Destination URL | Conversion event | What counts as a result |
|---|---|---|---|---|---|
| Members | Members | Link ad (Feed, Stories, Reels) | https://acmefitness.example/join?ref=meta | `StartTrial` (pixel, after cookie consent) | A 7-day free trial started |
| Corporate wellness | Corporate | Instant form `500000000000001`, or link ad → page | https://acmefitness.example/corporate/call?ref=meta | Lead form submit, or `Schedule` (pixel) | A booked 20-minute call |

## Language and destination match

- English ads → the English pages above; there is no other language. The members' area is never a paid destination.

## Attribution that reaches the database

- `?ref=<code>` (lower-case letters, digits, `-`, max 40 characters) is stored with the trial sign-up and the call booking; `utm_*` reach analytics only.

## Meta pixel

- `400000000000001` on acmefitness.example: `PageView` (/join, /corporate/call), `StartTrial` (trial confirmation), `Schedule` (booking confirmation), `MemberLogin` (members' area); all only after cookie consent. No Conversions API.

## Google Analytics

- `G-EXAMPLE001`, measurement only.

## Lead delivery

- Leads Center (default): new-lead notifications to the Operator, who answers within one working day; no webhook.

## Live on the website

- 2026-10-26: /join and /corporate/call load in English with the copy quoted in [[business/product|product]].
