---
name: compliance-check
description: "Check the company's ad copy, creatives and landing-page requests against Meta advertising policies, the market's law as noted in config/claims.md, and the company's own rules before anything is built or published. Use on every new creative, copy batch or page request."
---

# Compliance check (Meta policy + the market's law + the company's rules)

Output: a verdict table in the batch's plan or copy file (English), or `reports/<YYYY-MM-DD>-compliance-<topic>.md` for a standalone pass; the chat summary is in the chat language from `config/operator.md`.

Return **PASS**, **FIX** (the exact words or element and the replacement) or **HOLD** (needs the Owner or a lawyer; say which and why) per string or element, then one line **"Safe to build: yes/no"**. HOLDs go to the Owner; an agent never resolves a HOLD.

Read first: `config/claims.md` (allowed claims, forbidden words, lines needing clearance, consent and notice ids, jurisdiction notes, the special-ad-category decision per market), `config/audiences.md` (special ad category per audience, "must not be addressed as"), `config/brand.md` (AI-imagery disclosure rule, do-not-do list), `config/product.md` (destination pages, what the product does not do).

## Meta policy areas
1. **Special ad categories:** declare the category `config/claims.md` and `config/audiences.md` set per audience and market (HOUSING, CREDIT, EMPLOYMENT, ISSUES_ELECTIONS_POLITICS or none). Where Meta applies a category to a geo (for example housing, credit and employment ads in the EU and the US), it is declared; for a market where the requirement is unclear, confirm the current rule in Ads Manager before building, and when in doubt declare it. B2B service ads are usually not in a category; state the reason. A wrong or missing category means rejection or account flags.
2. **Discriminatory practices and personal attributes:** no targeting or copy by religion, origin, ethnicity, family status, disability, health, sexual orientation or financial status; never address the viewer as having such an attribute ("as a <group member>", "are you <condition>?"). Language and intent framing is allowed ("for <language> speakers planning <outcome>").
3. **Misleading claims:** every figure carries a source and a date; no price, rate, outcome or delivery-date predictions; an AI assistant is not an adviser (quote the product's own limit from `config/product.md`).
4. **Financial products and services:** when the company does not offer loans, credit or financial products, copy must not imply it does ("get your loan", "best rate").
5. **Prohibited and restricted content:** nothing on Meta's prohibited list; restricted categories only with the authorisation Meta requires.
6. **Before/after and body or outcome images:** no before/after comparisons, no images implying an unrealistic or guaranteed outcome, no negative self-perception framing.
7. **AI-generated content:** self-disclosure OPT_IN at the ad level whenever any asset is generated or altered; generated scenes, items, places or people never presented as a real item, project, address or person; the on-asset badge when `config/brand.md` requires one.
8. **Landing page:** loads in the ad's language, matches the ad, working privacy and accessibility links, no unexpected downloads; where a cookie consent is required, it is opt-in (equal buttons, nothing pre-selected) and nothing tracks before agreement.
9. **Lead ads:** the instant form's privacy link points at the company's own privacy policy; questions collect only what the follow-up needs; the form's disclaimer text is the shipped notice (by id), not ours.
10. **Text in image:** no hard limit, but heavy text lowers delivery; keep under about 20% for Reels.

## The market's law (from `config/claims.md`; dated notes, "verify with your lawyer")
- Apply each jurisdiction note in `config/claims.md` to the market the ad targets. Notes are perishable: a note past its re-verify date is flagged in the output and its rule is a HOLD until re-verified.
- **Regulated activities:** where the law reserves an activity (for example brokerage, financial advice, medical claims) for licensed people, copy must not imply the company performs it unless `config/claims.md` records the licence.
- **Marketing email and SMS:** where the market's spam law requires prior written consent, marketing messages go only to people who gave it; a sign-up consent that covers contact about the person's own request does not cover general marketing. Retargeting ads are not outbound messages; outbound messages are not this harness's to send.
- **Privacy:** personal data stays in the company's systems; this harness holds counts by source and ref only. Building a custom audience from any sign-up or customer list is a legal question for the Owner, never an agent's call.
- **Where the EU applies:** every ad and its targeting spec is public in the Ad Library (transparency rules), so write the targeting as if it will be read; declare special ad categories as Meta requires there.
- Any hard block that `config/claims.md` records for a market or language (for example investment or yield framing until a lawyer rules) is a HOLD, never a FIX.
- **Consent and disclosure wording:** quoted verbatim from the shipped notices by the ids in `config/claims.md`, never written or paraphrased here. Any new consent or disclosure sentence is a HOLD for the Owner or counsel.

## The company's own rules
- Every word and claim on the forbidden list in `config/claims.md` is a FIX (with a replacement) or a HOLD.
- Every line on the "needs clearance" list in `config/claims.md`: HOLD until the Owner confirms it for ads.
- Language matches the destination: each language goes to the destination URL `config/product.md` lists for it; each funnel to its own destination; never a destination `config/product.md` marks as not for paid traffic (for example a sign-in screen).
- Figures marked unverified in `config/audiences.md` or `config/claims.md`: words, not numbers, until re-verified against primary sources.
- Brand rules from `config/brand.md`: colour roles, the logo never mirrored, a reserved accent only in its role, the do-not-do list.
- Public release of film or reel material needs every rights question closed (real names, music licence, AI voice).

## Output
For each asset or string: PASS / FIX / HOLD with the exact words or element to change, the replacement (for FIX), the owner (for HOLD: the Owner or counsel) and the rule it touches (Meta policy area, the `config/claims.md` note, the company rule). One summary line: **"Safe to build: yes/no"**.

## Google Ads (when the copy or the page is for Google)
Also check Google Ads policies for every string and destination: editorial (no ALL CAPS words, no repeated punctuation or "!!!", no gimmicky symbols, at most one exclamation mark in a description and none in a headline, no phone numbers in the text), destination (the final URL works, matches the ad's language and promise, no sign-in screen, the same domain as the display URL), trademarks (competitor names in copy only with a reason in the plan), restricted and sensitive categories for the market (financial services verification, health, gambling, alcohol, political), and the EU political advertising declaration. Counted lengths are Google's (the learning note on responsive search ads); a string over a limit is FIX.
