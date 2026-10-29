---
name: onboard
description: "The buyer-mode keys pass, Part A of the onboarding (chapters A3 to A10): the Owner alone at their own computer, in the Claude desktop app's Code tab, with the harness driving the Meta consoles in the Owner's own Chrome through the Claude in Chrome extension and stopping at every hard stop (passwords, codes, the card, legal terms, the token). It checks the extension connection, runs the console steps of setup-console with the Owner clicking the hard stops, appends the two public ids to .env without ever reading it, leads the fal sign-up and login, and ends with the keys table (/health --keys) all green. Use when the Owner types /onboard, when /setup step 0.5 or step 2 finds the extension connected, or to resume the pass at the first row not done."
---

# /onboard: the keys pass, in the Owner's own Chrome

**Routing (since 2026-10-29).** `/onboard` is the console part of **`/connect`** (Part 1 of the onboarding): typing `/onboard` runs `/connect`, which asks the language first, checks the prerequisites, asks what already exists in Meta and verifies it in the Owner's Chrome, then runs the chapters below from the first one not `done` or `n/a`, and ends with `/health`. The chapters stay here as the shared step bodies.

One guided pass that collects every login and the one key the harness needs, then stops. "All the keys in `.env`" is one key: the Meta System User token (plus two public ids). Every other connection is a login made in the browser or in the app and stored by Claude Code or the tool (the credential map at the top of `.env.example`). After this pass the harness runs on its own: `/setup`, `/health`, the first flight built PAUSED (Part B).

The **Owner** sits at their own computer, in the Claude desktop app's Code tab, with Chrome open and the Claude in Chrome extension signed in. The harness navigates, reads, fills and clicks in that Chrome **on the Owner's go typed in chat**, and stops at the hard-stop list of `.claude/skills/setup-console/SKILL.md`, where the Owner does the step. The screens, outcomes, traps and records are those of `setup-console` (its steps 1–11) and `docs/meta-setup-guide.md`; this page says only what differs in Owner mode and how the chapters run. Project rules (`CLAUDE.md`) win on any conflict.

**Say at the start, in two or three plain sentences:** nothing is turned on and nothing spends: the go line with the amount, in the same message, is the only thing that ever runs an ad, and this pass never asks for it. No password, code or token ever goes into the chat: at those screens the harness stops and says "your turn", and the token goes into `.env` through a text editor. The pass ends with one table, all green.

## When to use

- The Owner typed `/onboard`, or `/setup` (step 0.5 or step 2) found the extension connected and handed the console steps here.
- Resume: the pass stops when a hard stop waits (a code that did not arrive, a card, a review) or when a new session is needed (A5, A9). The next `/onboard` starts at the first chapter whose page item is not `done` or `na` (`node dashboard/setup-page.mjs --print`), or the first row of the console-steps table of `config/accounts.md` that is not `done` or `n/a`; chapters already done are read back, never redone.
- Not for: an installer at the consoles (`setup-console`); click lists without browser tools (`/setup` step 2 prints them); building campaigns (`meta-campaign-build`); anything in Ads Manager beyond reads.

## Before the first chapter (in this order; stop at the first one missing and say what to do)

