---
type: decision
created: 2026-10-29
updated: 2026-10-29
status: active
maintained_by: harness
categories: [decisions, harness]
summary: The Owner's rulings of 2026-10-29 on the onboarding: two parts (/connect, /campaign), the chosen language rules every surface, the token moves clipboard → .env by env-set.mjs unseen, fal through its MCP login, the inventory before any creation, full research, the campaign built PAUSED with creatives, unlimited interview rounds, the hard-stop list.
decided_by: owner
supersedes: ""
superseded_by: ""
---

# The onboarding in two parts, the language, the token route

**Ruling.** (slava lebovkin, in chat, 2026-10-29, through nine question-tool answers.)
1. **The token** reaches `.env` without a human paste: on the Owner's go the harness clicks Generate and Copy in the Owner's Chrome without reading the dialog, and `creatives/tools/env-set.mjs --from-clipboard META_MARKETING_TOKEN` moves the clipboard into `.env` and clears it. The value never passes through the chat or the harness.
2. **Language.** The first question of the onboarding is "Which language do you prefer?" (asked in both languages). The answer rules every chat answer, every question-tool question and option, HOME and the Inbox, the progress page and the health table. Files that agents read stay English; the bootstrap's terminal lines stay English; reports and plans stay English.
3. **Two commands.** `/connect` (Part 1: language, prerequisites, the inventory of what exists, every connection, `/health` green) and `/campaign` (Part 2: the long interview, the market research, the plan, copy, creatives, the campaign built PAUSED and shown). `/setup` and `/onboard` stay as routers into them; `setup` remains the shared steps library.
4. **fal** stays on its MCP login (OAuth) with a credit check in Part 1; no key is pasted anywhere; optional.
5. **Existing assets.** Part 1 asks four inventory questions (portfolio, Page, ad account, developer app), verifies them in the Owner's Chrome, and creates only what is missing; the System User gets full access to the ad account, the app and the Page.
6. **Research depth.** Full: competitor-researcher (Ad Library + web), audience research (targeting ids and reach), offer-design, the account's own past ads, the pages when a website exists; agents in parallel; one merged report.
7. **Part 2 ends** with the campaign built PAUSED, creatives made (fal only on a stated cost and the go), media uploaded, Meta's previews sent. Activation stays a separate go.
8. **Interview length.** As many rounds of four as needed, with a progress line; research fills what it can.
9. **Hard stops** that stay the human's: passwords, re-logins and codes; identity documents; the payment card; legal and developer terms; Discard drafts and deletes. The Generate and Copy clicks are the harness's on the go.

**Context.** The Owner asked, after the first full setup of Habait, to improve the bootstrap and the wizard: the manual token paste was the step a non-technical Owner stumbled on; the question tool was still in English after the Owner had chosen Hebrew; one wizard mixed connecting accounts with planning a campaign; fal's key handling was unclear (it needs none).

**What it replaces.** The `/onboard` → `/setup` sequence of 2026-10-28 (the token as the Owner's paste in Notepad; questions in English by rule), recorded in CLAUDE.md §7 and the `onboard`, `setup`, `setup-console` skills before this date.

**Applies to.** CLAUDE.md (§2, §4 tables, §7, the Meta connection section, the A-to-Z), the skills `connect`, `campaign`, `setup`, `onboard`, `setup-console`, `health`, the progress page, the bootstrap's "What remains", `docs/meta-setup-guide.md` step 7, `.env.example`, ONBOARDING.md, README.md.
