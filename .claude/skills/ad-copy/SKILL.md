---
name: ad-copy
description: "Write or iterate Meta ad copy for the company (primary text, headlines, descriptions, hooks) in the languages listed in config/brand.md, grounded in the product facts, the audiences and the claims rules. Use for new ads, variations, hook libraries, or rewriting underperformers."
---

# Ad copy

Output: `plans/copy-<YYYY-MM-DD>-<topic>.md`, written in English with the ad strings in their own languages; the chat summary is in the chat language from `config/operator.md`.

## Ground truth (read before writing; do not contradict)
- `config/company.md`: what the company sells, its stage (pre-launch / live / scaling), its revenue model ("not stated" means never invent a price, a fee or a model).
- `config/product.md`: the product name, the one-line promise, what it does and **what it does not do**, the funnels table (audience, entry, destination URL, conversion event, what counts as a result), the destination pages table (H1 and CTA as written), the key copy in use (quoted verbatim). Ad copy repeats the page's own words; it never promises what the page does not say.
- `config/audiences.md`: who each audience is, their geo and language, their pains (with the source and date of any figure), what they must not be addressed as.
- `config/brand.md`: languages and their direction, tone of voice, how the brand name is written inside each language, the do-not-do list.
- `config/claims.md`: allowed claims with sources, forbidden words and claims, lines that need clearance, consent and notice ids.
- The product's own honest limits (from `config/product.md` "what it does not do") are part of the copy, not a footnote: say them plainly where they build trust.
- If the company is pre-launch, the CTA is the pre-launch ask on the destination page (as written in `config/product.md`); after launch it is the live product's first step. A launch date appears in copy only as the pages state it.

## Claims and compliance (Meta policy, the market's law, the company's rules)
- Never use a word or claim on the forbidden list in `config/claims.md`.
- Nothing from the "needs clearance" list in `config/claims.md` goes into the main batch: put any such line in a separate **"pending clearance"** block, never in an ad to be built, until the Owner confirms it.
- No advice the product does not give (for example financial, tax, legal or medical advice, when `config/product.md` says the product does not give it); no rate, price or outcome predictions; no licence or professional-status claims the company does not hold.
- No yield, return or investment framing unless `config/claims.md` explicitly allows it for that market; where `config/claims.md` marks it as a hard block for a language or market, it is a hard block.
- Figures only with a visible source and date ("<source>, <date>"). Figures marked unverified in `config/audiences.md` or `config/claims.md` stay out of ads until re-verified; write the pain in words instead.
- No personal attributes: never address the viewer by religion, origin, ethnicity, health, sexual orientation, family status, financial status or any attribute listed under "must not be addressed as" in `config/audiences.md`. Language and intent framing is fine ("for <language> speakers planning <the outcome>").
- AI-generated imagery is disclosed at the ad level (per `config/brand.md`); copy never presents a generated scene, item, place or person as a real one.
- Consent and disclosure sentences are quoted verbatim from the shipped notices (by the ids in `config/claims.md`) or left out; never written, never paraphrased.
- Run `compliance-check` on every batch before it is built.

## Angles (pick 3–5 per batch, each a different reason to click)
Derive the angles from the product's promise (`config/product.md`) and the audience's pains (`config/audiences.md`). Each angle must be a distinct reason to click, not a restyle of another. Archetypes that work:
1. **Truth / proof:** the audience cannot tell what is true; the product shows its sources and dates.
2. **Hidden costs or hidden risks:** what the audience finds out too late, surfaced before they commit.
3. **Finding / fit:** say what you want, see what fits, not a catalogue of everything.
4. **Time:** the delay, the wait, the wasted hours; what the product makes predictable before the audience commits.
5. **One place / wrap-around:** from the first step to the outcome, with the services the page names, in one place.
6. **Business-to-business call** (when a funnel in `config/product.md` is a B2B meeting): a short call about what the prospect does today and what the product can do for it, in the page's own words.
7. **Launch moment** (pre-launch only): the new way to do the job opens on the date the page states; be first on the list.

## Hook formulas (first line of primary text, under 125 characters, no em dashes)
- Question that names the pain: "What will <the thing> really cost you? Most people find out after <the commitment>."
- Specific mechanism: "Tell <the product> what you want. See what fits, each figure with its source."
- Time frame: "<Product> opens <date as the page states it>. Be on the list the day it does."
- Contrarian: "<The job> is not a gamble. It is just badly explained."
- B2B-led: "<N> minutes about your <work>. What you do today, and what <the product> can do for it."

Fill the formulas only from `config/product.md` and `config/audiences.md`; never fill them with a fact that is not there.

## Structure
- **Primary text:** hook (1 line) → what it is and the mechanism (2–3 lines) → an honest limit or proof line (the product's own limit, or "every figure carries its source") → the CTA in the product's own words. 50–110 words. Front-load: only the first 125 characters show before "See more".
- **RTL languages** (any language marked RTL in `config/brand.md`): the address form the tone of voice prescribes (for example second-person plural, when `config/brand.md` says so), no letter-spacing, numbers and currency amounts isolated per word in creative text.
- **Headline:** 40 characters or fewer; the outcome or the offer; no clickbait.
- **Description:** 30 characters or fewer; the limit or the date.
- **CTA button:** LEARN_MORE or SIGN_UP for cold traffic to a homepage; BOOK_NOW or LEARN_MORE for a meeting funnel; always a button the funnel's objective allows (see `meta-campaign-build`).

## Style
Plain words, active voice, specific facts that are true. Vary sentence openings across a batch.
Banned patterns: "It's not X, it's Y", "No X, no Y, no Z", "Say goodbye to", "Unlock", "Stop scrolling", "POV:", a rhetorical question answered by a colon, em dashes, exclamation marks, ALL CAPS, "revolutionary", "game-changing", plus every forbidden word in `config/claims.md`.

## Output
Group by angle and language. For each ad:
- primary text, headline (character count), description (character count), CTA button;
- which creative it pairs with (the creative's fixed number for the flight);
- the destination URL from `config/product.md` that matches the ad's language and funnel (language and destination always match);
- one line on why it should work.

Name every claim's source (page copy, plan, `config/claims.md`, the Owner). Flag missing proof with `[NEEDS PROOF]` or `[NEEDS SOURCE + DATE]` instead of inventing it. Deliver 2–3 headline alternatives per angle. Put uncleared lines in the "pending clearance" block.

## Iterating on data
Read the ad-level report first (`meta-performance-report`). Keep the structure and angle of winners; change one variable (hook, headline or CTA wording) per variation. Retire angles with CTR under half the account average after 1,000+ impressions. A changed string means a new ad (creatives are immutable on Meta), so the copy file records which ad each new string replaces. Log each round in the plan file.
