---
type: capability
created: 2026-10-29
status: active
maintained_by: generated
categories: [capabilities]
summary: The 2 MCP servers and tool families the harness knows (name, URL, tool prefix), generated; no tokens.
generated_at: 2026-10-29T20:00+02:00
content_hash: 9290b7a06f24502a
---

# Connections

Never hand-edit; run node memory/tools/build-capabilities.mjs
Sources: `.mcp.json`. Auth lives in Claude Code's credential store and the repo-root `.env` (names only).

| Server | URL or command | Tool prefix | Source |
|---|---|---|---|
| `meta-ads` | https://mcp.facebook.com/ads | `mcp__meta-ads__*` | `.mcp.json` |
| `fal` | https://mcp.fal.ai/mcp-relay | `mcp__fal__*` | `.mcp.json` |
