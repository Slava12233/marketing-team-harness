---
type: tooling
created: 2026-10-27
updated: 2026-10-27
status: active
maintained_by: harness
categories: [tooling, upgrade]
summary: A plain-language guide to upgrading the harness to a new release - what changes, what is never touched, the two commands, the dry run, the backup, rolling back, and what to do about a harness file you changed yourself.
---

# Upgrading the harness to a new release

From time to time a new version of the harness comes out: better skills, new things learned about Meta, fixes to the tools. This page explains how to bring it into the copy you already work in, without losing anything you or Claude wrote for your company.

## What an upgrade changes, and what it never touches

Your harness folder holds two kinds of files.

**The harness's own files** are the same for every company: the rules (`CLAUDE.md`), the skills, the agents, the tools, the guides in `docs/`, the setup scripts. An upgrade replaces these with the new versions.

**Your company's files** are the ones `/setup` and your daily work created: everything in `config/` (your company, products, audiences, brand, accounts, goals), your secrets file `.env`, the notes in the memory vault about your campaigns, flights, decisions, sessions and reviews, the current state, your plans and reports, your creatives, the checklist. **An upgrade never writes any of these.** It does not even open `.env`. The one addition: a `config/` file that is new in a release (a settings file your copy does not have yet) is added, with blanks for `/setup` to fill; the `config/` files you already have are never touched.

In between are a few files you may have adjusted, such as the Owner's page (`memory/HOME.md`), the Inbox, `.gitignore` and the Claude Code settings. An upgrade adds these only if they are missing and otherwise leaves yours as they are. New lessons about Meta arrive the same way: a new lesson is added, and one you already have is not touched.

The exact list lives in `docs/UPGRADE-PATHS.txt`, and the upgrade always follows the list that comes with the new release.

## Before you start

1. Download the new release zip (for example `marketing-team-harness-v1.1.0.zip`) and leave it in your Downloads folder. You do not need to unzip it.
2. Close Claude Code if it is open in the harness folder.
3. Open a terminal in the harness folder: the folder that holds `CLAUDE.md`, `config/` and `memory/`.

## The two commands

**Windows** (PowerShell):

```
powershell -ExecutionPolicy Bypass -File .\upgrade.ps1 "C:\Users\<you>\Downloads\marketing-team-harness-v1.1.0.zip"
```

**macOS** (Terminal):

```
bash upgrade.sh ~/Downloads/marketing-team-harness-v1.1.0.zip
```

Tip: type the first part of the command, then drag the zip from your file manager into the terminal window; it fills in the path for you. An unzipped release folder works too.

The script prints its steps one by one:

- **(a)** it checks that this is a harness folder and that the zip really is a harness release;
- **(b)** it shows your version and the new one, and stops if the new one is not newer;
- **(c)** it shows the plan: which files will be replaced, which added, which of yours are kept, and which company files it skips;
- **(d)** it asks one question, `Apply the upgrade now? [y/N]`. Type `y` and press Enter to go ahead. Pressing Enter alone means no, and nothing changes;
- **(e)** it saves a backup of every file it is about to overwrite, then copies the new files in;
- **(f)** it checks the memory vault and rebuilds the generated notes;
- **(g)** it tells you what to do next.

## Look first: the dry run

To see the plan without changing anything, add `--check` (macOS) or `-Check` (Windows):

```
bash upgrade.sh ~/Downloads/marketing-team-harness-v1.1.0.zip --check
powershell -ExecutionPolicy Bypass -File .\upgrade.ps1 "C:\Users\<you>\Downloads\marketing-team-harness-v1.1.0.zip" -Check
```

The dry run stops after the plan. Nothing is copied, nothing is backed up, nothing is changed. It is a good habit to run it first.

`--yes` / `-Yes` skips the question. It also lets you install a release that is not newer than yours (for example to repair a copy), so use it only when you mean it.

## After the upgrade

1. Open a new Claude Code session in the harness folder, so it loads the new rules, skills and agents.
2. Type `/health` and wait for the table.
3. When `/health` is all green, you can delete the backup folder (see below). Keep it until then.

