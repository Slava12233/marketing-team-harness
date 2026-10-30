---
name: connect
description: "Part 1 of the onboarding, the connections pass: first the new-copy check (every copy of the harness is a new business: a copy is reset to the blank templates and the previous company's files archived, with no question; logins already on the computer are re-verified for this business), then asks the Owner's language first (and from then on speaks, asks and writes Owner-facing notes in it), then where the company wants to advertise (Meta, Google or both; only those chapters run), checks the prerequisites, asks four inventory questions about what already exists in Meta (portfolio, Page, ad account, developer app) and verifies them in the Owner's own Chrome, then runs every connection chapter of /onboard on the Owner's go (the Meta business basics, the Meta login, the pixel, the developer app and the System User with full access to the ad account, the app and the Page, the upload token moved from the clipboard into .env by env-set.mjs without anyone seeing it, WhatsApp, lead forms, the domain, fal through its MC…"
---

# /connect: connect everything, then `/health`

Part 1 of the onboarding. You connect the harness to everything it needs (the Claude in Chrome extension, the Meta business, the Meta login, the developer app and the System User token, WhatsApp, lead forms, the domain, fal) and prove it with `/health`. Part 2, `/campaign`, builds the first campaign. You build nothing in the ad account here and you activate nothing.

The step bodies are shared: the console chapters are `onboard` (A3–A10), which reuses the step bodies, the hard-stop list, the traps and the marks of `setup-console`; the prerequisites and the account write are steps 0.5, 3 and 5 of `setup`. This page says what runs, in which order, in which language, and what differs. `CLAUDE.md` wins on any conflict.

## Rules you state at the start (two or three plain sentences, after the language question)

1. **Nothing is built, activated or spent.** This pass only connects accounts and writes files in this folder.
2. **No secrets in chat.** No password, code or token is ever typed here. The one token the harness uses moves from Meta's Copy button into `.env` by a tool (`creatives/tools/env-set.mjs`) that clears the clipboard and prints only a character count: neither you nor the harness sees it.
3. **One go per chapter.** Every click that changes something runs only on your go typed in the same message ("go: A7"); the harness stops at every password, code, identity document, card, legal terms screen and delete, and says "your turn".

## Before step 0. Every copy is a new business

