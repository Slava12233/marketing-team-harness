---
name: connect
description: "Part 1 of the onboarding, the connections pass: asks the Owner's language first (and from then on speaks, asks and writes Owner-facing notes in it), checks the prerequisites, asks four inventory questions about what already exists in Meta (portfolio, Page, ad account, developer app) and verifies them in the Owner's own Chrome, then runs every connection chapter of /onboard on the Owner's go (the Meta business basics, the Meta login, the pixel, the developer app and the System User with full access to the ad account, the app and the Page, the upload token moved from the clipboard into .env by env-set.mjs without anyone seeing it, WhatsApp, lead forms, the domain, fal through its MCP login), writes config/accounts.md and config/operator.md, and ends with /health green. Nothing is built, activated or spent. Use as the first command of a fresh copy after the bootstrap, when the Operator types /connect or /onboard, or to resume the pass at its first open chapter."
---

# /connect: connect everything, then `/health`

Part 1 of the onboarding. You connect the harness to everything it needs (the Claude in Chrome extension, the Meta business, the Meta login, the developer app and the System User token, WhatsApp, lead forms, the domain, fal) and prove it with `/health`. Part 2, `/campaign`, builds the first campaign. You build nothing in the ad account here and you activate nothing.

The step bodies are shared: the console chapters are `onboard` (A3–A10), which reuses the step bodies, the hard-stop list, the traps and the marks of `setup-console`; the prerequisites and the account write are steps 0.5, 3 and 5 of `setup`. This page says what runs, in which order, in which language, and what differs. `CLAUDE.md` wins on any conflict.

## Rules you state at the start (two or three plain sentences, after the language question)

1. **Nothing is built, activated or spent.** This pass only connects accounts and writes files in this folder.
2. **No secrets in chat.** No password, code or token is ever typed here. The one token the harness uses moves from Meta's Copy button into `.env` by a tool (`creatives/tools/env-set.mjs`) that clears the clipboard and prints only a character count: neither you nor the harness sees it.
3. **One go per chapter.** Every click that changes something runs only on your go typed in the same message ("go: A7"); the harness stops at every password, code, identity document, card, legal terms screen and delete, and says "your turn".

## Step 0. The language (the first question)

Before anything else, one AskUserQuestion, written in both languages at once:

