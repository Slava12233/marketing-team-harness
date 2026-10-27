#!/usr/bin/env bash
# bootstrap.sh: the first command for a new copy of the Marketing Team Harness, for macOS. It also runs in
# Git Bash on Windows and on Linux; on Windows, bootstrap.ps1 does the same steps in PowerShell.
# Run it from the harness folder (the one that contains CLAUDE.md and .mcp.json):
#   bash bootstrap.sh            check everything, list what is missing, then one question installs all of it
#   bash bootstrap.sh --ask      ask per item: one y/N question before each install
#   bash bootstrap.sh --yes      install everything that is missing, with no question at all
#   bash bootstrap.sh --check    report only: no questions, no installs, nothing changed
#   bash bootstrap.sh --help     show the usage
# The one install takes every missing item, required and optional alike (Git, Node.js, Claude Code,
# playwright-core, Obsidian for the memory vault, FFmpeg, the HyperFrames video plugin from vendor/hyperframes),
# copies .env.example to .env, sets Obsidian up for the vault (memory/tools/obsidian-setup.mjs: the vault is
# registered, the command line interface is on, the app opens; no click) and opens the setup progress page.
# Enter at its question means Yes; Enter at an --ask question means No.
# Tags: [ok] already there, [installed] put in place by this run, [missing] not there, [skipped] an optional
# item left out. Exit codes: 0 everything required is present, 1 something required is missing or the
# install was declined, 2 wrong folder or unknown option. It never asks for, reads or prints a token: .env is
# only copied from .env.example.
set -u

MODE=all; CHECK=0; YES=0; ASKEACH=0; MISSING=0; RECHECK=""; AGREED=0
PLAN=""; ENV_TODO=0; PAGE_TODO=0; GO=0; DECLINED=0; NOANSWER=0; ANSWER=""
say()  { printf '%s\n' "$*"; }
note() { printf '        %s\n' "$*"; }
usage() {
  say "Usage: bash bootstrap.sh [--ask | --yes | --check] [--help]"
  say "  (no option)  check, list what is missing, then one question installs all of it (Enter means Yes)"
  say "  --ask        ask per item: one y/N question before each install (Enter means No)"
  say "  --yes        install everything that is missing, required and optional, with no question"
  say "  --check      report only: no questions, no installs, nothing changed"
  say "  --help       show this text"
  say "Given together, the more careful option wins: --check, then --ask, then --yes."
  say "Run it from the harness folder (the one that contains CLAUDE.md and .mcp.json)."
}
for a in "$@"; do
  case "$a" in
    --check) CHECK=1 ;;  --ask) ASKEACH=1 ;;  --yes) YES=1 ;;  --help|-h) usage; exit 0 ;;
    *) say "Unknown option: $a"; usage; exit 2 ;;
  esac
done
if [ "$CHECK" = 1 ]; then MODE=check; elif [ "$ASKEACH" = 1 ]; then MODE=ask; fi
case "$(uname -s 2>/dev/null)" in
  Darwin) OS=mac ;;  Linux) OS=linux ;;  MINGW*|MSYS*|CYGWIN*) OS=win ;;  *) OS=other ;;
esac

if [ ! -f CLAUDE.md ] || [ ! -f .mcp.json ]; then
  say "This is not the harness folder: it must contain CLAUDE.md and .mcp.json."
  here=$(cd "$(dirname "$0")" 2>/dev/null && pwd)
  if [ -n "$here" ] && [ -f "$here/CLAUDE.md" ] && [ -f "$here/.mcp.json" ]; then
    say "Type this line and press Enter, then run the script again:"
    printf '  cd "%s"\n' "$here"
  else
    say "Type cd and a space, drag the harness folder into this window, press Enter, then run: bash bootstrap.sh"
  fi
  exit 2
fi

# answer: reads one typed line into ANSWER, spaces taken out; returns 1 when nothing could be read (the input
# is closed). When the input is not a terminal, the line is printed after the question so the log shows it.
answer() {
  local got=0; ANSWER=""
  IFS= read -r ANSWER && got=1
  ANSWER=${ANSWER%$'\r'}
  if [ ! -t 0 ]; then printf '%s\n' "$ANSWER"; elif [ "$got" = 0 ]; then echo; fi
  ANSWER=${ANSWER//[[:space:]]/}
  [ "$got" = 1 ] || [ -n "$ANSWER" ]
}

# ask <question>: one --ask question; returns 0 for yes. Enter, or no answer at all, means No.
ask() {
  printf '        %s [y/N]: ' "$1"
  answer
  case "$ANSWER" in [yY]|[yY][eE][sS]) return 0 ;; *) return 1 ;; esac
}

