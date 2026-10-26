---
type: learning
created: 2026-10-20
updated: 2026-10-20
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "ads_creative_upload_local_image may not be rolled out on an account; then the MCP route is ads_creative_upload_media by public URL (fal's CDN as one host); it is the fallback behind direct Graph uploads."
applies_to: [meta, uploads]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# The MCP may upload media only from a public URL

**The fact.** `ads_creative_upload_local_image` is "gradually rolled out" and was not available on the account where this was observed (2026-10-20): a public URL is then the only MCP upload route (`ads_creative_upload_media`, `upload_source` URL). fal's CDN can serve as the public host (`mcp__fal__upload_file` prepare → curl PUT → `file_url`); it refuses uploads while the fal account is out of credits, so a fal top-up gates this route. Create tools and reads keep working regardless. Since 2026-10-23 this route is the fallback behind [[2026-10-23-direct-graph-uploads-are-the-default-route]].

**Evidence.** Observed on a single company's ad account on 2026-10-20; ported to this template on 2026-10-26.

**How to apply.** Upload with `creatives/tools/meta-upload.mjs` first; use a public URL → `ads_creative_upload_media` only when the direct route fails or has no token yet. Before using fal's CDN, check its credits (`mcp__fal__check_account_status`); a top-up is the Owner's (paid).
