---
name: landing-page-build
description: "Build a one-page static landing site for paid traffic from creatives/landing-template/ when the company has no page, or its page cannot take a Meta pixel or a call to action that matches the ad: fill page.config.js from config/ and the flight plan, run check.mjs and compliance-check, write the landing plan, deploy on the Owner's go with the company's Vercel login, then hand the live page to landing-page-cro and signals-audit before any ad points at it."
---

# Landing page build

Output: `creatives/<flight>/landing/` (a filled copy of `creatives/landing-template/`) and `plans/<YYYY-MM-DD>-landing-<flight>.md` (English; page copy quoted in its own language); the chat summary is in the chat language from `config/operator.md`.

This skill builds and, on the Owner's go, publishes a page. It never edits the company's own website, never writes consent or legal wording, and never points an ad at the page; `landing-page-cro`, `signals-audit` and the Owner's go come first.

## When to use

- The company has no website (the destination pages table in `config/product.md` says `none`) and the flight's funnel needs a page: a link ad, a pixel-optimised conversion, a warm-up step before WhatsApp or a booking.
- The company's page cannot take a Meta pixel (a site builder that blocks scripts, a page the company cannot change in time) and the funnel optimises for a pixel event.
- The company's page has no call to action that matches the ad (message match fails at the first screen), and the product team or the Owner cannot change it before the flight.

Not for: a page the company already owns and can change (that is a request through `landing-page-cro`, labelled "Needs product team" or "Needs Owner"); click-to-WhatsApp or instant-form funnels that need no page at all (no page is a valid design per `signals-audit`).

## Read first

1. `config/product.md`: the funnel this page serves (audience, entry, conversion event, what counts as a result), what the product does and does not do, key copy in use, the destination pages table.
2. `config/brand.md`: colours (hex and role), fonts, the language and its direction (LTR or RTL), RTL rules, tone of voice, the do-not-do list.
3. `config/claims.md`: allowed claims with sources, forbidden words and claims, lines that need clearance, consent and notice ids, jurisdiction notes ("verify with your lawyer"), whether consent is required in the market.
4. `config/company.md` (name, legal entity, primary market), `config/audiences.md` (who, pains, "must not be addressed as"), `config/accounts.md` (`pixel_id`, WhatsApp number names, `lead_delivery`, attribution parameters, the console-steps table: "Domain verified", "Pixel / dataset created and installed").
5. The flight's plan file and its copy table: the ad's promise, its language, the `ref` values the ad links carry. **Message match:** the H1 repeats the ad's promise.
6. The `offer-design` report for this funnel, if there is one (`reports/*-offer-<funnel>.md`): the ask and what the visitor gets.
7. `creatives/landing-template/README.md`: the files, the CTA types, deploy, domain, pixel verification.

## Procedure

### 1. Decide the page's shape (state it in the plan before filling)
- **One page per language** the flight's ads run in; each copy is its own folder (`creatives/<flight>/landing-<lang>/` when there is more than one) and its own deploy.
- **The CTA type** from the funnel's entry and result (`config/product.md`):
  - `whatsapp` when the result is a conversation (number from `config/accounts.md`; the prefilled message in the page's language);
  - `phone` when the company answers calls (no `ref` survives a call: count the CTA event);
  - `booking` when the result is a booked call on the company's own booking page;
  - `instant-form` when the result is a Meta lead and the form has a link;
  - `form-post` only when the company owns an endpoint that stores the row (its CRM or server) **and** has a shipped notice for the form (its id in `config/claims.md`). Otherwise pick another type. A static site cannot store a form.
- **The pixel:** `pixel_id` from `config/accounts.md`, or `none` when the company has no pixel yet (then the page carries no tracker and results are counted where the CTA lands). The conversion event matches the funnel's event (`Lead`, `Contact`, `Schedule`, ...) and fires once on the CTA click.
- **Consent mode:** `required` by default. `not-required` only when `config/claims.md` records the Owner's lawyer's written word for this market; quote that note in the plan.

### 2. Copy the template
```bash
cp -r creatives/landing-template creatives/<flight>/landing
```
The dotfiles (`.vercelignore`) come with it. Never edit `creatives/landing-template/` itself for a flight.

### 3. Fill `page.config.js`
Every double-brace placeholder, from the files above; nothing invented.
- **Hero:** H1 = the ad's promise as the copy table writes it; sub = what it is and for whom; CTA label = the funnel's ask.
- **Benefits (3), steps (3), FAQ (4):** only claims from "Allowed claims" in `config/claims.md`, each figure with its source and date in the plan; never a forbidden word; never a line from "needs clearance" without the Owner's clearance in writing; FAQ answers never go past "what it does not do" in `config/product.md`; no testimonial, rating or count that does not exist.
- **Brand:** the hex colours and the font stack from `config/brand.md`; `dir` from the language's direction; RTL rules apply (Latin names and numbers read correctly inside RTL text).
- **Footer legal lines:** the company's entity, address and registration as `config/company.md` states them.
- **Consent-adjacent strings:** the bar's sentence that names the pixel and its two buttons (`consent.text`, `consent.accept`, `consent.decline`, usually "Accept" / "Decline" in the page's language) are the only ones the harness fills; each is marked **"lawyer to confirm"** in the plan. The form notice (`form-post` only) is the shipped notice quoted verbatim by id, never written. Nothing else that reads as consent or legal text.
- **Legal pages:** `legal/privacy.html` and `legal/cookies.html` stay as shipped (DRAFT banners, bracketed instructions for the lawyer). When the company already has published policy pages, set `legal.privacyUrl` / `legal.cookiesUrl` to them instead.
- **Attribution:** keep `ref` and the `utm_*` names the ad links use (`config/accounts.md`).

