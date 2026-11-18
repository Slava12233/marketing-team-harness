# Quick install: the installer's path

One page for the installer or technician who sets the harness up on a client's computer. Four commands, in this order; each one says what it did and names the next. Nothing here builds, activates or spends: the first campaign is built PAUSED by the last command, and only the Owner's go, in a message of their own, ever runs an ad.

| # | Command | What it does | Who clicks |
|---|---|---|---|
| 0 | one line in a terminal | Claude Code on the computer, the folder open | you |
| 1 | `/install` | The tools: Git, Node.js, the Claude desktop app, Chrome, Obsidian, FFmpeg, the video plugin, the blank `.env` | you, only a Windows permission prompt |
| 2 | `/meta` | Everything Meta: the login, the ad account and Page, the developer app, the System User, the token, the checks | you click Meta's screens; the harness checks each step |
| 3 | `/check` | Is everything connected? A table and one verdict: READY or the fix | nobody |
| 4 | `/campaign` | The questions about the business, the market research, the first campaign built PAUSED | the Owner answers |

**In Hebrew, as one table to open in a browser:** `INSTALL-COMMANDS.html` in the harness folder (every command with a copy button). Keep it in step with this page.

The guided pass (`/connect` with the setup wizard and the Claude in Chrome extension driving the Owner's own Chrome) stays as it is. Both paths write the same files, so you can switch between them at any step.

## Before you start

- The harness folder on the client's computer, unzipped from the release (or cloned). **One folder per business.**
- A Claude account for the client (the plan is in `ONBOARDING.md` §3a).
- In the browser on that computer: facebook.com signed in as a **personal profile** that is an admin of the client's Business portfolio, with two-factor authentication on. Not "switched into" the Page.
- The Owner within reach for the steps that are theirs alone: the Meta login's consent screen, the payment card, any code or password, any legal terms.

## Step 0. Claude Code, one line

Open a terminal in the harness folder (Windows: right-click the folder → Open in Terminal) and run the line for the computer:

Windows (PowerShell), two lines: Git first, because Claude Code on Windows runs its commands through Git Bash, then Claude Code. Close the terminal and open it again after them, so both are on the PATH.

```powershell
winget install --id Git.Git -e --source winget
```

```powershell
irm https://claude.ai/install.ps1 | iex
```

macOS:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Then, in the same folder, start it and sign in with the client's Claude account:

```powershell
claude
```

Trust the folder and approve the two servers it brings (`meta-ads`, `fal`) when asked. The first question of every session is the language.

No terminal at all? The bootstrap does step 0 and step 1 together: `powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1` (macOS: `bash bootstrap.sh`), then open the folder in the Claude desktop app's Code tab and go to step 2.

## Step 1. `/install`

Type `/install`. It reports what is on the computer, installs everything that is missing and reports again. It asks for no password and no token.

- One tool only: `/install git`, `/install node`, `/install claude`, `/install app`, `/install chrome`, `/install obsidian`, `/install ffmpeg`, `/install playwright`, `/install video`, `/install env`.
- Report only: `/install check`.
- Python is not needed.

When it installed Node.js, Git or Claude Code, start a new session before step 2. From here on the Claude desktop app's **Code** tab is the better place to work: open the app, sign in, Code → Open folder.

## Step 2. `/meta`

Type `/meta`. It runs the core, the four things every Meta campaign needs, and resumes where it stopped:

1. **`login`**: `/mcp` → `meta-ads` → log in, with **the Owner's own Facebook profile**, sharing only this business's portfolio, ad account and Page. Then a new session and `/meta` again.
2. **`assets`**: the harness reads the ad accounts and Pages the login sees; you pick the client's. You confirm the payment method and the verified phone.
3. **`app`**: you create the developer app (Marketing API) and the System User (Employee) and assign its three assets: the ad account, the app, the Page.
4. **`token`**: you click Generate token, tick the six permissions, click **Copy** and type `copied`. The harness moves the token from the clipboard into `.env` and clears the clipboard. Nobody sees it; never paste it anywhere.

Each step is a short click list, then your "done", then a live check. One step only: `/meta login`, `/meta assets`, `/meta app`, `/meta token`. Where things stand: `/meta status`.

**The items that depend on the campaign type** run by their word, now or when `/campaign` asks for them:

| The campaign | Command |
|---|---|
| Sends people to the website, or sells from a catalog | `/meta pixel`, and `/meta domain` |
| Click-to-WhatsApp | `/meta whatsapp` |
| Lead form inside Facebook and Instagram | `/meta leads` |
| Instagram placements from the company's own account | `/meta instagram` |
| An Operator other than the Owner | `/meta people` |

## Step 3. `/check`

Type `/check`. It reads everything and changes nothing. **READY for /campaign** means the computer can be handed over. **NOT READY** lists each red row with the one command that fixes it (`/install <item>` or `/meta <item>`); run it, then `/check` again.

Yellow rows listed as "later" are fine: the empty company files (step 4 fills them), a deferred Meta item, the browser extension you did not need.

## Step 4. `/campaign`

Type `/campaign`, with the Owner. The first question is which campaign to build; then the interview about the business (as many rounds of four questions as it takes), the market research, the plan and the Owner's numbered picks, the copy, the creatives and the campaign built **PAUSED**, shown as Meta's own previews. Activation is a separate message from the Owner with the amount in it.

## Before you leave

- `/check` says READY, and the Owner saw the table.
- The Meta login in `/mcp` is the Owner's own profile, not yours.
- When you created the developer app with your own profile: the Owner is an Administrator of the app.
- The Owner removes or downgrades your admin access in Business Settings → Users → People (a row in `checklist.md` reminds them).
- Type `/sync` to close the session.

## When something fails

| What you see | What it is | Command |
|---|---|---|
| The Meta tools are missing after the login | they load only into a session started after it | a new session, then `/meta` |
| Code 10 on the lead-forms check | the Page is not assigned to the System User | `/meta app`, step 5 of its list |
| Code 200 "API access blocked" on every check | Meta's checkpoint on the developer account of the app's admin, not the token | finish the checkpoint signed in as the personal profile, then `/meta token` runs its checks again |
| Code 190 | the token is wrong or revoked | `/meta token` (revoke first, then generate) |
| "the value is empty" after `copied` | the Copy did not land | click Copy again, type `copied` |
| The token appeared in the chat | it is burned | revoke it in Business Settings, then `/meta token` |
| A tool is missing | | `/install <item>` |

The long form of every Meta step, with its pitfalls, is `docs/meta-setup-guide.md`.
