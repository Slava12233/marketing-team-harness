#!/usr/bin/env bash
# upgrade.sh: brings a new release of the Marketing Team Harness into this copy without touching the company's
# files. For macOS; it also runs in Git Bash on Windows and on Linux (on Windows, upgrade.ps1 does the same).
# Usage, from the harness folder:
#   bash upgrade.sh <release zip or unzipped release folder>            show the plan, then one question
#   bash upgrade.sh <release zip or unzipped release folder> --check    show the plan only; nothing is changed
#   bash upgrade.sh <release zip or unzipped release folder> --yes      no question; also lets an equal or older
#                                                                       release through
# Each step is printed:
#   (a) this folder is a harness copy (CLAUDE.md, memory/README.md, config/) and the source is a release
#       (CHANGELOG.md, docs/TEMPLATE-SPEC.md, docs/UPGRADE-PATHS.txt); a zip is extracted to a temporary folder
#   (b) both versions (the first "## [x.y.z]" heading of each CHANGELOG.md); a release that is not newer is
#       refused unless --yes (under --check it is a warning and the plan still shows)
#   (c) the plan, from the release's docs/UPGRADE-PATHS.txt: files replaced, added, kept, skipped as [never],
#       harness files you changed locally (against docs/release-manifest.txt when this copy has one), files
#       only in your copy; --check stops here
#   (d) one question: Apply the upgrade now? [y/N] (Enter means No; --yes skips it)
#   (e) every file about to be overwritten is copied to .upgrade-backup/<YYYY-MM-DD-HHMM>/ (same relative
#       path), then the release's files are copied in
#   (f) node memory/tools/lint.mjs, node memory/tools/build-hot.mjs --by upgrade and node memory/tools/instance.mjs
#       --adopt (the instance marker for this folder when it has none: an upgrade keeps the business), when they exist
#   (g) what to do next
# It never pushes, never runs git, never opens .env and never prints a secret.
# Exit codes: 0 upgraded (or --check done), 1 refused, declined or failed, 2 usage.
# The whole script is one function, read in full before it runs, because step (e) may replace this very file.
set -u
WORK=""