### 4. Check
```bash
timeout 60 node creatives/<flight>/landing/check.mjs
```
Exit 2 is a hard error: fix and run again (one bounded run per fix, never a loop). Exit 0 with **"legal drafts not yet replaced"** is expected until the lawyer's text arrives; it goes into the plan's legal status and to the Owner. Open `index.html` locally and read every line in the page's language.

### 5. Compliance
Run `compliance-check` (or the `compliance-reviewer` agent) on every string of the page, the CTA, the consent mode and the destination of the CTA: PASS / FIX / HOLD per string, then "Safe to build: yes/no". HOLDs go to the Owner; an agent never resolves one. Apply the FIXes, re-run step 4.

### 6. Write the plan: `plans/<YYYY-MM-DD>-landing-<flight>.md`
Vault frontmatter per `memory/README.md` (`type: plan`, `created`, `updated`, `status: draft`, `maintained_by: harness`, `categories: [plans]`, `summary`). Sections:
1. **Why a page:** which of the "When to use" cases, the funnel, the ads that will point here.
2. **Strings:** a table of every config path and its value, quoted in the page's language, with the source (`config/claims.md` row, the copy table line, `config/product.md`) and the compliance verdict.
3. **CTA:** the type, the target (number name or URL), what happens after the click, how `ref` and `utm_*` travel.
4. **Pixel:** id (or `none`), `PageView` after consent, the conversion event and when it fires; the consent mode and its source.
5. **Consent-adjacent strings, "lawyer to confirm":** the bar's sentence and its two buttons, verbatim.
6. **Legal status:** DRAFT / replaced by the lawyer (date) / the company's own pages (URLs); the Owner's acknowledgement in writing (date) before any ad.
7. **Deploy status:** not deployed / deployed (date, Vercel project name, URL, custom domain); the domain's Meta verification status.
8. **Checks:** `check.mjs` output, the `landing-page-cro` report, the `signals-audit` evidence; each with a date.

### 7. Ask the Owner for the deploy go
Deploying publishes a public page, so it is an explicit go, in the same message, with what goes live: the URL it will have, the CTA, the pixel and consent mode, the legal status. Ask the Owner to acknowledge the DRAFT legal pages in writing, or to give the lawyer's text first. The Vercel CLI runs on the company's own Vercel login; no login, no deploy (the Owner logs in; the harness never handles the credentials).

### 8. Deploy (only after the go)
```bash
cd creatives/<flight>/landing
rm -f .env.local
timeout 540 npx vercel@latest deploy --prod --yes
```
Then: the URL answers 200, `/legal/privacy` answers 200, `/.env.local` and `/check.mjs` answer 404. Write the URL into `site.url`, the plan and the flight note (`memory/flights/<flight>.md`); redeploy once for the canonical link. A custom domain and its Meta domain verification are the Owner's DNS and console steps (the template's README has the click list; the row "Domain verified" in `config/accounts.md` and `checklist.md`).

### 9. After the deploy, before any ad
1. **`landing-page-cro`** audits the live page: message match with the ads, the CTA, friction, policy.
2. **`signals-audit`** confirms in Events Manager → Test events: nothing before Accept, `PageView` after Accept, the conversion event once on the CTA, nothing after Decline (the network panel, not the code). The Owner clicks in Events Manager when the login is the Owner's; the harness records what is reported.
3. **`config/product.md`** gains the row in the destination pages table (language, URL, H1 as written, CTA as written, pixel present, notes: "harness landing page; legal DRAFT until <date>" or "legal replaced <date>").
4. Only then may `meta-campaign-build` point an ad at the URL (with `ref` and `utm_*` on the link, and the domain as `conversion_domain` once verified).

### 10. Memory
Per `memory-update`: the flight note's `## Current state` and `## Log`, today's session note, `memory/state/current.md`; a redeploy or a copy change is logged the same way. A copy change starts in the plan, then the config, then `check.mjs`, then the Owner's go to redeploy.

## Rules
- Never deployed with a placeholder left, or while the DRAFT legal pages are unacknowledged by the Owner.
- Never a claim outside `config/claims.md`; never consent, privacy or cookie wording written by the harness.
- The page never collects data the company cannot store; forms POST only to an endpoint the company owns.
- No third-party script beyond the Meta pixel; no analytics, chat widget, font CDN or tag manager unless the Owner adds it with the lawyer's word (and `check.mjs` and the CSP are updated for it by hand).
- Nothing loads before consent where consent is required; Decline loads nothing.
- One page, one CTA, one language. The H1 repeats the ad's promise.
- The page is the company's, on the company's Vercel login and domain; deploys, domains and DNS happen only on the Owner's word.
- An ad points at the page only after steps 9.1–9.3 and the Owner's go for that ad.
