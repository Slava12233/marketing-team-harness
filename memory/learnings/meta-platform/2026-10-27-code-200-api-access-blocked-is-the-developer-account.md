---
type: learning
created: 2026-10-27
updated: 2026-10-27
status: confirmed
maintained_by: harness
categories: [learnings, meta-platform, tokens]
summary: "HTTP 400 code 200 'API access blocked' on GET /me with a System User token means Meta blocked the developer account of the app's admin ('Account confirmation needed'), not a missing permission; the admin's checkpoint clears it and the same token works again within minutes; the checkpoint renders only while facebook.com is signed in as the admin's personal profile, not switched into the Page"
applies_to: [tokens, uploads, graph-tool, health]
evidence: "ported from a single-company harness, 2026-10-27 (two days of a blocked token, cleared by the account checkpoint)"
supersedes: ""
superseded_by: ""
---

# Code 200 "API access blocked" on `GET /me` = the admin's developer account is blocked

**Symptom.** Every Graph call with the System User token answers `HTTP 400 (code 200): API access blocked`, starting with `GET /me`, the call that needs no permission. The token, its permissions and its assets are unchanged; it worked days before.

**Cause.** `developers.facebook.com` shows the app admin "Account confirmation needed: we've noticed unusual activity on this developer account". Meta blocks the API of every app administered by a blocked developer account. A real permission problem reads `(#200) Requires <permission>` or `(#10)` on a specific endpoint, never on `/me`.

**Fix.** The admin's checkpoint, not a new token: Confirm Account → "Confirm your identity" → a code to the admin's email → "Please wait" (Meta's review) → usually cleared within minutes; the existing token works again at once.

**Trap.** The checkpoint page (`facebook.com/checkpoint/…`) answers "Sorry, something went wrong" while facebook.com in that browser is switched into the Page profile; it renders once the admin signs in as their personal profile. Clicks that "did nothing" were this.

**Rule.** `meta-upload.mjs`, `meta-graph.mjs` and `/health` check 13 report this as cause 0; never rotate the token for this error; the `setup-console` skill lists it among the known traps.