# confirm <question>: the one question of a default run; returns 0 for yes. Enter means Yes; no answer at all
# (the input is closed) means No and sets NOANSWER=1.
confirm() {
  printf '%s [Y/n]: ' "$1"
  if ! answer; then NOANSWER=1; return 1; fi
  case "$ANSWER" in ''|[yY]|[yY][eE][sS]) return 0 ;; *) return 1 ;; esac
}

# offer <name> <1 = required> <what it downloads> <command>: runs one install. Under --ask it first states the
# download and asks; in the one-question install (a default run after its yes, or --yes) it runs at once, the
# plan having named the source. Sets AGREED=1 when the install goes ahead; returns 0 when the command succeeded.
offer() {
  AGREED=0
  if [ "$MODE" = ask ]; then
    note "This downloads $3."
    if ! ask "Install $1 now?"; then
      [ "$2" = 1 ] && note "Not installed. Run this script again when you are ready."
      return 1
    fi
  fi
  AGREED=1; note "Running: $4"
  bash -c "set -o pipefail; $4"; local rc=$?
  [ "$rc" -eq 0 ] || note "The install did not finish (exit code $rc)."
  return "$rc"
}

BREW=""; command -v brew >/dev/null 2>&1 && BREW=brew
for b in /opt/homebrew/bin/brew /usr/local/bin/brew /home/linuxbrew/.linuxbrew/bin/brew; do
  [ -z "$BREW" ] && [ -x "$b" ] && BREW="$b"; done

# pkg_from: where pkg installs from on this machine, in the plan's words; nothing when it has no installer here.
pkg_from() {
  if [ "$OS" = win ]; then
    if command -v winget >/dev/null 2>&1; then say "the winget catalogue (the Windows Package Manager)"; fi
  elif [ -n "$BREW" ]; then say "Homebrew"; fi
}
# pkg_hint <name> <download page>: what to do instead when pkg has no installer here.
pkg_hint() {
  if [ "$OS" = win ]; then
    note "winget (the Windows Package Manager) was not found. Get App Installer from the Microsoft Store:"
    note "https://apps.microsoft.com/detail/9NBLGGH4NNS1 , or download $1 from $2"
  elif [ "$OS" = mac ]; then
    note "Homebrew, the installer this script uses on a Mac, is not installed. Install it first with this"
    note "line from https://brew.sh (it asks for your Mac password), then open a new terminal window:"
    note '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  else
    note "Install $1 with your system's package manager (or from $2), then run this script again."
  fi
}
# pkg <name> <Homebrew formula> <winget id> <download page> [<1 = required (the default), 0 = optional>]:
# installs with winget (Windows) or Homebrew.
pkg() {
  local from; from=$(pkg_from)
  if [ -z "$from" ]; then pkg_hint "$1" "$4"; return 1; fi
  if [ "$OS" = win ]; then offer "$1" "${5:-1}" "$1 from $from" "winget install --id $3 -e --source winget"
  else offer "$1" "${5:-1}" "$1 from $from" "$BREW install $2"; fi
}

git_v() {   # Git's version line, or nothing when Git is absent
  local p; p=$(command -v git 2>/dev/null) || return 0
  # On a Mac without Apple's command line tools, /usr/bin/git is only a stub that opens an install dialog.
  if [ "$OS" = mac ] && [ "$p" = /usr/bin/git ] && ! xcode-select -p >/dev/null 2>&1; then return 0; fi
  git --version 2>/dev/null | head -n 1
}
node_v()   { command -v node >/dev/null 2>&1 && node --version 2>/dev/null | head -n 1; }
claude_v() { command -v claude >/dev/null 2>&1 && claude --version 2>/dev/null | head -n 1; }
claude_file() { [ -e "$HOME/.local/bin/claude" ] || [ -e "$HOME/.local/bin/claude.exe" ]; }

check_git() {
  local v; v=$(git_v)
  if [ -n "$v" ]; then say "[ok] Git is installed ($v)."; return 0; fi
  say "[missing] Git is not installed."; return 1
}
check_node() {
  local v m; v=$(node_v); m=${v#v}; m=${m%%.*}
  case "$m" in ''|*[!0-9]*) m=0 ;; esac
  if [ "$m" -ge 20 ]; then say "[ok] Node.js $v is installed (20 or newer is needed)."; return 0; fi
  if [ -n "$v" ]; then say "[missing] Node.js $v is too old (20 or newer is needed)."
  else say "[missing] Node.js is not installed (20 or newer is needed)."; fi
  return 1
}
check_claude() {   # 0 ok, 1 not installed, 2 installed but its folder is not on PATH
  local v; v=$(claude_v)
  if [ -n "$v" ]; then say "[ok] Claude Code is installed ($v)."; return 0; fi
  if claude_file; then
    say "[missing] Claude Code is installed in $HOME/.local/bin, but that folder is not on your PATH yet."
    note "Open a new terminal window. If claude is still not found, add that folder to your PATH (the installer printed how)."
    return 2
  fi
  say "[missing] Claude Code is not installed."; return 1
}

