---
type: tooling
created: 2026-10-26
updated: 2026-10-26
status: active
maintained_by: harness
categories: [tooling, hooks]
summary: The hooks block the Owner pastes into .claude/settings.json to turn on the vault's SessionStart and PreCompact hooks, and how to verify it.
---

# Hooks paste block (memory vault)

The Owner pastes this once (hooks and `settings*.json` are the Owner's to install; the harness prepares the block and stops). It turns on two small scripts that ship in `.claude/hooks/`: one gives every new session the vault's HOT, the other saves a checkpoint before Claude Code compacts a long conversation.

**Where.** In the folder you unzipped (the harness folder, the one that holds `CLAUDE.md` and `memory/`), open `.claude/settings.json` in a text editor. If the file does not exist, create it with exactly the content below. If it exists and already has a `"hooks"` key, add the two events (`SessionStart`, `PreCompact`) inside it; keep everything else in the file as it is.

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

**What they do.** `session-start.mjs` prints `memory/HOT.md` (without its frontmatter) as the session's `additionalContext`; it prints nothing when HOT does not exist yet (before `/setup`). `pre-compact.mjs` appends a `## Checkpoint HH:MM` block (the last 8 assistant messages, scrubbed of secrets, emails and phone numbers, 300 characters each) to today's `memory/sessions/YYYY-MM/YYYY-MM-DD.md`; it always exits 0 and never blocks compaction. Both need Node 20 or later (the bootstrap installs it) and nothing else.

The commands use paths relative to the harness folder, so start Claude Code from that folder. If sessions are ever started from a subfolder, replace `node .claude/hooks/` with `node "$CLAUDE_PROJECT_DIR/.claude/hooks/` in both commands.

**Verify.** Start a new session in the harness folder and ask "what does HOT say about the next actions?": the answer should quote `memory/HOT.md`. Or run `claude --debug` and look for the SessionStart hook running `session-start.mjs` with exit 0. For the PreCompact hook, run `/compact` once and check that today's session note gained a `## Checkpoint` block. A dry check without a session, from the harness folder: `echo {} | node .claude/hooks/session-start.mjs` prints the JSON with HOT text (or nothing before `/setup`).

**Undo.** Delete the two entries (or the whole `"hooks"` key) from `.claude/settings.json`. The vault keeps working without hooks; sessions then read `memory/HOT.md` themselves, as `memory.md` tells them to.