Every copy of this harness (a clone of the template, an unzipped release, a folder copied from another company's harness) is a **new business**, whatever `config/`, the vault or the logins on this computer say. Before the first question, with nothing asked:

```
node memory/tools/instance.mjs --check
```

- **Exit 0** (this folder's own harness, by the instance marker `.harness-instance.json`): go on at step 0; the pass resumes at its first open chapter.
- **Exit 3** (a new copy: no marker, or a marker written for another folder or another computer): reset it at once, with no question: `node memory/tools/instance.mjs --reset`. It moves every file of the previous company (config, checklist, the vault's company notes, plans, reports, the flights, the progress page's files, `.env`, `.vercel/`) into `.previous-company/<stamp>/` (nothing is deleted; gitignored), puts the blank templates of `templates/company/` back, recreates `.env` from `.env.example` and writes the marker. Then every chapter below is open, and nothing the previous company had (its ad account, Page, portfolio, app, System User, token, fal account, language) is assumed. After the language answer, say it in one line in that language: a new business, how many files of the previous company were archived and where (or "nothing of another company was here").

## Step 0. The language (the first question)

Before anything else, one AskUserQuestion, written in both languages at once:

> Which language do you prefer? / באיזו שפה תרצו שנדבר?
> Options: **עברית** (Recommended when the Operator's first message was in Hebrew, else second) · **English** · Other (type it)

Record it at once: `**Chat language:**` in `config/operator.md` (replace the placeholder or the value; add "(RTL)" for Hebrew or Arabic), `node dashboard/setup-page.mjs --lang he|en` (any other language keeps `en` for the page), and one line in today's session note. **From this answer on, every chat answer, every AskUserQuestion question and option, every summary, the progress page, the health table's "what to do" lines, HOME and the Inbox are in that language**, right to left when it is RTL; technical names (commands, ids, field names, Meta's screen labels) stay as they are; files that agents read (config, plans, reports, notes other than HOME and the Inbox) stay English. When `config/operator.md` already holds a chat language and the Operator's message is in it, ask anyway (one question) and keep the answer.

## Step 0b. Where to advertise (the second question)

Right after the language, one AskUserQuestion in the chat language: "Where do you want to advertise?" with **Meta and Google** · **Meta only (Facebook, Instagram, WhatsApp)** · **Google only (Search; Performance Max and Demand Gen next)**; the recommended option is the one the Operator's first message points to, else "Meta and Google" when the company has a website and "Meta only" when it has none (Google Search needs a page to send people to). Record it at once as `**Platforms:**` in `config/operator.md` ("Meta", "Google" or "Meta and Google"), then `node dashboard/setup-page.mjs` (the wizard hides the chapters of a platform that is left out). Only the chosen platforms' chapters run below; the others' console-steps rows are `n/a` with "not a platform of this company" and their `/health` rows read n/a. Re-running `/connect` later with a new answer adds the missing chapters.

## Step 1. Prerequisites

`setup` step 0.5 as written (the progress page opened, the table of Git / Node / Claude Code / the desktop app / the extension, `.env` present, `.mcp.json`, the tools, Obsidian, the hooks and the account guard), with one change: anything missing is installed by the harness itself, at once, by running the bootstrap with `-Yes` / `--yes` from this session (the wizard opens and ticks each install live), and the pass goes on here. The extension is needed for the chapters below: when it is not connected, run chapter A3 of `onboard` first (the Connectors path, then a new session and `/connect` again); the click lists of `setup` step 2 remain the fallback only when the Owner says they cannot use the extension at all.

## Step 2. The inventory (what already exists)

Meta's four questions below run when Meta is a platform; when Google is, add one round: **Google Ads account** ("We have one I administer" (Recommended when they advertise on Google today) · "Not sure" · "None yet"), **reached through a manager account (an agency's MCC)** ("No, directly" (Recommended) · "Yes, an agency manages it" · "Not sure"), **Google Cloud** ("Never used it" (Recommended) · "We have a project" · "Not sure"), and **a conversion on the site** ("Not yet" (Recommended) · "Google tag or GA4 already installed" · "Not sure").

Many Owners already have a business on Meta. Ask one round of four (in the chat language, recommended first; "I am not sure" is a valid option on each):

1. **Business portfolio:** "We have one and I am its admin" (Recommended) · "I am not sure" · "We have none".
2. **Facebook Page:** "The company has a Page I administer" (Recommended) · "Not sure" · "None yet".
3. **Ad account:** "We have an ad account with a payment method" (Recommended) · "We have one, payment or phone not sure" · "None yet".
4. **Developer app and System User:** "Never heard of them" (Recommended: most companies have none) · "An app exists" · "An app and a System User exist".

A second round when it matters: a website (yes → the pixel and the domain chapters apply; no → both `n/a`), click-to-WhatsApp planned (yes → the WhatsApp number's label, never the number), instant forms planned (yes → Lead Ads terms and Leads Center), Instagram for ads (optional), and the two names chapter A4 needs (the business as Meta shows it; a short name for the app and the System User).

**In Codex** (`AGENTS.md`, `docs/codex.md`): the Codex app or CLI takes the place of the desktop app, the Codex Chrome extension that of Claude in Chrome, `codex mcp login meta-ads` and `codex mcp login fal` (then a new session) that of `/mcp`. Before the first Meta write, the project and its hooks must be trusted in Codex (`/hooks`): without them the account guard is off, so say so and stop.

**Logins already on this computer belong to no one yet.** The Meta and fal MCP logins are kept per computer, not per folder, and the Claude in Chrome extension drives the Owner's whole Chrome: a login made for another harness on this computer shows up here as "connected". It is never evidence about this business. Keep it (logging out would log the other harness out too), but re-verify it for this business: the ad account, the Page and the portfolio are chosen anew from a live read (`ads_get_ad_accounts`, `ads_get_user_pages`: list them and ask the Owner which are this business's, or that none is, and A4 creates them); the business switcher in Chrome must show this business before a click; fal's `check_account_status` names its account, and the Owner says whether that account pays for this business; the System User token is always a new one for this business (a reset leaves `.env` blank; another business's token is never reused); the account guard learns this business's ids from the reads (a reset archived the previous record). Never take an id from another harness folder, an earlier session or a previous company's archive.

Then **verify in the Owner's Chrome before creating anything**: `https://business.facebook.com/settings` (the portfolio and the signed-in name's role), Accounts → Pages, Accounts → Ad accounts (currency, time zone, payment, the phone's state where shown), Accounts → Apps, Users → System users; read, screenshot (never a screen that lists another business), and record what exists with its public ids in the console-steps table of `config/accounts.md` (status `done` with "existing, verified <date>") and the marks. Create only what is missing, in the chapters below, each on the Owner's go.

## Step 3. The Meta chapters (A3–A8 of `onboard`, as written)

Run `onboard` from its first chapter not `done` or `n/a`, with these points fixed:
- **A4** creates only what step 2 found missing. An existing ad account is never recreated; its currency and time zone are read back and confirmed by the Owner in chat (they are permanent).
- **A5**, the Meta login (`/mcp` → `meta-ads`): the Owner's own profile; only this company's business, ad account and Page shared; then a new session and `/connect` again (it resumes here). When `meta-ads` is already logged in from another harness on this computer, it is kept only if `ads_get_ad_accounts` lists this business's ad account; otherwise the Owner re-authenticates (`/mcp` → `meta-ads` → re-authenticate) and shares this business's assets too.
- **A7**, the developer app, the System User and the token: the harness creates the app (Business type, Marketing API, connected to the portfolio), the System User (Employee) and assigns its three assets at creation with full access (the ad account: Full control; the app: Develop app; the Page: Everything), on one go per chapter; developer terms and any code are the Owner's hard stops. **The token takes the clipboard route of `setup-console` 7g:** Generate and Copy on the go, no read of the dialog except `find` for the Copy control, `timeout 60 node creatives/tools/env-set.mjs --from-clipboard META_MARKETING_TOKEN`, the two public ids through the same tool, then the three live checks. An existing app or System User found in step 2 is reused: assign the missing assets, generate a token for it the same way.
- **A6, A8**: pixel, WhatsApp, lead forms, domain, Instagram per the step-2 answers; what does not apply is `n/a` with the reason.

## Step 3b. Google Ads (chapter G, only when Google is a platform)

The step bodies, the traps and the pitfalls are `docs/google-setup-guide.md`; the hard-stop list of `setup-console` applies as written (the Owner types every password and code, accepts every terms screen, enters the card and the identity documents of advertiser verification). One go per chapter, in the Owner's own Chrome, signed in as the Google user who will own the logins (`google_login_holder`); the account switcher shows that user before any click. Mark each item with `node dashboard/setup-page.mjs --mark google.<key>=done|owner|na` and write its console-steps row.

1. **G1 The Google Ads account** (`google.account`): the company's own account, never an agency's manager. A new one at `ads.google.com` → switch to Expert mode → create the account without a campaign (the currency and time zone are permanent: read them back and confirm them in chat). An existing one: read its 10-digit id from the account menu.
2. **G2 Billing** (`google.billing`) and **G3 advertiser verification** (`google.verification`, when Google asks; often days after the first ad): the card and the documents are the Owner's hard stops.
3. **G4 The Cloud project** (`google.cloud`): `console.cloud.google.com` → a new project named after the company (the company's own, never one from another harness) → APIs & Services → Library → Google Ads API → Enable. Record `google_cloud_project_id`.
4. **G5 The consent screen and the client** (`google.oauth`): Google Auth Platform → Branding (the app name, the Owner's support e-mail typed by the Owner), Audience (External, then **Publish app**: in Testing the login expires after 7 days), Data access (add the scope `https://www.googleapis.com/auth/adwords`), Clients → Create client → **Desktop app**. Copy the client id → `timeout 60 node creatives/tools/env-set.mjs --from-clipboard GOOGLE_ADS_CLIENT_ID --min-length 20`; copy the secret → the same with `GOOGLE_ADS_CLIENT_SECRET` (never read in the dialog, never in chat).
5. **G6 API access** (`google.access`): Cloud Console → Google Ads API → Overview → the access level (a new project shows Test) → Upgrade access level → Explorer → Apply (the form is the Owner's; the review is usually automated). Do it **now**, before the login, so the review runs meanwhile; record `google_api_access_level`.
6. **G7 The login** (`google.login`): `timeout 330 node creatives/tools/google-ads.mjs login` opens Google's sign-in in the default browser; the Owner signs in, passes the "unverified app" screen (their own app), ticks the Google Ads permission and clicks Allow; the tool saves the refresh token into `.env` and prints only its length. Then `google-ads.mjs accounts` lists what the login reaches: the Owner picks the company's account (not a manager) → `GOOGLE_ADS_CUSTOMER_ID` (and `GOOGLE_ADS_LOGIN_CUSTOMER_ID` when it is reached through a manager) through `env-set.mjs --from-stdin` (an id is not a secret: `printf %s <id> | node creatives/tools/env-set.mjs --from-stdin GOOGLE_ADS_CUSTOMER_ID --min-length 10`) and `google_ads_customer_id` in `config/accounts.md`. `timeout 60 node creatives/tools/google-ads.mjs check` must be green; a Test-access line means G6 is still pending (the pass goes on; builds wait).
7. **G8 The conversion** (`google.conversion`): `google-ads.mjs conversions list`; none yet and a website exists → `conversions create` on the go (the funnel's result: `SUBMIT_LEAD_FORM`, `CONTACT`, `PURCHASE`…) and `conversions list --tags --out plans/<date>-request-google-tag.md` (a request "Needs product team" / "Needs Owner"); no website → `n/a`.

**A copy that predates Google** (upgraded, not reset): when `config/accounts.md` has no `## Google Ads` table, `config/goals.md` no `## Platform share` or `config/operator.md` no `**Platforms:**` line, copy them from `templates/company/config/` into the company's files before this chapter (the rest of each file is kept).

**Logins already on this computer**, again: a Google user signed in to Chrome, a Google Ads account the login reaches, a Cloud project in the console's list may belong to another business. Choose the account and the project anew for this business from what the Owner says is theirs; never reuse another harness's client, project or refresh token (a reset leaves the Google lines of `.env` blank).

## Step 4. fal (A9 of `onboard`, optional)

fal needs no key: it logs in through its MCP (`/mcp` → `fal` → log in; the terminal fallback `claude mcp login fal`). The harness leads the sign-up in the Owner's Chrome and stops at the e-mail, the password or single sign-on and the card (hard stops); after the login and a new session, `mcp__fal__check_account_status` reads the balance (a number, fine in chat) and the mark is `fal.login=done`. The Owner may skip it (`na`): stills come from the renderer and video from HyperFrames. Never a `FAL_KEY` in `.env` unless the Owner runs a script of their own.

## Step 5. Write the account files

`setup` step 3 (the live read: the account, the Page and its duplicates, the pixel, Instagram, the portfolio, `meta-upload.mjs --check` by names, `lead_delivery`) and the account rows of step 5: `config/accounts.md` filled (ids, currency, minimum daily budget, the Google Ads table when Google is a platform (from `google-ads.mjs check`: the customer id, the manager, currency, time zone, the access level, the conversion actions), the console-steps table with dates and notes, the MCP servers and logins table), `config/operator.md` with the Owner's name, the Operators, the chat language, the platforms (the rest of the file is `/campaign` round (a) and (h)), `checklist.md` rows for every console step (done / open / n/a) and for every hard stop still open. Names and public ids only. Then regenerate the page (`node dashboard/setup-page.mjs`).

## Step 6. `/health`

Run `/health --keys` first (A10: every row green or `n/a` by the Owner's word), then the full `/health` (the `health` skill: all checks, the table in the chat language). A yellow or red row names the click or the fix and who does it; the pass is not over until nothing is red. Marks: `keys.table=done`, `health.run=done`.

## Step 7. Close

- Session note lines for every chapter (`- HH:MM — connect A7: …`), `memory/state/current.md` next actions (`/campaign` first), the marks, `node memory/tools/build-hot.mjs --by connect`.
- **Closing message, in the chat language:** what is connected (by name and public id), every hard stop and who took it, what is still the Owner's to click (the open `checklist.md` rows, numbered), that nothing was built, activated or spent, and that Part 2 starts with `/campaign`: the interview about the company and the first campaign, the market research, and the campaign built PAUSED.

## Resume

`/connect` (and `/onboard`, which routes here) resumes at the first chapter whose console-steps row is not `done` or `n/a`, after the new-copy check (a new copy never resumes: it is reset and starts at step 0) and the language question (one question, kept short when the language is already set). Nothing is asked twice when `config/` already holds the answer: read it, confirm it in one line.