install_git()  { pkg "Git" git Git.Git https://git-scm.com/downloads; }
install_node() { pkg "Node.js" node OpenJS.NodeJS.LTS https://nodejs.org/en/download; }
install_claude() {
  if [ "$OS" = win ]; then
    offer "Claude Code" 1 "Claude Code from claude.ai (the official installer)" \
      'powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://claude.ai/install.ps1 | iex"'
  else
    offer "Claude Code" 1 "Claude Code from claude.ai (the official installer)" "curl -fsSL https://claude.ai/install.sh | bash"
  fi
  local rc=$?; hash -r
  if [ "$rc" -eq 0 ] && { [ -n "$(claude_v)" ] || claude_file; }; then return 0; fi
  [ "$AGREED" = 1 ] || return 1
  note "The official installer did not work; trying the npm route instead."
  if ! command -v npm >/dev/null 2>&1; then note "npm was not found: install Node.js first, then run this script again."; return 1; fi
  note "This downloads Claude Code from the npm registry."
  note "Running: npm install -g @anthropic-ai/claude-code"
  npm install -g @anthropic-ai/claude-code
}

# put <name> <install function> <check function>: installs one required item: [installed] and a re-check
# at the end when it worked, otherwise it stays missing.
put() {
  if ! "$2"; then MISSING=1; return; fi
  say "[installed] $1. A new terminal window may be needed before the command is found."
  RECHECK="$RECHECK $3"
}
# need <item> <name> <install function> <check function> [<download page>]: after the [missing] line of a
# required item. --check records it, --ask installs it now (one question), and the one-question install adds it
# to the plan, or says why this script cannot install it here.
need() {
  case "$MODE" in
    check) MISSING=1 ;;
    ask) put "$2" "$3" "$4" ;;
    *) if [ "$1" = claude ] || [ -n "$(pkg_from)" ]; then PLAN="$PLAN $1"
       else pkg_hint "$2" "${5:-}"; MISSING=1; fi ;;
  esac
}
in_plan() { case " $PLAN " in *" $1 "*) return 0 ;; esac; return 1; }

say "Marketing Team Harness: first-time setup"
say "Folder: $(pwd)"
if [ "$MODE" = check ]; then say "Mode: check only. Nothing is installed or changed."
elif [ "$MODE" = ask ]; then say "Mode: one question before each install. Enter means No."
elif [ "$YES" = 1 ]; then say "Mode: check everything, then install all that is missing, with no question (--yes)."
else say "Mode: check everything, then one question installs all that is missing. Enter means Yes."; fi
say "No token or password is ever asked for here."

say ""
say "Required"
check_git || need git "Git" install_git check_git https://git-scm.com/downloads
check_node || need node "Node.js" install_node check_node https://nodejs.org/en/download
check_claude; rc=$?
if [ "$rc" -eq 1 ]; then need claude "Claude Code" install_claude check_claude
elif [ "$rc" -eq 2 ]; then MISSING=1; fi

browser=""
case "$OS" in
  mac) for b in "Microsoft Edge" "Google Chrome"; do
         [ -z "$browser" ] && [ -d "/Applications/$b.app" ] && browser="$b"; done ;;
  win) for base in "$(printenv 'ProgramFiles(x86)')" "${PROGRAMFILES:-}"; do
         [ -n "$base" ] || continue
         base=$(cygpath -u "$base" 2>/dev/null || printf '%s' "$base")
         [ -z "$browser" ] && [ -f "$base/Microsoft/Edge/Application/msedge.exe" ] && browser="Microsoft Edge"
         [ -z "$browser" ] && [ -f "$base/Google/Chrome/Application/chrome.exe" ] && browser="Google Chrome"
       done ;;
  *) for c in microsoft-edge microsoft-edge-stable google-chrome google-chrome-stable chromium chromium-browser; do
       [ -z "$browser" ] && command -v "$c" >/dev/null 2>&1 && browser="$c"; done ;;
