#!/usr/bin/env bash
# release.sh: the maintainer's release step for the Marketing Team Harness (buyers never run it).
# Usage: bash release.sh vX.Y.Z [--skip-tests]   (Windows: powershell -ExecutionPolicy Bypass -File .\release.ps1 vX.Y.Z [-SkipTests])
#        bash release.sh --manifest               (only rewrites docs/release-manifest.txt and exits 0; stage new files
#                                                  with git add first so they are listed, then commit the manifest)
# Each step is printed, and every check runs before the tag is made:
#   (a) the working tree is clean (git status --porcelain), no .env file is tracked, no file under vendor/ is
#       hidden by an ignore rule (it would be missing from the zip), dist/ is ignored
#   (b) bash docs/scrub-check.sh prints "scrub gate: clean"
#   (b2) the node test suites pass, one after the other, each bounded at 300 s (timeout 300 node --test <file>):
#        memory/tools/tools.test.mjs, memory/tools/instance.test.mjs, dashboard/setup-page.test.mjs, .claude/hooks/account-guard.test.mjs, bootstrap.test.mjs and
#        every creatives/tools/*.test.mjs; --skip-tests bypasses them with a printed warning (then run
#        docs/regression-run.md before publishing)
#   (b3) docs/release-manifest.txt ("<sha256>  <path>" for every tracked file but itself, LF) matches the tree;
#        a missing or stale manifest refuses the release with the command that rewrites it (--manifest)
#   (c) CHANGELOG.md has a "## [X.Y.Z]" heading for this version
#   (d) the annotated tag vX.Y.Z is created (refused when the tag or the zip already exists)
#   (e) dist/marketing-team-harness-vX.Y.Z.zip is built from that tag with git archive
#   (f) the zip's path and size are printed, with the push command to run by hand
# This script never pushes. Exit codes: 0 released, 1 refused or failed, 2 usage.
set -u

TAG=""; SKIP_TESTS=0; MANIFEST=0
for a in "$@"; do
  case "$a" in
    --skip-tests) SKIP_TESTS=1 ;;
    --manifest) MANIFEST=1 ;;
    *) if [ -z "$TAG" ]; then TAG="$a"; else TAG="invalid"; fi ;;
  esac
done
if [ "$MANIFEST" -eq 1 ] && [ -n "$TAG" ]; then
  echo "Usage: bash release.sh --manifest   (no version: it only rewrites docs/release-manifest.txt)"; exit 2
fi
if [ "$MANIFEST" -eq 0 ] && ! [[ "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Usage: bash release.sh vX.Y.Z [--skip-tests]   (for example: bash release.sh v1.0.0), or bash release.sh --manifest"; exit 2
fi
VERSION="${TAG#v}"
ZIP="dist/marketing-team-harness-$TAG.zip"
refuse() { echo "REFUSED: $*"; exit 1; }
step() { echo ""; echo "($1) $2"; }
MANIFEST_FILE="docs/release-manifest.txt"
# "<sha256>  <path>" for every tracked file except the manifest itself, in git's order, LF line endings.
# The same text as release.ps1 writes (sha256sum's binary-mode "*" marker is normalised to a second space).
manifest_text() {
  local hasher
  if command -v sha256sum >/dev/null 2>&1; then hasher="sha256sum"
  elif command -v shasum >/dev/null 2>&1; then hasher="shasum -a 256"
  else echo "neither sha256sum nor shasum was found" >&2; return 1; fi
  ( set -o pipefail
    git -c core.quotepath=off ls-files -z -- . ":(exclude)$MANIFEST_FILE" \
      | xargs -0 $hasher -- \
      | sed -E 's/^([0-9a-f]{64}) [ *]/\1  /' )
}

cd "$(dirname "$0")" || exit 2
command -v git >/dev/null 2>&1 || refuse "git was not found."
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || refuse "this folder is not a git repository."
[ -f docs/scrub-check.sh ] || refuse "docs/scrub-check.sh was not found: run this from the harness repository."

if [ "$MANIFEST" -eq 1 ]; then
  step manifest "Rewrite $MANIFEST_FILE from the tracked files (nothing else runs)"
  TMPM="$MANIFEST_FILE.tmp"
  manifest_text > "$TMPM" || { rm -f "$TMPM"; refuse "the manifest could not be computed (a tracked file may be missing from the disk; see above)."; }
  mv -f "$TMPM" "$MANIFEST_FILE" || refuse "$MANIFEST_FILE could not be written."
  echo "ok: $(wc -l < "$MANIFEST_FILE" | tr -d ' ') files listed in $MANIFEST_FILE. Commit it, then run the release."
  exit 0
fi

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

step b2 "Node test suites (one after the other, each bounded at 300 s)"
if [ "$SKIP_TESTS" -eq 1 ]; then
  echo "WARNING: --skip-tests was given: the node test suites were NOT run. Run them by hand (docs/regression-run.md) before you publish this zip."
else
  command -v node >/dev/null 2>&1 || refuse "node was not found: install Node.js 20 or newer (or pass --skip-tests, not recommended)."
  TIMEOUT_BIN=""
  for t in timeout gtimeout; do
    if command -v "$t" >/dev/null 2>&1; then TIMEOUT_BIN="$t"; break; fi
  done
  [ -n "$TIMEOUT_BIN" ] || refuse "timeout was not found: install GNU coreutils (macOS: brew install coreutils) so every suite runs with a time bound."
  SUITES=(memory/tools/tools.test.mjs memory/tools/instance.test.mjs dashboard/setup-page.test.mjs .claude/hooks/account-guard.test.mjs bootstrap.test.mjs)
  for f in "${SUITES[@]}"; do [ -f "$f" ] || refuse "the test suite $f is missing."; done
  for f in creatives/tools/*.test.mjs; do [ -f "$f" ] && SUITES+=("$f"); done
  for f in "${SUITES[@]}"; do
    echo "-> $TIMEOUT_BIN 300 node --test $f"
    "$TIMEOUT_BIN" 300 node --test "$f"; RC=$?
    [ "$RC" -ne 124 ] || refuse "$f did not finish within 300 s (exit 124). A node process may be left over: find it (ps, or tasklist on Windows) and kill it before running again."
    [ "$RC" -eq 0 ] || refuse "$f failed (exit $RC): see the output above."
  done
  echo "ok: ${#SUITES[@]} suites passed"
fi

step b3 "Release manifest ($MANIFEST_FILE matches the tracked files)"
TMPM=$(mktemp 2>/dev/null) || TMPM="dist/.release-manifest.tmp"
manifest_text > "$TMPM" || { rm -f "$TMPM"; refuse "the release manifest could not be computed (sha256sum or shasum is needed; see above)."; }
if [ -f "$MANIFEST_FILE" ] && cmp -s "$TMPM" "$MANIFEST_FILE"; then
  rm -f "$TMPM"
  echo "ok: $(wc -l < "$MANIFEST_FILE" | tr -d ' ') files"
else
  rm -f "$TMPM"
  refuse 'docs/release-manifest.txt is stale: run `bash release.sh --manifest` (or `-Manifest`) to rewrite it, commit, and run the release again'
fi

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
