---
name: install
description: "Step 1 of the installer's path (/install, /meta, /check, /campaign): the tools on this computer, by command. Reports what is present, then installs everything the bootstrap installs (Git, Node.js LTS, Claude Code, the Claude desktop app, Google Chrome, playwright-core, Obsidian, FFmpeg, the HyperFrames video plugin), copies .env.example to .env and confirms the two MCP servers of .mcp.json are approved; with a word after the command it installs or checks one item only (/install git, /install node, /install chrome, /install check). A thin layer over the bootstrap and step 0.5 of setup: the same installs, the same wizard ticks, nothing asked that the files already answer. Nothing in the ad account, no login, no token. Use when an installer or technician sets a computer up for a client, when the Operator types /install, or to add one missing tool later."
---

# /install: the tools on this computer

Step 1 of **the installer's path**: `/install` (the tools) → `/meta` (the Meta connections) → `/check` (is everything connected) → `/campaign` (the business questions and the first campaign, PAUSED). The path is for an installer or technician who sets the harness up for a client and wants one short command per stage; the installer's one-page sheet is `docs/quick-install.md`. The guided pass (`/connect`, the wizard, the Owner's Chrome driven by the extension) stays as it is and writes the same files: the two can be mixed at any point.

This page is a thin layer. The installs are the bootstrap's (`bootstrap.ps1` / `bootstrap.sh`), and the checks are step 0.5 of `setup`. It says what runs, in which order, and how one item is installed alone. `CLAUDE.md` wins on any conflict.

**Say at the start, in one or two sentences:** this command only installs tools on this computer; it logs in to nothing, touches no ad account and never asks for a password or a token. Windows may show a permission prompt for an installer: that click is the human's.

## Words after the command

| Typed | What runs |
|---|---|
| `/install` or `/install all` | Steps 0–4: the report, every missing item installed, the report again |
| `/install check` | Steps 0–1 only: the report, nothing installed |
| `/install <item>` | Step 3 for that item, then step 1 again. Items: `git`, `node`, `claude`, `app`, `chrome`, `obsidian`, `ffmpeg`, `playwright`, `video`, `env` |

## Step 0. This folder

1. `node --version` through Bash. When Node.js is missing, skip to step 2: the bootstrap needs no Node.js and installs it first. **No Bash in this session** (Windows without Git): run the Windows line of step 2 through the PowerShell tool without the leading `timeout 1800` (the tool call's own time limit bounds it), then tell the installer to start a new session and type `/install` again.
2. `node memory/tools/instance.mjs --check`. Exit 0: this folder's own harness, go on. Exit 3: a new copy, so a new business: `node memory/tools/instance.mjs --reset` at once, with no question (the previous company's files move to `.previous-company/<stamp>/`, the blank templates come back), exactly as `/connect` does before its step 0; say it in one line.
3. The setup wizard beside the chat: `node dashboard/setup-page.mjs --open` (the bootstrap opens it itself on a run that installs).

## Step 1. The report

Bounded, in the foreground, one command:

- Windows: `timeout 60 powershell -NoProfile -ExecutionPolicy Bypass -File ./bootstrap.ps1 -Check`
- macOS and Linux: `bash bootstrap.sh --check` (`timeout 60` first where the shell has it)

It installs nothing and never reads a token. Show its lines as one short table (item, found, needed), the `[missing]` rows first. Exit 0 with nothing missing: say "everything is here", skip to step 4.

## Step 2. Install everything that is missing (the default)

The no-question run of step 0.5 of `setup`, with the app named so the bootstrap asks nothing (`-Codex` / `--codex` in a Codex session):

- Windows: `timeout 1800 powershell -NoProfile -ExecutionPolicy Bypass -File ./bootstrap.ps1 -Yes -Claude`
- macOS and Linux: `timeout 1800 bash bootstrap.sh --yes --claude`

In the foreground, with the Bash tool's own timeout above the bound (1860000 ms); each install inside it is bounded at 20 minutes. It installs Git, the Node.js LTS, Claude Code, the Claude desktop app, Google Chrome (when neither Chrome nor Edge is present), `playwright-core`, Obsidian, FFmpeg and the HyperFrames plugin from `vendor/hyperframes`, copies `.env.example` to `.env` and ticks each item on the wizard as it lands. Say in one line what is being installed. Exit 124 is the bound: report the tail, run it once more, never loop.

A tool this run installed is not on this session's PATH yet: for the rest of the session call it by its full path (Windows `"/c/Program Files/nodejs/node.exe"`, `"/c/Program Files/Git/cmd/git.exe"`; macOS `/opt/homebrew/bin/node` or `/usr/local/bin/node`), or tell the installer to start a new session before `/meta`.

**Python is not installed:** no tool this harness ships needs it (the Google Ads tool is Node.js). The one optional extra that does, Google's own read-only Google Ads MCP, is described in `docs/google-ads.md` and installed only when the Owner asks for it.

## Step 3. One item (`/install <item>`)

Each line is the bootstrap's own for that item, run bounded (`timeout 1260` first, one at a time), then step 1 again for the result. `<flags>` on the winget lines is `-e --source winget --accept-package-agreements --accept-source-agreements`. When a line here and the bootstrap disagree, the bootstrap wins: fix this table.

| Item | What it is | Windows | macOS |
|---|---|---|---|
| `git` | Git (required) | `winget install --id Git.Git <flags>` | `brew install git` |
| `node` | Node.js LTS, 20 or newer (required) | `winget install --id OpenJS.NodeJS.LTS <flags>` | `brew install node` |
| `claude` | Claude Code, the `claude` command (required for the typed fallbacks and the plugin install) | in PowerShell: `irm https://claude.ai/install.ps1 \| iex` | `curl -fsSL https://claude.ai/install.sh \| bash` |
| `app` | The Claude desktop app (the Code tab is where the harness runs) | `winget install --id Anthropic.Claude <flags>` | `brew install --cask claude` |
| `chrome` | Google Chrome (only needed for the driven mode of `/connect`) | `winget install --id Google.Chrome <flags>` | `brew install --cask google-chrome` |
| `obsidian` | Obsidian, the window onto the memory vault (optional), then `node memory/tools/obsidian-setup.mjs` | `winget install --id Obsidian.Obsidian <flags>` | `brew install --cask obsidian` |
| `ffmpeg` | FFmpeg (video only) | `winget install --id Gyan.FFmpeg <flags>` | `brew install ffmpeg` |
| `playwright` | `playwright-core`, for the screenshots of the creative tools | `npm install --no-save --no-package-lock playwright-core` | the same |
| `video` | The HyperFrames plugin (needs Node.js 22+ and FFmpeg) | `claude plugin marketplace add ./vendor/hyperframes`, then `claude plugin install hyperframes@hyperframes` | the same |
| `env` | The blank `.env` (names only, no value) | `test -f .env \|\| cp .env.example .env` | the same |

Never open, read, grep or print `.env`: only `test -f .env`. An item the bootstrap could not install says why on its line; it becomes a `checklist.md` row (owner Operator) with that reason, never a retry loop.

## Step 4. The servers and the hooks

Reads only:

1. `.mcp.json` declares `meta-ads` and `fal` (it holds names and URLs, no secret). When Claude Code asked about them on opening the folder, the installer approved both; when it did not, `/mcp` lists them. The logins themselves are `/meta`'s.
2. `.claude/settings.json` names `session-start.mjs`, `pre-compact.mjs` and `account-guard.mjs` (shipped; never edited here). Missing: a `checklist.md` row "restore from `docs/hooks-paste-block.md`", owner Operator.

## Step 5. Close

- The report of step 1 once more, as the final table; `node dashboard/setup-page.mjs` so the wizard shows it.
- One line in today's session note (`- HH:MM — install: Git, Node.js 22, Claude Code present; installed this run: <items>; missing: <items and why>`), names and versions only.
- **Closing message, in the chat language:** what is on the computer now, what this run installed, what is still missing and who installs it, and the next command: **`/meta`** (in a new session when this run installed Node.js, Git or Claude Code).