## Where the backup is

Every upgrade that changes something makes a folder named after the date and time, inside `.upgrade-backup/` in the harness folder, for example `.upgrade-backup/2026-11-03-0915/`. Inside it, each overwritten file sits at the same place it had in your harness folder. Next to the folder is a small text file with the same name and `.added.txt` at the end: it lists the files the upgrade added (those had no older version to back up).

The backup folder is never sent anywhere and is not part of your work; `/health` turns yellow when a backup is older than 30 days, as a reminder to delete it.

## Rolling back

If something does not work after an upgrade and you want your previous version back:

1. Close Claude Code.
2. Open the backup folder, for example `.upgrade-backup/2026-11-03-0915/`.
3. Select everything inside it (on Windows, show hidden items first: the `.claude` folder is hidden) and copy it into the harness folder, choosing **Replace** when asked.
4. Optionally, delete the files listed in the `.added.txt` file next to the backup folder. Leaving them does no harm.
5. Open Claude Code again and run `/health`.

Your company's files were never changed by the upgrade, so they need no rolling back.

## When the plan shows "CHANGED IN THIS COPY"

Sometimes you, or Claude at your request, edit one of the harness's own files: a sentence in a skill, an agent's instructions, a rule in `CLAUDE.md`. The plan shows such files under **"Replaced, but CHANGED IN THIS COPY since the last release"**. The upgrade will still replace them with the new version, and your edited version goes to the backup folder, so it is never lost.

What to do:

1. Run the dry run first and note the files in that list.
2. Decide for each one whether your edit still matters. Often the new release already covers it.
3. Run the upgrade.
4. If an edit still matters, open a Claude Code session and ask: "Compare `.upgrade-backup/<date>/<file>` with the new `<file>` and carry my change over". Claude shows you the difference before it changes anything.

A tip for the future: a company-specific fact belongs in `config/` or in the vault, not in a skill or in `CLAUDE.md`. Facts kept there survive every upgrade with no extra step.

If your copy has no `docs/release-manifest.txt` (an older copy), the upgrade cannot tell your edits apart from older versions, so every harness file that differs is listed as plain "Replaced". The backup still keeps the old version of each one.

## Other lines in the plan

- **Kept as yours although the release's version differs:** a file you may adjust (such as `.gitignore`) exists in your copy and differs from the release. Yours is kept. If you want the release's version, compare the two by hand or ask Claude to.
- **Skipped: [never]:** your company's files. The release carries empty versions of some of them; they are never written.
- **Not listed:** a file the release carries but the list does not name. It is left alone. This should not happen in a published release; report it to the harness's maintainers.
- **Only in this copy, under a harness folder:** for example a skill you added yourself, or a harness file the new release no longer has. It is left in place. Delete it only if you know you do not use it.

## What goes wrong

| What you see | What it means | What to do |
|---|---|---|
| `REFUSED: this is not a harness folder` | The terminal is in a different folder. | Go to the folder that holds `CLAUDE.md`, `config/` and `memory/`, and run the command again. |
| `REFUSED: the source is not a harness release` | The path does not point at a harness release zip or folder. | Check the path. Drag the zip into the terminal to be sure. |
| `REFUSED: the release (...) is not newer than this copy (...)` | You already have this version or a newer one. | Nothing to do. To reinstall the same version on purpose, add `--yes` / `-Yes`. |
| `REFUSED: the zip could not be extracted` | The download is incomplete, or the computer cannot open zips. | Download the zip again, or unzip it by double-clicking and give the folder instead. |
| `files could not be copied` | A file was open in another program, or the folder is read-only. | Close the other programs (and Claude Code) and run the upgrade again; the backup from the failed run stays in `.upgrade-backup/`. |
| `lint.mjs exit code: 1` | The memory vault check found something to fix after the upgrade. | Open Claude Code and run `/health`; it tells you what and how. |

The upgrade never pushes anything anywhere, never touches git, never opens `.env` and never prints a secret.
