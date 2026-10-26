---
type: learning
created: 2026-10-27
updated: 2026-10-27
status: confirmed
maintained_by: harness
categories: [learnings, tooling]
summary: "FICTIONAL EXAMPLE. Without the System User token meta-upload.mjs --check fails, so the first flight's five files went up by public URL through the MCP; switch to direct uploads once the Owner creates the token."
applies_to: [uploads]
evidence: "the build session of 2026-10-27 (meta-upload.mjs --check, then ads_creative_upload_media)"
supersedes: ""
superseded_by: ""
---

# Uploads go by public URL until the System User token exists

> FICTIONAL EXAMPLE.

**The fact.** `node creatives/tools/meta-upload.mjs --check` failed on 2026-10-27 (no `META_MARKETING_TOKEN` in `.env`; the System User `acme-uploader` is not created yet), so the five files of [[2026-11-first-flight]] were uploaded by public URL with `ads_creative_upload_media` ([[2026-10-20-mcp-upload-route-is-public-url-only]]).

**Evidence.** The build session of 2026-10-27 ([[2026-10-27]]).

**How to apply.** Run `--check` before every upload round; while it fails, use the public-URL route and remind the Owner of the token step (`docs/meta-setup-guide.md`); never ask for the token value in chat.
