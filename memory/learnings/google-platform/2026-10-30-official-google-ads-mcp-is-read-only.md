---
type: learning
created: 2026-10-30
updated: 2026-10-30
status: confirmed
maintained_by: harness
categories: [learnings, google-platform]
summary: "Google's open-source Google Ads MCP server (googleads/google-ads-mcp) is Python, runs locally or on the user's own Cloud Run, and offers three read tools; it cannot create or change anything."
applies_to: [google, tooling, mcp]
evidence: "Google's MCP server page and the GitHub repository, read 2026-10-30."
supersedes: ""
superseded_by: ""
---

# Google's own Google Ads MCP is read-only and self-hosted

**The fact.** Google's Google Ads MCP server is open source (`googleads/google-ads-mcp`), written in Python (`pipx run`), run locally over stdio or deployed to the user's own Cloud Run; Google hosts no endpoint for it. It offers `search` (GAQL), `list_accessible_customers` and `get_resource_metadata`, read-only. Hosted third-party Google Ads MCPs exist (paid; the account access goes through that company).

**Evidence.** Google's MCP server page and the GitHub repository, read 2026-10-30. Not yet observed on a company's account: the first live call confirms it or a new note supersedes it.

**How to apply.** The harness builds and reads through its own `creatives/tools/google-ads.mjs` (Node only, no Python, the PAUSED and go rules built in). The official MCP stays an optional extra for ad-hoc chat queries (`docs/google-ads.md`).
