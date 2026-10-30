---
name: competitor-research
description: "Scan the Meta Ad Library and the web for how the company's category, its alternatives and its audiences are advertised in its markets (from config/company.md and config/audiences.md), and turn findings into positioning, creative and offer ideas. Use before a creative round or when asked what competitors do."
---

# Competitor research

Output: `reports/<YYYY-MM-DD>-competitors.md` (English, with ad lines quoted in their own language); the chat summary is in the chat language from `config/operator.md`.

## Sources
- **`ads_library_search`** with `countries` and `search_terms`; filter ACTIVE. Works with any Meta login (the Ad Library is public). Build the term list from the config, per market and language:
  - **The category, in the audience's words** (`config/company.md` "what the company sells", `config/audiences.md`): the terms a buyer types or would recognise, in each market's language.
  - **The alternatives:** the portals, marketplaces, agencies or tools the audience uses today (`config/audiences.md` pains; `config/product.md` "what it does not do" hints at what they use instead).
  - **The suppliers' own ads** (when the company presents or serves other businesses' products): to learn what they claim, not to copy it.
  - **Services aimed at the B2B audience** (when `config/product.md` has a B2B funnel): what else is sold to them and how.
  - **Each other market** in `config/company.md`, in its language; note the special-ad-category labels and disclosures those ads carry.
- **Ad snapshot URLs** for creatives (open in a browser; read, do not copy).
- **Competitor sites** (WebFetch): offer, fees, who it is for, proof, disclosures, language.
- **Known references:** keep a dated list in the latest competitors report; the scan confirms or refutes it each time, including whether a direct competitor exists at all.

## What to extract per advertiser
Offer (fee model, free or paid, what the customer gets), audience framing (first-time buyer, expert, family, abroad …), hook pattern, format (video, static, carousel, UGC, founder on camera), proof used, landing page structure, scarcity or urgency device, disclosures (special ad category, AI imagery, licence numbers), how long the ads have run (a proxy for what works).

## Teardown of an ad that stands out
Use the `viral-reverse-engineering` method on the one or two ads that ran longest: layers (hook, trigger, proof, format, the ask, distribution), the counterfactual ("remove it: does it still work?"), driver vs incidental vs confound, the replicability check (luck, sample size, survivorship). Extract the mechanism, never the copy.

## Turn it into decisions
- **Positioning gap:** state the product's one-line promise (`config/product.md`) against what competitors are: catalogues of everything with no guidance, single suppliers with their own pitch, services that take a cut. Say the difference explicitly where the scan shows it.
- **Steal formats, not claims:** if founder-on-camera dominates, a film may be ready (`config/product.md` existing assets); if polished renders dominate, a real screen recording with private data blurred differentiates.
- **Fee context:** market norms and competitor pricing as competitors state them, with the source and date. Any fee or price line of the company's own stays out of ads unless `config/claims.md` clears it.

## Output
`reports/<YYYY-MM-DD>-competitors.md`: a table per advertiser, three patterns that repeat, three gaps the company can own, and five concrete creative or offer ideas handed to `creative-brief` and `ad-copy`. Quote at most one short line per competitor; summarise the rest. No personal data of individuals.