> Which language do you prefer? / באיזו שפה תרצו שנדבר?
> Options: **עברית** (Recommended when the Operator's first message was in Hebrew, else second) · **English** · Other (type it)

Record it at once: `**Chat language:**` in `config/operator.md` (replace the placeholder or the value; add "(RTL)" for Hebrew or Arabic), `node dashboard/setup-page.mjs --lang he|en` (any other language keeps `en` for the page), and one line in today's session note. **From this answer on, every chat answer, every AskUserQuestion question and option, every summary, the progress page, the health table's "what to do" lines, HOME and the Inbox are in that language**, right to left when it is RTL; technical names (commands, ids, field names, Meta's screen labels) stay as they are; files that agents read (config, plans, reports, notes other than HOME and the Inbox) stay English. When `config/operator.md` already holds a chat language and the Operator's message is in it, ask anyway (one question) and keep the answer.

## Step 1. Prerequisites

`setup` step 0.5 as written (the progress page opened, the table of Git / Node / Claude Code / the desktop app / the extension, `.env` present, `.mcp.json`, the tools, Obsidian, the hooks and the account guard), with one change: anything missing is the bootstrap's, and the Operator comes back to `/connect` (not `/onboard` or `/setup`). The extension is needed for the chapters below: when it is not connected, run chapter A3 of `onboard` first (the Connectors path, then a new session and `/connect` again); the click lists of `setup` step 2 remain the fallback only when the Owner says they cannot use the extension at all.

## Step 2. The inventory (what already exists)

Many Owners already have a business on Meta. Ask one round of four (in the chat language, recommended first; "I am not sure" is a valid option on each):

1. **Business portfolio:** "We have one and I am its admin" (Recommended) · "I am not sure" · "We have none".
2. **Facebook Page:** "The company has a Page I administer" (Recommended) · "Not sure" · "None yet".
3. **Ad account:** "We have an ad account with a payment method" (Recommended) · "We have one, payment or phone not sure" · "None yet".
4. **Developer app and System User:** "Never heard of them" (Recommended: most companies have none) · "An app exists" · "An app and a System User exist".

A second round when it matters: a website (yes → the pixel and the domain chapters apply; no → both `n/a`), click-to-WhatsApp planned (yes → the WhatsApp number's label, never the number), instant forms planned (yes → Lead Ads terms and Leads Center), Instagram for ads (optional), and the two names chapter A4 needs (the business as Meta shows it; a short name for the app and the System User).

Then **verify in the Owner's Chrome before creating anything**: `https://business.facebook.com/settings` (the portfolio and the signed-in name's role), Accounts → Pages, Accounts → Ad accounts (currency, time zone, payment, the phone's state where shown), Accounts → Apps, Users → System users; read, screenshot (never a screen that lists another business), and record what exists with its public ids in the console-steps table of `config/accounts.md` (status `done` with "existing, verified <date>") and the marks. Create only what is missing, in the chapters below, each on the Owner's go.

## Step 3. The Meta chapters (A3–A8 of `onboard`, as written)

Run `onboard` from its first chapter not `done` or `n/a`, with these points fixed:
- **A4** creates only what step 2 found missing. An existing ad account is never recreated; its currency and time zone are read back and confirmed by the Owner in chat (they are permanent).
- **A5**, the Meta login (`/mcp` → `meta-ads`): the Owner's own profile; only this company's business, ad account and Page shared; then a new session and `/connect` again (it resumes here).
- **A7**, the developer app, the System User and the token: the harness creates the app (Business type, Marketing API, connected to the portfolio), the System User (Employee) and assigns its three assets at creation with full access (the ad account: Full control; the app: Develop app; the Page: Everything), on one go per chapter; developer terms and any code are the Owner's hard stops. **The token takes the clipboard route of `setup-console` 7g:** Generate and Copy on the go, no read of the dialog except `find` for the Copy control, `timeout 60 node creatives/tools/env-set.mjs --from-clipboard META_MARKETING_TOKEN`, the two public ids through the same tool, then the three live checks. An existing app or System User found in step 2 is reused: assign the missing assets, generate a token for it the same way.
- **A6, A8**: pixel, WhatsApp, lead forms, domain, Instagram per the step-2 answers; what does not apply is `n/a` with the reason.

## Step 4. fal (A9 of `onboard`, optional)

fal needs no key: it logs in through its MCP (`/mcp` → `fal` → log in; the terminal fallback `claude mcp login fal`). The harness leads the sign-up in the Owner's Chrome and stops at the e-mail, the password or single sign-on and the card (hard stops); after the login and a new session, `mcp__fal__check_account_status` reads the balance (a number, fine in chat) and the mark is `fal.login=done`. The Owner may skip it (`na`): stills come from the renderer and video from HyperFrames. Never a `FAL_KEY` in `.env` unless the Owner runs a script of their own.

## Step 5. Write the account files

`setup` step 3 (the live read: the account, the Page and its duplicates, the pixel, Instagram, the portfolio, `meta-upload.mjs --check` by names, `lead_delivery`) and the account rows of step 5: `config/accounts.md` filled (ids, currency, minimum daily budget, the console-steps table with dates and notes, the MCP servers and logins table), `config/operator.md` with the Owner's name, the Operators, the chat language (the rest of the file is `/campaign` round (a) and (h)), `checklist.md` rows for every console step (done / open / n/a) and for every hard stop still open. Names and public ids only. Then regenerate the page (`node dashboard/setup-page.mjs`).

## Step 6. `/health`

Run `/health --keys` first (A10: every row green or `n/a` by the Owner's word), then the full `/health` (the `health` skill: all checks, the table in the chat language). A yellow or red row names the click or the fix and who does it; the pass is not over until nothing is red. Marks: `keys.table=done`, `health.run=done`.

## Step 7. Close

- Session note lines for every chapter (`- HH:MM — connect A7: …`), `memory/state/current.md` next actions (`/campaign` first), the marks, `node memory/tools/build-hot.mjs --by connect`.
- **Closing message, in the chat language:** what is connected (by name and public id), every hard stop and who took it, what is still the Owner's to click (the open `checklist.md` rows, numbered), that nothing was built, activated or spent, and that Part 2 starts with `/campaign`: the interview about the company and the first campaign, the market research, and the campaign built PAUSED.

## Resume

`/connect` (and `/onboard`, which routes here) resumes at the first chapter whose console-steps row is not `done` or `n/a`, after the language question (one question, kept short when the language is already set). Nothing is asked twice when `config/` already holds the answer: read it, confirm it in one line.
