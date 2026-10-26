---
name: landing-page-cro
description: "Audit the company's paid-traffic destinations (every page in the destination pages table of config/product.md, in each language) for conversion, message match with the ads, policy risk and tracking, and write the changes as requests to the product team or the Owner. Use when asked to review a page, explain low conversion, or propose page tests."
---

# Landing page CRO

Output: the audit as `reports/<YYYY-MM-DD>-cro-<page>.md` and every proposed change as a request in a dated plan file (`plans/<YYYY-MM-DD>-<topic>.md`), all in English with page copy quoted in its own language; the chat summary is in the chat language from `config/operator.md`.

**Pages:** the destination pages table in `config/product.md` (language, URL, H1 and CTA as written, pixel present yes/no, notes) and the funnels table (entry, destination, conversion event). Pixel and consent facts: `config/accounts.md` and the last `signals-audit`. Where page copy lives in the product's source: `config/product-team.md` "where product truth lives", when a product team exists.

**Fetch the live page before auditing** with WebFetch (or open it in a browser for layout, modals and the cookie bar); never audit from memory or from the config alone. When the live page differs from `config/product.md`, report the difference and propose the config update.

**You change nothing.** Every proposed change is a request with the exact wording or spec, labelled **"Needs product team"** and filed per `config/product-team.md` (a dated plan file the Owner carries to the product team). When `config/product-team.md` says there is no product team, label it **"Needs Owner"**. Consent, cookie and disclosure sentences are never proposed here; name the notice id from `config/claims.md` and the owner (the Owner or counsel).

## Audit order (highest impact first)
1. **Message match:** does the hero repeat the ad's promise in the ad's language? An ad built from a page line must land on a page that says it above the fold, in that language.
2. **Value proposition in 5 seconds:** what it is (from `config/product.md`), for whom (`config/audiences.md`), the mechanism, and the moment (a launch date, when pre-launch).
3. **Primary CTA:** the funnel's ask as the page writes it. Count every modal or step that stands before it for a paid visitor (cookie bar, popup, sign-in); measure the drop between landing page views and results by `ref` and propose, as a hypothesis, a shorter or lighter sequence. After a launch or a funnel change, re-check the new first step.
4. **Proof:** sourced figures with dates, the product's steps, a real screen recording with private data blurred. Where no testimonials exist (for example pre-launch), do not propose inventing any.
5. **Objections:** the audience's top pains (`config/audiences.md`), "can I trust this" (the product's honest limits), "is this <a regulated service it is not>" (it is not, per `config/product.md`), "what does it cost me" (the revenue model in `config/company.md`; when it is "not stated", flag every question the page cannot answer).
6. **Policy and legal risk:** lines on the "needs clearance" list in `config/claims.md`, any figure without a source, unsigned or draft consent text, any forbidden word from `config/claims.md` anywhere on the page.
7. **Consistency:** the same promise in the ad, the hero, the form and every funnel page; language paths correct; redirects as `config/product.md` describes them.
8. **Friction:** load time on a phone, the modal sequence, form fields (count them per funnel), error states, the 16 px input floor on mobile (smaller inputs zoom the page on iOS).
9. **Lead capture and follow-up:** what the form stores (`source`, `ref`); what happens after the success message (confirmation email, call-back, nothing); when the follow-up lane is unknown or switched off, it is a question for the product team or the Owner.
10. **Tracking:** the pixel only after consent where consent is required and only on the pages `config/product.md` marks; the success event the funnel optimises for exists (when it does not, request it, consent-gated); `ref` preserved from the ad link to the form; pages that are tracker-free by the company's rule stay so (report as a fact, count results in the product's own data); `utm_*` reaches analytics only unless `config/accounts.md` says otherwise.

## Output format
1. **Quick wins:** requests that can ship without a test.
2. **High-impact changes** (bigger effort), each as a request with wording or spec.
3. **Test ideas as hypotheses:** "Because [observation], changing [X] to [Y] for [audience] will [metric effect]; we will know by [metric]." Page tests are built by the product team (or the Owner); ad-side tests go to `ab-test-design`.
4. **Copy alternatives** for the hero, the form title and the primary CTA (2–3 each, with rationale), in the page's languages; run them through `compliance-check`.
5. **Policy flags** with the exact sentence, the rule or `config/claims.md` note it touches, and the owner.

Score only what was verified; mark anything not checkable as **"unknown"**, never as pass.
