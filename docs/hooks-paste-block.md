---
type: tooling
created: 2026-10-26
updated: 2026-10-26
status: active
maintained_by: harness
categories: [tooling, hooks]
summary: The memory hooks ship in .claude/settings.json (nothing to paste); this page holds the block to restore if that file was deleted or replaced, and how to verify it.
---

# Hooks: shipped in `.claude/settings.json`

Nothing to paste. The harness's five hook entries (SessionStart, SubagentStart, PreCompact, and PreToolUse + PostToolUse for the account guard) ship turned on in `.claude/settings.json`, in the harness folder. The first time Claude Code opens the folder it asks once whether to trust it; say yes and the hooks run from then on. They start three small scripts in `.claude/hooks/`: one gives every new session the vault's HOT, one saves a checkpoint before Claude Code compacts a long conversation, and one (the account guard) keeps every Meta Ads call inside the one ad account named in `config/accounts.md`.

**If you deleted or replaced that file, this is the block to restore.** In the harness folder (the one that holds `CLAUDE.md` and `memory/`), open `.claude/settings.json` in a text editor. If the file does not exist, create it with exactly the content below. If it exists and already has a `"hooks"` key, add the two events (`SessionStart`, `PreCompact`) inside it; keep everything else in the file as it is. `/health` (check 18) says when the file no longer holds the hooks.

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/session-start.mjs", "timeout": 15 }
        ]
      }
    ],
    "SubagentStart": [
      {
        "matcher": "*",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/session-start.mjs", "timeout": 15 }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "manual|auto",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/pre-compact.mjs", "timeout": 30 }
        ]
      }
    ]
  }
}
```

**The account guard (two more entries, same file).** `account-guard.mjs` is the one hook that protects money: it refuses any Meta Ads call that names an ad account other than the one in `config/accounts.md` (`meta_ad_account_id`), and any write to an ad object whose id no read or create in this folder has returned and no vault note names. The shipped file carries these two events inside the same `"hooks"` object; this is the block to restore:

```json
    "PreToolUse": [
      {
        "matcher": "mcp__meta-ads__.*",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/account-guard.mjs", "timeout": 20 }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "mcp__meta-ads__.*",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/account-guard.mjs", "timeout": 20 }
        ]
      }
    ]
```

A refused call shows its reason in the session ("account guard: … bound to act_<id>"); nothing was sent to Meta. Before `/setup` has written the account id the guard lets every call through, so the wizard's first live reads work. The ids it learns are kept in `memory/state/known-objects.json` (ids only, git-ignored; deleting the file only means the next write to an object needs one read first). `/health` check 18 runs a dry check of the guard for you (a call on a wrong account must come back refused).

**What they do.** `session-start.mjs` prints `memory/HOT.md` (without its frontmatter) as the session's `additionalContext`; it prints nothing when HOT does not exist yet (before `/setup`). `pre-compact.mjs` appends a `## Checkpoint HH:MM` block (the last 8 assistant messages, scrubbed of secrets, emails and phone numbers, 300 characters each) to today's `memory/sessions/YYYY-MM/YYYY-MM-DD.md`; it always exits 0 and never blocks compaction. Both need Node 20 or later (the bootstrap installs it) and nothing else.

The commands use paths relative to the harness folder, so start Claude Code from that folder. If sessions are ever started from a subfolder, replace `node .claude/hooks/` with `node "$CLAUDE_PROJECT_DIR/.claude/hooks/` in both commands.

**Verify.** Start a new session in the harness folder and ask "what does HOT say about the next actions?": the answer should quote `memory/HOT.md`. Or run `claude --debug` and look for the SessionStart hook running `session-start.mjs` with exit 0. For the PreCompact hook, run `/compact` once and check that today's session note gained a `## Checkpoint` block. A dry check without a session, from the harness folder: `echo {} | node .claude/hooks/session-start.mjs` prints the JSON with HOT text (or nothing before `/setup`).

**Turn them off.** Delete the three entries (or the whole `"hooks"` key) from `.claude/settings.json`. The vault keeps working without hooks; sessions then read `memory/HOT.md` themselves, as `memory.md` tells them to, and `/health` shows check 18 red until the block is back.
