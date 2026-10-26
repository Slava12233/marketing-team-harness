---
type: learning
created: 2026-10-23
updated: 2026-10-23
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform]
summary: "creatives/tools/meta-upload.mjs posts local files to the ad account's adimages/advideos and returns image_hash/video_id; it needs META_MARKETING_TOKEN (a System User token) whose generation is the Owner's click."
applies_to: [meta, uploads]
evidence: "ported from a single-company harness, 2026-10-26"
supersedes: ""
superseded_by: ""
---

# Direct Graph API uploads with meta-upload.mjs are the default media route

**The fact.** Direct uploads outside the MCP (live-tested on 2026-10-23) are the default upload route. `creatives/tools/meta-upload.mjs <files>` posts local images and videos to the ad account's `/adimages` and `/advideos` through Meta's Graph API (the account id comes from `META_AD_ACCOUNT_ID` in `.env`), waits for a video's `ready`, and returns the `image_hash` / `video_id` that `ads_create_ad` takes (ledger in `creatives/uploads/`). It needs `META_MARKETING_TOKEN` in the repo-root `.env` (names only, never a value in chat): the token of a System User (Employee, in the Business portfolio, with Manage campaigns on the ad account and Develop app on a Business-type app; scopes `ads_management` + `ads_read`). Generating, rotating or revoking that token is the Owner's click in Business Settings → System users. `--check` verifies the token (names only). A public URL → `ads_creative_upload_media` remains the fallback ([[2026-10-20-mcp-upload-route-is-public-url-only]]).

**Evidence.** Observed on a single company's ad account on 2026-10-23; ported to this template on 2026-10-26.

**How to apply.** Run `meta-upload.mjs --check` before an upload round; on code 190/200 report to the Owner and never retry blindly. Never open, print or paste the `.env` value; a value that reaches chat is burned and rotated. The click list is in `docs/meta-setup-guide.md`.