esac
if [ -n "$browser" ]; then say "[ok] A browser for ad screenshots is installed ($browser)."
else
  say "[missing] Neither Microsoft Edge nor Google Chrome was found. Only the ad screenshots need one, so the setup goes on."
  note "Download one: https://www.microsoft.com/edge/download or https://www.google.com/chrome/"
fi

copy_env() {   # copies .env.example to .env; an .env that exists by now is left as it is
  if [ -f .env ]; then say "[ok] .env exists (contents never shown)."; return; fi
  if cp .env.example .env; then
    chmod 600 .env 2>/dev/null
    say "[installed] .env created from .env.example (contents never shown)."
    note "Later the Owner pastes the Meta System User token into .env with a text editor, never into the chat."
  else say "[missing] .env could not be created. Copy .env.example to .env by hand."; MISSING=1; fi
}
if [ -f .env ]; then say "[ok] .env exists (contents never shown)."
elif [ ! -f .env.example ]; then say "[missing] .env.example is missing, so .env cannot be created. Unzip the harness again."; MISSING=1
elif [ "$MODE" = check ]; then say "[missing] .env does not exist yet. Run this script without --check to create it from .env.example."; MISSING=1
elif [ "$MODE" = ask ]; then copy_env
else say "[missing] .env does not exist yet."; ENV_TODO=1; fi

say ""
say "Optional"
do_playwright() {   # installs playwright-core into node_modules here (after its question under --ask)
  if offer "playwright-core" 0 "playwright-core (a few megabytes) from the npm registry into node_modules in this folder" "npm install --no-save --no-package-lock playwright-core"
  then say "[installed] playwright-core."
  else say "[skipped] playwright-core. Install it later with: npm install --no-save --no-package-lock playwright-core"; fi
}
if [ -f node_modules/playwright-core/package.json ]; then say "[ok] playwright-core is installed (for the still renderer)."
elif [ "$MODE" = check ]; then say "[skipped] playwright-core is not installed (optional: only the still renderer needs it)."
elif ! command -v npm >/dev/null 2>&1 && ! in_plan node; then say "[skipped] playwright-core needs Node.js first (optional: only the still renderer needs it)."
else
  say "[missing] playwright-core is not installed (optional: only the still renderer needs it)."
  if [ "$MODE" = all ]; then PLAN="$PLAN playwright"; else do_playwright; fi
fi

# Obsidian (free, also for commercial use; Sync and Publish are optional paid services) opens the folder as the
# memory vault: notes, links and the Bases dashboards over memory/. This script installs the app (winget on
# Windows, the Homebrew cask on a Mac; on Linux it points to the download page). After the install phase
# memory/tools/obsidian-setup.mjs registers the vault, turns on the command line interface and starts the app,
# so the Owner clicks nothing in Obsidian. The memory hooks ship in .claude/settings.json.
OBSIDIAN_PAGE=https://obsidian.md/download
winpath_u() { cygpath -u "$1" 2>/dev/null || printf '%s' "$1"; }
obsidian_path() {   # the Obsidian app found (printed), or nothing
  local p
  case "$OS" in
    mac) for p in /Applications/Obsidian.app "$HOME/Applications/Obsidian.app"; do
           [ -d "$p" ] && { say "$p"; return 0; }; done ;;
    win) for p in "${LOCALAPPDATA:+$(winpath_u "$LOCALAPPDATA")/Programs/Obsidian/Obsidian.exe}" \
                  "${PROGRAMFILES:+$(winpath_u "$PROGRAMFILES")/Obsidian/Obsidian.exe}"; do
           [ -n "$p" ] && [ -f "$p" ] && { say "$p"; return 0; }; done ;;
    *) p=$(command -v obsidian 2>/dev/null) && { say "$p"; return 0; }
       for p in /snap/bin/obsidian /var/lib/flatpak/exports/bin/md.obsidian.Obsidian \
                "$HOME/.local/share/flatpak/exports/bin/md.obsidian.Obsidian"; do
         [ -x "$p" ] && { say "$p"; return 0; }; done ;;
  esac
  return 1
}
obsidian_from() { if [ "$OS" = win ] || [ "$OS" = mac ]; then pkg_from; fi; }   # nothing on Linux: no cask there
obsidian_cmd() {
  if [ "$OS" = win ]; then say "winget install --id Obsidian.Obsidian -e --accept-package-agreements --accept-source-agreements"
  else say "$BREW install --cask obsidian"; fi
}
do_obsidian() {   # installs Obsidian (after its question under --ask)
  local from p; from=$(obsidian_from)
  if [ -z "$from" ]; then
    pkg_hint "Obsidian" "$OBSIDIAN_PAGE"
    say "[skipped] Obsidian. Install it later; the vault notes are plain Markdown files and work without it."; return 1
  fi
  if offer "Obsidian" 0 "Obsidian (free, also for commercial use) from $from" "$(obsidian_cmd)"; then
    p=$(obsidian_path)
    if [ -n "$p" ]; then say "[installed] Obsidian ($p)."
    else say "[installed] Obsidian. A new terminal window may be needed before this script finds it."; fi
    return 0
  fi
  say "[skipped] Obsidian. Install it later with: $(obsidian_cmd) (or from $OBSIDIAN_PAGE)"; return 1
}
obs_path=$(obsidian_path)
if [ -n "$obs_path" ]; then say "[ok] Obsidian is installed for the memory vault ($obs_path)."
elif [ "$MODE" = check ]; then say "[skipped] Obsidian is not installed (optional: it shows the memory vault, memory/, as linked notes and dashboards)."
elif [ "$MODE" = all ] && [ -z "$(obsidian_from)" ]; then
  say "[skipped] Obsidian is not installed (optional: it shows the memory vault, memory/, as linked notes and dashboards)."
  pkg_hint "Obsidian" "$OBSIDIAN_PAGE"
