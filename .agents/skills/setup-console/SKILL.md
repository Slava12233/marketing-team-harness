---
name: setup-console
description: "The installer-led Meta console setup, A to Z: an installer sits at the client's Meta consoles with the client's admin access, and the harness drives the screens in the installer's browser (Claude in Chrome) on the installer's word, stopping at a fixed hard-stop list (passwords, codes, identity documents, the payment card, legal terms, the token value, deletes). Covers every console step of docs/meta-setup-guide.md in its order (portfolio, Page, ad account, people, MCP login, pixel, developer app + System User + token with the Page assigned, WhatsApp, lead forms, domain, Instagram), checks each outcome live, and records it in config/accounts.md, checklist.md and the setup progress page. Use when the Operator or installer says 'drive the consoles', after the /setup interview rounds have named the company in config/."
---

# /setup-console: the installer-led Meta console setup

The **installer** is the person who installs this harness for a client company (often the person who sold it). In this mode the installer sits at the client's Meta consoles, in a browser that holds the client's admin access, and the harness drives those screens with its browser tools: it navigates, reads, fills and clicks on the installer's word, and stops at the hard-stop list below, where a human does the step. Every client gets every capability: the MCP login, the pixel, the developer app, the System User token for direct uploads and the Graph tool, the Page assigned to the System User, WhatsApp, lead forms, the domain and Instagram (a step is `n/a` only where `config/product.md` says the funnel does not use it).

The steps, their outcomes and their pitfalls are those of `docs/meta-setup-guide.md`, in the same order; this page adds what the harness does in the browser, where it stops, and what it records. Vocabulary and field names follow `docs/TEMPLATE-SPEC.md`; project rules (`CLAUDE.md`) win on any conflict.

## When to use

- The installer is at the client's consoles with the client's admin access, and the Owner (the client) agreed to an installer-led setup (`docs/client-intake.md` §1, option 0).
- **The go.** Every click that changes something (create, add, assign, connect, save, invite, verify) runs only on a go typed in chat **in the same message**, naming the step or the click ("go: step 7, create the system user"). In this mode the installer types it, sitting with the Owner or holding the Owner's written OK for the setup day (recorded as a `checklist.md` note). One message may cover the clicks of one step; a go never carries over to the next step. Navigation, reads and screenshots need no go.
- **Never a password typed by the harness.** When Meta asks for a password, a code or a re-login, the harness stops and the human types it.
- Not for: the Owner alone at home (with the extension connected, `/connect`, whose console chapters are `onboard`; without it, the click lists of `setup` step 2 and `docs/meta-setup-guide.md`); building campaigns (`/campaign`, `meta-campaign-build`); anything in Ads Manager beyond reads.

## Owner mode: `/onboard`

The same steps run in **Owner mode** when the Owner is alone at their own computer, in the Claude desktop app's Code tab, with the Claude in Chrome extension connected to their own Chrome: that is the `onboard` skill (`.claude/skills/onboard/SKILL.md`, chapters A3–A10 of the onboarding). It reuses every step body, the hard-stop list, the traps and the marks of this page and changes only who clicks and whose word the go is: the Owner clicks every hard stop, the go is the Owner's own, typed in chat in the same message, the app-roles step (7d) is n/a because the Owner's own profile creates the app, the two public ids are appended to `.env` by the harness (never a read), the fal sign-up and login are a chapter, and the pass ends with the keys table (`/health --keys`) all green instead of an installer's access to remove. When a step on this page says "the installer", read "the Owner" there.

## Prerequisites (check them in this order; stop at the first missing one)

0. **A new copy is a new business.** `node memory/tools/instance.mjs --check` exits 0, or exit 3 was followed by `node memory/tools/instance.mjs --reset` (the previous company's files archived in `.previous-company/<stamp>/`, the blank templates back) and the `/setup` rounds below run for this client. A login already on this computer (Meta, fal, the extension's Chrome) is re-verified for this client's business before any click.

