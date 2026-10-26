# Changelog

All notable changes to the Marketing Team Harness are recorded in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html). A release is an annotated tag `vX.Y.Z` plus the zip that `release.sh` / `release.ps1` builds from it; the release scripts refuse to tag a version that has no `## [X.Y.Z]` heading here.

## [Unreleased]

The product build of 2026-10-26: what a buyer needs to go from a computer without the tools to a configured harness and a first campaign built PAUSED.

### Added

- `.mcp.json` in the repository root: the two connections (`meta-ads`, `fal`) ship with the files. Opening the folder in Claude Code asks to approve them, and `/mcp` then logs in. The typed `claude mcp add` commands stay in the docs as the fallback.
- `bootstrap.ps1` (Windows) and `bootstrap.sh` (macOS; it also runs in Git Bash and on Linux): the buyer's first command. It checks Git, Node.js 20 or newer and Claude Code, and offers each missing one as a y/N install (winget on Windows, Homebrew on macOS); reports whether Microsoft Edge or Google Chrome is there for the ad screenshots (it never installs a browser); creates `.env` from `.env.example` (never shown); offers the optional `playwright-core`, FFmpeg and the HyperFrames video plugin; and ends with what remains. `--check` / `-Check` only reports; `--yes` / `-Yes` answers yes to the required items only.
- The HyperFrames video plugin vendored under `vendor/hyperframes/` (Apache-2.0, version 0.8.160, upstream commit `695110e46ba4ec971f5dcfc797ce8bf750e1029d` of https://github.com/heygen-com/hyperframes): its 21 skills unchanged, with a local marketplace manifest and `VENDOR.md`; the bootstrap installs it from there (after checking Node.js 22 or newer and offering FFmpeg), never from GitHub; the renderer comes from npm on first use. Credited in `THIRD-PARTY.md` and pinned under `plugins` in `skills-lock.json`.
- `release.ps1` and `release.sh`, the maintainer's release step: clean working tree (every file under `vendor/` tracked, none hidden by an ignore rule), scrub gate, changelog heading, annotated tag, and a zip in `dist/` built with `git archive`. They never push. This `CHANGELOG.md` goes with them.
- `config/goals.md` and a goals-and-money round in the `/setup` interview: the monthly budget band in the account currency, a target cost per result for each funnel, the first funnel to launch, hard daily, weekly, monthly and per-campaign caps, what success in 30 days means, the appetite for tests, and the review cadence (weekly, in `/next-round`, unless the Owner sets another).
- The Meta console steps as numbered click lists, in `/setup` and in `docs/meta-setup-guide.md`, with Meta's URLs, what you should see, and a live check wherever a read exists.
- The setup progress page: `dashboard/setup-page.mjs` (Node 20+, no dependencies) writes `dashboard/setup.html`, a page the Operator keeps open in a browser beside Claude Code during setup. It shows a progress bar, the next step and the twelve setup chapters (from "Before you start" to the routine), each step marked done, to do, in progress, n/a or "your turn" for the Owner's clicks in Meta, with the Meta screen to open. The statuses come from `checklist.md`, the console steps of `config/accounts.md`, `.mcp.json`, whether `.env` exists (it is never opened), the `config/` placeholders, the first flight plan and `dashboard/state.json`; where the files say nothing, the wizard's marks in `dashboard/setup-progress.json` fill in (the files always win). It works offline, reloads itself every 5 seconds, and comes in English and Hebrew (right to left) with a toggle, defaulting to the chat language in `config/operator.md`. The bootstrap opens it at the end of a real run (never under `--check` / `-Check`), `/setup` opens it and regenerates it after every step, and `/health`, `/morning` and `/sync` regenerate it. It shows names and public ids only, never a secret. Both generated files are git-ignored; `dashboard/setup-page.test.mjs` is its smoke test.
- `LICENSE`.

### Changed

- Instant-form leads arrive through Meta's own delivery by default (Leads Center, email notifications, CRM integrations); the lead webhook is an advanced path that needs a developer.
- `README.md` and `ONBOARDING.md` rewritten around the bootstrap script, the approve-then-log-in connections and the setup chapters.
- `control-room/`: the money tile reads `money.caps` entries as `{ label, amount, period }` (copied from `config/goals.md` by `/morning` and `/sync`); `health` gained checks 14 (bootstrap) and 15 (money vs caps); the example company gained `config/goals.md`, a Money section in its first-flight plan and a Leads Center checklist row.
- The scrub gate: the backslash spelling of its drive-path term now matches a real Windows path (the earlier spelling, with two backslashes, only matched JSON-escaped paths), and the gate skips `vendor/` (verbatim third-party files, like the third-party skills).
- `creative-production` and `creatives/tools/render-stills.mjs` install playwright-core with `npm install --no-save --no-package-lock playwright-core`, the same line as the bootstrap, so the repository gains no `package.json`.

## [0.1.0] - 2026-10-26

### Added

- The template, cut from a working single-company harness: ten agents, the harness skills, the third-party skills (pinned in `skills-lock.json` and credited in `THIRD-PARTY.md`), the `config/` templates that `/setup` fills in, the fictional example company in `examples/acme-fitness/`, and the scrub gate (`docs/scrub-check.sh`, with its terms in `docs/TEMPLATE-SPEC.md` section 8).