else
  say "[missing] Obsidian is not installed (optional: it shows the memory vault, memory/, as linked notes and dashboards)."
  if [ "$MODE" = all ]; then PLAN="$PLAN obsidian"; else do_obsidian; fi
fi

# The HyperFrames video plugin (Apache-2.0, by HeyGen) ships in this folder, in vendor/hyperframes: the script
# adds that folder as the plugin's marketplace and never adds one from GitHub. The renderer needs Node.js 22
# or newer and FFmpeg; it is fetched from the npm registry (npx hyperframes) the first time a video is made.
HF_DIR="$(pwd)/vendor/hyperframes"
if [ "$OS" = win ] && command -v cygpath >/dev/null 2>&1; then HF_DIR=$(cygpath -m "$HF_DIR"); fi
hf_installed() { claude plugin list 2>/dev/null | grep -qi hyperframes; }
ffmpeg_v() { command -v ffmpeg >/dev/null 2>&1 && ffmpeg -version 2>/dev/null | head -n 1 | sed 's/ Copyright.*//'; }
do_ffmpeg() {   # installs FFmpeg (after its question under --ask)
  if pkg "FFmpeg" ffmpeg Gyan.FFmpeg https://ffmpeg.org/download.html 0; then
    hash -r; say "[installed] FFmpeg. A new terminal window may be needed before the command is found."; return 0
  fi
  say "[skipped] FFmpeg. The video plugin cannot render until it is installed."; return 1
}
check_ffmpeg() {   # FFmpeg for the video plugin: reports it; --ask offers it, the one-question install plans it
  local v; v=$(ffmpeg_v)
  if [ -n "$v" ]; then say "[ok] FFmpeg is installed for the video plugin ($v)."; return 0; fi
  if [ "$MODE" = check ]; then say "[skipped] FFmpeg is not installed (optional: the video plugin needs it to render)."; return 1; fi
  if [ "$MODE" = all ] && [ -z "$(pkg_from)" ]; then
    say "[skipped] FFmpeg is not installed (optional: the video plugin needs it to render)."
    pkg_hint "FFmpeg" https://ffmpeg.org/download.html; return 1
  fi
  say "[missing] FFmpeg is not installed (optional: the video plugin needs it to render)."
  if [ "$MODE" = all ]; then PLAN="$PLAN ffmpeg"; return 1; fi
  do_ffmpeg
}
install_hyperframes() {   # adds the vendored marketplace (one that already exists is fine), then installs
  local out rc
  note "Running: claude plugin marketplace add \"$HF_DIR\""
  out=$(claude plugin marketplace add "$HF_DIR" 2>&1); rc=$?
  [ -n "$out" ] && printf '%s\n' "$out" | sed 's/^/        /'
  if [ "$rc" -ne 0 ] && ! printf '%s' "$out" | grep -qi 'already'; then
    note "Adding the marketplace did not finish (exit code $rc)."; return 1
  fi
  note "Running: claude plugin install hyperframes@hyperframes"
  claude plugin install hyperframes@hyperframes; rc=$?
  hf_installed && return 0
  note "The install did not finish (exit code $rc)."; return 1
}
hf_node=$(node_v); hf_major=${hf_node#v}; hf_major=${hf_major%%.*}
case "$hf_major" in ''|*[!0-9]*) hf_major=0 ;; esac
if [ -z "$(claude_v)" ] && ! in_plan claude; then say "[skipped] The HyperFrames video plugin needs Claude Code first (optional: only for silent video ads)."
elif [ "$hf_major" -lt 22 ] && ! in_plan node; then
  if hf_installed; then say "[ok] The HyperFrames video plugin is installed, but it needs Node.js 22 or newer to render (${hf_node:-none found})."
  else say "[skipped] The HyperFrames video plugin needs Node.js 22 or newer (${hf_node:-none found}; the harness itself needs 20 or newer)."; fi
  note "Install the current Node.js LTS (https://nodejs.org/en/download), then run this script again."
