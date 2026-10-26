---
name: setup
description: "The onboarding wizard a non-technical marketer runs once: checks the prerequisites and the .mcp.json servers, interviews the Operator in rounds of four questions (goals and money included), prints the Owner's Meta console click lists with live checks, reads the Meta account and the destination pages, writes config/*.md (goals.md included), memory.md and checklist.md, and drafts the first flight plan inside the budget band and caps. Use in the first session of a fresh copy of this harness, whenever a config/ file still holds a {{ placeholder, or when the Operator types /setup (also to re-run one section)."
---

# /setup: the onboarding wizard

You turn this company-agnostic harness into the company's own marketing team: you check the prerequisites, interview the Operator, hand the Owner the Meta console click lists, read the account, check the pages, and write `config/*.md`, `memory.md`, `checklist.md` and a first flight plan. You build nothing in the ad account and you activate nothing.

Vocabulary, file names and field names are fixed by `docs/TEMPLATE-SPEC.md`; when this page and the spec disagree, the spec wins.

## Rules you state to the Operator at the start (say them in two or three plain sentences)

1. **Nothing is activated by the wizard.** It only reads the Meta account and writes files in this folder. No campaign, ad set or ad is created, and no money is spent.
2. **No secrets in chat.** Never paste a token, password or key here. The one secret the harness uses (the Meta System User token) goes into the `.env` file, typed there by the Owner; the harness only ever names it and never opens `.env`.
3. **Language.** The interview questions are asked in English. From the moment the Operator answers the chat-language question in round (a), every chat message, summary and closing note is written in that language; the files stay in English (except copy quoted verbatim in the company's own languages).

## Step 0. Preconditions

1. Read every file in `config/` (`company.md`, `product.md`, `audiences.md`, `brand.md`, `claims.md`, `accounts.md`, `operator.md`, `goals.md`, `product-team.md`, and `config/README.md` if present) and `memory.md`, `checklist.md`.
2. Grep `config/*.md` (not `config/README.md`; `goals.md` included) for `{{`.
   - **No placeholder left:** tell the Operator the harness is already configured (name the company from `config/company.md` and the date in each file's header comment) and offer, with AskUserQuestion, to re-run one section: Prerequisites (step 0.5), the interview rounds (a)–(i) (round (i) alone re-sets the money limits in `config/goals.md`), Connections and console steps (step 2), Live Meta check (step 3), Destination pages (step 4), or the first flight plan (step 6). Run only what is picked, then go to step 8.
   - **Some placeholders left:** say which files are still unfilled and continue from the first unfilled round; keep every value already written unless the Operator changes it.
3. Read `docs/TEMPLATE-SPEC.md` §4 for the exact field list of each `config/` file, §9 for the fixed shapes of `memory.md` and `checklist.md`. Use those field names exactly.
4. Note today's date (YYYY-MM-DD); every file you write is dated with it.

## Step 0.5. Prerequisites and connections

Run `git --version`, `node --version` and `claude --version` yourself through Bash from the repository root and show a short table (item, found, needed, what to do). Needed: Git; Node **20 or newer** (the upload tool needs it); Claude Code (a desktop-app session may lack the `claude` command; only the typed fallback below needs it). Also run `claude plugin list` when the command exists: the HyperFrames plugin row of `config/accounts.md` reads `installed` or `not installed` (also `not installed` without the command). Not installed is fine (video is optional); the Owner can add it later with `claude plugin marketplace add ./vendor/hyperframes` (the plugin ships in `vendor/hyperframes/`; the renderer needs Node 22+ and FFmpeg) then `claude plugin install hyperframes@hyperframes`.
- **Missing or too old:** never install from the chat. The Operator closes Claude Code and runs the bootstrap in this folder, report-only first: Windows `powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 -Check`, macOS `bash bootstrap.sh --check`, then the same without the flag. It asks before each install, copies `.env.example` to `.env`, offers `playwright-core` and the HyperFrames plugin, and prints what remains; then the Operator reopens the folder in Claude Code and types `/setup`.
- **`.env`:** only check that it exists (`test -f .env && echo present || echo missing`); never open, read, grep or print it.
- **`.mcp.json`** (it holds no secret): it lists `meta-ads` (`https://mcp.facebook.com/ads`) and `fal` (`https://mcp.fal.ai/mcp-relay`).
- **Tools:** are `mcp__meta-ads__*` and `mcp__fal__*` loaded (load deferred ones with ToolSearch, e.g. `mcp__meta-ads__ads_get_ad_accounts`)? fal is optional (paid generation on the company's own account). **Meta tools missing:** the Operator approves both servers when Claude Code asks about this folder's `.mcp.json` (`/mcp` lists them if the question was dismissed), types `/mcp` → `meta-ads` → log in with the Owner's Facebook, in the browser where the Owner is signed in (console step 5), then opens a new session here and types `/setup` again: the tools load only into a session started after the login. The typed fallback, in a normal terminal, then `/mcp` → log in:
  ```
  claude mcp add --transport http --scope user meta-ads https://mcp.facebook.com/ads
  claude mcp add --transport http --scope user fal https://mcp.fal.ai/mcp-relay
  ```
  Ask with AskUserQuestion: "Log in to Meta now and restart (Recommended)" or "Interview first, Meta at the end". Before any restart, run step 5 for the answers so far (the account placeholders stay).

## Step 1. The interview

Use the **AskUserQuestion** tool. Rules for every round:
- English, at most **four questions a round**, the **recommended option first** and labelled "(Recommended)", two to four options per question; "Other" (free text) is always possible, and for free-text fields say "pick Other and type it".
- Look facts up yourself where you can (the website, the live pages, the Meta account in step 3) and put only decisions and facts you cannot find to the Operator. When a round has more than four questions, or a question depends on an answer given in the same round, split it into two rounds.
- After each round, repeat the answers back in one short block (in the chat language once known) and keep them in a working list; nothing is written to `config/` until step 5.
- An answer of "I don't know" is valid: record `not stated` (for a fact) or `open` with the Owner as the person to ask (for a decision), and add it to the open questions of step 6. Never invent a value.

**Round (a): who runs this** → `config/operator.md`
1. Owner name: the person who gives the go on money and holds the Meta logins (free text).
2. Operator names: who runs sessions day to day ("the Owner" recommended if they are the same person; or free text).
3. Chat language: the language of every chat answer and summary (offer the language of the Operator's first message as the recommended option, then English, then Other).
4. Timezone and working days (recommended: the timezone of the primary market with Monday–Friday; Other for e.g. Sunday–Thursday).

**Round (b): the company** → `config/company.md` (two rounds)
- (b1) company name and short name; website (recommended: the domain the Operator mentioned, else Other; "no website" is a valid answer, see round (c2)); primary market (country); other markets (none / list).
- (b2) stage (pre-launch / live / scaling, with the launch date if pre-launch); what the company sells (free text, one paragraph); revenue model ("not stated" is a valid and recommended answer when unsure; never invent one); legal entity and HQ city and country (optional).

**Round (c): product and funnels** → `config/product.md` (two or more rounds)
- (c1) product name; one-line promise (offer the website's H1 if you fetched it, as the recommended option); what the product does (free text); what it does NOT do (free text: e.g. no advice of a regulated kind, does not sell directly, no guarantees).
- (c2) per funnel, one round each: the audience it serves; the entry (Meta ad → page, lead form, click-to-WhatsApp, Messenger); the destination URL (in each language, if several); the conversion and what counts as a result (sign-up, lead, booked call, purchase, conversation). Ask "another funnel?" until the Operator says no.
- **No website** (round (b1)): each funnel enters by click-to-WhatsApp (recommended when someone answers chats within a working day) or an instant form (when the company calls back); the destination pages table of `config/product.md` holds one row `none (no website)`; the pixel steps (round (g2) 1–2, console step 6, the fetch of step 4) are skipped, noted "no website: no pixel; Meta counts the conversations or leads".
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
2. WhatsApp number names (names only, never the number) if click-to-WhatsApp is planned; whether lead forms are planned and, if so, `lead_delivery`: how their leads reach the person who answers them (recommended "Leads Center"; or email notifications, CSV download, a CRM by name; the webhook only with a product team that can receive it).
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

**Round (i): goals and money** → `config/goals.md`, in two rounds (the caps depend on the band); amounts in the account currency. With the Meta tools loaded, run the account read of step 3.1 first (reuse its pick) for the currency and the minimum daily budget.
- (i1)
  1. **Monthly budget band** (from–to): 300–600, 600–1,500 and 1,500–3,000 times Meta's minimum daily budget (major unit), rounded; without the read, about that many US dollars' worth in the round (g) currency, labelled approximate. Recommended: the middle band.
  2. **Target cost per result**, one question per funnel: recommended "Not stated yet: set after the first week of data"; Other for an amount and its source (margin per customer, a past campaign, an estimate).
  3. **First funnel to launch**: recommended the one with the simplest conversion (click-to-WhatsApp, or a page sign-up the pixel already records); record why.
  4. **Success in 30 days**, one measurable sentence: recommended "The first funnel runs 30 days inside the caps and we know its real cost per result"; Other for a number.
- (i2)
  1. **Hard caps**, all campaigns together, shown as amounts: recommended monthly = the top of the band, daily = 1/25 of it, weekly = 7× daily, per campaign (its lifetime spending limit) = the monthly cap ÷ the number of funnels, rounded down; "Tighter: half of each".
  2. **Risk appetite for tests**: recommended "Up to 20 % of the band on experiments and new creatives"; "Up to 10 %"; "None until the first flight has a week of data".
  3. **Review cadence**: recommended "Weekly, in `/next-round`" (at the time from round (h)); "Every two weeks".

**Budget week** is written without a question: `Sunday–Saturday (Meta's budget week)`. The caps are the Owner's: if someone else answers, Set by reads "proposed by <Operator>; Owner to confirm", with an Owner row in `checklist.md`. Tell the Operator: `/morning` and `/sync` copy the caps into `dashboard/state.json` (`money.caps`) and flag spend above 80 % of a cap; the first flight plan proposes budgets inside the band and below the caps, still labelled "Needs the Owner's go"; a cap change is the Owner's, in writing.

## Step 2. Connections and the Owner's Meta console steps

**(a) Connections.** The servers ship in `.mcp.json`: approve them when Claude Code asks, then `/mcp` → `meta-ads` → log in, in the browser where the Owner is signed in to Facebook (step 0.5); the typed `claude mcp add` lines of step 0.5 stay the fallback.

**(b) Console click lists.** Print the whole list in one message, in the chat language (Meta's labels in English); what does not apply (WhatsApp, lead forms; pixel and domain without a website) is marked `n/a`. Meta's labels drift, outcomes do not: read a changed screen for the outcome. Do not wait for "done" per step: after printing, run every live check a read can do, then record each status (done / open / n/a / unknown, dated) under the row names in bold below, in the console-steps table of `config/accounts.md` and as `checklist.md` rows (owner Owner). `docs/meta-setup-guide.md` repeats the steps with their pitfalls.

1. **Business portfolio.** `https://business.facebook.com/settings`: pick the company's portfolio or create one (business name, the Owner's name, a work email). *You should see:* the Owner with full control under Users → People. *Live check:* step 3 reads the business behind the ad account.
2. **Page.** Business Settings → Accounts → Pages: the company's Page (create one at `https://www.facebook.com/pages/create` only if there is none). **Instagram linked for ads (optional):** Accounts → Instagram accounts → connect the professional account. *You should see:* the Page (and Instagram) with the Owner's full control. *Live check:* `ads_get_user_pages`, `ads_get_ad_account_pages`, `ads_get_ig_accounts`.
3. **Ad account owned by the portfolio.** Business Settings → Accounts → Ad accounts: an existing one owned by the portfolio, or Add → Create a new ad account → name, **time zone**, **currency**, the Owner with full control. **The time zone and the currency are permanent**: a wrong one means a new ad account. Then the **Payment method on the ad account** (Billing and payments) and the **Phone number verified on the ad account** (Meta sends a code, sometimes only at the first publish; no ad activates without it). *You should see:* the account active, with a payment method, in the currency and time zone you meant: check both now, they can never be changed. *Live check:* `ads_get_ad_accounts` (id, currency, status, minimum daily budget); the phone has no read and stays `open` until the Owner confirms it.
4. **People and roles** (a `checklist.md` row only). Users → People → invite the Operator's work email as an employee → assign the ad account with **Manage campaigns** (`n/a` when the Owner operates). *You should see:* the Operator, once the emailed invitation is accepted, with the ad account. *Live check:* none.
5. **MCP login (`meta-ads`).** `/mcp` → `meta-ads` → log in: Facebook Login for Business names the app and what it asks for (to manage and read ads, and the business's Pages and assets); share only the company's portfolio, ad account and Page (and Instagram), then open a new session and type `/setup`. An asset created after the login may need a re-login (`/mcp` → `meta-ads` → re-authenticate). *You should see:* `meta-ads` connected in `/mcp`. *Live check:* `ads_get_ad_accounts` shows the company's account and nothing the Owner did not mean to share.
6. **Pixel / dataset created and installed (or "no website").** Events Manager `https://business.facebook.com/events_manager2` → connect a data source → Web → name it → install it through the website platform's Meta integration or the manual base code (for whoever runs the site), firing only after cookie consent where the law requires it. "No pixel yet" is valid: `pixel_id` reads `none yet` (or `none (no website)`), and the first flight optimises for a result Meta counts itself (conversations, leads, link clicks). *You should see:* PageView events after a test visit with consent given. *Live check:* `ads_get_datasets`, `ads_get_dataset_stats`; step 4 per page.
7. **Developer app (Business type) + System User token in `.env`.** `https://developers.facebook.com/apps` → Create app → **Business** type → name, email, the company's portfolio → add **Marketing API** (Business Settings → Accounts → Apps then lists it). Users → System users → Add (role **Employee**) → Add assets: the ad account (**Manage campaigns**), the app (**Develop app**) → Generate token → **`ads_management`** + **`ads_read`** → copy. The Owner pastes it into `.env` after `META_MARKETING_TOKEN=` with a text editor, **never into this chat**. To rotate (a token that reached the chat is burned, or one expired): first Revoke the system user's existing tokens for the app, then Generate new token, then paste it into `.env`, in that order: Meta's Revoke can invalidate every token of that system user for the app, including one generated a minute earlier. `META_AD_ACCOUNT_ID` is the account id in digits without `act_` (not a secret). *You should see:* the system user with both assets; Meta shows the token once. *Live check:* `node creatives/tools/meta-upload.mjs --check` (step 3.6).
8. **WhatsApp Business number linked to the Page** (click-to-WhatsApp only). With the number already on the WhatsApp Business app (Meta stops otherwise): Page settings → Linked accounts → WhatsApp → connect it with the code Meta sends. A second number is never made the Page's primary (ad sets that name no number follow the primary). *You should see:* WhatsApp connected on the Page. *Live check:* none (the MCP cannot read or set the number); its name, never the number, goes in `whatsapp_number_names`.
9. **Lead Ads terms accepted on the Page** (instant forms only): `https://www.facebook.com/ads/leadgen/tos`; then Business Suite (`https://business.facebook.com/`) → All tools → Instant forms → create and publish the form with the company's privacy policy URL; copy its id. **Leads Center access for whoever answers leads:** leads arrive by default in Meta's Leads Center (Business Suite), with email notifications, a CSV download or a CRM integration Meta offers; the person under replies in `config/operator.md` gets access, and the notifications are confirmed before the first lead ad runs. *You should see:* the form in the forms library; that person can open Leads Center. *Live check:* none (no lead-form tool); the form's id and name go in `lead_form_ids`, the path in `lead_delivery`.
10. **Domain verified** (recommended). Business Settings → Brand safety → Domains → Add → verify by the DNS TXT record or the meta tag, given to whoever runs the domain or the site. *You should see:* the domain verified. *Live check:* for the meta tag, fetch the homepage and look for `facebook-domain-verification`; otherwise the Owner confirms.

**Not a standard step: Lead webhook subscription (advanced, only with a product team).** Only when `config/product-team.md` names a product team that runs an endpoint for Meta's `leadgen` webhook: Webhooks on the developer app, the Page subscribed to `leadgen`, a long-lived Page token, every running form id registered; a `checklist.md` row for that team. Otherwise the row is `n/a` and `lead_webhook_url` reads `none: leads are read in Leads Center`.

## Step 3. Live Meta check (only when the `mcp__meta-ads__*` tools are loaded)

All calls are reads (never create, update or activate anything here); carry `client_conversation_id` and `client_model` on every call the tools ask for them.

1. `ads_get_ad_accounts` → show the accounts (name, id, currency, status) and let the Operator pick one with AskUserQuestion (recommended: the active account whose name matches the company); reuse the pick if round (i) made it. Record `meta_ad_account_id`, `currency`, account status, and the minimum daily budget if the read gives it (else `not read`).
2. `ads_get_ad_account_pages` for the picked account, and `ads_get_user_pages` → let the Operator pick the Page. Record `page_id`; list any other Page with the company's name as a duplicate to avoid. Record whether Lead Ads terms are accepted if the read shows it.
3. `ads_get_datasets` → pick the pixel (dataset) the website uses; record `pixel_id`. If none, record `none yet` and add a checklist row (`none (no website)` without a website).
4. `ads_get_ig_accounts` → record `instagram_account_id` if one is linked for ads, else `none linked`.
5. Read `business_portfolio_id` from the account read if it is there; else ask the Operator to copy it from Business Settings (an id is not a secret).
6. Run, from the repository root:
   ```
   node creatives/tools/meta-upload.mjs --check
   ```
   Record the result in `config/accounts.md` by names only (token present yes/no, account reachable yes/no, the error code if any). Code 190 or 200 means the token is missing, expired or lacks the account: add it to the Owner's checklist rows; do not retry.
7. Record `lead_delivery` in `config/accounts.md`: the round (g) answer (`Leads Center` by default), or `n/a (no instant forms)`.
8. Update the console-steps rows the reads can show (portfolio, Page, ad account, MCP login, pixel, token, Instagram) in `config/accounts.md`.

If the tools are not loaded, skip this step, leave the account fields as `{{...}}` placeholders, and say in the closing message that `/setup` must be run again in a new session to finish step 3.

## Step 4. Destination pages

For every destination URL in the funnels (each language), fetch it with **WebFetch** (load it with ToolSearch first if it is deferred) and record in the destination pages table of `config/product.md`:
- language, URL as given, final URL after redirects (the redirect target, if any),
- the title or H1 **as written**, the visible call to action **as written**,
- whether a Meta pixel tag (`fbevents.js` or `fbq(`) is present in what the fetch returns (note that a pixel loaded only after cookie consent may not show: write `not seen (may load after consent)`),
- notes.

Flag in capitals (`DO NOT SEND PAID TRAFFIC: lands on a sign-in screen`) any URL that lands on a log-in or sign-in screen, and any that fails to load or answers in a language other than the funnel's. Each flag becomes a `checklist.md` row for the product team or the Owner.

**No website:** nothing to fetch; the table keeps its one `none (no website)` row, console steps 6 and 10 are `n/a`, and the first flight uses click-to-WhatsApp or an instant form.

## Step 5. Write the files

1. For each `config/*.md` (`goals.md` included), replace every `{{FIELD}}` with the answer (or `not stated` / `none` / `open: ask the Owner`), remove every `<!-- setup: ... -->` hint, and set the header comment to `<!-- Written by /setup on <today>. Edit by hand or re-run /setup. -->`. Keep the headed field structure of the template exactly; add table rows, never new top-level sections. Quote copy verbatim in its language; consent and notice texts appear by id only.
2. `memory.md` → "Current state": the account facts (ad account id, currency, Page, pixel, Instagram, upload check result, as last verified today), an empty campaigns table; "How to verify": the reads of step 3; "Decision rules": one dated line pointing to the money limits in `config/goals.md`; "Session log": nothing yet (step 8 adds it). Keep the fixed sections of TEMPLATE-SPEC §9 in order.
3. `checklist.md` → one dated row per item, owner **Owner** unless named, status `open` (`done` when step 3 showed it, `n/a` when it does not apply):
   - each console-steps row of `config/accounts.md`, by its row name: Page; Business portfolio; Ad account owned by the portfolio; Payment method on the ad account; Phone number verified on the ad account (required before any activation); MCP login (`meta-ads`); Pixel / dataset created and installed (or "no website"); Developer app (Business type) + System User token in `.env`; WhatsApp Business number linked to the Page; Lead Ads terms accepted on the Page; Leads Center access for whoever answers leads; Domain verified; Instagram linked for ads (optional)
   - People and roles: the Operator has Manage campaigns on the ad account (console step 4)
   - Lead webhook subscription (advanced, only with a product team): owner Product team, only when `config/product-team.md` names a product team that receives leads
   - the Owner confirms the caps in `config/goals.md` (only when the Operator proposed them)
   - one row per missing prerequisite of step 0.5 (installs: owner Operator), per page flagged in step 4 and per open question of step 1 that needs the Owner.
   Use the table shape `| id | item | owner | status | note | updated |` and keep the `## Sync log` section.
4. Do not touch any file outside `config/`, `memory.md`, `checklist.md` and `plans/`.

## Step 6. The first flight plan

Write `plans/<today>-first-flight-plan.md` (a living document). Nothing in it is built. Sections:
1. **Summary**: the company, the funnels, the markets, the stage, one paragraph.
2. **Money**: quoted from `config/goals.md` (the band, the four caps and the budget week, the target cost per result, the share for tests); every budget below sits inside the band and below every cap; a cap change is the Owner's, in writing.
3. **Per funnel, one campaign proposal**, the first funnel of `config/goals.md` first: objective (matching the conversion: traffic, leads, sales or engagement/messages), audience and geo (from `config/audiences.md`), special ad category with its reason, placements (recommended Advantage+ unless a format needs otherwise), language and destination URL (with attribution parameters), the **lead path** (`lead_delivery`, or the WhatsApp inbox; who answers within how long, from `config/operator.md`), a budget in the account currency (all campaigns' daily total at or under the daily cap, 30 days of it inside the band, none under Meta's minimum daily budget, each spending limit at or under the per-campaign cap) labelled **"Needs the Owner's go"**, schedule placeholder (start, end), creative needs (formats, count, the AI-imagery disclosure if generated), tracking needs (pixel event or "none: Meta counts the result"; `ref` code; the webhook only with a product team).
4. **Sequence to launch**: signals audit (`signals-audit`) → copy (`ad-copy`) → creative brief and production → compliance gate (`compliance-check`, every string PASS) → upload → build PAUSED (`meta-campaign-build`) → render check (`ads_get_ad_preview` → `ad-shots.sh` → images to the Owner) → numbered recap → grill-me interview → the Owner's go in the same message with the daily spend and the cap stated first → activate → re-read live.
5. **Compliance gate**: what `config/claims.md` blocks, what needs clearance, what is a HOLD for the Owner or a lawyer.
6. **Open questions**: every `not stated` / `open` answer from the interview, with who answers it.

## Step 7. Optional demo

Offer with AskUserQuestion: "Try the harness on a made-up company first?" (recommended: "No, go to my real setup" when the real config is now filled; "Yes" otherwise).
If yes: copy the whole repository to a scratch folder **outside** this folder (for example the session scratchpad, or a sibling folder the Operator names), and in that copy only, copy `examples/acme-fitness/config/*` over `config/`, `examples/acme-fitness/memory.md` over `memory.md`, `examples/acme-fitness/checklist.md` over `checklist.md`, and the example's `plans/*` and `reports/*` into `plans/` and `reports/`. Never copy example files over the real `config/` or `memory.md`. Tell the Operator to open a session in the copy and type `/health`, then `/morning`; with no Meta account behind the example ids, the reads come back empty or refused, which is the expected dry run. Delete nothing in the real folder.

## Step 8. Close

1. **Scrub check:** grep `config/*.md` (not `config/README.md`) for `{{` and `<!-- setup:`. Zero hits is done; if any remain (for example the account fields because the Meta tools were not loaded), list them and the step that fills them.
2. Append the session entry to `memory.md` "Session log" (`<today>: /setup run; files written; open items`), and rewrite "Next session should".
3. Print, in the chat language:
   - **Next steps:** `/health` now (checks the plumbing); `/morning` on the first day a flight runs and every working morning after; `/next-round` once a week when a cell has about a week of delivery; `/sync` at the end of every session.
   - **What the Owner still has to click:** the open `checklist.md` rows owned by the Owner, as a numbered click list; the full console steps, with URLs and pitfalls, are in `docs/meta-setup-guide.md`.
   - **What the wizard did not do:** it built nothing, activated nothing, spent nothing.
