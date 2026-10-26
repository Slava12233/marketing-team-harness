#!/usr/bin/env bash
# Scrub gate: fails when any term of docs/TEMPLATE-SPEC.md §8 appears anywhere in the repository.
# Usage: bash docs/scrub-check.sh [repo-root]   (exit 0 = clean, 1 = hits, 2 = usage)
# The term list is read from the fenced block under "## 8. Scrub gate" so it lives in one place.
# Excluded: .git, node_modules, media folders, this script, the spec, the verbatim third-party
# skills (their attribution lines are theirs; they were checked for company terms when copied), and
# vendor/ (the HyperFrames plugin, vendored verbatim; see THIRD-PARTY.md).
set -u
ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
SPEC="$ROOT/docs/TEMPLATE-SPEC.md"
[ -f "$SPEC" ] || { echo "spec not found: $SPEC"; exit 2; }

TERMS=$(awk '/^## 8\. Scrub gate/{f=1;next} f&&/^```/{c++; if(c==2){exit}; next} f&&c==1{print}' "$SPEC" \
  | tr ',' '\n' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//' | sed '/^$/d')

THIRD_PARTY="ad-creative image banner-design frontend-design find-skills grill-me grilling viral-reverse-engineering"
EXCL=(--exclude-dir=.git --exclude-dir=node_modules --exclude-dir=media --exclude-dir=vendor --exclude=TEMPLATE-SPEC.md --exclude=scrub-check.sh --binary-files=without-match)
for d in $THIRD_PARTY; do EXCL+=("--exclude-dir=$d"); done

STATUS=0
while IFS= read -r term; do
  [ -z "$term" ] && continue
  HITS=$(grep -r -i -n -F "${EXCL[@]}" -e "$term" "$ROOT" 2>/dev/null)
  if [ -n "$HITS" ]; then
    STATUS=1
    echo "== term: $term"
    echo "$HITS" | head -20
    n=$(echo "$HITS" | wc -l); [ "$n" -gt 20 ] && echo "   ... $n hits in all"
  fi
done <<< "$TERMS"

# Warning class (does not fail): an uppercase {{FIELD}} placeholder outside config/, examples/ and docs/
# usually means a generalised file still carries a template token instead of a config reference.
PH=$(grep -r -n -E "${EXCL[@]}" --exclude-dir=config --exclude-dir=examples --exclude-dir=docs -e '\{\{[A-Z][A-Z_]+\}\}' "$ROOT" 2>/dev/null \
  | grep -v -E '(CLAUDE|README|ONBOARDING)\.md:|SKILL\.md:')
if [ -n "$PH" ]; then echo "== warning: {{FIELD}} placeholders outside config/, examples/, docs/:"; echo "$PH" | head -20; fi

[ "$STATUS" -eq 0 ] && echo "scrub gate: clean ($(echo "$TERMS" | wc -l) terms checked)"
exit $STATUS
