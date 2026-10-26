---
type: tooling
created: 2026-10-26
updated: 2026-10-26
status: active
maintained_by: harness
categories: [tooling, obsidian]
summary: A plain-language guide to the memory vault in Obsidian - what it is, installing Obsidian, opening the folder, HOME, the Inbox, the weekly review, the CLI toggle, the hooks, optional Sync, and what goes wrong.
---

# The memory vault in Obsidian: a guide for the Owner and the Operator

## What the vault is

The harness remembers everything in plain text files in the `memory/` folder: what is true in the ad account right now, every campaign, every creative flight, every ruling the Owner made, every lesson learned, a note for each working day. Together they are a "vault": a folder of linked notes. Claude reads it at the start of every session and writes to it as it works, so nothing depends on a long chat history.

**Obsidian** is a free app that shows that folder as a tidy, clickable notebook: your page with today's picture, live tables of campaigns and open items, and an Inbox where you write to the team in your own words. You never have to use it: the harness works the same without it. It is simply the most comfortable way to look inside.

## 1. Install Obsidian

The bootstrap (`bootstrap.ps1` on Windows, `bootstrap.sh` on macOS) installs Obsidian with the other tools after your one confirmation, and opens the vault at the end. If you skipped it, or want to install it yourself:

- **Windows:** open PowerShell and run `winget install Obsidian.Obsidian`, or download it from obsidian.md.
- **macOS:** open Terminal and run `brew install --cask obsidian`, or download it from obsidian.md.

## 2. Open the folder as a vault (once)

1. Start Obsidian.
2. Choose **Open folder as vault**.
3. Pick the folder you unzipped: the harness folder, the one that holds `CLAUDE.md`, `config/` and `memory/` (not the `memory/` folder itself).
4. If Obsidian asks whether to trust the folder, say yes. The vault uses only Obsidian's built-in features; there are no community plugins to enable.

Obsidian hides the folders that are not notes (`creatives/`, `.claude/`, `dashboard/`, `examples/`, `vendor/`). The left sidebar's **Bookmarks** has four shortcuts: HOME, Inbox, Current state, Memory contract.

## 3. HOME: your page

`memory/HOME.md` is the page to keep open. Its top part is rebuilt automatically every morning and evening (do not edit between the two `%%` marker lines; your edits there would be overwritten and the check would flag them):

- **Today:** the date, the countdown to a launch date if the company has one, and the next three actions.
- **Money vs caps:** the limits you set in `config/goals.md`.
- **Open items by owner:** what waits for you, the Operator, the product team, a lawyer or Claude.
- **Newest learnings:** the latest things the team learned.

Below it are live tables (campaigns, experiments, open items, learnings, reports, decisions, sessions). They update on their own as notes change. Click any name to open its note. Everything under the generated block is yours: add your own notes or links there.

HOME and the Inbox are in your chat language (the one set in `config/operator.md`): `/setup` keeps the Hebrew or the English version and removes the other.

## 4. The Inbox: write to the team

Open **Inbox** (`memory/inbox/owner.md`) and write anything in plain words under "Open", one line per matter: a question, a request, a correction ("the shop now closes at 9 on Fridays"), an idea. Every morning `/morning` reads it, files facts into the right notes and answers under your line (an indented line that starts with ↳), then moves the line to "Answered".

The Inbox never changes the ad account. Anything that would spend money becomes a proposal that still needs your go in the chat, in the exact phrasing of `config/operator.md`.

## 5. The weekly review

Once a week `/next-round` writes a short review in `memory/reviews/` (one note per week, named like `2026-W44`): the bottom line, the campaigns against your caps, up to three learnings, the decisions waiting for you with their cost, and what comes next. The **Sessions** table on HOME links each day's note if you want the detail.

## 6. The command line switch (optional)

Recent Obsidian versions include a command line interface that lets Claude rename and move notes with their links kept, and search the vault quickly. Turn it on once: **Settings → General → Command line interface → on**, then close and reopen your terminal. Without it, everything still works through plain files.

## 7. The hooks (once, by the Owner)

Two small scripts make every new session start with the vault's HOT and save a checkpoint before a long conversation is compacted. Installing them is the Owner's step: follow `docs/hooks-paste-block.md` (copy one block into `.claude/settings.json`). Without them the harness still reads HOT, just one step later.

## 8. On the phone (optional): Obsidian Sync

The vault lives on the computer. If you want to read HOME and write to the Inbox from your phone, Obsidian's own **Sync** service (about $4 a month, paid to Obsidian, not part of this harness) keeps a copy on your phone:

1. In Obsidian on the computer: **Settings → Core plugins → Sync → on**, then sign in and create a remote vault.
2. In **Settings → Sync → Excluded folders**, exclude `creatives/` (large media files that the phone does not need), `node_modules/` and `dashboard/`.
3. Install Obsidian on the phone, sign in, and connect to the same remote vault.

Write on the phone only in the Inbox; let the harness write everything else. If two devices edit the same note at the same moment, Sync keeps both versions and you choose.

## 9. What goes wrong, and what to do

| What you see | What it means | What to do |
|---|---|---|
| HOME's top part says "this block is built … at /setup" | `/setup` or `/sync` has not run yet | Run `/setup` (first time) or `/sync` |
| The tables on HOME are empty | No campaign, experiment or decision notes yet | Normal before the first build |
| A table shows "Bases" as an unknown file type | Your Obsidian is older than version 1.9 | Update Obsidian (Help → Check for updates) |
| HOME and the Inbox are in the wrong language | `/setup` has not chosen yet, or the chat language in `config/operator.md` changed | Re-run `/setup` or ask Claude to switch HOME and the Inbox to your language |
| `/sync` stops with "lint: … FAIL" | A note breaks a rule: a phone number or email, a broken link, a hand edit inside a generated part | Ask Claude to fix the lines it names; never put a customer's name, email or phone in a note |
| You edited HOME between the `%%` lines | The next build overwrites it and the check flags the edit | Write your own text below the generated part |
| Obsidian shows a note twice or a strange `(conflicted copy)` file | Sync saw two edits at once | Keep the right one, delete the copy |
| The HOT never appears in new sessions | The hooks are not pasted, or Claude Code was started from another folder | Follow `docs/hooks-paste-block.md`; start Claude Code from the harness folder |