else
  check_ffmpeg
  if hf_installed; then say "[ok] The HyperFrames video plugin is installed."
  elif [ ! -f vendor/hyperframes/.claude-plugin/marketplace.json ]; then
    say "[skipped] The HyperFrames video plugin's files are missing from vendor/hyperframes. Unzip the harness again to get them."
  elif [ "$MODE" = check ]; then say "[skipped] The HyperFrames video plugin is not installed (optional: only for silent video ads)."
  else
    say "[missing] The HyperFrames video plugin is not installed (optional: only for silent video ads)."
    if [ "$MODE" = all ]; then PLAN="$PLAN hyperframes"
    else
      note "The plugin's files are in this folder (vendor/hyperframes); the renderer itself (npx hyperframes) is fetched from the npm registry the first time a video is made."
      if ask "Install the HyperFrames video plugin now?" && install_hyperframes
      then say "[installed] The HyperFrames video plugin. Start a new Claude Code session so it loads."
      else say "[skipped] The HyperFrames video plugin. Install it later with the two lines in vendor/hyperframes/VENDOR.md."; fi
    fi
  fi
fi

# The one-question install (a default run, or --yes): the plan, one question, then every planned item in the
# order of the table above, with no further question. The items that need an earlier one (playwright-core needs
# npm; the plugin needs Claude Code and Node.js 22 or newer) look for it again first.
plan_line() {   # one line of the plan: the item and where it comes from
  case "$1" in
    git)         say "  - Git, from $(pkg_from)" ;;
    node)        if [ "$OS" = win ]; then say "  - Node.js LTS, from $(pkg_from)"; else say "  - Node.js, from $(pkg_from)"; fi ;;
    claude)      say "  - Claude Code, from claude.ai (the official installer; the npm registry if that fails)" ;;
    playwright)  say "  - playwright-core (a few megabytes), from the npm registry into node_modules in this folder" ;;
    obsidian)    say "  - Obsidian for the memory vault (free, also for commercial use), from $(obsidian_from)" ;;
    ffmpeg)      say "  - FFmpeg, from $(pkg_from)" ;;
    hyperframes) say "  - The HyperFrames video plugin, from vendor/hyperframes in this folder (its renderer comes from npm on first use)" ;;
  esac
}
playwright_now() {
  hash -r
  if command -v npm >/dev/null 2>&1; then do_playwright; return; fi
  say "[skipped] playwright-core needs Node.js first (optional: only the still renderer needs it)."
  note "Open a new terminal window in this folder and run this script again to add it."
}
hyperframes_now() {
  local v m; hash -r; v=$(node_v); m=${v#v}; m=${m%%.*}
  case "$m" in ''|*[!0-9]*) m=0 ;; esac
  if [ -z "$(claude_v)" ]; then say "[skipped] The HyperFrames video plugin needs Claude Code first (optional: only for silent video ads)."
  elif [ "$m" -lt 22 ]; then say "[skipped] The HyperFrames video plugin needs Node.js 22 or newer (${v:-none found}; the harness itself needs 20 or newer)."
  elif install_hyperframes; then say "[installed] The HyperFrames video plugin. Start a new Claude Code session so it loads."; return
  else say "[skipped] The HyperFrames video plugin. Install it later with the two lines in vendor/hyperframes/VENDOR.md."; return; fi
  note "Open a new terminal window in this folder and run this script again to add it."
}
if [ "$MODE" = all ]; then
  [ -f dashboard/setup-page.mjs ] && { [ -n "$(node_v)" ] || in_plan node; } && PAGE_TODO=1
  say ""
  if [ -z "$PLAN" ]; then
    if [ "$MISSING" = 1 ]; then say "Nothing for this script to install here: for what is marked [missing] above, follow the step on its line or in its note."
    else say "Nothing to install: every tool this script can install is in place."; fi
    GO=1
  else
    say "This will install:"
    for i in $PLAN; do plan_line "$i"; done
    if [ "$ENV_TODO" = 1 ] || [ "$PAGE_TODO" = 1 ]; then
      say "and will:"
      [ "$ENV_TODO" = 1 ] && say "  - copy .env.example to .env (its contents are never shown)"
      [ "$PAGE_TODO" = 1 ] && say "  - open the setup progress page (dashboard/setup.html) in your browser"
    fi
    if [ "$OS" = win ] && { in_plan git || in_plan node || in_plan ffmpeg; }; then
      say "winget may still show its own agreement prompts while it installs; answer them in this window."
    fi
    if [ "$YES" = 1 ]; then say "Install all of the above now? [Y/n]: yes (--yes)"; GO=1
    elif confirm "Install all of the above now?"; then GO=1
    else
      DECLINED=1
      if [ "$NOANSWER" = 1 ]; then say "No answer could be read, so nothing was installed. Run this script in a terminal window and press Enter at the question."
      else say "Nothing was installed."; fi
    fi
  fi
  if [ "$GO" = 1 ]; then
    if [ -n "$PLAN" ]; then say ""; say "Installing"; fi
    in_plan git && put "Git" install_git check_git
    in_plan node && put "Node.js" install_node check_node
    in_plan claude && put "Claude Code" install_claude check_claude
    [ "$ENV_TODO" = 1 ] && copy_env
    in_plan playwright && playwright_now
    in_plan obsidian && do_obsidian
    in_plan ffmpeg && do_ffmpeg
    in_plan hyperframes && hyperframes_now
  fi
