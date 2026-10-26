#!/usr/bin/env bash
# ad-shots.sh: captures Meta ad previews as PNGs with a headless Chromium browser (Edge or Chrome), 520x680.
#
# Usage (from the repository root):
#   bash creatives/tools/ad-shots.sh <out_dir> <name>=<preview_url> [<name>=<preview_url> ...]
#
# The URLs are the Facebook Feed `preview_url` values that the Meta Ads MCP tool `ads_get_ad_preview` returns
# (ad_format MOBILE_FEED_STANDARD). Replace every `&amp;` with `&` first, and quote each pair. Use one call for
# all ads; the files are what the Owner is shown (never a browser pane). Send the first usable capture at once;
# do not loop retries on a capture that fails silently.
#
# Browser: $AD_SHOTS_BROWSER if set (full path to msedge, chrome, chromium), else the first one found among the
# usual Windows, macOS and Linux install paths and the PATH. Edge can hand off to a background process, so the
# files may land a few seconds after the browser returns; the script polls up to 30 s for them.
# Output: one line per ad, "ok <file>" or "MISSING <name>". Exit 0 when every file exists, 1 otherwise, 2 on usage.
set -u

if [ "$#" -lt 2 ]; then
  sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'
  exit 2
fi

OUT="$1"; shift
mkdir -p "$OUT"

find_browser() {
  if [ -n "${AD_SHOTS_BROWSER:-}" ] && [ -x "$AD_SHOTS_BROWSER" ]; then echo "$AD_SHOTS_BROWSER"; return 0; fi
  local c
  for c in \
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe" \
    "C:/Program Files/Google/Chrome/Application/chrome.exe" \
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium"; do
    if [ -x "$c" ] || [ -f "$c" ]; then echo "$c"; return 0; fi
  done
  for c in microsoft-edge microsoft-edge-stable msedge google-chrome google-chrome-stable chromium chromium-browser chrome; do
    if command -v "$c" >/dev/null 2>&1; then command -v "$c"; return 0; fi
  done
  return 1
}

BROWSER="$(find_browser)" || { echo "No Edge or Chrome found. Set AD_SHOTS_BROWSER to the browser's full path." >&2; exit 2; }

# A time bound per capture when `timeout` exists (GNU coreutils, Git Bash); macOS without it runs unbounded.
if command -v timeout >/dev/null 2>&1; then BOUND=(timeout 60); else BOUND=(); fi

names=()
for pair in "$@"; do
  case "$pair" in
    *=*) ;;
    *) echo "skipping '$pair': expected <name>=<url>" >&2; continue ;;
  esac
  name="${pair%%=*}"; url="${pair#*=}"; names+=("$name")
  ${BOUND[@]+"${BOUND[@]}"} "$BROWSER" --headless=new --disable-gpu --hide-scrollbars --window-size=520,680 \
    --virtual-time-budget=8000 --screenshot="$OUT/$name.png" "$url" >/dev/null 2>&1 &
done
wait

[ "${#names[@]}" -eq 0 ] && { echo "no <name>=<url> pairs given" >&2; exit 2; }

for _ in $(seq 1 30); do
  missing=0
  for n in "${names[@]}"; do [ -s "$OUT/$n.png" ] || missing=1; done
  [ "$missing" = 0 ] && break
  sleep 1
done

status=0
for n in "${names[@]}"; do
  if [ -s "$OUT/$n.png" ]; then echo "ok $OUT/$n.png"; else echo "MISSING $n"; status=1; fi
done
exit "$status"