1. **The desktop app.** `mcp__scheduled-tasks__*` or `mcp__ccd_*` tools are present: this session runs in the Claude desktop app's Code tab (chapter A2 is done). In a terminal session the pass still works, but the memory routines, Remote Control and the extension's pairing screen are the app's: say so once and go on.
2. **The extension.** Load the browser tools in one ToolSearch call: `select:mcp__claude-in-chrome__list_connected_browsers,mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__find,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__form_input`. Then `list_connected_browsers`: a browser is listed, and `tabs_context_mcp` answers. When the tools are missing or no browser is connected, run chapter A3 first; never fall through to click lists without saying so (they are `/setup` step 2's).
3. **`.env` exists** (`test -f .env && echo present || echo missing`; the bootstrap copied it from `.env.example`). Never open, read, grep, print or screenshot it.
4. **The names.** `config/` may still hold `{{` placeholders (Part B fills it). Ask the Owner in chat for the two names the pass needs: the business as Meta shows it (the portfolio switcher) and a short name for the app and the System User (`<short name> marketing`, `<short name>-harness`). Record them in today's session note; `/setup` round (b) confirms them.
5. **The progress page** beside Chrome: `node dashboard/setup-page.mjs --open`. From here on, mark every confirmed step (`--mark <key>=<status>`; `owner` while a hard stop waits).

## What differs from `setup-console` (Owner mode)

| | Installer mode (`setup-console`) | Owner mode (`/onboard`) |
|---|---|---|
| Who sits at the consoles | the installer, with the client's admin access | the Owner, with their own personal Facebook profile (two-factor on) |
| The go | typed by the installer, holding the Owner's written OK | typed by the Owner, in the same message, naming the chapter or the click ("go: A7, create the system user"); one message may cover one chapter's clicks; a go never carries over |
| Hard stops | the list in `setup-console` | the same list, plus: the Claude sign-in inside the extension (A3), the fal sign-up and its card (A9), the WhatsApp number itself (A8: the Owner types it; a phone number never passes through the chat). The token is not a paste any more: its value moves clipboard → `.env` through `env-set.mjs` on the Owner's go (A7), unseen by both |
| App roles (step 7d) | the Owner added as Administrator of the app | n/a: the Owner's own profile creates the app |
| The MCP login (step 5) | the Owner's profile, with the installer standing by | the Owner's profile; the consent screen is the Owner's alone |
| Screens that list other businesses (the portfolio switcher, the Login for Business chooser) | read | read, **never screenshotted**: describe the outcome ("the company's portfolio is selected"), name no other business |
| Records | `config/accounts.md` rows, `checklist.md` rows, marks, the session note | the console-steps rows and the ids in `config/accounts.md` (replace only the `{{` placeholders you learned; leave the rest for `/setup`), the marks, the session note; a `checklist.md` row only for a hard stop still open at the end of a chapter (owner Owner); `/setup` step 5 writes the full rows later and keeps these |
| The end | the installer's access removed; `/health` green on 1–5, 13, 20 | the keys table (`/health --keys`) all green; nothing to remove |

Everything else is `setup-console` as written: how every step runs (navigate, say the plan, click on the go, screenshot after every state change, live check, record), the traps table, the session-log line format (`- HH:MM — onboard A7f: …`), names and public ids only.

**Screenshots.** As in `setup-console`: one after every state change and at every stop, sent to the chat (and as a file when the host has a file-sending tool), copies only outside the repository. Never a screenshot of a token, a password field with a value, a card form, a lead, or a screen that lists another business. From the click on Generate until the token dialog is closed: no screenshot, `read_page`, `get_page_text` or `javascript_tool` on that tab; only `find` for the Copy control (7g).

## The chapters

### A3. Claude in Chrome  (mark `chrome.extension`)

- **Outcome:** `list_connected_browsers` lists the Owner's Chrome, and facebook.com in it is signed in as the Owner's personal profile with two-factor on.
- **Not connected yet** (the tools are missing, "Browser extension is not connected" or "No browsers are connected"): the Owner's clicks, read from the screen and said one at a time:
  1. In the desktop app: the initials at the lower left → **Settings** → **Customize** → **Connectors** → **Claude in Chrome** → **Configure** → turn it on; when the extension is not installed yet, the app opens its Chrome Web Store page: **Add to Chrome** → sign in to the extension **with the same Claude account** (and organization) as the app (a hard stop) → pin it. In a terminal session the same pairing is `/chrome` → **Enabled by default** (or `claude --chrome`); the first enable writes Chrome's native-messaging host entry, so Chrome is restarted once if the extension reads "Not detected".
  2. A new session (the browser tools load only into a session started after the pairing), then `/onboard` again.
  3. Where a screen differs from these labels, look for the outcome: the extension installed and signed in, the app's connector on, a browser listed by `list_connected_browsers`.
- **Connected:** `tabs_create_mcp`, `navigate` to `https://www.facebook.com/`, read the profile menu (names only, said in chat, never written to a file): the personal profile, not a Page profile (trap 3 of `setup-console`); `https://accountscenter.facebook.com/password_and_security`: two-factor on, else the Owner turns it on (codes are a hard stop). Then `--mark chrome.extension=done`.

### A4. Meta business basics  (`setup-console` steps 1–4; marks `meta.portfolio`, `meta.page`, `meta.adaccount`, `meta.payment`, `meta.phone`, `meta.people`)

- The portfolio and the Page exist (read them; a Page or portfolio to create is the exception, as in steps 1–2). The ad account is created when there is none: its **time zone and currency are read back and confirmed by the Owner in the same message before Create** (trap 6). Then Billing and payments: the card is the Owner's (hard stop); the phone number and its code are the Owner's.
- People and roles: `n/a` when the Owner operates alone; a person added later goes through `/setup` step 2.
- Records: `business_portfolio_id`, `page_id` (and duplicates to avoid), `meta_ad_account_id`, `currency` into `config/accounts.md`; the rows, dated; the marks. The live checks of these steps run after A5.

### A5. The Meta login  (`setup-console` step 5; marks `meta.login`, `login.tools`)

- `/mcp` → `meta-ads` → log in: the consent screen opens in the browser; it must show the Owner's own profile; grant only this company's business, ad account and Page. The chooser is never screenshotted. When the Code tab offers no `/mcp` login, the documented fallback is a terminal in the harness folder: `claude mcp login meta-ads`. Then a new session (kept from this harness's experience: the documentation does not require it); before it, append the session-note line and the marks so the next `/onboard` resumes here.
- In the new session: `ads_get_ad_accounts` and `ads_get_user_pages` show the company's account and Page. More than that: say "the grant was wider than it needs to be: `/mcp` → `meta-ads` → re-authenticate and tick only this business" (the account guard keeps every call inside the one account meanwhile). Then the pending live checks of A4 (steps 1–3), `min_daily_budget` recorded, `--mark meta.login=done --mark login.tools=done`.

### A6. The pixel  (`setup-console` step 6; mark `meta.pixel`)

- As written. The base code and the one consent sentence go into `plans/<today>-website-requests.md` (vault frontmatter, `type: plan`, labelled "Needs product team", or the Owner when there is no product team); the domain record of A8 joins it later. No website: `n/a`, `pixel_id` = `none (no website)`.

### A7. The developer app, the System User, the token  (`setup-console` steps 7a–7h; marks `meta.apptoken`, `token.check`)

- 7a–7c and 7e–7f as written, on the Owner's go; the developer terms and any code are the Owner's; 7d is n/a (the Owner's own profile creates the app). The app stays Unpublished (trap 4). The System User gets its three assets at creation (the ad account with full control, the app, the Page "Everything").
- **7g, the token: the clipboard route, on the Owner's go** ("go: A7, generate the token"), exactly as `setup-console` 7g: the harness clicks Generate token, the app, Never, the six permissions and Generate; from that click until the dialog is closed it reads nothing on that tab except `find` for the Copy control, clicks Copy, and runs `timeout 60 node creatives/tools/env-set.mjs --from-clipboard META_MARKETING_TOKEN`, which moves the clipboard into `.env`, clears the clipboard and prints the name and the character count only. The Owner never sees, copies or pastes the value; the harness never does either. If `find` finds no Copy control, say "your turn: click Copy, then tell me 'copied'" and run the tool. Then the two public ids through the same tool (`--from-stdin META_AD_ACCOUNT_ID --min-length 6`, `--from-stdin META_PAGE_ID --min-length 6`; never a read of the file). A token that reaches the chat is burned: the Owner revokes it, `env-set.mjs --unset META_MARKETING_TOKEN`, generate again (revoke first, then generate).
- **7h, the live checks**, one at a time, as written (`meta-upload.mjs --check`, `meta-graph.mjs check`, `lead-forms list`); code 10 → trap 1, code 200 "API access blocked" → trap 2, code 190 → the Owner revokes and generates again. Records: the app name and App ID, the System User's name and its three assets, the check results by name; `--mark meta.apptoken=done --mark token.check=done`.

### A8. WhatsApp, lead forms, domain  (`setup-console` steps 8–10; marks `meta.whatsapp`, `meta.leadads`, `meta.leadscenter`, `meta.domain`)

- WhatsApp: the harness opens the Page's Linked accounts → WhatsApp and stops; the Owner types the number and the code (switching into the Page profile for this screen is allowed; switch back afterwards, trap 3). `n/a` when no funnel uses click-to-WhatsApp. The number's label only goes into `whatsapp_number_names`.
- Lead Ads terms and Leads Center access only when a funnel will use instant forms (the Owner says); the terms are the Owner's. Domain verification: the record goes into the website-requests note of A6; Verify runs on the go once it is in place; `n/a` without a website.

### A9. fal  (mark `fal.login`; optional)

- fal is paid per run on the company's own account and optional: without it the still comes from the renderer and the video from HyperFrames (`creative-production`). The Owner may skip it: `--mark fal.login=na`.
- Otherwise: `navigate` to `https://fal.ai/` and stop at sign-up: the e-mail (not the company's main inbox), the password or the single sign-on and the card are hard stops; a small credit is the Owner's choice and nothing is charged by the harness. Then `/mcp` → `fal` → log in (the consent screen in the browser; the terminal fallback is `claude mcp login fal`), a new session (append the session-note line and the mark first), and in it `mcp__fal__check_account_status`: the balance is read (a number, fine in chat); `--mark fal.login=done`.

### A10. The keys table  (mark `keys.table`)

- Run `/health --keys` (the `health` skill, keys view): the desktop app (26), Chrome and the extension (27), the Meta MCP (1), the login and the account (2), the pixel (5), the upload token (13), the Graph token (20), the credential map (25), fal (8), the hooks (18), Obsidian (19). Every row green, or `n/a` by the Owner's word (fal skipped; no website): `node dashboard/setup-page.mjs --mark keys.table=done`. A yellow or red row names the click; the pass is not over until the table is green.
- **Closing message**, in the chat language: what is in place, every hard stop and who took it, what is still the Owner's to click (the open `checklist.md` rows), that nothing was built, activated or spent, and that Part B starts with `/setup`.

## End state

- `list_connected_browsers` lists the Owner's Chrome; the `meta-ads` login is the Owner's own and shows the company's account alone; `.env` holds the token (pasted by the Owner) and the two appended ids; the System User holds three assets; `/health --keys` is all green; the progress page shows Part A ticked.
- `config/accounts.md` holds the ids and the console-steps rows the pass produced (the other placeholders wait for `/setup`); `plans/<today>-website-requests.md` holds the pixel snippet and the domain record when a website exists; today's session note holds one line per click and hard stop, names and public ids only.
- Nothing built, nothing activated, nothing spent.