fi

if [ -n "$RECHECK" ]; then
  say ""
  say "Checking again what this run installed"
  hash -r; again=0
  for c in $RECHECK; do "$c" || again=1; done
  if [ "$again" = 1 ]; then MISSING=1; note "Not found yet: open a new terminal window in this folder and run this script again."; fi
fi

# Obsidian set up with no click: memory/tools/obsidian-setup.mjs registers this folder as a vault in Obsidian's
# own config (obsidian.json), turns on its command line interface there and starts the app on the vault.
# --check runs it with --check (a report line, nothing changed); a declined run leaves it out. It never fails
# the run. OBS_SETUP: ok, failed, noapp, nonode, notool or skipped.
OBS_SETUP=skipped
obs_now=$(obsidian_path)
if [ "$DECLINED" = 0 ]; then
  if [ ! -f memory/tools/obsidian-setup.mjs ]; then OBS_SETUP=notool
  elif [ -z "$obs_now" ]; then OBS_SETUP=noapp
  elif [ -z "$(node_v)" ]; then OBS_SETUP=nonode
  else
    if [ "$MODE" = check ]; then obs_args="--check --quiet"; else obs_args="--quiet"; fi
    # shellcheck disable=SC2086
    if node memory/tools/obsidian-setup.mjs $obs_args >/dev/null 2>&1; then OBS_SETUP=ok; else OBS_SETUP=failed; fi
  fi
  if [ "$MODE" = check ]; then
    case "$OBS_SETUP" in
      ok)     say "[ok] Obsidian is set up for the memory vault: the vault is registered and the command line interface is on." ;;
      failed) say "[skipped] Obsidian is not set up for this folder yet: run this script without --check (or: node memory/tools/obsidian-setup.mjs)." ;;
      nonode) say "[skipped] Obsidian is not set up for this folder yet: it needs Node.js first; then run this script without --check." ;;
    esac
  fi
fi

