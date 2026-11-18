---
name: fal
description: "An optional step of the installer's path (/install, /meta, /fal, /check, /campaign): the company's fal account connected by command, for generated pictures and video. The installer (or the Owner) signs up at fal.ai and logs in through the fal MCP (/mcp, fal, log in), a new session starts, and the harness reads the account and its balance with check_account_status and records who holds the login. /fal status only reads; /fal skip marks fal as not used. A thin layer over chapter A9 of onboard and step 4 of connect: the same mark (fal.login) and the same row. Nothing is generated, nothing is charged, no key is written to .env. Use after /meta when the client wants AI pictures or video, when /check shows the fal row yellow, when /campaign needs a generated picture and fal is not connected, or when the Operator types /fal."
---

# /fal: the fal account, connected

An **optional** step of **the installer's path**: `/install` → `/meta` → **`/fal`** → `/check` → `/campaign` (the sheet: `docs/quick-install.md`). fal is where the harness generates pictures and video; it is paid per run on the company's own account. Without it everything still works: the still comes from the renderer and the video from the HyperFrames plugin (`creative-production`), and `/campaign` builds the campaign. Run this command when the client wants generated pictures or video, now or any time later.

This page is a thin layer over chapter A9 of `onboard` (step 4 of `connect`): the same outcome, the same mark and the same row, with the human clicking instead of the extension. `CLAUDE.md` wins on any conflict.

**Say at the start, in one or two sentences:** this command only connects the fal account; it generates nothing and charges nothing. Later, every paid run is stated with its cost first and needs the Owner's go in the same message.

## Words after the command

| Typed | What runs |
|---|---|
| `/fal` | Steps 0–4, from the first one not done; typed again after the login's new session, it resumes at step 3 |
| `/fal status` | Step 3 only: the account and the balance read back, nothing changed |
| `/fal skip` | The client does not use fal: the mark `fal.login=na`, the row "skipped by the client, <date>", then `/check` |

## Step 0. Before the first step

1. `node memory/tools/instance.mjs --check` exits 0 (exit 3: a new copy; reset it as `/install` step 0 does, then go on).
2. `.mcp.json` declares `fal` (`https://mcp.fal.ai/mcp-relay`) and the installer approved it when the folder was opened (`/install` step 4); when it was not approved, `/mcp` lists it.
3. **Resume:** the `mcp__fal__*` tools are loaded in this session → skip to step 3. They are not → step 1.

## Step 1. The account (the human's clicks)

One message, a short click list, then wait for "done":

1. Open `https://fal.ai/` in the browser and sign up, or sign in when the company already has an account. **The company's own account**, with an e-mail the Owner controls: never the installer's.
2. The e-mail, the password or the single sign-on, and the card are typed by the human at fal's screen and never pass through the chat (the hard-stop list of `setup-console`). A small starting credit is the Owner's choice; the harness charges nothing.

**Never a key.** fal needs no API key here: it logs in through its MCP. Do not ask for a `FAL_KEY`, do not write one into `.env`, and when a key is pasted into the chat say it is burned and the Owner revokes it at fal.

## Step 2. The login, then a new session

1. `/mcp` → `fal` → log in: the consent screen opens in the browser where the human is signed in to fal (the terminal fallback is `claude mcp login fal`).
2. Record before the session ends: one session-note line (`- HH:MM — fal: login done, new session next`) and `node dashboard/setup-page.mjs --mark fal.login=owner` (a human step is waiting on the check).
3. Tell them: the fal tools load only into a session started after the login. **Start a new session and type `/fal` again.**

## Step 3. The check (a live read)

`mcp__fal__check_account_status`, once, no blind retry:

- **It answers:** say the account's name and the balance (a number, fine in chat). **A login already on this computer belongs to no one yet:** the fal login is kept per computer, not per folder, so ask one question, in the chat language: "Is `<account name>` the account that pays for this business?" Yes → step 4. No → the human logs in again with the right account (`/mcp` → `fal` → re-authenticate), a new session, `/fal`; the other harness on this computer then needs its own login back, so say that first.
- **The balance is zero:** connected, and nothing can be generated until the Owner adds credit at fal (their click, their card). The row is `done` with the note "no credit yet".
- **It fails or the tools are missing:** the login did not land or the session is older than the login: step 2 again, once. A second failure is a `checklist.md` row (owner Owner) with what the call said, never a retry loop.

## Step 4. The record, then `/check`

- `config/accounts.md`, the MCP servers and logins table: the fal row's "Login held by" (the Owner's name, or "the company's account"); names only, never the e-mail's password or a key.
- `node dashboard/setup-page.mjs --mark fal.login=done`, then `node dashboard/setup-page.mjs`.
- `checklist.md`: the fal row `done` (or `n/a` on `/fal skip`), and, when the balance is zero, a row for the Owner: "add credit at fal before the first generated picture".
- One line in today's session note (`- HH:MM — fal: connected, account <name>, balance <number> as of <time>`).
- **Closing message, in the chat language:** the account connected and its balance, that nothing was generated or charged, that every paid run later is stated with its cost and needs the Owner's go, and the next command: **`/check`** (or back to `/campaign` when it sent the Operator here).

## End state

`mcp__fal__check_account_status` answers with this business's account; the mark `fal.login` is `done` (or `na`); row 8 of `/health` is green with credit, yellow with a zero balance, n/a when skipped. No `FAL_KEY` anywhere.

**In Codex:** `codex mcp login fal` takes the place of `/mcp` → `fal` → log in, then a new session (`docs/codex.md`).
