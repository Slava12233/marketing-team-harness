#!/usr/bin/env bash
# bootstrap.sh: the first command for a new copy of the Marketing Team Harness, for macOS. It also runs in
# Git Bash on Windows and on Linux; on Windows, bootstrap.ps1 does the same steps in PowerShell.
# Run it from the harness folder (the one that contains CLAUDE.md and .mcp.json):
#   bash bootstrap.sh            check, and offer to install what is missing (one y/N question per item)
#   bash bootstrap.sh --check    report only: no questions, no installs, nothing changed
#   bash bootstrap.sh --yes      yes to every missing REQUIRED item; optional items are skipped
#   bash bootstrap.sh --help     show the usage
# Tags: [ok] already there, [installed] put in place by this run, [missing] not there, [skipped] an optional
# item left out. Exit codes: 0 everything required is present, 1 something required is missing, 2 wrong
# folder or unknown option. It never asks for, reads or prints a token: .env is only copied from .env.example.
set -u

CHECK=0; YES=0; MISSING=0; RECHECK=""; AGREED=0
say()  { printf '%s\n' "$*"; }
note() { printf '        %s\n' "$*"; }
usage() {
  say "Usage: bash bootstrap.sh [--check] [--yes] [--help]"
  say "  (no option)  check, and offer to install what is missing (one y/N question per item; Enter means No)"
  say "  --check      report only: no questions, no installs, nothing changed"
  say "  --yes        yes to every missing required item; optional items are skipped"
  say "  --help       show this text"
  say "Run it from the harness folder (the one that contains CLAUDE.md and .mcp.json)."
}
for a in "$@"; do
  case "$a" in
    --check) CHECK=1 ;;  --yes) YES=1 ;;  --help|-h) usage; exit 0 ;;
    *) say "Unknown option: $a"; usage; exit 2 ;;
  esac
done
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

# ask <question> <1 = required item>: returns 0 for yes. Enter, or no answer at all, means No.
ask() {
  if [ "$YES" = 1 ]; then
    if [ "$2" = 1 ]; then note "$1 [y/N]: yes (--yes)"; return 0; fi
    return 1
  fi
  printf '        %s [y/N]: ' "$1"
  local ans=""; read -r ans || echo
  case "$ans" in [yY]|[yY][eE][sS]) return 0 ;; *) return 1 ;; esac
}

# offer <name> <1 = required> <what it downloads> <command>: states the download, asks once, runs the
# command. Sets AGREED=1 on a yes; returns 0 when the command succeeded.
offer() {
  AGREED=0; note "This downloads $3."
  if ! ask "Install $1 now?" "$2"; then
    [ "$2" = 1 ] && note "Not installed. Run this script again when you are ready."
    return 1
  fi
  AGREED=1; note "Running: $4"
  bash -c "set -o pipefail; $4"; local rc=$?
  [ "$rc" -eq 0 ] || note "The install did not finish (exit code $rc)."
  return "$rc"
}

BREW=""; command -v brew >/dev/null 2>&1 && BREW=brew
for b in /opt/homebrew/bin/brew /usr/local/bin/brew /home/linuxbrew/.linuxbrew/bin/brew; do
  [ -z "$BREW" ] && [ -x "$b" ] && BREW="$b"; done

