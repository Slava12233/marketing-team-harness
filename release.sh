#!/usr/bin/env bash
# release.sh: the maintainer's release step for the Marketing Team Harness (buyers never run it).
# Usage: bash release.sh vX.Y.Z        (Windows: powershell -ExecutionPolicy Bypass -File .\release.ps1 vX.Y.Z)
# Each step is printed, and every check runs before the tag is made:
#   (a) the working tree is clean (git status --porcelain), no .env file is tracked, no file under vendor/ is
#       hidden by an ignore rule (it would be missing from the zip), dist/ is ignored
#   (b) bash docs/scrub-check.sh prints "scrub gate: clean"
#   (c) CHANGELOG.md has a "## [X.Y.Z]" heading for this version
#   (d) the annotated tag vX.Y.Z is created (refused when the tag or the zip already exists)
#   (e) dist/marketing-team-harness-vX.Y.Z.zip is built from that tag with git archive
#   (f) the zip's path and size are printed, with the push command to run by hand
# This script never pushes. Exit codes: 0 released, 1 refused or failed, 2 usage.
set -u

TAG="${1:-}"
if ! [[ "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Usage: bash release.sh vX.Y.Z   (for example: bash release.sh v1.0.0)"; exit 2
fi
VERSION="${TAG#v}"
ZIP="dist/marketing-team-harness-$TAG.zip"
refuse() { echo "REFUSED: $*"; exit 1; }
step() { echo ""; echo "($1) $2"; }

cd "$(dirname "$0")" || exit 2
command -v git >/dev/null 2>&1 || refuse "git was not found."
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || refuse "this folder is not a git repository."
[ -f docs/scrub-check.sh ] || refuse "docs/scrub-check.sh was not found: run this from the harness repository."

step a "The working tree is clean, no .env file is tracked, every file under vendor/ is tracked, and dist/ is ignored"
DIRTY=$(git status --porcelain)
if [ -n "$DIRTY" ]; then
  printf '%s\n' "$DIRTY" | head -n 20
  refuse "the working tree is not clean: commit or stash the changes above first."
fi
TRACKED_ENV=$(git ls-files -- .env '.env.*' | grep -v -x -F .env.example)
[ -z "$TRACKED_ENV" ] || refuse "a secrets file is tracked by git ($TRACKED_ENV): remove it with git rm --cached and commit first."
# A vendored folder carries its upstream's own .gitignore files, which can hide a file upstream tracks.
HIDDEN=$(git ls-files --others --ignored --exclude-standard -- vendor)
if [ -n "$HIDDEN" ]; then
  printf '%s\n' "$HIDDEN" | head -n 20
  refuse "the vendored files above are hidden by an ignore rule and would be missing from the zip: add each with git add -f and commit first."
fi
mkdir -p dist || refuse "dist/ could not be created."
git check-ignore -q dist || refuse "dist/ is not ignored: add the line dist/ to .gitignore, commit it, and run again."
echo "ok"

step b "Scrub gate (bash docs/scrub-check.sh)"
GATE=$(bash docs/scrub-check.sh 2>&1); RC=$?
printf '%s\n' "$GATE"
case "$GATE" in *"scrub gate: clean"*) ;; *) RC=1 ;; esac
[ "$RC" -eq 0 ] || refuse "the scrub gate is not clean (see above)."

step c "CHANGELOG.md has a heading for $VERSION"
[ -f CHANGELOG.md ] || refuse "CHANGELOG.md is missing."
awk -v h="## [$VERSION]" 'index($0, h) == 1 { found = 1 } END { exit !found }' CHANGELOG.md \
  || refuse "CHANGELOG.md has no heading ## [$VERSION]."
echo "ok"

step d "Tag $TAG"
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then refuse "the tag $TAG already exists."; fi
[ ! -e "$ZIP" ] || refuse "$ZIP already exists: move it away first."
git tag -a "$TAG" -m "Marketing Team Harness $TAG" || refuse "git tag failed."
echo "ok: $TAG on commit $(git rev-parse --short HEAD)"

step e "Build $ZIP"
# git archive packs only the files tracked in the tagged commit, so .env, node_modules/, dist/ and every
# other untracked or ignored file can never be inside the zip.
git archive --format=zip --prefix=marketing-team-harness/ -o "$ZIP" "$TAG" \
  || refuse "git archive failed. The tag $TAG stays; remove it with: git tag -d $TAG"
echo "ok: $(git ls-tree -r --name-only "$TAG" | wc -l | tr -d ' ') files"

step f "Done"
BYTES=$(wc -c < "$ZIP" | tr -d ' ')
echo "Zip: $(pwd)/$ZIP ($(( (BYTES + 1023) / 1024 )) KB)"
echo "This script never pushes. To publish the branch and the tag, run by hand: git push origin main --tags"
exit 0
