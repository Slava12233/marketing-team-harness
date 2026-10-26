# vendor/hyperframes: the HyperFrames plugin, vendored

This folder is the **HyperFrames** Claude Code plugin by HeyGen, licensed under **Apache-2.0**, copied into the template so that a buyer installs it from the files they downloaded instead of from GitHub. HyperFrames writes videos as HTML compositions and renders them to MP4; the harness uses it for short silent video ads (`.claude/skills/creative-production/SKILL.md`, section 4). It is optional: the rest of the harness works without it.

| | |
|---|---|
| Upstream | https://github.com/heygen-com/hyperframes |
| Commit | `695110e46ba4ec971f5dcfc797ce8bf750e1029d` (2026-10-15) |
| Plugin version | `0.8.160` (from `.claude-plugin/plugin.json`) |
| Licence | Apache-2.0, in `LICENSE` here (Copyright 2026 HeyGen, Inc.) |
| Copied | 2026-10-26 |

## What was copied, unchanged

- `skills/`: all 21 skill folders of upstream `skills/` (943 files): `embedded-captions`, `faceless-explainer`, `figma`, `general-video`, `hyperframes`, `hyperframes-animation`, `hyperframes-audio`, `hyperframes-cli`, `hyperframes-core`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-registry`, `hyperframes-studio`, `media-use`, `motion-graphics`, `music-to-video`, `pr-to-video`, `product-launch-video`, `remotion-to-hyperframes`, `slideshow`, `talking-head-recut`.
- `.claude-plugin/plugin.json`, `LICENSE` and `skills-manifest.json`: the upstream files.

Nothing in these files was modified. How that was checked: every file is byte-identical to the upstream git blob at the commit above (compared with `git hash-object`), and every skill folder's file count and fingerprint match upstream's `skills-manifest.json` (recomputed with upstream's own algorithm, `hashSkillBundle` in `packages/cli/src/utils/skillsManifest.ts`).

## What this template wrote

- `.claude-plugin/marketplace.json` turns this folder into a local marketplace named `hyperframes`. It is written from upstream's marketplace file: it keeps the one plugin entry `hyperframes` (`"source": "./"`, this folder) with upstream's owner, description, homepage and licence fields, and drops upstream's legacy `core-skills` entry. It is the only file here that differs from upstream, and this paragraph is its notice of change.
- `VENDOR.md`: this page.

## What was left out

Everything else in the upstream repository: the documentation, the examples, `packages/` (the source of the CLI, the renderer and the studio), the website, the block registry, themes, scripts and assets, the repository's own tooling (`package.json`, `bun.lock`, CI, linters), the duplicate root `plugin.json`, the manifests for other agents (`.codex-plugin/`, `.cursor-plugin/`, `gemini-extension.json`), and the stray test file `skills/python-encoding.test.mjs`. Upstream has no `NOTICE` file at its root.

Some skill folders carry third-party material with its own terms, copied as upstream ships it: font licence texts (`skills/hyperframes-creative/frame-presets/code-editorial/fonts/OFL-*.txt`), the credits and licence of the bundled sound effects (`skills/media-use/audio/assets/sfx/CREDITS.md`), and the attribution and MIT notice of the project `talking-head-recut` was adapted from (`skills/talking-head-recut/NOTICE.md`). See `THIRD-PARTY.md` at the repository root.

## What it needs at run time

- **Claude Code**, to load the plugin.
- **Node.js 22 or newer** (the harness itself needs 20 or newer) and **FFmpeg** with ffprobe (`ffmpeg -version` answers in a terminal).
- **The `hyperframes` npm package, which is not vendored.** The skills run the CLI through `skills/hyperframes/scripts/plugin-cli.mjs`, which calls `npx --yes hyperframes@0.8.160` (the version in `.claude-plugin/plugin.json`). The first call downloads that exact version from the npm registry, so the first video needs an internet connection. Workflows that use the block registry, voices, music or other external providers download what they need when they are used.
- **Chrome** for local renders: the system's Chrome, or one the CLI downloads with `npx hyperframes@0.8.160 browser ensure`. `npx hyperframes@0.8.160 doctor` reports what is missing. The plugin can also render on HeyGen's cloud, a paid service that the harness does not need.

## Install it (by hand)

From the repository root, in a terminal:

```
claude plugin marketplace add ./vendor/hyperframes
claude plugin install hyperframes@hyperframes
```

If Claude Code refuses the relative path, give the path of this folder instead: the full path of the repository followed by `/vendor/hyperframes`. `bootstrap.sh` and `bootstrap.ps1` run the same two lines by default (installed with everything else after the one confirmation; `--ask` makes it a separate question) and compute that full path themselves. If Claude Code answers that a marketplace named `hyperframes` already exists, one was added before (perhaps from GitHub) and the second line installs from it. Start a new Claude Code session afterwards so the skills load; the entry skill is `hyperframes:hyperframes`. If you move the repository folder, run the two lines again.

## Refresh it to a newer upstream release

1. Clone upstream at a release tag: `git clone --depth 1 --branch <tag> https://github.com/heygen-com/hyperframes <a temporary folder>`.
2. Replace `skills/` here with the skill folders of upstream `skills/` (folders only; leave out loose files such as `skills/python-encoding.test.mjs`), and copy upstream's `.claude-plugin/plugin.json`, `LICENSE` and `skills-manifest.json`. Keep this folder's `marketplace.json`, and carry over any change to the fields of upstream's `hyperframes` entry (still without `core-skills`). If upstream now has a `NOTICE` file at its root, copy it here and name it in `THIRD-PARTY.md`.
3. Check: the skill folders match the names in `skills-manifest.json`, and each folder's file count matches its `files` value.
4. Update this page (commit, date, version, the skill list), `THIRD-PARTY.md` (the section "HyperFrames plugin (vendored)" and its table row), `skills-lock.json` (`plugins.hyperframes`: commit, version and the sha256 of `skills-manifest.json`) and `CHANGELOG.md`.
5. Commit with care: `git add vendor/hyperframes`, then add with `git add -f` every file that a nested upstream `.gitignore` hides (`git status --short --ignored vendor` lists them; at this commit one, `skills/embedded-captions/scripts/fixtures/heroless/transcript.json`), and when committing from Windows set the executable bit on upstream's executable scripts with `git update-index --chmod=+x <file>` (`git ls-tree -r <tag> skills` shows them as `100755`; at this commit nine). `git ls-files vendor/hyperframes | wc -l` must then equal the number of files in this folder.
6. Run the scrub gate (`bash docs/scrub-check.sh`; it skips this folder) and `claude plugin validate vendor/hyperframes`.