# pkg <name> <Homebrew formula> <winget id> <download page> [<1 = required (the default), 0 = optional>]:
# installs with winget (Windows) or Homebrew.
pkg() {
  local req="${5:-1}"
  if [ "$OS" = win ]; then
    if ! command -v winget >/dev/null 2>&1; then
      note "winget (the Windows Package Manager) was not found. Get App Installer from the Microsoft Store:"
      note "https://apps.microsoft.com/detail/9NBLGGH4NNS1 , or download $1 from $4"
      return 1
    fi
    offer "$1" "$req" "$1 from the winget catalogue (the Windows Package Manager)" "winget install --id $3 -e --source winget"
  elif [ -n "$BREW" ]; then
    offer "$1" "$req" "$1 from Homebrew" "$BREW install $2"
  elif [ "$OS" = mac ]; then
    note "Homebrew, the installer this script uses on a Mac, is not installed. Install it first with this"
    note "line from https://brew.sh (it asks for your Mac password), then open a new terminal window:"
    note '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    return 1
  else
    note "Install $1 with your system's package manager (or from $4), then run this script again."
    return 1
  fi
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

# fix <name> <install function> <check function>: after a [missing] line, installs unless --check.
fix() {
  if [ "$CHECK" = 1 ]; then MISSING=1; return; fi
  if ! "$2"; then MISSING=1; return; fi
  say "[installed] $1. A new terminal window may be needed before the command is found."
  RECHECK="$RECHECK $3"
}

say "Marketing Team Harness: first-time setup"
say "Folder: $(pwd)"
if [ "$CHECK" = 1 ]; then say "Mode: check only. Nothing is installed or changed."
elif [ "$YES" = 1 ]; then say "Mode: yes to every missing required item. Optional items are skipped."
else say "Mode: one question before each install. Enter means No."; fi
say "No token or password is ever asked for here."

say ""
say "Required"
check_git || fix "Git" install_git check_git
check_node || fix "Node.js" install_node check_node
check_claude; rc=$?
if [ "$rc" -eq 1 ]; then fix "Claude Code" install_claude check_claude
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

if [ -f .env ]; then say "[ok] .env exists (contents never shown)."
elif [ ! -f .env.example ]; then say "[missing] .env.example is missing, so .env cannot be created. Unzip the harness again."; MISSING=1
elif [ "$CHECK" = 1 ]; then say "[missing] .env does not exist yet. Run this script without --check to create it from .env.example."; MISSING=1
elif cp .env.example .env; then
  chmod 600 .env 2>/dev/null
  say "[installed] .env created from .env.example (contents never shown)."
  note "Later the Owner pastes the Meta System User token into .env with a text editor, never into the chat."
else say "[missing] .env could not be created. Copy .env.example to .env by hand."; MISSING=1; fi

say ""
say "Optional"
if [ -f node_modules/playwright-core/package.json ]; then say "[ok] playwright-core is installed (for the still renderer)."
elif [ "$CHECK" = 1 ]; then say "[skipped] playwright-core is not installed (optional: only the still renderer needs it)."
elif [ "$YES" = 1 ]; then say "[skipped] playwright-core is not installed (optional items are skipped under --yes)."
elif ! command -v npm >/dev/null 2>&1; then say "[skipped] playwright-core needs Node.js first (optional: only the still renderer needs it)."
else
  say "[missing] playwright-core is not installed (optional: only the still renderer needs it)."
  if offer "playwright-core" 0 "playwright-core (a few megabytes) from the npm registry into node_modules in this folder" "npm install --no-save --no-package-lock playwright-core"
  then say "[installed] playwright-core."
  else say "[skipped] playwright-core. Install it later with: npm install --no-save --no-package-lock playwright-core"; fi
fi

# The HyperFrames video plugin (Apache-2.0, by HeyGen) ships in this folder, in vendor/hyperframes: the script
# adds that folder as the plugin's marketplace and never adds one from GitHub. The renderer needs Node.js 22
# or newer and FFmpeg; it is fetched from the npm registry (npx hyperframes) the first time a video is made.
HF_DIR="$(pwd)/vendor/hyperframes"
if [ "$OS" = win ] && command -v cygpath >/dev/null 2>&1; then HF_DIR=$(cygpath -m "$HF_DIR"); fi
hf_installed() { claude plugin list 2>/dev/null | grep -qi hyperframes; }
ffmpeg_v() { command -v ffmpeg >/dev/null 2>&1 && ffmpeg -version 2>/dev/null | head -n 1 | sed 's/ Copyright.*//'; }
check_ffmpeg() {   # FFmpeg for the video plugin: reports it, and offers it (optional) unless --check or --yes
  local v; v=$(ffmpeg_v)
  if [ -n "$v" ]; then say "[ok] FFmpeg is installed for the video plugin ($v)."; return 0; fi
  if [ "$CHECK" = 1 ]; then say "[skipped] FFmpeg is not installed (optional: the video plugin needs it to render)."; return 1; fi
  if [ "$YES" = 1 ]; then say "[skipped] FFmpeg is not installed (optional items are skipped under --yes)."; return 1; fi
  say "[missing] FFmpeg is not installed (optional: the video plugin needs it to render)."
  if pkg "FFmpeg" ffmpeg Gyan.FFmpeg https://ffmpeg.org/download.html 0; then
    hash -r; say "[installed] FFmpeg. A new terminal window may be needed before the command is found."; return 0
  fi
  say "[skipped] FFmpeg. The video plugin cannot render until it is installed."; return 1
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
if [ -z "$(claude_v)" ]; then say "[skipped] The HyperFrames video plugin needs Claude Code first (optional: only for silent video ads)."
elif [ "$hf_major" -lt 22 ]; then
  if hf_installed; then say "[ok] The HyperFrames video plugin is installed, but it needs Node.js 22 or newer to render (${hf_node:-none found})."
  else say "[skipped] The HyperFrames video plugin needs Node.js 22 or newer (${hf_node:-none found}; the harness itself needs 20 or newer)."; fi
  note "Install the current Node.js LTS (https://nodejs.org/en/download), then run this script again."
else
  check_ffmpeg
  if hf_installed; then say "[ok] The HyperFrames video plugin is installed."
  elif [ ! -f vendor/hyperframes/.claude-plugin/marketplace.json ]; then
    say "[skipped] The HyperFrames video plugin's files are missing from vendor/hyperframes. Unzip the harness again to get them."
  elif [ "$CHECK" = 1 ]; then say "[skipped] The HyperFrames video plugin is not installed (optional: only for silent video ads)."
  elif [ "$YES" = 1 ]; then say "[skipped] The HyperFrames video plugin is not installed (optional items are skipped under --yes)."
  else
    say "[missing] The HyperFrames video plugin is not installed (optional: only for silent video ads)."
    note "The plugin's files are in this folder (vendor/hyperframes); the renderer itself (npx hyperframes) is fetched from the npm registry the first time a video is made."
    if ask "Install the HyperFrames video plugin now?" 0 && install_hyperframes
    then say "[installed] The HyperFrames video plugin. Start a new Claude Code session so it loads."
    else say "[skipped] The HyperFrames video plugin. Install it later with the two lines in vendor/hyperframes/VENDOR.md."; fi
  fi
fi

if [ -n "$RECHECK" ]; then
  say ""
  say "Checking again what this run installed"
  hash -r; again=0
  for c in $RECHECK; do "$c" || again=1; done
  if [ "$again" = 1 ]; then MISSING=1; note "Not found yet: open a new terminal window in this folder and run this script again."; fi
fi

say ""
say "What remains"
if [ "$MISSING" = 1 ]; then
  if [ "$CHECK" = 1 ]; then say "  First: run this script without --check to install what is marked [missing] above."
  else say "  First: install what is marked [missing] above (run this script again, or install it by hand)."; fi
fi
say "  1. Open this folder in Claude Code: type claude in this folder (or open the folder in the Claude desktop app)."
say "  2. Claude Code asks you to approve the two servers in .mcp.json (meta-ads and fal): approve them."
say "  3. In Claude Code type /mcp, pick meta-ads and log in, in the browser where the Owner is signed in to Facebook."
say "     Then pick fal and log in (optional: paid pictures). Start a new session afterwards so the tools load."
say "  4. Type /setup and answer the wizard."
say "  5. The Owner's Meta console steps are listed by the wizard and in docs/meta-setup-guide.md."
say ""
if [ "$MISSING" = 1 ]; then say "Result: something required is still missing (marked [missing] above)."; exit 1; fi
say "Result: everything required is in place."
exit 0