# The memory routines (.claude/routines/): a nightly memory check and a weekly consolidation review that alert
# the Owner's phone and never act. The desktop app keeps their schedules itself, so only /setup (step 5.6) can
# register them; this script counts the scheduled tasks whose prompt names this folder and never creates one.
ROUTINES=0
TASK_DIR="$HOME/.claude/scheduled-tasks"
if [ -d "$TASK_DIR" ]; then
  HERE_PATH=$(pwd -W 2>/dev/null || pwd)   # Git Bash: the Windows form the prompts carry
  HERE_KEY=$(printf '%s' "$HERE_PATH" | tr '\\' '/' | tr '[:upper:]' '[:lower:]')
  for skill in "$TASK_DIR"/*/SKILL.md; do
    [ -f "$skill" ] || continue
    if tr '\\' '/' < "$skill" | tr '[:upper:]' '[:lower:]' | grep -qF "$HERE_KEY"; then ROUTINES=$((ROUTINES + 1)); fi
  done
fi
if [ "$MODE" = check ]; then
  if [ "$ROUTINES" -ge 2 ]; then say "[ok] The memory routines are registered for this folder ($ROUTINES scheduled tasks)."
  else say "[todo] The memory routines are not registered yet: /setup registers them in the Claude desktop app (one question)."; fi
fi

say ""
say "What remains"
if [ "$DECLINED" = 1 ]; then say "  First: run this script again and press Enter at the question to install what is marked [missing] above."
elif [ "$MISSING" = 1 ]; then
  if [ "$MODE" = check ]; then say "  First: run this script without --check to install what is marked [missing] above."
  else say "  First: install what is marked [missing] above (run this script again, or install it by hand)."; fi
fi
say "  1. Open this folder in Claude Code: type claude in this folder (or open the folder in the Claude desktop app)."
say "  2. Claude Code asks you to approve the two servers in .mcp.json (meta-ads and fal): approve them."
say "  3. In Claude Code type /mcp, pick meta-ads and log in, in the browser where the Owner is signed in to Facebook."
say "     Then pick fal and log in (optional: paid pictures). Start a new session afterwards so the tools load."
say "  4. Type /setup and answer the wizard."
if [ "$ROUTINES" -ge 2 ]; then say "     The two memory routines are already registered for this folder."
else say "     It also registers two memory routines: a nightly check and a weekly review that alert your phone and never act."; fi
say "  5. The Owner's Meta console steps are listed by the wizard and in docs/meta-setup-guide.md."
# The memory vault in Obsidian: the result of obsidian-setup.mjs above, after a run that went ahead. Nothing
# for the Owner to click; the memory hooks ship in .claude/settings.json.
if [ "$MODE" != check ] && [ "$DECLINED" = 0 ]; then
  case "$OBS_SETUP" in
    ok)     say "  6. Obsidian is set up: the vault is registered, the command line interface is on, the app opened on your HOME page."
            say "     (If Obsidian was already open before this run, close and reopen it once so its command line answers.)" ;;
    notool) say "  6. Obsidian is not set up: memory/tools/obsidian-setup.mjs is missing. Unzip the harness again to get it." ;;
    noapp)  say "  6. Obsidian is not installed, so the memory vault is not set up in it yet (the notes work without it)."
            say "     Install it (run this script again, or get it free from $OBSIDIAN_PAGE); then node memory/tools/obsidian-setup.mjs finishes it." ;;
    nonode) say "  6. Obsidian is installed but not set up yet: this window does not find Node.js."
            say "     Open a new terminal window in this folder and run: node memory/tools/obsidian-setup.mjs" ;;
    *)      say "  6. Obsidian could not be set up from here. Run: node memory/tools/obsidian-setup.mjs (it says why, and finishes it)." ;;
  esac
fi
# The setup progress page (dashboard/setup.html): written and opened at the end of a run that went ahead,
# never under --check or after a No. The marks are this run's results: done when the tool was found or installed.
if [ "$MODE" != check ] && [ "$DECLINED" = 0 ] && [ -f dashboard/setup-page.mjs ]; then
  if [ -n "$(node_v)" ]; then
    ran() { case " $RECHECK " in *" $1 "*) return 0 ;; esac; return 1; }
    pg_node=$(node_v); pg_major=${pg_node#v}; pg_major=${pg_major%%.*}
    case "$pg_major" in ''|*[!0-9]*) pg_major=0 ;; esac
    mark_git=todo; { [ -n "$(git_v)" ] || ran check_git; } && mark_git=done
    mark_node=todo; { [ "$pg_major" -ge 20 ] || ran check_node; } && mark_node=done
    mark_claude=todo; { [ -n "$(claude_v)" ] || ran check_claude; } && mark_claude=done
    mark_obsidian=todo; [ -n "$obs_now" ] && mark_obsidian=done
    obs_marks=()
    [ "$OBS_SETUP" = ok ] && obs_marks=(--mark "obsidian.vault_opened=done" --mark "obsidian.cli=done")
    say ""
    if node dashboard/setup-page.mjs --mark "install.git=$mark_git" --mark "install.node=$mark_node" \
         --mark "install.claude=$mark_claude" --mark "obsidian.installed=$mark_obsidian" ${obs_marks[@]+"${obs_marks[@]}"} --open >/dev/null 2>&1
    then say "A progress page opened in your browser; keep it beside Claude Code: dashboard/setup.html"
    else say "The progress page could not be written (node dashboard/setup-page.mjs failed); /setup opens it later."; fi
  elif [ "$PAGE_TODO" = 1 ]; then
    say ""
    say "The progress page needs Node.js, which this window does not find yet; /setup opens it later."
  fi
fi
say ""
if [ "$DECLINED" = 1 ]; then say "Result: nothing was installed; run this script again when you are ready."; exit 1; fi
if [ "$MISSING" = 1 ]; then say "Result: something required is still missing (marked [missing] above)."; exit 1; fi
say "Result: everything required is in place."
exit 0
