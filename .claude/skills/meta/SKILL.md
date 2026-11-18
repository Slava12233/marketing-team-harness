---
name: meta
description: "Step 2 of the installer's path (/install, /meta, /check, /campaign): everything Meta, by command, with the installer clicking and the harness checking. The core by default: the Meta Ads MCP login (/mcp, the Owner's own profile), the portfolio, Page and ad account picked from a live read, the developer app with the Marketing API, the System User with its three assets (ad account, app, Page), the token moved from Meta's Copy button into .env by env-set.mjs unseen, the two public ids, and the three live checks. Each step is a short click list for the installer, then a live check, then the record (config/accounts.md, checklist.md, the wizard marks, the session note). A word after the command runs one item (/meta login, /meta assets, /meta app, /meta token, /meta pixel, /meta whatsapp, /meta leads, /meta domain, /meta instagram, /meta people, /meta status). Needs no browser extension. A thin layer over setup step 2, setup-console and docs/meta-setup-guide.md. Nothing built, activated or spent. Use when an installer or technician connects a client's Meta business, when the Operator types /meta, or when /campaign names a Meta item its campaign type still needs."
---

# /meta: everything Meta, by command

Step 2 of **the installer's path**: `/install` → **`/meta`** → `/fal` (optional) → `/check` → `/campaign` (the sheet: `docs/quick-install.md`). The installer sits at the client's Meta screens with the client's admin access and **clicks every step**; the harness prints a short click list, waits for "done", checks the outcome live and records it. No browser extension is needed and the harness clicks nothing in a browser. An installer who wants the harness to drive the screens types `/connect` instead (the Claude in Chrome extension): both write the same rows, so a pass started in one resumes in the other.

This page is a thin layer. The click lists are step 2 (b) of `setup`; the outcomes, the token route, the live checks, the traps table and the session-log format are `setup-console` (its steps 1–11); the long form with pitfalls is `docs/meta-setup-guide.md`. This page says what the core is, in which order it runs for an installer, and what one word after the command does. `CLAUDE.md` wins on any conflict.

**Say at the start, in two or three sentences:** nothing is built, activated or spent here. No password, code or token is ever typed into this chat: the token is copied with Meta's Copy button and a tool moves it from the clipboard into `.env`, so nobody sees it. The Meta login and the card are the Owner's own.

## Words after the command

| Typed | What runs | Console-steps rows and marks |
|---|---|---|
| `/meta` | **The core**, from its first step not done: `login` → `assets` → `app` → `token`, then the record | as below |
| `/meta login` | The Meta Ads MCP login | "MCP login (`meta-ads`)"; `meta.login`, `login.tools` |
| `/meta assets` | The portfolio, the Page and the ad account, from a live read | "Business portfolio", "Page", "Ad account owned by the portfolio", "Payment method…", "Phone number verified…"; `meta.portfolio`, `meta.page`, `meta.adaccount`, `meta.payment`, `meta.phone` |
| `/meta app` | The developer app and the System User with its three assets | (part of the token row) |
| `/meta token` | The token into `.env`, the two ids, the three live checks | "Developer app (Business type) + System User token in `.env`"; `meta.apptoken`, `token.check` |
| `/meta pixel` | The pixel / dataset (a website) | "Pixel / dataset…"; `meta.pixel` |
| `/meta whatsapp` | The WhatsApp Business number on the Page (click-to-WhatsApp) | "WhatsApp Business number…"; `meta.whatsapp` |
| `/meta leads` | Lead Ads terms and Leads Center access (instant forms) | "Lead Ads terms…", "Leads Center access…"; `meta.leadads`, `meta.leadscenter` |
| `/meta domain` | Domain verification (a website) | "Domain verified"; `meta.domain` |
| `/meta instagram` | Instagram linked for ads (optional) | "Instagram linked for ads (optional)"; `meta.instagram` |
| `/meta people` | The Operator invited with Manage campaigns | the People and roles row of `checklist.md`; `meta.people` |
| `/meta status` | The console-steps table read back, with the next command | none (a read) |