main() {
  local SRC="" CHECK=0 YES=0 a
  say()  { printf '%s\n' "$*"; }
  note() { printf '        %s\n' "$*"; }
  step() { echo ""; echo "($1) $2"; }
  refuse() { echo "REFUSED: $*"; exit 1; }
  usage() {
    say "Usage: bash upgrade.sh <path to the new release zip or an unzipped release folder> [--check] [--yes]"
    say "  --check   show the plan only: nothing is copied, nothing is changed"
    say "  --yes     apply without the question; also lets an equal or older release through"
    say "Run it from the harness folder (the one that contains CLAUDE.md, memory/ and config/)."
  }
  for a in "$@"; do
    case "$a" in
      --check) CHECK=1 ;;  --yes) YES=1 ;;  --help|-h) usage; exit 0 ;;
      -*) say "Unknown option: $a"; usage; exit 2 ;;
      *) if [ -n "$SRC" ]; then say "Only one release path, please: $a"; usage; exit 2; fi; SRC="$a" ;;
    esac
  done
  [ -n "$SRC" ] || { usage; exit 2; }
  # A relative release path is taken from the folder the command was typed in, before moving to the harness.
  case "$SRC" in /*|[A-Za-z]:*) ;; *) SRC="$(pwd)/$SRC" ;; esac

  cd "$(dirname "$0")" || exit 2
  local ROOT; ROOT=$(pwd -P)
  WORK=$(mktemp -d 2>/dev/null || mktemp -d -t upgrade) || refuse "a temporary folder could not be made."
  trap 'rm -rf "$WORK"' EXIT

  local HASH=""
  if command -v sha256sum >/dev/null 2>&1; then HASH="sha256sum"
  elif command -v shasum >/dev/null 2>&1; then HASH="shasum -a 256"
  else refuse "neither sha256sum nor shasum was found: the plan cannot compare files."; fi

  # ---------------------------------------------------------------------------------------------------------
  step a "This folder is a harness copy, and the source is a release"
  [ -f CLAUDE.md ] && [ -f memory/README.md ] && [ -d config ] \
    || refuse "this is not a harness folder: it must contain CLAUDE.md, memory/README.md and config/. Run upgrade.sh from the harness folder."
  local REL=""
  if [ -f "$SRC" ]; then
    case "$SRC" in *.zip|*.ZIP) ;; *) refuse "$SRC is a file but not a .zip: give the release zip or an unzipped release folder." ;; esac
    mkdir -p "$WORK/release"
    # unzip where it exists; else tar (macOS's tar reads zips); else Windows' own tar.exe (Git Bash's GNU tar cannot).
    if command -v unzip >/dev/null 2>&1; then unzip -q "$SRC" -d "$WORK/release" || refuse "the zip could not be extracted."
    elif tar -xf "$SRC" -C "$WORK/release" 2>/dev/null; then :
    elif [ -n "${SYSTEMROOT:-}" ] && [ -x "$(cygpath -u "$SYSTEMROOT" 2>/dev/null)/System32/tar.exe" ]; then
      "$(cygpath -u "$SYSTEMROOT")/System32/tar.exe" -xf "$(cygpath -w "$SRC")" -C "$(cygpath -w "$WORK/release")" \
        || refuse "the zip could not be extracted."
    else refuse "the zip could not be extracted (no unzip, and tar cannot read it): unzip it by hand and give the folder."; fi
    REL="$WORK/release"
    note "extracted $SRC to a temporary folder"
  elif [ -d "$SRC" ]; then
    REL=$(cd "$SRC" && pwd -P)
  else
    refuse "$SRC was not found."
  fi
  # A release zip holds one top folder (marketing-team-harness/); step into it.
  if [ ! -f "$REL/CHANGELOG.md" ]; then
    local subs; subs=$(find "$REL" -mindepth 1 -maxdepth 1 -type d | head -n 2)
    if [ -n "$subs" ] && [ "$(printf '%s\n' "$subs" | wc -l | tr -d ' ')" = 1 ]; then REL="$subs"; fi
  fi
  [ -f "$REL/CHANGELOG.md" ] && [ -f "$REL/docs/TEMPLATE-SPEC.md" ] \
    || refuse "the source is not a harness release: it must contain CHANGELOG.md and docs/TEMPLATE-SPEC.md."
  [ "$(cd "$REL" && pwd -P)" != "$ROOT" ] || refuse "the source is this harness folder itself: give the new release instead."
  local MANIFEST="$REL/docs/UPGRADE-PATHS.txt"
  [ -f "$MANIFEST" ] || refuse "the release has no docs/UPGRADE-PATHS.txt, so it does not say which files it may write."
  note "harness folder: $ROOT"
  note "release:        $REL"
  echo "ok"

  # ---------------------------------------------------------------------------------------------------------
  step b "Versions"
  version_of() { awk 'match($0, /^## \[[0-9]+\.[0-9]+\.[0-9]+\]/) { print substr($0, 5, RLENGTH - 5); exit }' "$1"; }
  local VOLD VNEW; VOLD=$(version_of CHANGELOG.md); VNEW=$(version_of "$REL/CHANGELOG.md")
  note "this copy:   ${VOLD:-no version heading (an unreleased copy)}"
  note "the release: ${VNEW:-no version heading}"
  local NEWER=0
  if [ -z "$VNEW" ]; then NEWER=0
  elif [ -z "$VOLD" ]; then NEWER=1
  else
    NEWER=$(awk -v a="$VOLD" -v b="$VNEW" 'BEGIN { split(a, x, "."); split(b, y, ".");
      for (i = 1; i <= 3; i++) { if (y[i] + 0 > x[i] + 0) { print 1; exit } if (y[i] + 0 < x[i] + 0) { print 0; exit } } print 0 }')
  fi
  if [ "$NEWER" = 1 ]; then echo "ok: the release is newer"
  elif [ "$YES" = 1 ]; then echo "warning: the release is not newer than this copy; going on because of --yes"
  elif [ "$CHECK" = 1 ]; then echo "warning: the release is not newer than this copy; an apply would be refused without --yes"
  else refuse "the release (${VNEW:-no version}) is not newer than this copy (${VOLD:-no version}). To install it anyway, add --yes."; fi

  # ---------------------------------------------------------------------------------------------------------
  step c "The plan (from the release's docs/UPGRADE-PATHS.txt)"
  # The manifest becomes one "section<TAB>regex" line per path, in one awk pass. Glob to regex: the regex
  # characters are escaped, **/ -> (.*/)?, ** -> .*, * -> [^/]*, ? -> [^/]; a trailing / means "everything under
  # the folder". A "!path" line under [never] is an exception to [never] (section "unnever").
  local d ERR
  ERR=$(awk -v rxfile="$WORK/rx" -v dirsfile="$WORK/repl.dirs" '
    BEGIN { printf "" > rxfile; printf "" > dirsfile }
    { sub(/\r$/, ""); sub(/#.*/, ""); gsub(/^[ \t]+|[ \t]+$/, ""); if ($0 == "") next
      if ($0 == "[replace]") { sec = "replace"; next }
      if ($0 == "[add-only]") { sec = "add"; next }
      if ($0 == "[never]") { sec = "never"; next }
      if ($0 ~ /^\[/) { print "an unknown section: " $0; exit 3 }
      if (sec == "") { print "a path before the first section: " $0; exit 3 }
      line = $0; s = sec
      if (substr(line, 1, 1) == "!") { if (sec != "never") { print "a ! line outside [never]: " $0; exit 3 } s = "unnever"; line = substr(line, 2) }
      dir = (line ~ /\/$/); p = line; if (dir) sub(/\/$/, "", p)
      out = ""
      for (i = 1; i <= length(p); i++) {
        c = substr(p, i, 1)
        if (c == "*") {
          if (substr(p, i, 3) == "**/") { out = out "(.*/)?"; i += 2 }
          else if (substr(p, i, 2) == "**") { out = out ".*"; i += 1 }
          else out = out "[^/]*"
        } else if (c == "?") out = out "[^/]"
        else if (index(".[]^$+(){}|\\", c)) out = out "\\" c
        else out = out c
      }
      print s "\t^" out (dir ? "/" : "$") > rxfile
      if (s == "replace" && dir && p !~ /[*?]/) print p > dirsfile }' "$MANIFEST") \
    || refuse "docs/UPGRADE-PATHS.txt has $ERR"

  # classify: reads paths, prints "section<TAB>path" ([never] first unless a !path exception matches, then
  # [add-only], then [replace]; else none).
  classify() {
    awk -F '\t' -v rxfile="$WORK/rx" '
      BEGIN { while ((getline l < rxfile) > 0) { split(l, f, "\t"); n[f[1]]++; rx[f[1], n[f[1]]] = f[2] } }
      { s = "none"
        ex = 0; for (i = 1; i <= n["unnever"]; i++) if ($0 ~ rx["unnever", i]) { ex = 1; break }
        if (!ex) for (i = 1; i <= n["never"]; i++) if ($0 ~ rx["never", i]) { s = "never"; break }
        if (s == "none") for (i = 1; i <= n["add"]; i++) if ($0 ~ rx["add", i]) { s = "add"; break }
        if (s == "none") for (i = 1; i <= n["replace"]; i++) if ($0 ~ rx["replace", i]) { s = "replace"; break }
        print s "\t" $0 }'
  }
  # hashes <folder> <list file>: prints "hash<TAB>path" for each listed file that exists in the folder.
  hashes() {
    [ -s "$2" ] || return 0
    (cd "$1" && tr '\n' '\0' < "$2" | xargs -0 $HASH) \
      | awk '{ h = $1; sub(/^\\/, "", h); p = substr($0, 67); print h "\t" p }'
  }

  (cd "$REL" && find . -type f ! -path './.git/*' ! -path '*/node_modules/*' | sed 's#^\./##' | LC_ALL=C sort) > "$WORK/rel.list"
  classify < "$WORK/rel.list" > "$WORK/rel.class"
  # Files of this copy that the release could compare against: those in the release, plus everything under a
  # [replace] folder (to find harness files the release no longer carries).
  : > "$WORK/mine.list"
  while IFS= read -r line; do [ -f "$ROOT/$line" ] && printf '%s\n' "$line" >> "$WORK/mine.list"; done < "$WORK/rel.list"
  while IFS= read -r d; do
    [ -d "$ROOT/$d" ] && (cd "$ROOT" && find "$d" -type f ! -path '*/node_modules/*')
  done < "$WORK/repl.dirs" | LC_ALL=C sort -u > "$WORK/mine.dirs"
  classify < "$WORK/mine.dirs" | awk -F '\t' '$1 == "replace" { print $2 }' > "$WORK/mine.repl"
  LC_ALL=C comm -23 "$WORK/mine.repl" "$WORK/rel.list" > "$WORK/only-mine"

  awk -F '\t' '$1 != "never" && $1 != "none" { print $2 }' "$WORK/rel.class" > "$WORK/cmp.list"
  LC_ALL=C comm -12 "$WORK/cmp.list" <(LC_ALL=C sort "$WORK/mine.list") > "$WORK/both.list"
  hashes "$REL" "$WORK/both.list" > "$WORK/h.rel"
  hashes "$ROOT" "$WORK/both.list" > "$WORK/h.mine"
  : > "$WORK/h.old"
  if [ -f docs/release-manifest.txt ]; then
    awk '!/^#/ && NF >= 2 { h = $1; sub(/^\\/, "", h); p = substr($0, 67); print h "\t" p }' docs/release-manifest.txt > "$WORK/h.old"
  fi

  # One line per release file: "<category><TAB>path", categories replace, local, add, unchanged, kept, differs,
  # never, none.
  awk -F '\t' -v hr="$WORK/h.rel" -v hm="$WORK/h.mine" -v ho="$WORK/h.old" '
    BEGIN { while ((getline l < hr) > 0) { split(l, f, "\t"); R[f[2]] = f[1] }
            while ((getline l < hm) > 0) { split(l, f, "\t"); M[f[2]] = f[1] }
            while ((getline l < ho) > 0) { split(l, f, "\t"); O[f[2]] = f[1] } }
    { s = $1; p = $2
      if (s == "never" || s == "none") { print s "\t" p; next }
      if (!(p in M)) { print "add\t" p; next }
      if (s == "add") { print ((R[p] == M[p]) ? "kept" : "differs") "\t" p; next }
      if (R[p] == M[p]) { print "unchanged\t" p; next }
      if ((p in O) && O[p] != M[p]) print "local\t" p; else print "replace\t" p }' "$WORK/rel.class" > "$WORK/plan"

  count() { awk -F '\t' -v c="$1" '$1 == c' "$WORK/plan" | wc -l | tr -d ' '; }
  show() {   # show <category> <title>
    local n; n=$(count "$1")
    say "  $2: $n"
    [ "$n" = 0 ] || awk -F '\t' -v c="$1" '$1 == c { print "        " $2 }' "$WORK/plan"
  }
  show replace "Replaced from the release (the old file goes to the backup)"
  show local   "Replaced, but CHANGED IN THIS COPY since the last release (your edit goes to the backup)"
  show add     "Added (new in the release, not in this copy)"
  show differs "Kept as yours although the release's version differs ([add-only]: compare by hand if you like)"
  show never   "Skipped: [never] (the company's files; not written)"
  show none    "Not listed in docs/UPGRADE-PATHS.txt (left alone)"
  local NONLY; NONLY=$(wc -l < "$WORK/only-mine" | tr -d ' ')
  say "  Only in this copy, under a harness folder (left in place; delete by hand if unused): $NONLY"
  [ "$NONLY" = 0 ] || sed 's/^/        /' "$WORK/only-mine"
  say "  Already identical (nothing to do): $(count unchanged); kept as yours ([add-only], same as the release): $(count kept)"
  if [ ! -f docs/release-manifest.txt ]; then
    note "This copy has no docs/release-manifest.txt, so local edits to harness files cannot be told apart:"
    note "every differing harness file is listed as replaced. Its old version still goes to the backup."
  fi
  local NWRITE; NWRITE=$(( $(count replace) + $(count local) + $(count add) ))
  if [ "$CHECK" = 1 ]; then
    echo ""; echo "--check: nothing was changed. $NWRITE files would be written."; exit 0
  fi
  if [ "$NWRITE" = 0 ]; then
    echo ""; echo "Nothing to copy: this copy already matches the release."; exit 0
  fi

  # ---------------------------------------------------------------------------------------------------------
  step d "Confirm"
  if [ "$YES" = 1 ]; then echo "--yes: no question"
  else
    printf 'Apply the upgrade now? [y/N]: '
    local ANSWER="" got=0
    IFS= read -r ANSWER && got=1
    ANSWER=${ANSWER%$'\r'}; ANSWER=${ANSWER//[[:space:]]/}
    if [ ! -t 0 ]; then printf '%s\n' "$ANSWER"; elif [ "$got" = 0 ]; then echo; fi
    case "$ANSWER" in [yY]|[yY][eE][sS]) ;; *) echo "Not applied. Nothing was changed."; exit 1 ;; esac
  fi

  # ---------------------------------------------------------------------------------------------------------
  local STAMP; STAMP=$(date +%Y-%m-%d-%H%M)
  local BK=".upgrade-backup/$STAMP" k=2
  while [ -e "$BK" ]; do BK=".upgrade-backup/$STAMP-$k"; k=$((k + 1)); done
  step e "Back up to $BK/, then copy"
  mkdir -p "$BK" || refuse "the backup folder $BK could not be made. Nothing was changed."
  local p NB=0 NC=0 FAIL=0
  awk -F '\t' '$1 == "replace" || $1 == "local" { print $2 }' "$WORK/plan" > "$WORK/overwrite"
  while IFS= read -r p; do
    mkdir -p "$BK/$(dirname "$p")" && cp -p "$p" "$BK/$p" || refuse "the backup of $p failed. Nothing was overwritten; the partial backup is in $BK/."
    NB=$((NB + 1))
  done < "$WORK/overwrite"
  { echo "# Upgrade $STAMP: ${VOLD:-unreleased} -> ${VNEW:-no version}, from $SRC"
    echo "# The files under this folder are the versions the upgrade overwrote. The files below were ADDED by the"
    echo "# upgrade (they have no backup); to roll back fully, delete them after copying the backup back."
    awk -F '\t' '$1 == "add" { print $2 }' "$WORK/plan"; } > "$BK.added.txt"
  echo "ok: $NB files backed up"
  awk -F '\t' '$1 == "replace" || $1 == "local" || $1 == "add" { print $2 }' "$WORK/plan" > "$WORK/write"
  while IFS= read -r p; do
    if mkdir -p "$(dirname "$p")" && cp "$REL/$p" "$p"; then NC=$((NC + 1)); else FAIL=$((FAIL + 1)); note "FAILED: $p"; fi
  done < "$WORK/write"
  echo "ok: $NC files copied"
  if [ "$FAIL" -gt 0 ]; then
    echo "REFUSED: $FAIL files could not be copied (listed above). To roll back, copy everything in $BK/ back into this folder."
    exit 1
  fi

  # ---------------------------------------------------------------------------------------------------------
  step f "Check the vault"
  if command -v node >/dev/null 2>&1; then
    local rc
    if [ -f memory/tools/lint.mjs ]; then node memory/tools/lint.mjs; rc=$?; echo "lint.mjs exit code: $rc"
    else echo "memory/tools/lint.mjs is not there: skipped"; fi
    if [ -f memory/tools/build-hot.mjs ]; then node memory/tools/build-hot.mjs --by upgrade; rc=$?; echo "build-hot.mjs exit code: $rc"
    else echo "memory/tools/build-hot.mjs is not there: skipped"; fi
    # An upgrade in place keeps the business: the instance marker is written when the folder has none, so the
    # new-copy check does not take this company for a copy (a marker from another folder is left as it is).
    if [ -f memory/tools/instance.mjs ]; then node memory/tools/instance.mjs --adopt; rc=$?; echo "instance.mjs exit code: $rc"; fi
  else
    echo "Node.js was not found: lint.mjs and build-hot.mjs were skipped (run bash bootstrap.sh --check)"
  fi

  # ---------------------------------------------------------------------------------------------------------
  step g "Next"
  say "Upgraded from ${VOLD:-an unreleased copy} to ${VNEW:-the release}."
  say "1. Close Claude Code and open a new session in this folder, so it loads the new rules, skills and agents."
  say "2. Type /health and wait for the table."
  say "3. When /health is green, the backup folder $BK/ (and $BK.added.txt) can be deleted."
  say "To roll back: copy everything in $BK/ back into this folder, and delete the files listed in $BK.added.txt."
  exit 0
}

main "$@"; exit $?
