---
type: capability
created: 2026-10-29
status: active
maintained_by: generated
categories: [capabilities]
summary: The 4 hook scripts under .claude/hooks, their events and whether project settings install them, generated.
generated_at: 2026-10-29T20:00+02:00
content_hash: d149545dad48e097
---

# Hooks

Never hand-edit; run node memory/tools/build-capabilities.mjs
The hooks ship turned on in `.claude/settings.json` (nothing to paste); [[hooks-paste-block]] (`docs/`) holds the block to restore if that file is deleted or replaced. "Installed" reads the project settings files for the script name.

| Hook | Event | What it does | Installed |
|---|---|---|---|
| `account-guard.mjs` | `PreToolUse` (from the name) | account-guard.mjs: the account guard. A PreToolUse hook on every Meta Ads MCP call (and a PostToolUse hook on the same calls) that keeps this harness inside the ONE ad account its config names. | yes |
| `account-guard.test.mjs` | `PreToolUse` (from the name) | node --test .claude/hooks/account-guard.test.mjs (Node 20+, no dependencies; run with a time bound) | no (paste block not applied) |
| `pre-compact.mjs` | `PreCompact` (manual\|auto) | PreCompact hook (Node 20+, no dependencies): before a compaction, appends a "## Checkpoint HH:MM" block (in the timezone of config/operator.md, UTC when unset) to today's | yes |
| `session-start.mjs` | `SubagentStart` (*) | SessionStart and SubagentStart hook: injects memory/HOT.md (without its frontmatter) into every new session and every sub-agent as context. | yes |