**The core is what every Meta campaign needs.** The other items depend on the campaign type, so they wait: `/campaign` asks the type first and names the item it needs (a lead form → `/meta leads`; click-to-WhatsApp → `/meta whatsapp`; traffic or conversions to a website, or a catalog → `/meta pixel`, and `/meta domain` recommended). An installer who already knows the type runs them now.

## Step 0. Before the first step

Before it, the session has asked the language and the two setup questions of `setup` step 0.4 (the extension: not needed here, the installer clicks; the permission mode: Bypass permissions shortens the checks, by the installer's own clicks). They are asked again in the new session after the login, kept short.

1. `node memory/tools/instance.mjs --check` exits 0 (exit 3: a new copy; reset it as `/install` step 0 does, then go on). `test -f .env` says present (missing: `/install env`); never open, read, grep or print `.env`.
2. **Access, said by the installer, not checked in a browser:** their browser is signed in to facebook.com as a **personal profile** (not switched into the Page) that is an admin of the client's Business portfolio, with two-factor authentication on (`setup-console` prerequisites 1–3; traps 2 and 3 are what a miss looks like).
3. Read the console-steps table of `config/accounts.md`, `checklist.md` and today's session note. **Resume:** the first core row not `done` is where `/meta` starts; rows already done are read back in one line, never redone.
4. **One round of questions** (AskUserQuestion, the chat language, skipping what `config/` already holds):
   - the business as Meta shows it (the portfolio's name), typed;
   - a short name for the app and the System User (`<short name> marketing`, `<short name>-harness`), typed;
   - the Owner's default language: עברית / English / another;
   - what exists in Meta already: "A portfolio, a Page and an ad account, and I am an admin" (Recommended) / "Some of it is missing" / "Not sure".

   Record at once: `**Chat language:**` in `config/operator.md` (the Owner's default, "(RTL)" added for Hebrew or Arabic; the session keeps the language it asked for at its start), `**Platforms:** Meta` when the field still holds a placeholder (Google is added later by `/connect`), `node dashboard/setup-page.mjs --lang he|en`, and the two names in today's session note.
5. The wizard beside the chat: `node dashboard/setup-page.mjs --open`.

## How every step runs

1. **The click list**, in one message: numbered, short, Meta's labels in English, each ending with what the installer should see. Meta renames buttons: the outcome is what counts.
2. **The installer clicks**, then answers "done" (with the public ids the step asks for). Passwords, codes, the card, identity documents and legal terms are typed and accepted by the human at the screen and never pass through the chat (the hard-stop list of `setup-console`).
3. **The live check**, bounded (`timeout 60` first on every node command, one at a time, no blind retry).
4. **The record:** the console-steps row of `config/accounts.md` (`done` / `open` / `n/a`, dated, with the ids), the same row in `checklist.md` (owner Owner, the note "installer's path, <date>"), `node dashboard/setup-page.mjs --mark <key>=done` (`owner` while a human step waits), and one line in today's session note (`- HH:MM — meta token: …`, names and public ids only).

## The core

### 1. `login`: the Meta Ads MCP login

- **Already loaded?** Load `mcp__meta-ads__ads_get_ad_accounts` with ToolSearch and call it. It answers: skip the click list, go to the check.
- **Click list:** approve the two servers of `.mcp.json` when Claude Code asks (or `/mcp` lists them) → `/mcp` → `meta-ads` → log in → the consent screen opens in the browser → it must show **the Owner's own profile** (a login made with the installer's profile stops working when the installer's access is removed, trap 8) → share only this business's portfolio, ad account and Page (and Instagram). The terminal fallback: `claude mcp login meta-ads` in the folder. Then **a new session and `/meta` again**: the Meta tools load only into a session started after the login. Before it, write the session-note line and `--mark meta.login=owner`.
- **A login already on this computer** (made for another harness) belongs to no one yet: keep it only when `ads_get_ad_accounts` lists this business's ad account; otherwise `/mcp` → `meta-ads` → re-authenticate and share this business's assets too.
- **Check:** `ads_get_ad_accounts` lists the client's ad account. More than this business listed: say the grant was wider than it needs to be (the account guard keeps every call inside the one account meanwhile).

### 2. `assets`: the portfolio, the Page, the ad account

Reads first, clicks only for what is missing (`setup` step 3, items 1–5):

- `ads_get_ad_accounts` → the installer picks the client's account (AskUserQuestion; recommended: the active one whose name matches the business). Record `meta_ad_account_id`, `currency`, the status, `min_daily_budget` and `business_portfolio_id` when the read gives it (else the installer copies it from Business Settings → Business info: an id is not a secret).
- `ads_get_ad_account_pages` and `ads_get_user_pages` → the Page customers know; another Page with the same name goes into `page_duplicates_to_avoid` (trap 5). Record `page_id`.
- **Something missing** (no portfolio, no Page under it, no ad account): the click list is items 1–3 of `setup` step 2 (b). A new ad account's **time zone and currency are permanent**: the installer reads both back and the Owner confirms them before Create (trap 6). A second ad account is never made to get around a restriction (trap 7).
- **Payment method and phone:** no read shows them. Ask once: "A payment method is on the ad account, and its phone number is verified?" → `done` on the installer's word, else `open` with a `checklist.md` row for the Owner (the card and the code are the Owner's; no ad activates without them, #3858013).

### 3. `app`: the developer app and the System User

One click list (`setup-console` 7a–7f has every screen's outcome):

1. `https://developers.facebook.com/apps` → **Create app** → the name `<short name> marketing` → the use case **"Create & manage ads with Marketing API"** (the older flow: Other → **Business**) → connect the client's portfolio → Create. A banner "Account confirmation needed" is cleared first (trap 2). The app stays **Unpublished** (trap 4). Never open the App Secret.
2. Business Settings → Accounts → **Apps**: the app is listed (else Add → connect an app ID).
3. When the app was created with the installer's profile: the app → App roles → add **the Owner as Administrator** (the Owner accepts).
4. Business Settings → Users → **System users** → Add → `<short name>-harness` → role **Employee**.
5. The System User → **Assign assets**: the ad account (**Full control**), the app (**Develop app**), the Page (**Everything**). All three, now: without the Page every lead endpoint answers code 10 (trap 1).

The installer answers "done" with the App ID and the System User's name (both public).

### 4. `token`: the token, the two ids, the checks

- **Click list** (on the computer this harness runs on, because the clipboard is local): the System User → **Generate token** → the app → expiration **Never** → tick `ads_management`, `ads_read`, `leads_retrieval`, `pages_manage_ads`, `pages_read_engagement`, `pages_show_list` → Generate → **Copy** → close the dialog → type **"copied"** in the chat. Never paste the token anywhere.
- **On "copied"**, from the repository root:
  ```
  timeout 60 node creatives/tools/env-set.mjs --from-clipboard META_MARKETING_TOKEN
  printf '%s' <the ad account id, digits only> | node creatives/tools/env-set.mjs --from-stdin META_AD_ACCOUNT_ID --min-length 6
  printf '%s' <the Page id, digits only> | node creatives/tools/env-set.mjs --from-stdin META_PAGE_ID --min-length 6
  ```
  The first line writes the token into `.env`, clears the clipboard and prints the name and a character count only. "the value is empty" or "shorter than 20 characters": the Copy did not land; the installer clicks Copy again and the tool runs once more (one retry, never a loop). `--check META_MARKETING_TOKEN` prints the count; the file is never opened.
- **A token that reaches the chat is burned:** the installer revokes it (System users → Revoke tokens), `node creatives/tools/env-set.mjs --unset META_MARKETING_TOKEN`, then generates again (revoke first, then generate).
- **The three live checks**, one at a time (`setup-console` 7h):
  ```
  timeout 60 node creatives/tools/meta-upload.mjs --check
  timeout 60 node creatives/tools/meta-graph.mjs check
  timeout 60 node creatives/tools/meta-graph.mjs lead-forms list
  ```
  Green: the token holder is the System User, the account with status 1, `adimages ok, advideos ok`, the six permissions, and `lead-forms list` answers (an empty list passes). Code 10 → the Page is not assigned (trap 1). Code 200 "API access blocked" → the developer account's checkpoint (trap 2), not the token. Code 190 → revoke and generate again.

### 5. The record, then `/check`

- `config/accounts.md`: the ids and names the core learned (replace only the `{{` placeholders they fill), the MCP servers and logins table (who holds the `meta-ads` login; the System User's name), and the console-steps rows, dated. **The rows the core did not run** (pixel, WhatsApp, Lead Ads terms, Leads Center, domain, Instagram, the webhook) are written `open` with the note `deferred: /meta <item> when the campaign needs it`, or `n/a` when the installer already said the business has no website or will not use that format. Google rows: `n/a` (Meta only) unless Google is a platform.
- `checklist.md`: one row per console step with its status, and a row for the Owner: "remove or downgrade the installer's admin access once `/check` is green" (when the installer's own profile was used).
- `node dashboard/setup-page.mjs`, the session-note lines, `node memory/tools/build-hot.mjs --by meta`.
- **Closing message, in the chat language:** what is connected (names and public ids), what the humans still owe (the open `checklist.md` rows, numbered), which items are deferred and the command for each, that nothing was built, activated or spent, and the next command: **`/check`**, with **`/fal`** before it when the client wants generated pictures or video (optional; it can also run any time later).

## The items outside the core

Each is the matching numbered item of `setup` step 2 (b) printed as the click list, the live check and the record of the `setup-console` step named here, run as "How every step runs" says. What does not apply is `n/a` with the reason.

| Word | Click list (`setup` step 2 b) | Outcome, check, record (`setup-console`) | Human-only parts |
|---|---|---|---|
| `pixel` | item 6 | step 6: `ads_get_datasets`, `ads_get_dataset_stats`; `pixel_id`; the base code and the consent sentence go into `plans/<date>-website-requests.md`, "Needs product team" or "Needs Owner" | the website change; a website builder's login |
| `whatsapp` | item 8 | step 8: no read exists, the installer confirms; the number's label only in `whatsapp_number_names` | the number and its code, typed at the screen, never in the chat |
| `leads` | item 9 | step 9: `ads_get_ad_account_pages` shows the terms; `meta-graph.mjs lead-forms list` answers; `lead_delivery` | accepting the Lead Ads terms; forms are built later from an approved spec, never here |
| `domain` | item 10 | step 10: the homepage holds `facebook-domain-verification`, or the Domains screen says verified | the DNS or site change |
| `instagram` | item 2 (its Instagram part) | step 11: `ads_get_ig_accounts`; `instagram_account_id` | the Instagram login |
| `people` | item 4 | step 4: no read; the Operator accepts the invitation | the Operator's own acceptance |

`/meta status` prints the console-steps table as it stands (row, status, date), the core rows first, and one line: the next command (`/meta` to resume the core, a named item, `/check`, or `/campaign`).

## End state

- The Meta tools answer for the client's one ad account; `.env` holds the token and the two ids (never read); the System User holds three assets; the three checks are green.
- Every core row of the console-steps table is `done` (payment and phone `done` on the installer's word, or `open` with the Owner's `checklist.md` row); every other row is `open` with its `deferred` note, or `n/a`.
- Nothing built, nothing activated, nothing spent. Next: `/check`.