1. **Access.** Either the client made the installer's own Facebook profile an **Admin** of the client's Business portfolio for the setup day (Business Settings → Users → People → Add → Admin access), or the installer is signed in, in the browser the extension drives, as the client's admin. Read Business Settings → Users → People and confirm the signed-in name shows full control.
2. **The personal profile.** facebook.com is signed in as a **personal profile**, not "switched into" the Page. Read the profile menu (top right); if it shows the Page, the installer switches back (Meta's checkpoint and several business screens fail inside a Page profile; see the traps).
3. **Two-factor authentication** is on for the signed-in profile (`https://accountscenter.facebook.com/password_and_security`). If it is off, the installer turns it on (codes are a hard stop).
4. **Claude in Chrome connected.** Load the browser tools in one ToolSearch call: `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__find,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__form_input,mcp__claude-in-chrome__list_connected_browsers`. Then `list_connected_browsers` and `tabs_context_mcp`: the installer confirms it is the browser in front of them. Work in a tab you created (`tabs_create_mcp`).
5. **`/setup` rounds done.** `config/company.md`, `config/product.md` and `config/operator.md` hold no `{{` placeholder (grep `{{` in them): the company, its funnels and the Owner are named. Otherwise run `/setup` rounds (a)–(c) first. `.env` exists (`test -f .env && echo present || echo missing`; never open it).
6. Read `docs/meta-setup-guide.md` (the step you are on), the console-steps table of `config/accounts.md`, `checklist.md` and today's session note. **Resume:** the first row of the console-steps table that is not `done` or `n/a` is where you start.

Start the progress page beside the browser: `node dashboard/setup-page.mjs --open`.

**Google Ads, when it is a platform** (`config/operator.md`): the same driven mode and this hard-stop list cover the Google consoles (Google Ads, the Cloud Console, the Google Auth Platform) in the order of `docs/google-setup-guide.md`, recorded in the Google rows of the console-steps table and the `google.*` marks; `/connect` step 3b has the step bodies.

## The hard-stop list (never done by the harness; always the human)

| Hard stop | What the harness does instead |
|---|---|
| Typing any password, re-login, or code (email code, SMS code, two-factor code, WhatsApp code, phone-verification code) | Stops on the screen, says "your turn: type the code", waits for "done", then screenshots |
| Identity documents, business verification uploads, a selfie or ID check | Stops; names the screen; the Owner decides |
| The payment card or any payment method detail | Navigates to Billing and payments, stops before the form |
| Accepting legal terms: Lead Ads terms, the developer platform terms, System User or other policy acknowledgements, any "I agree" box | Shows the screen, stops; the human reads and accepts |
| The MCP login's consent screen (granting the harness's login its businesses, ad accounts and Pages) | The Owner does it in `/mcp`, with the Owner's own profile (step 5) |
| The token's value | Never screenshotted, read, listed or typed by the harness. On the go it clicks Generate and then Copy (step 7g) using only `find` for the Copy control, and `creatives/tools/env-set.mjs --from-clipboard` moves the clipboard into `.env` and clears it: the value passes through neither the chat nor the harness. If the extension cannot click Copy, the human clicks it |
| Ads Manager "Discard drafts", deleting or archiving any live object, removing a person, partner or asset | Prepares the click list; the Owner clicks |
| Requesting a review or appeal (Account Quality) | Shows the reason; the Owner requests it |

Also never: `javascript_tool`, network-request reads or cookie access on any Meta domain; typing a person's email or phone that the installer did not give in chat for that click; any click in another business than the client's (read the portfolio switcher before each changing click).

## How every step runs

