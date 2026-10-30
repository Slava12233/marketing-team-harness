---
name: offer-design
description: "Diagnose and strengthen what each of the company's funnels (config/product.md) offers the visitor before blaming copy or targeting. Use when conversion is low with healthy CTR, when planning a launch-day or funnel switch, or when asked about incentives or the ask."
---

# Offer design

Output: `reports/<YYYY-MM-DD>-offer-<funnel>.md` (English, with proposed wording in the page's languages); the chat summary is in the chat language from `config/operator.md`.

## Value equation
Value = (desired outcome × perceived likelihood) ÷ (time delay × effort). Raise the top or lower the bottom. When `config/company.md` says the revenue model or a price is "not stated", never invent one. Everything below is about what the visitor is asked to do and what they get, as the page states it.

## Current offers (build from `config/product.md` and the live pages, dated)
| Funnel | The ask (fields, steps) | What they get, in the page's words | Effort (modals, fields, clicks) |
|---|---|---|---|
| one row per funnel in `config/product.md` | | | |

Fetch the live pages first (`landing-page-cro`); the config can be stale.

## Diagnostic (score 1–10 per funnel; the lowest is the constraint)
1. **Desired outcome specificity:** is the outcome concrete ("know X before you commit") or vague? A pre-launch ask that only promises "a notice" is weak: can it promise something concrete on day one (first access, a short guide to the steps) without inventing a feature? Ask the Owner what exists.
2. **Perceived likelihood:** what proves it works? No testimonials or counts yet means the real screen recording, sourced figures and a face (a film) carry it.
3. **Time delay:** how long until the visitor gets the outcome? A pre-launch wait is the offer's weakness; a concrete date makes it tangible.
4. **Effort:** count fields, modals and clicks before the result; compare across funnels (for example a zero-field path from a lead form versus a full form on the page).

## Levers to propose (one per iteration; every lever is a question for the Owner or a request to the product team)
- **A true incentive** (early access, a short guide, a review of their current situation): needs the Owner to say what exists.
- **Field reduction** (an optional field, a shorter form): a request with a privacy note; fields exist for a reason the plan states.
- **B2B offer clarity:** what the call delivers (a review, a demo) stated in one line on the page and in the ad.
- **Page claims as the offer** (fee-free lines, guarantees, holds): only once `config/claims.md` clears them for ads.
- **Naming:** the product's and any assistant's own names from `config/product.md` are kept; never rename them in an ad.
- **Launch-day or funnel switch:** when the ask changes on a date (pre-launch list → live product), plan the new offer, page and ads in advance as a separate PAUSED build.

## Guardrails
No fake timers, no invented "spots left", no price or fee statements beyond the page, no yield or outcome promises, no "secret" or "game-changing", no word on the forbidden list in `config/claims.md`.

## Output
The scored diagnostic, the one lever to change now, draft wording for it (in the page's languages, through `compliance-check`), who owns it (the Owner, the product team, the harness), and an honest projected effect (single changes typically move page conversion 10–40%). Label it "Needs Owner's go" when it changes spend and "Needs product team" (or "Needs Owner") when it changes a page.
