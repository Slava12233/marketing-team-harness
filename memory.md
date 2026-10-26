# Harness memory

<!-- The harness's operational memory. Read it first in every session; update "Current state" and "Learnings" immediately after any publish, pause, budget change, new object or new finding; at session end append to "Session log" and rewrite "Next session should". Never a secret, never personal data. Durable platform behaviour goes to docs/meta-platform-notes.md. -->

## Current state

<!-- Account facts as last verified (with the time of the live read) and every campaign the harness built or manages. Keep it true at all times; the plan file to read first is named here. -->

**Plan file to read first:** none yet

**Account facts (last verified: never):** none yet

| Campaign id | Name | Status | Daily budget | Cap | Start | End | Ad sets | Ads | Last verified |
|---|---|---|---|---|---|---|---|---|---|

## How to verify

<!-- The live reads that confirm "Current state", e.g. ads_get_ad_accounts for the account, ads_get_ad_entities by campaign id for status and budgets, ads_get_errors for review flags, ads_get_datasets for the pixel, meta-upload.mjs --check for the token. -->

## Learnings

<!-- Dated bullets: what worked, what did not, account-specific behaviour. Format: - YYYY-MM-DD: learning (evidence). -->

## Decision rules

<!-- The rules the Owner has set, dated: target cost per result, budget step size and spacing, winner thresholds, mid-test edit policy, who pauses. Format: - YYYY-MM-DD: rule. -->

## Session log

<!-- Dated entries, newest last: what was asked, what was done, ids created or changed, what is open. Format: ### YYYY-MM-DD HH:MM <timezone> then bullets. -->

## Next session should

<!-- A short list, rewritten at every session end. -->
- Run `/setup` (if `config/` still holds placeholders), then `/health`.
