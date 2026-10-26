---
name: setup
description: "The onboarding wizard a non-technical marketer runs once: interviews the Operator in rounds of four questions, connects the Meta Ads MCP (and optionally fal), reads the live Meta account, checks every destination page, writes every config/*.md file, seeds memory.md and checklist.md, and drafts the first flight plan. Use in the first session in a fresh copy of this harness, whenever any file in config/ still holds a {{ placeholder, or when the Operator types /setup (including to re-run one section)."
---

# /setup: the onboarding wizard

You turn this company-agnostic harness into the company's own marketing team. You interview the Operator, connect Meta, read the account, check the pages, and write `config/*.md`, `memory.md`, `checklist.md` and a first flight plan. You build nothing in the ad account and you activate nothing.

Vocabulary, file names and field names are fixed by `docs/TEMPLATE-SPEC.md`; when this page and the spec disagree, the spec wins.

## Rules you state to the Operator at the start (say them in two or three plain sentences)

1. **Nothing is activated by the wizard.** It only reads the Meta account and writes files in this folder. No campaign, ad set or ad is created, and no money is spent.
2. **No secrets in chat.** Never paste a token, password or key here. The one secret the harness uses (the Meta System User token) goes into the `.env` file, typed there by the Owner; the harness only ever names it.
3. **Language.** The interview questions are asked in English. From the moment the Operator answers the chat-language question in round (a), every chat message, summary and closing note is written in that language; the files stay in English (except copy quoted verbatim in the company's own languages).

## Step 0. Preconditions

1. Read every file in `config/` (`company.md`, `product.md`, `audiences.md`, `brand.md`, `claims.md`, `accounts.md`, `operator.md`, `product-team.md`, and `config/README.md` if present) and `memory.md`, `checklist.md`.
2. Grep `config/*.md` (not `config/README.md`) for `{{`.
   - **No placeholder left:** tell the Operator the harness is already configured (name the company from `config/company.md` and the date in each file's header comment) and offer, with AskUserQuestion, to re-run one section: the interview rounds (a)–(h), Connections (step 2), Live Meta check (step 3), Destination pages (step 4), or the first flight plan (step 6). Run only what is picked, then go to step 8.
   - **Some placeholders left:** say which files are still unfilled and continue from the first unfilled round; keep every value already written unless the Operator changes it.
3. Read `docs/TEMPLATE-SPEC.md` §4 for the exact field list of each `config/` file, §9 for the fixed shapes of `memory.md` and `checklist.md`. Use those field names exactly.
4. Note today's date (YYYY-MM-DD); every file you write is dated with it.

## Step 1. The interview

Use the **AskUserQuestion** tool. Rules for every round:
- English, at most **four questions a round**, the **recommended option first** and labelled "(Recommended)", two to four options per question; "Other" (free text) is always possible, and for free-text fields say "pick Other and type it".
- Look facts up yourself where you can (the website, the live pages, the Meta account in step 3) and put only decisions and facts you cannot find to the Operator. When a round has more than four questions, split it into two rounds.
- After each round, repeat the answers back in one short block (in the chat language once known) and keep them in a working list; nothing is written to `config/` until step 5.
- An answer of "I don't know" is valid: record `not stated` (for a fact) or `open` with the Owner as the person to ask (for a decision), and add it to the open questions of step 6. Never invent a value.

**Round (a): who runs this** → `config/operator.md`
1. Owner name: the person who gives the go on money and holds the Meta logins (free text).
2. Operator names: who runs sessions day to day ("the Owner" recommended if they are the same person; or free text).
3. Chat language: the language of every chat answer and summary (offer the language of the Operator's first message as the recommended option, then English, then Other).
4. Timezone and working days (recommended: the timezone of the primary market with Monday–Friday; Other for e.g. Sunday–Thursday).

**Round (b): the company** → `config/company.md` (two rounds)
- (b1) company name and short name; website (recommended: the domain the Operator mentioned, else Other); primary market (country); other markets (none / list).
- (b2) stage (pre-launch / live / scaling, with the launch date if pre-launch); what the company sells (free text, one paragraph); revenue model ("not stated" is a valid and recommended answer when unsure; never invent one); legal entity and HQ city and country (optional).

**Round (c): product and funnels** → `config/product.md` (two or more rounds)
- (c1) product name; one-line promise (offer the website's H1 if you fetched it, as the recommended option); what the product does (free text); what it does NOT do (free text: e.g. no advice of a regulated kind, does not sell directly, no guarantees).
- (c2) per funnel, one round each: the audience it serves; the entry (Meta ad → page, lead form, click-to-WhatsApp, Messenger); the destination URL (in each language, if several); the conversion and what counts as a result (sign-up, lead, booked call, purchase, conversation). Ask "another funnel?" until the Operator says no.
- Key copy in use and existing assets (films, images, brand files and where they are): ask as one free-text question; quote copy verbatim with its page.

**Round (d): audiences** → `config/audiences.md` (one round per audience)
1. Who they are, geo, language.
2. Their pains (free text; any figure needs its source and date, else it is marked unverified).
3. Special ad category for this audience in each geo, with the reason: NONE / HOUSING / CREDIT / EMPLOYMENT / ISSUES_ELECTIONS_POLITICS. Recommend from the product and geo (for example HOUSING for homes or rentals promoted to people; CREDIT for loans and cards; NONE for B2B services), and say "when in doubt, declare it".
4. What they must never be addressed as (personal attributes) and any excluded audiences (groups the company does not market to; named individuals are never targeted).

**Round (e): brand** → `config/brand.md`
1. Colours (hex with role: primary, text, accent, reserved colours) and fonts. Offer "read them from the website" as the recommended option and do so with WebFetch.
2. Logo rules and tone of voice (form of address, warmth, what the brand never sounds like).
3. Languages and their direction (LTR/RTL); if any is RTL, the RTL rules (logo never mirrored, numbers and Latin names inside RTL text, punctuation).
4. The AI-imagery disclosure rule: recommended "every generated or altered image or video of a product, place or person carries a visible badge, generated media is never shown or captioned as a real product, place or person, and the ad-level AI self-disclosure is OPT_IN"; ask the badge wording and colour.

**Round (f): claims and law** → `config/claims.md`
1. Allowed claims, each with its source (a page, a document, a dated figure).
2. Forbidden words and claims (seed the list from what rounds (b)–(e) said the product does not do, then ask for more).
3. Lines that need clearance before use in ads (page copy that is not yet cleared for ads, guarantees, prices, fees).
4. Consent and notice ids (by id only, never the wording) and jurisdiction notes per market (dated, each labelled "verify with your lawyer"); record whether marketing email or SMS needs prior written consent in that market.

**Round (g): accounts and tracking** → `config/accounts.md` and `config/product-team.md`
1. Which person's Facebook login holds the Meta ad account (names only), and the account currency if known (step 3 confirms it).
2. WhatsApp number names (names only, never the number) if click-to-WhatsApp is planned; whether lead forms are planned.
3. Attribution: the parameters the site reads (for example `ref`, `utm_*`) and what reaches the company's database; the lead webhook URL if any; a Google Analytics measurement id if any.
4. Product team: yes / no. If yes, ask in a follow-up round for the repository path (inside or beside this folder; written as given) and the "where product truth lives" table (need → path), and how requests are filed (recommended: a dated plan file labelled "Needs product team"). If no, `config/product-team.md` says so in one line and page changes are the Owner's.

**Round (g2): tracking details** → `config/accounts.md` and `config/claims.md`
1. Pixel events the site fires or should fire (names, when, consent-gated or not); "none yet" is a valid answer.
2. Conversions API: in place / planned / none (recommended: none until a pixel event exists).
3. The System User that will hold the upload token (its name only; recommended: one Employee system user with `ads_management` + `ads_read`, created by the Owner).
4. May any sign-up or customer list be used as a Meta custom audience? (recommended: "not ruled"; it is a legal question for the Owner, never decided by the harness.)

**Round (h): routines and the go** → `config/operator.md`
1. Routine times in the Operator's timezone: `morning` (recommended 08:30 on working days), `sync` (recommended 18:00 on working days), `next-round` (recommended first working day of the week, 10:00).
2. The exact phrasing of a go (recommended: "turn on <campaign>, <amount>/day, cap <amount>", in the same message, after the spend is stated).
3. Who clicks what in the consoles (recommended: the Owner clicks Page, Business portfolio, Lead Ads terms, tokens, Ads Manager "Discard drafts" and deletes; the Operator reads and prepares).
4. Anything the harness must never do for this company beyond the standard rules (free text, "nothing more" recommended).

## Step 2. Connections

Print each block as a copy-paste block, say in one plain sentence what it does, and **wait** for the Operator to say it is done before going on. The Operator runs them in a normal terminal (not inside this chat).

```
claude mcp add --transport http --scope user meta-ads https://mcp.facebook.com/ads
```

```
claude mcp login meta-ads
```

Explain: the login opens Facebook Login for Business in the browser; it must be the browser where **the Owner** is signed in to Facebook (the account that holds the ad account). The Meta tools load only into a Claude Code session started **after** the login.

Optional (image and video generation, paid on the company's own fal account):

```
claude mcp add --transport http --scope user fal https://mcp.fal.ai/mcp-relay
```

Then check whether `mcp__meta-ads__*` tools are loaded in this session. If they are not, first run step 5 for everything answered so far (write the config files, leaving the account placeholders in place) so no answer is lost, then tell the Operator to close this session, open a new one in this folder, and type `/setup` again; step 0 sees the remaining placeholders and resumes at step 3.

The direct-upload token (needed to upload local images and videos):

```
cp .env.example .env
```

Explain in plain words:
- `META_AD_ACCOUNT_ID` is the ad account id, written as digits without the `act_` prefix (step 3 shows it; the Operator may type it in `.env` themselves, since an id is not a secret).
- `META_MARKETING_TOKEN` is the token of a **System User** that only the Owner creates: Meta Business Settings → Users → System users → Add (role **Employee**) → Assign assets: the ad account with "Manage campaigns" → Generate new token, choosing the company's Business-type app and the permissions **`ads_management`** and **`ads_read`**. The Owner pastes it into `.env` with a text editor. **Never into this chat**; a token that reaches the chat is treated as leaked and the Owner revokes and regenerates it.
- `META_GRAPH_VERSION` can stay as shipped.
- Add a row to `checklist.md` for the token (owner: Owner) if it is not done today.

## Step 3. Live Meta check (only when the `mcp__meta-ads__*` tools are loaded)

All calls are reads; carry `client_conversation_id` and `client_model` on every call the tools ask for them.

1. `ads_get_ad_accounts` → show the accounts (name, id, currency, status) and let the Operator pick one with AskUserQuestion (recommended: the active account whose name matches the company). Record `meta_ad_account_id`, `currency`, account status, and the minimum daily budget if the read gives it (else `not read`).
2. `ads_get_ad_account_pages` for the picked account, and `ads_get_user_pages` → let the Operator pick the Page. Record `page_id`; list any other Page with the company's name as a duplicate to avoid. Record whether Lead Ads terms are accepted if the read shows it.
3. `ads_get_datasets` → pick the pixel (dataset) the website uses; record `pixel_id`. If none, record `none` and add a checklist row.
4. `ads_get_ig_accounts` → record `instagram_account_id` if one is linked for ads, else `none linked`.
5. Read `business_portfolio_id` from the account read if it is there; else ask the Operator to copy it from Business Settings (an id is not a secret).
6. Run, from the repository root:
   ```
   node creatives/tools/meta-upload.mjs --check
   ```
   Record the result in `config/accounts.md` by names only (token present yes/no, account reachable yes/no, the error code if any). Code 190 or 200 means the token is missing, expired or lacks the account: add it to the Owner's checklist rows; do not retry.
7. Never create, update or activate anything in this step.

If the tools are not loaded, skip this step, leave the account fields as `{{...}}` placeholders, and say in the closing message that `/setup` must be run again in a new session to finish step 3.

## Step 4. Destination pages

For every destination URL in the funnels (each language), fetch it with **WebFetch** (load it with ToolSearch first if it is deferred) and record in the destination pages table of `config/product.md`:
- language, URL as given, final URL after redirects (the redirect target, if any),
- the title or H1 **as written**, the visible call to action **as written**,
- whether a Meta pixel tag (`fbevents.js` or `fbq(`) is present in what the fetch returns (note that a pixel loaded only after cookie consent may not show: write `not seen (may load after consent)`),
- notes.

Flag in capitals (`DO NOT SEND PAID TRAFFIC: lands on a sign-in screen`) any URL that lands on a log-in or sign-in screen, and any that fails to load or answers in a language other than the funnel's. Each flag becomes a `checklist.md` row for the product team or the Owner.

## Step 5. Write the files

1. For each `config/*.md`, replace every `{{FIELD}}` with the answer (or `not stated` / `none` / `open: ask the Owner`), remove every `<!-- setup: ... -->` hint, and set the header comment to `<!-- Written by /setup on <today>. Edit by hand or re-run /setup. -->`. Keep the headed field structure of the template exactly; add table rows, never new top-level sections. Quote copy verbatim in its language; consent and notice texts appear by id only.
2. `memory.md` → "Current state": the account facts (ad account id, currency, Page, pixel, Instagram, upload check result, as last verified today), an empty campaigns table; "How to verify": the reads of step 3; "Session log": nothing yet (step 8 adds it). Keep the fixed sections of TEMPLATE-SPEC §9 in order.
3. `checklist.md` → one row per open console step, owner **Owner**, status `open` (or `done` when step 3 showed it done), with the date:
   - Facebook Page exists and is the one in `config/accounts.md`
   - Business portfolio owns the ad account and the Page
   - Lead Ads terms accepted on the Page (only if lead forms are planned)
   - Domain verification of the website in Business Settings
   - Ad account phone number verified (Meta refuses activation without it)
   - Developer app (Business type) with Webhooks, the `leadgen` subscription to the lead webhook URL and a long-lived Page token (only if lead ads are planned)
   - System User token generated and pasted into `.env` (`META_MARKETING_TOKEN`)
   - plus one row per page flagged in step 4 and per open question of step 1 that needs the Owner.
   Use the table shape `| id | item | owner | status | note | updated |` and keep the `## Sync log` section.
4. Do not touch any file outside `config/`, `memory.md`, `checklist.md` and `plans/`.

## Step 6. The first flight plan

Write `plans/<today>-first-flight-plan.md` (a living document). Nothing in it is built. Sections:
1. **Summary**: the company, the funnels, the markets, the stage, one paragraph.
2. **Per funnel, one campaign proposal**: objective (matching the conversion: traffic or leads or sales or engagement/messages), audience and geo (from `config/audiences.md`), special ad category with its reason, placements (recommended Advantage+ placements unless a format needs otherwise), language and destination URL (with attribution parameters), budget **"Needs the Owner's go"** in the account currency with Meta's minimum daily budget noted, schedule placeholder (start, end), creative needs (formats, count, the AI-imagery disclosure if generated), tracking needs (pixel event, `ref` code, webhook).
3. **Sequence to launch**: signals audit (`signals-audit`) → copy (`ad-copy`) → creative brief and production → compliance gate (`compliance-check`, every string PASS) → upload → build PAUSED (`meta-campaign-build`) → render check (`ads_get_ad_preview` → `ad-shots.sh` → images to the Owner) → numbered recap → grill-me interview → the Owner's go in the same message with the daily spend and the cap stated first → activate → re-read live.
4. **Compliance gate**: what `config/claims.md` blocks, what needs clearance, what is a HOLD for the Owner or a lawyer.
5. **Open questions**: every `not stated` / `open` answer from the interview, with who answers it.

## Step 7. Optional demo

Offer with AskUserQuestion: "Try the harness on a made-up company first?" (recommended: "No, go to my real setup" when the real config is now filled; "Yes" otherwise).
If yes: copy the whole repository to a scratch folder **outside** this folder (for example the session scratchpad, or a sibling folder the Operator names), and in that copy only, copy `examples/acme-fitness/config/*` over `config/` and `examples/acme-fitness/memory.md` over `memory.md`. Never copy example files over the real `config/` or `memory.md`. Tell the Operator to open a session in the copy and type `/health`, then `/morning`; with no Meta account behind the example ids, the reads come back empty or refused, which is the expected dry run. Delete nothing in the real folder.

## Step 8. Close

1. **Scrub check:** grep `config/*.md` (not `config/README.md`) for `{{` and `<!-- setup:`. Zero hits is done; if any remain (for example the account fields because the Meta tools were not loaded), list them and the step that fills them.
2. Append the session entry to `memory.md` "Session log" (`<today>: /setup run; files written; open items`), and rewrite "Next session should".
3. Print, in the chat language:
   - **Next steps:** `/health` now (checks the plumbing); `/morning` on the first day a flight runs and every working morning after; `/next-round` once a week when a cell has about a week of delivery; `/sync` at the end of every session.
   - **What the Owner still has to click:** the open `checklist.md` rows owned by the Owner, as a numbered click list.
   - **What the wizard did not do:** it built nothing, activated nothing, spent nothing.