1. **Navigate** to the step's URL; `read_page` / `find` for the controls; check the portfolio switcher shows the client's business and the profile is personal.
2. **Say the plan** in one short block: the clicks, the values it will type (names and public ids only), where it stops. Wait for the go.
3. **Click and fill** on the go (`computer` left_click by ref, `form_input`), one control at a time; after each, re-read the screen. If the screen does not match the expected outcome, stop and show it.
4. **Screenshot after every state change** (`computer` → `screenshot`) and at every stop: it shows in the chat at once, so the installer sees what changed; when the host offers a file-sending tool, send it as a file too. Keep copies only outside the repository (the session's scratch folder), never in the repository: screens carry names and ids beyond the public ones. Never a screenshot of a token, a password field with a value, a card form, or a lead.
5. **Live check** (below, per step), bounded: `timeout 60` first on every node command, one at a time.
6. **Record**: the console-steps row of `config/accounts.md` (status `done` / `open` / `n/a`, dated, and the ids the step produced), the same row in `checklist.md` (owner Owner, a note "installer-led, <date>"), `node dashboard/setup-page.mjs --mark meta.<key>=done` (`owner` while a hard stop waits), and one line per click in today's session note (below).

Meta renames buttons and moves menus; read the screen for the outcome the step names. Until step 5's login, the Meta tools are not loaded: steps 1–4 are recorded `done (screen, <date>); live check after step 5`, and the checks run right after the new session starts.

## Step 1. Business portfolio  (mark `meta.portfolio`)

- **URL:** `https://business.facebook.com/settings` (Business info, Users → People, Security Center).
- **Harness:** reads the portfolio switcher; if the client has a portfolio, selects it; reads Business info for the business portfolio ID (a public id); reads People for the admins. Only if none exists: Create a business portfolio with the business name, the Owner's name and the work email the installer gives in chat. On the go: Security Center → require two-factor authentication for admins.
- **Stops at:** the email confirmation code; any second portfolio found (two portfolios for one company is the Owner's call, never merged by the harness).
- **Live check:** after step 5, `ads_get_ad_accounts` shows the business that owns the ad account.
- **Records:** `business_portfolio_id` in `config/accounts.md`; row "Business portfolio".

## Step 2. Page  (mark `meta.page`)

- **URL:** `https://www.facebook.com/pages/?category=your_pages`; Business Settings → Accounts → Pages (`https://business.facebook.com/settings/pages`).
- **Harness:** lists the Pages with the company's name; asks the installer which one customers know (two with the same name: the other is recorded as a duplicate to avoid). Checks the Page is under the portfolio; on the go: Add → add a Page you own, or Request access when another business owns it. Reads the Page's access screen (the Owner with full control).
- **Stops at:** a Page owned by another business (an agency, a former employee): that request is the Owner's conversation; a restricted Page (Account Quality shows it; the review request is the Owner's).
- **Live check:** after step 5, `ads_get_user_pages` and `ads_get_ad_account_pages` list it.
- **Records:** `page_id` and the duplicates to avoid in `config/accounts.md`; row "Page".

## Step 3. Ad account, payment method, phone  (marks `meta.adaccount`, `meta.payment`, `meta.phone`)

- **URL:** `https://business.facebook.com/settings/ad-accounts`; `https://business.facebook.com/billing_hub/payment_settings`; `https://adsmanager.facebook.com`.
- **Harness:** reads the existing ad accounts (owned by the portfolio, active, the signed-in admin with full control). A new account only when there is none: Add → Create a new ad account → the name → **time zone and currency read back to the installer and confirmed by the Owner in the same message before Create** (they are permanent) → "my business" → full control for the Owner. Then navigates to Billing and payments for the account.
- **Stops at:** the payment method (the card is a hard stop); the phone verification code; a new-account restriction or spending limit (wait, never a second account).
- **Live check:** after step 5, `ads_get_ad_accounts`: id, currency, status, minimum daily budget. The phone has no read: the Owner confirms it.
- **Records:** `meta_ad_account_id`, `currency`, `min_daily_budget` in `config/accounts.md`; rows "Ad account owned by the portfolio", "Payment method on the ad account", "Phone number verified on the ad account".

## Step 4. People and roles  (mark `meta.people`)

- **URL:** `https://business.facebook.com/settings/people`.
- **Harness:** on the go, Add (invite) the Operator's work email (given in chat by the installer) with employee (partial) access → assign the ad account with Manage campaigns and the Page with the tasks the Operator needs → Send. `n/a` when the Owner operates alone. Reads People for a second admin (Meta recommends two) and tells the Owner if there is none.
- **Stops at:** the Operator accepting the invitation (their own email and profile); removing anyone.
- **Live check:** none (no read of people); the screenshot of People is the evidence.
- **Records:** who holds which login (names only) in `config/accounts.md` and `config/operator.md`; the People and roles row in `checklist.md`.

## Step 5. MCP login (`meta-ads`)  (marks `meta.login`, `login.tools`)

- **Where:** Claude Code in the harness folder (`/mcp` → `meta-ads` → log in); the consent screen opens in the browser.
- **Harness:** nothing in the browser. It tells the installer the login must be made with the **Owner's own profile** (the one the harness keeps after the installer leaves; a login made with the installer's profile stops working when the installer's access is removed), and that the consent shares only the client's portfolio, ad account and Page (and Instagram). The browser that opens must show the Owner's profile.
- **Stops at:** the whole step (the consent screen is a hard stop); then a new session (`/exit`, `claude`), because the Meta tools load only into a session started after the login. Before the restart, append the session-note line and the marks so the next session resumes at step 6.
- **Live check:** in the new session, `ads_get_ad_accounts` shows the client's account and nothing else; then run the pending checks of steps 1–4.
- **Records:** row "MCP login (`meta-ads`)", and the rows of steps 1–4 updated from the reads.

## Step 6. Pixel (dataset)  (mark `meta.pixel`)

- **URL:** `https://business.facebook.com/events_manager2`.
- **Harness:** reads the existing datasets (an agency's pixel shared to the portfolio counts). None and a website exists: on the go, Connect data sources → Web → name → Create → the website address → reads which install path Meta offers (a partner integration or the base code). The base code is not a secret: the harness copies it into a note for whoever runs the website, with the consent sentence of `docs/meta-setup-guide.md` step 6. Checks the dataset's connected assets include the ad account (on the go: add it). Test events: types the website address and reads for a PageView after the installer opens the site with consent given.
- **Stops at:** a partner integration's own login (the website builder's password is a hard stop); the website change itself (whoever runs the site). No website: `n/a`, `pixel_id` = `none (no website)`.
- **Live check:** `ads_get_datasets`; `ads_get_dataset_stats` for events.
- **Records:** `pixel_id` in `config/accounts.md`; row "Pixel / dataset created and installed (or "no website")".

## Step 7. Developer app, System User, token  (marks `meta.apptoken`, `token.check`)

The longest step. The token belongs to a System User, not to a person, so it survives the installer leaving; the app and the System User both belong to the client's portfolio.

**7a. The developer account.** Navigate to `https://developers.facebook.com/apps` with the personal profile. First time on this profile: Meta asks to register as a developer (accept the platform terms: hard stop; a phone or email code: hard stop). Read the page for an "Account confirmation needed" banner: if it is there, clear it now (trap 2) before creating anything.

**7b. The app.** On the go: Create app → name (`<company short name> marketing`, or as the installer says) and the contact email the installer gives → use case **"Create & manage ads with Marketing API"** (or, on the older flow, Other → app type **Business**) → connect the client's business portfolio → Create. A password prompt here is a hard stop. In the app's dashboard, check the Marketing API is added (use case or Add product → Marketing API → Set up). Read the App ID (public). Never open or copy the App Secret. The app shows **Unpublished** (Development mode): that is correct for System User tokens; never switch it to Live.

**7c. The app in the portfolio.** `https://business.facebook.com/settings/apps`: the app is listed; if not, on the go: Add → connect an app ID → the App ID.

**7d. App roles.** If the app was created with the installer's own profile, on the go add the Owner's profile as an Administrator of the app (the app → App roles → Roles → Add people → Administrator). The Owner accepts the invitation (their click). Otherwise the app hangs on the installer's developer account, and a block on that account stops every call (trap 2, trap 8).

**7e. The System User.** `https://business.facebook.com/settings/system-users` → on the go: Add → name (`<company short name>-harness`, or as the installer says) → role **Employee** (not Admin) → Create. A terms or policy acknowledgement on first creation is a hard stop.

**7f. Assign its three assets at creation** (the new Business Settings screens): System users → the user → "…" → **Assign assets** →
- **Ad accounts** → tick the client's ad account → **Full control** (at the least Manage campaigns) → next;
- **Apps** → tick the app from 7b → full control (Develop app) → next;
- **Facebook Pages** → tick the Page from step 2 → **Full access, "Everything"** → **Assign assets** → the screen says "Assets assigned".
Screenshot the user's assigned-assets list showing all three. Without the Page, every Page endpoint (lead forms, leads) answers code 10 even when the token carries the `pages_*` permissions (trap 1). The Page's own screen in Business Settings has "Assign people" as a second way to the same outcome.

**7g. The token: the clipboard route (the value never passes through the chat or the harness).** Navigate to the System User's screen with "Generate token" visible and state the plan: Generate token → the app from 7b → expiration Never if offered → tick `ads_management`, `ads_read`, `leads_retrieval`, `pages_manage_ads`, `pages_read_engagement`, `pages_show_list` → Generate → Copy → the tool. On the go ("go: 7g, generate the token"):
1. Click Generate token, pick the app, the expiration and the six permissions (reads and screenshots are fine here: no token is on screen yet), then click Generate.
2. **From this click until the dialog is closed:** no screenshot, no `read_page`, no `get_page_text`, no `javascript_tool` on that tab. The only allowed read is `find` with the query `Copy` (it returns the control's role and name, not the dialog's text); click the ref it returns. If `find` returns nothing, the human clicks Copy and says "copied".
3. Run from the repository root (`timeout 60` where the shell has it):
   ```
   timeout 60 node creatives/tools/env-set.mjs --from-clipboard META_MARKETING_TOKEN
   ```
   It reads the clipboard, writes the one `META_MARKETING_TOKEN=` line into `.env` (every older line of that name replaced), restricts the file to the current user, clears the clipboard, and prints the name and the character count only. "not written: the value is empty" or "shorter than 20 characters" means the Copy did not land: the human clicks Copy, and the tool runs once more (one retry, never a loop). Never `cat`, `grep`, `sed` or open `.env` to check: `--check META_MARKETING_TOKEN` prints the count.
4. Close the dialog (its Close or Done control; or the human), then screenshots are allowed again.
5. The two public ids, also through the tool (never a read of the file; both are the same values as in `config/accounts.md`):
   ```
   printf '%s' <the ad account id, digits only> | node creatives/tools/env-set.mjs --from-stdin META_AD_ACCOUNT_ID --min-length 6
   printf '%s' <the Page id, digits only> | node creatives/tools/env-set.mjs --from-stdin META_PAGE_ID --min-length 6
   ```
If the token ever reaches the chat (a screenshot, a read, a paste), it is burned: the human revokes it (System users → Revoke tokens, the app), `node creatives/tools/env-set.mjs --unset META_MARKETING_TOKEN`, and 7g runs again (revoke first, then generate). The manual paste of `docs/meta-setup-guide.md` step 7 (Notepad, TextEdit) remains the last fallback when no clipboard tool exists on the machine.

**7h. Live checks**, one at a time:
```
timeout 60 node creatives/tools/meta-upload.mjs --check
timeout 60 node creatives/tools/meta-graph.mjs check
timeout 60 node creatives/tools/meta-graph.mjs lead-forms list
```
Green: the token holder is the System User, the ad account with status 1, `adimages ok, advideos ok`; `check` reports the six permissions; `lead-forms list` answers (an empty list is a pass). Code 10 on `lead-forms list` → trap 1. HTTP 400 code 200 "API access blocked" on every call, `check` included → trap 2. Code 190 → the token is wrong or revoked: the human revokes and generates again. One run per check; no blind retry.

- **Records:** in `config/accounts.md`, the app name and App ID, the System User's name and its three assets, the check results (names only: token present and its character count, account reachable, permissions, error code if any); row "Developer app (Business type) + System User token in `.env`"; marks `meta.apptoken=done`, `token.check=done` (`owner` while 7g waits for a human click).

## Step 8. WhatsApp number  (mark `meta.whatsapp`)

- **URL:** the Page's settings on Facebook → Linked accounts → WhatsApp (or `https://business.facebook.com` → Settings → WhatsApp accounts).
- **Harness:** asks the installer to confirm the number runs the **WhatsApp Business** app; on the go, Connect → types the number the installer gives in chat (never written to a file) → Send code. A second number is never set as the Page's primary.
- **Stops at:** the WhatsApp code (hard stop). Switching into the Page profile for this screen is allowed; switch back to the personal profile afterwards (trap 3).
- **Live check:** none (no read of the number); the screenshot of Linked accounts is the evidence.
- **Records:** the number's name only in `whatsapp_number_names`; row "WhatsApp Business number linked to the Page" (`n/a` when no funnel uses click-to-WhatsApp).

## Step 9. Lead forms, terms and Leads Center  (marks `meta.leadads`, `meta.leadscenter`)

- **URL:** `https://www.facebook.com/ads/leadgen/tos`; `https://business.facebook.com` → All tools → Leads Center; Business Settings → Integrations → Leads access.
- **Harness:** opens the Lead Ads terms for the client's Page and stops: accepting is a hard stop. On the go: Leads access → the Page → assign the person under replies in `config/operator.md` (and the CRM if one is named). Reads notification settings for new-lead emails and tells the person to turn them on. Forms themselves are made later from an approved, compliance-checked spec with `meta-graph.mjs lead-forms create` (`docs/meta-graph.md`), not in this step.
- **Stops at:** the terms; the person's own acceptance; any consent or disclaimer wording (never written by the harness).
- **Live check:** `ads_get_ad_account_pages` shows the terms accepted; `timeout 60 node creatives/tools/meta-graph.mjs lead-forms list` answers.
- **Records:** `lead_delivery` in `config/accounts.md`; rows "Lead Ads terms accepted on the Page" and "Leads Center access for whoever answers leads" (`n/a` without instant forms). The webhook row stays `n/a` unless a product team receives leads.

## Step 10. Domain verification  (mark `meta.domain`)

- **URL:** `https://business.facebook.com/settings/owned-domains`.
- **Harness:** on the go, Add → the main domain (no `https://`, no `www`) → reads the DNS TXT record or the meta tag Meta gives (not secrets) → writes them into a note for whoever runs DNS or the site. When they say it is in place, on the go: Verify; reads the status.
- **Stops at:** the DNS or website change (outside Meta; the registrar's password is a hard stop); a failed verify (DNS can take up to 72 hours: press Verify later, never add a second record).
- **Live check:** for the meta tag, fetch the homepage and look for `facebook-domain-verification`; the Domains screen showing verified.
- **Records:** row "Domain verified" (`n/a` without a website).

## Step 11. Instagram  (mark `meta.instagram`)

- **URL:** the Page's settings → Linked accounts → Instagram; Business Settings → Accounts → Instagram accounts.
- **Harness:** reads whether an Instagram account is linked; on the go, Connect and, in Business Settings, connect the ad account to it.
- **Stops at:** the Instagram login (password and code are hard stops); switching a personal Instagram to a professional account (in the app, the client's own step).
- **Live check:** `ads_get_ig_accounts`.
- **Records:** `instagram_account_id` (or `none linked`); row "Instagram linked for ads (optional)".

## Known traps (platform facts)

| # | Symptom | What it really is | What to do |
|---|---|---|---|
| 1 | Every Page endpoint (`lead-forms list`, `leads`) answers **code 10**, although the token carries `pages_manage_ads`, `pages_read_engagement`, `pages_show_list` | The System User has the ad account and the app but **not the Page**. Permissions on a token reach only the assets assigned to its user | Step 7f: Assign assets → Facebook Pages → the Page → Full access "Everything". Assign the Page at creation, with the other two. Re-run the check; the existing token picks the assignment up |
| 2 | HTTP 400, **code 200 "API access blocked"**, even on `GET /me` (the most basic call; `meta-graph.mjs check` fails at once) | Not a permission problem: Meta blocked the **developer account of the app's admin**. developers.facebook.com shows "Account confirmation needed" | Clear the account checkpoint (trap 3: personal profile; the code is a hard stop). Do not generate a new token: after the checkpoint clears, the existing token works again within minutes. Run the check once more after a few minutes |
| 3 | The checkpoint ("Confirm your identity", a code sent to the email) shows **"Sorry, something went wrong"** | The checkpoint renders only when facebook.com is signed in as the admin's **personal profile**; it fails while the browser is "switched into" the Page profile | Switch back to the personal profile (profile menu → the person's name), reopen the checkpoint link, the human types the code |
| 4 | The developer app shows **"Unpublished"** (Development mode) | Normal. System User tokens work in Development mode | Leave it. Never switch the app to Live for this |
| 5 | Two Pages with the company's name | A duplicate (old, or made by mistake) | The installer and the Owner pick the one customers know; the other goes into `config/accounts.md` as a duplicate to avoid; never assign it to the System User or the ad account |
| 6 | Wrong currency or time zone on the ad account | Both are **permanent** | Read both back before Create and get the Owner's confirmation in the same message; a wrong one means a new account without history |
| 7 | A new ad account is restricted or has a low spending limit | Meta reviews new accounts for days; a new portfolio may get one ad account at first | Wait, and tell the Owner. Never create a second account to get around it (it can get every account restricted). An appeal is the Owner's |
| 8 | Calls fail after the installer leaves | The app's only admin, or the MCP login, was the installer's profile | 7d (the Owner as app Administrator) and step 5 (the Owner's own login) prevent it; check both before the end |
| 9 | "Assign assets" is missing; the screen says "Add assets" or shows other tabs | Meta's older or newer Business Settings layout | Look for the outcome: the System User lists the three assets with the access named in 7f |

## The session log

Every click is a line in today's session note `memory/sessions/YYYY-MM/YYYY-MM-DD.md` (start it from `memory/templates/session.md` if it does not exist), appended as it happens:

```
- HH:MM — setup-console step 7f: assigned to system user "<name>": ad account `<id>` full control, app `<app id>`, Page `<page id>` Everything; screenshot sent; go: installer
- HH:MM — setup-console step 7g: hard stop (token) handed to the installer
- HH:MM — setup-console step 7h: meta-upload --check ok; meta-graph check ok (6 permissions); lead-forms list ok (0 forms)
```

Names and public ids only: never a token, a password, a code, a card, an email address, a phone number or a lead. A hard stop and who took it are lines too. At the end, one closing line: steps done, steps `n/a`, steps waiting for the Owner.

## End state

- Every row of the console-steps table in `config/accounts.md` (and its `checklist.md` row) is `done` or `n/a`, dated; "Phone number verified on the ad account" is `done` on the Owner's confirmation.
- Every row of the credential map (the top of `.env.example`; the table "Where every secret lives" in `docs/meta-setup-guide.md`) is provided on the client's computer by the client's own accounts: the `meta-ads` and `fal` logins in `/mcp`, the token in `.env`, the Vercel login if the preview site is used; nothing copied from the installer's machine.
- `/health` is green on checks 1–5 (MCP, login and account, objects, review, pixel), 13 (upload token) and 20 (Graph token, with the lead permissions and `META_PAGE_ID`).
- The System User holds three assets (ad account, app, Page "Everything"); the Owner is an Administrator of the developer app; the MCP login is the Owner's own.
- A `checklist.md` row for the Owner: remove or downgrade the installer's admin access in Users → People once `/health` is green (the Owner's click), with the date.
- The progress page regenerated (`node dashboard/setup-page.mjs --print`); then `/sync` (or `/setup` step 5.5 for the vault notes if the interview is not finished).
- A closing message in the chat language: what was set up, every hard stop and who took it, what the Owner still has to click, and that nothing was built, activated or spent.
