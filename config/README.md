# config/

Everything specific to the company lives in this folder. The rules in `CLAUDE.md`, the skills in `.claude/skills/` and the agents in `.claude/agents/` never name the company, its product, its people, its markets or its account ids; they read them from these files by name. `CLAUDE.md` imports every file here with an `@config/<file>.md` line, so each session starts with the company facts loaded.

## Who writes these files

The `/setup` wizard writes them. It interviews the Operator in rounds of four questions (in English, recommended option first), runs a live Meta check for the ids, fetches each destination page, and fills the placeholders. Each file starts with a header comment saying when `/setup` wrote it. Re-run `/setup` whenever the company, product, accounts or people change; it shows what it is about to replace before writing.

## The files

| File | What it holds | Read by |
|---|---|---|
| `company.md` | Name, short name, legal entity, website, headquarters, the primary market and other markets, what the company sells, stage (and launch date, if pre-launch), revenue model | every skill; the control room |
| `product.md` | Product name, promise, what it does and does not do, the funnels table, the destination pages table, key copy in use (verbatim), existing assets | `ad-copy`, `landing-page-cro`, `offer-design`, `meta-campaign-build`, `meta-performance-report` |
| `audiences.md` | One section per audience: who, geo, language, pains (with sources and dates), what they must not be addressed as, exclusions, special ad category | `audience-research`, `ad-copy`, `compliance-check`, `meta-campaign-build` |
| `brand.md` | Colours, fonts, logo rules, tone of voice, languages and their direction, RTL rules, the AI-imagery disclosure rule, the do-not-do list | `creative-brief`, `creative-production`, `ad-copy` |
| `claims.md` | Allowed claims with sources, forbidden words and claims, lines needing clearance, consent and notice ids, dated legal notes ("verify with your lawyer"), special ad category per market, the custom-audience ruling | `compliance-check`, `ad-copy`, `landing-page-cro` |
| `accounts.md` | Meta ids (ad account, portfolio, Page, Instagram, pixel, forms), WhatsApp number names, currency, minimum daily budget, analytics and attribution, lead webhook, who holds each login, console-step status | `meta-campaign-build`, `signals-audit`, `health`, `morning` |
| `operator.md` | Owner, Operators, chat language, timezone, working days, routine times, the phrasing of a go, who clicks what | every command; the control room |
| `product-team.md` | The product repository (read-only), where product truth lives, how a request is filed, shared memory conventions; or the one line saying there is no product team | `landing-page-cro`, `signals-audit`, `memory-update` |

## Editing by hand

- Replace a double-brace placeholder with the value; keep the bold field label and the table headers as they are (skills look for them).
- The setup comments (HTML comments beginning `setup:`) are hints; leave them or delete them, they are not read as data.
- Tables: one row per item; copy a row to add another. Sections in `audiences.md`: copy the whole section per audience.
- Quote page copy and claims verbatim; never paraphrase a consent or notice text (quote its id in `claims.md`).
- No secrets in any file here: ids are public, tokens are not. Tokens go in the repo-root `.env` (see `.env.example`).
- No personal data (names, emails, phones of customers or leads). The Owner's and Operators' names in `operator.md` are the only names.
- After a hand edit, run `/health`: it flags placeholders left unfilled and ids that disagree with a live read.
- A worked example of every file, for a fictional company, is in `examples/acme-fitness/config/`.
