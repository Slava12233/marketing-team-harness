---
name: check
description: "Step 3 of the installer's path (/install, /meta, /check, /campaign): is everything connected? Runs the keys view of /health and then the full /health, read-only, and ends with one verdict: READY for /campaign, or NOT READY with the one command or click that fixes each red row. The connection rows decide (this copy, the tools, the Meta MCP and login, the upload token, the Graph token, the credential map, the hooks, the Google login when Google is a platform); rows that only wait for /campaign (empty config, no goals yet) and deferred Meta items are listed as later, never as failures. A thin layer over the health skill: the same reads, the same colours, no fix. Use after /install and /meta, when the Operator types /check, or before handing the computer to the client."
---

# /check: is everything connected?

Step 3 of **the installer's path**: `/install` → `/meta` → `/fal` (optional) → **`/check`** → `/campaign` (the sheet: `docs/quick-install.md`). It answers one question for the installer: can this computer be handed over and `/campaign` started?

This page is a thin layer over the `health` skill: every read, colour, bound and "what to do" line is `health`'s, and this command fixes nothing. It adds the order and the verdict. `CLAUDE.md` wins on any conflict.

## What runs

1. `/health --keys`: the keys table (rows 28, 26, 27, 1, 2, 5, 13, 20, 29, 25, 8, 18, 19), with `health`'s own marks.
2. The full `/health`: every check, the table in the chat language, `reports/YYYY-MM-DD-health.md` when a row is red, the mark `health.run=done`.
3. The verdict below, then the wizard regenerated (`node dashboard/setup-page.mjs`) and one line in today's session note (`- HH:MM — check: READY; yellow: 27 (no extension), 5 (pixel deferred)`).

## The verdict

**The connection rows decide.** READY when every one of these is green and no other row is red for a reason of its own:

| Row | What it proves |
|---|---|
| 28 this copy | the folder is this business's own harness |
| 14 bootstrap | Git, Node.js 20+ and Claude Code are present |
| 1 MCP, 2 login | the Meta tools are loaded and show the client's ad account and Page |
| 13 upload token, 20 Graph token | the System User token works, with its permissions and the Page |
| 25 credential map | `.env` is git-ignored and holds the four names |
| 18 hooks | the account guard is in place |
| 29 Google login | only when Google is a platform |

**Listed as "later", never as a failure:**

- **Waiting for `/campaign`:** row 10's placeholders in `config/` and the `memory/business/` notes, row 15's empty `config/goals.md`, row 21's `config/reporting.md`. The interview fills them. The guard's dry check of row 18 exiting 0 while `config/accounts.md` still holds the account placeholder is the same case; once `/meta` wrote the account it must refuse.
- **Deferred Meta items:** a console-steps row `open` with the note `deferred: /meta <item>` (the pixel of row 5, WhatsApp, lead forms, the domain, Instagram). Say which campaign type needs which.
- **The driven mode's tools:** row 27 without the Claude in Chrome extension (only `/connect`'s driven mode uses it), row 26 in a terminal session, and Obsidian (row 19) when the client skipped it.
- **fal (row 8), optional:** not connected (the `mcp__fal__*` tools are not loaded, or the mark `fal.login` is not `done`) is "later" with its command, `/fal`; skipped by the client (`fal.login=na`) is n/a and not listed; connected with a zero balance is yellow, "the Owner adds credit at fal".
- **The Owner's own steps:** the payment method and the verified phone on the ad account when their rows are `open`. They do not block `/campaign` (a campaign is built PAUSED) and they do block any activation: say so in the verdict.

Anything else red is NOT READY. Never soften a red row: a wrong account in row 2, a token error in rows 13 or 20, an `.env` that git would commit, a missing guard.

## Output

In the chat language, after `health`'s table:

```
/check YYYY-MM-DD HH:MM
READY for /campaign
connected: account <meta_ad_account_id>, Page <page_id>, token holder <System User name>
later:     27 extension not connected (only /connect's driven mode needs it)
           5 pixel deferred: /meta pixel when the campaign sends people to the website
           8 fal not connected: /fal when the client wants generated pictures or video
           10, 15, 21 filled by /campaign
owner:     payment method and phone on the ad account, before any activation
mode:      Part 1 is closed: switch the permission mode back to Manual (the selector under the prompt box)
next:      /campaign
```

The `mode:` line is the reminder of `setup` step 0.4, printed on every READY whatever mode the session is in (the harness cannot read it), with its reason in one sentence the first time: the daily sessions read public web pages, and the approval prompt is the human check.

or

```
/check YYYY-MM-DD HH:MM
NOT READY: 2 rows
20 Graph ... red  code 10 on lead-forms: the Page is not assigned to the System User → /meta app (step 5 of its list), then /check
 2 login ... red  the ad account is not visible → /meta login (re-authenticate with the Owner's profile)
```

Every red row names one command of the path (`/install <item>`, `/meta <item>`, `/fal`) or one click and who clicks it. No write to the account, no re-login, no install: those are `/install`'s and `/meta`'s.
