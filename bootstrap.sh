#!/usr/bin/env bash
# bootstrap.sh: the first command for a new copy of the Marketing Team Harness, for macOS. It also runs in
# Git Bash on Windows and on Linux; on Windows, bootstrap.ps1 does the same steps in PowerShell.
# Run it from the harness folder (the one that contains CLAUDE.md and .mcp.json):
#   bash bootstrap.sh            check everything, list what is missing, then one question installs all of it
#   bash bootstrap.sh --ask      ask per item: one y/N question before each install
#   bash bootstrap.sh --yes      install everything that is missing, with no question at all
#   bash bootstrap.sh --check    report only: no questions, no installs
#   bash bootstrap.sh --help     show the usage
# The one install takes every missing item, required, recommended and optional alike (on a Mac without it,
# Homebrew first; then Git, Node.js, Claude Code, the Claude desktop app, Google Chrome, playwright-core, Obsidian
# for the memory vault, the Node.js LTS upgrade the video plugin needs when Node.js is 20 or 21, FFmpeg, the
# HyperFrames video plugin from vendor/hyperframes), copies .env.example to .env (mode 600), sets Obsidian up for
# the vault (memory/tools/obsidian-setup.mjs: the vault is registered, the command line interface is on, the app
# opens; no click) and opens the setup progress page. After each install this window's PATH is extended with the
# folders installers write to, so a Node.js installed by this run is used by the later steps of the same run.
# Each installer (winget, brew install and upgrade, the Claude Code installer, npm, claude plugin install) runs
# under a 20-minute bound: past it the install is stopped (its process group is killed), reported, and the run
# goes on. The Homebrew installer runs in the foreground without the bound: it asks for the Mac password.
# The harness files listed in docs/release-manifest.txt are checked for presence (no hashing) at the end of
# Required; company-written areas (config/, plans/, the memory notes) are not counted.
# Every copy is a new business: memory/tools/instance.mjs compares the instance marker (.harness-instance.json)
# with this folder and computer; a new copy (no marker, or one from another folder or computer) is reset with no
# question (--check only reports it): another company's files are moved to .previous-company/<stamp>/ (nothing
# is deleted), the blank templates of templates/company/ come back, .env is recreated from .env.example.
# Every run writes bootstrap.log in this folder (overwritten per run: the mode, the date and every line this
# script prints, never the contents of .env) and dashboard/bootstrap-result.json (the mode, the exit code and
# each item's tag and version), --check included.
# Enter at its question means Yes; Enter at an --ask question means No.
# Tags: [ok] already there, [installed] put in place by this run, [missing] not there, [skipped] an optional
# item left out, [todo] a step a later command does. Exit codes: 0 everything required is present, 1 something
# required is missing or the install was declined, 2 wrong folder or unknown option. It never asks for, reads
# or prints a token: .env is only copied from .env.example.
set -u

MODE=all; CHECK=0; YES=0; ASKEACH=0; MISSING=0; RECHECK=""; AGREED=0; RECO_MISSING=""; TIMED_OUT=0
PLAN=""; ENV_TODO=0; PAGE_TODO=0; GO=0; DECLINED=0; NOANSWER=0; ANSWER=""
LOG=""; CUR=""; BOUND=1200; BREW_TRIED=0; LIVE_ON=0; LIVE_STARTED=""; LIVE_CUR=""; PAGE_OPENED=0
WINGET_FLAGS="-e --source winget --accept-package-agreements --accept-source-agreements"
# The items of dashboard/bootstrap-result.json, each with the tag of the last line printed for it.
ITEM_KEYS="git node claude env manifest app chrome playwright obsidian node_upgrade ffmpeg hyperframes obsidian_setup routines instance"

out() { printf '%s\n' "$*"; }   # a function's value (never logged)
mark() {   # mark <status>: the status of the current item; a re-check's [ok] keeps an [installed]
  local prev
  [ -n "$CUR" ] || return 0
  eval "prev=\${S_$CUR:-}"
  if [ "$1" = ok ] && [ "$prev" = installed ]; then return 0; fi
  eval "S_$CUR=\$1"
  write_live
}
set_status()  { eval "S_$1=\$2"; write_live; }
set_version() { [ -n "$2" ] && eval "V_$1=\$2"; return 0; }
cur() { CUR=$1; }
say() {
  printf '%s\n' "$*"
  if [ -n "$LOG" ]; then printf '%s\n' "$*" >> "$LOG" 2>/dev/null; fi
  case "$*" in
    "[ok] "*) mark ok ;;  "[installed] "*) mark installed ;;  "[missing] "*) mark missing ;;
    "[skipped] "*) mark skipped ;;  "[todo] "*) mark todo ;;
  esac
  return 0
}
note() {
  printf '        %s\n' "$*"
  if [ -n "$LOG" ]; then printf '        %s\n' "$*" >> "$LOG" 2>/dev/null; fi
  return 0
}
log_only() { if [ -n "$LOG" ]; then printf '%s\n' "$*" >> "$LOG" 2>/dev/null; fi; return 0; }
capital() { local f; f=$(printf '%s' "${1:0:1}" | tr '[:lower:]' '[:upper:]'); printf '%s%s' "$f" "${1:1}"; }
major() { local m=${1#v}; m=${m%%.*}; case "$m" in ''|*[!0-9]*) m=0 ;; esac; out "$m"; }
iso_now() { date +%Y-%m-%dT%H:%M:%S%z | sed 's/\([+-][0-9][0-9]\)\([0-9][0-9]\)$/\1:\2/'; }
json_text() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr -d '\000-\037'; }
run_mode() { if [ "$MODE" = all ] && [ "$YES" = 1 ]; then out yes; else out "$MODE"; fi; }
write_result() {   # write_result <exit code>: dashboard/bootstrap-result.json, written by hand (Node.js may be what is missing)
  local k s v sep=""
  mkdir -p dashboard 2>/dev/null
  {
    printf '{\n  "ran": "%s",\n  "mode": "%s",\n  "script": "bootstrap.sh",\n  "exit": %s,\n  "items": {\n' "$(iso_now)" "$(run_mode)" "$1"
    for k in $ITEM_KEYS; do
      eval "s=\${S_$k:-skipped}; v=\${V_$k:-}"
      printf '%s    "%s": {"status": "%s", "version": "%s"}' "$sep" "$k" "$s" "$(json_text "$v")"
      sep=$(printf ',\n_'); sep=${sep%_}
    done
    printf '\n  }\n}\n'
  } > dashboard/bootstrap-result.json 2>/dev/null || printf '%s\n' "dashboard/bootstrap-result.json could not be written."
}
# The setup wizard (dashboard/setup.html, a static page shipped with the harness) reads dashboard/setup-live.js every
# 2 seconds: each item's status, the item being installed, and whether the run is still going. It is written by
# hand after every step (Node.js may be what is missing), atomically (a temp file, then a rename); --check writes
# none and opens nothing.
write_live() {
  [ "$LIVE_ON" = 1 ] || return 0
  local k s sep="" running=true
  [ "${1:-}" = done ] && running=false
  {
    printf 'window.SETUP_LIVE = {"started": "%s", "updated": "%s", "script": "bootstrap.sh", "mode": "%s", "running": %s, "current": "%s", "items": {' \
      "$LIVE_STARTED" "$(iso_now)" "$(run_mode)" "$running" "$LIVE_CUR"
    for k in $ITEM_KEYS; do eval "s=\${S_$k:-pending}"; printf '%s"%s": "%s"' "$sep" "$k" "$s"; sep=', '; done
    printf '}};\n'
  } > dashboard/setup-live.js.tmp 2>/dev/null && mv -f dashboard/setup-live.js.tmp dashboard/setup-live.js 2>/dev/null
  return 0
}
doing() { cur "$1"; LIVE_CUR=$1; write_live; }   # doing <item>: the wizard shows it as being installed now
open_wizard() {   # the wizard in the default browser; 0 when the browser was started
  local f
  [ -f dashboard/setup.html ] || return 1
  [ -n "${HARNESS_NO_BROWSER:-}" ] && return 1   # tests: never start a browser
  f="$(pwd)/dashboard/setup.html"
  case "$OS" in
    win) cmd.exe //c start "" "$(cygpath -w "$f" 2>/dev/null || printf '%s' "$f")" >/dev/null 2>&1 ;;
    mac) open "$f" >/dev/null 2>&1 ;;
    *) command -v xdg-open >/dev/null 2>&1 || return 1; xdg-open "$f" >/dev/null 2>&1 & ;;
  esac
}
finish() { write_result "$1"; LIVE_CUR=""; write_live done; exit "$1"; }
usage() {
  say "Usage: bash bootstrap.sh [--ask | --yes | --check] [--help]"
  say "  (no option)  check, list what is missing, then one question installs all of it (Enter means Yes)"
  say "  --ask        ask per item: one y/N question before each install (Enter means No)"
  say "  --yes        install everything that is missing, required and optional, with no question"
  say "  --check      report only: no questions, no installs (it writes only bootstrap.log and dashboard/bootstrap-result.json)"
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
[ "$OS" = mac ] && ITEM_KEYS="brew $ITEM_KEYS"

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
# bootstrap.log: overwritten per run; the mode, the date, then every line say and note print.
LOG="$(pwd)/bootstrap.log"
printf 'bootstrap.sh, mode %s, %s\n' "$(run_mode)" "$(iso_now)" > "$LOG" 2>/dev/null || LOG=""

# answer: reads one typed line into ANSWER, spaces taken out; returns 1 when nothing could be read (the input
# is closed). When the input is not a terminal, the line is printed after the question so the console shows it.
# The log gets the decision (yes or no), never the typing.
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
  case "$ANSWER" in
    [yY]|[yY][eE][sS]) log_only "        $1 [y/N]: yes"; return 0 ;;
    *) log_only "        $1 [y/N]: no"; return 1 ;;
  esac
}

# confirm <question>: the one question of a default run; returns 0 for yes. Enter means Yes; no answer at all
# (the input is closed) means No and sets NOANSWER=1.
confirm() {
  printf '%s [Y/n]: ' "$1"
  if ! answer; then NOANSWER=1; log_only "$1 [Y/n]: (no answer)"; return 1; fi
  case "$ANSWER" in
    ''|[yY]|[yY][eE][sS]) log_only "$1 [Y/n]: yes"; return 0 ;;
    *) log_only "$1 [Y/n]: no"; return 1 ;;
  esac
}

# path_refresh: adds to this window's PATH the folders installers write to (nothing is removed): on a Mac
# Homebrew's /opt/homebrew/bin and /usr/local/bin; in Git Bash on Windows the Machine and User PATH as Windows
# has them now; everywhere $HOME/.local/bin (Claude Code). Then hash -r, so the shell looks commands up again.
path_add() { case ":$PATH:" in *":$1:"*) ;; *) [ -d "$1" ] && PATH="$PATH:$1" ;; esac; return 0; }
path_refresh() {
  local winp d old_ifs
  case "$OS" in
    mac) path_add /opt/homebrew/bin; path_add /usr/local/bin ;;
    win) if command -v powershell.exe >/dev/null 2>&1 && command -v cygpath >/dev/null 2>&1; then
           winp=$(powershell.exe -NoProfile -Command "[Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')" 2>/dev/null | tr -d '\r')
           old_ifs=$IFS; IFS=';'; set -f
           for d in $winp; do [ -n "$d" ] && path_add "$(cygpath -u "$d" 2>/dev/null)"; done
           set +f; IFS=$old_ifs
         fi ;;
  esac
  path_add "$HOME/.local/bin"
  export PATH; hash -r
}

# run_bounded <command line>: runs one installer with no keyboard input under the 20-minute bound; returns its
# exit code, or 124 (TIMED_OUT=1) when the bound stopped it. GNU timeout (or gtimeout) where it exists, which
# kills the command's process group; otherwise the command runs in its own process group and a watchdog
# kills that group at the deadline.
run_bounded() {
  local tmo="" rc pid waited=0
  TIMED_OUT=0
  if command -v timeout >/dev/null 2>&1; then tmo=timeout; elif command -v gtimeout >/dev/null 2>&1; then tmo=gtimeout; fi
  if [ -n "$tmo" ]; then
    "$tmo" -k 10 "$BOUND" bash -c "set -o pipefail; $1" </dev/null; rc=$?
    if [ "$rc" -eq 124 ] || [ "$rc" -eq 137 ]; then TIMED_OUT=1; fi
    return "$rc"
  fi
  set -m 2>/dev/null
  bash -c "set -o pipefail; $1" </dev/null &
  pid=$!
  set +m 2>/dev/null
  while kill -0 "$pid" 2>/dev/null; do
    if [ "$waited" -ge "$BOUND" ]; then
      kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null
      sleep 5
      kill -KILL -- "-$pid" 2>/dev/null; kill -KILL "$pid" 2>/dev/null
      wait "$pid" 2>/dev/null
      TIMED_OUT=1; return 124
    fi
    sleep 1; waited=$((waited + 1))
  done
  wait "$pid"
}

# offer <name> <1 = required> <what it downloads> <command>: runs one install. Under --ask it first states the
# download and asks; in the one-question install (a default run after its yes, or --yes) it runs at once, the
# plan having named the source. Sets AGREED=1 when the install goes ahead and TIMED_OUT=1 (with its [missing]
# or [skipped] line) when the 20-minute bound stopped it; returns 0 when the command succeeded.
offer() {
  AGREED=0; TIMED_OUT=0
  if [ "$MODE" = ask ]; then
    note "This downloads $3."
    if ! ask "Install $1 now?"; then
      [ "$2" = 1 ] && note "Not installed. Run this script again when you are ready."
      return 1
    fi
  fi
  AGREED=1; note "Running: $4"
  run_bounded "$4"; local rc=$?
  path_refresh
  if [ "$TIMED_OUT" = 1 ]; then
    if [ "$2" = 1 ]; then say "[missing] $(capital "$1"): the install took longer than 20 minutes and was stopped; run this script again."
    else say "[skipped] $(capital "$1"): the install took longer than 20 minutes and was stopped; run this script again."; fi
    return "$rc"
  fi
  [ "$rc" -eq 0 ] || note "The install did not finish (exit code $rc)."
  return "$rc"
}

BREW=""; command -v brew >/dev/null 2>&1 && BREW=brew
for b in /opt/homebrew/bin/brew /usr/local/bin/brew /home/linuxbrew/.linuxbrew/bin/brew; do
  [ -z "$BREW" ] && [ -x "$b" ] && BREW="$b"; done
in_plan() { case " $PLAN " in *" $1 "*) return 0 ;; esac; return 1; }

# pkg_from: where pkg installs from on this machine, in the plan's words; nothing when it has no installer here.
# On a Mac where Homebrew is planned (and not yet tried), Homebrew counts.
pkg_from() {
  if [ "$OS" = win ]; then
    if command -v winget >/dev/null 2>&1; then out "the winget catalogue (the Windows Package Manager)"; fi
  elif [ -n "$BREW" ]; then out "Homebrew"
  elif [ "$OS" = mac ] && in_plan brew && [ "$BREW_TRIED" = 0 ]; then out "Homebrew"; fi
}
# pkg_hint <name> <download page>: what to do instead when pkg has no installer here.
pkg_hint() {
  if [ "$OS" = win ]; then
    note "winget (the Windows Package Manager) was not found. Get App Installer from the Microsoft Store:"
    note "https://apps.microsoft.com/detail/9NBLGGH4NNS1 , or download $1 from $2"
  elif [ "$OS" = mac ]; then
    note "Homebrew, the installer this script uses on a Mac, is not installed. Run this script again without"
    note "--check and it installs Homebrew first, or install it with this line from https://brew.sh:"
    note '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  else
    note "Install $1 with your system's package manager (or from $2), then run this script again."
  fi
}
# pkg <name> <Homebrew formula> <winget id> <download page> [<1 = required (the default), 0 = optional>]:
# installs with winget (Windows) or Homebrew.
pkg() {
  local from; from=$(pkg_from); TIMED_OUT=0
  if [ -z "$from" ] || { [ "$OS" != win ] && [ -z "$BREW" ]; }; then pkg_hint "$1" "$4"; return 1; fi
  if [ "$OS" = win ]; then offer "$1" "${5:-1}" "$1 from $from" "winget install --id $3 $WINGET_FLAGS"
  else offer "$1" "${5:-1}" "$1 from $from" "$BREW install $2"; fi
}

# Homebrew on a Mac that lacks it: the official installer from https://brew.sh, in the foreground with the
# keyboard (it asks for the Mac password and for Return itself), without the 20-minute bound. Afterwards
# brew shellenv sets BREW and PATH for the rest of this run.
BREW_URL=https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh
do_brew() {
  local b rc=1
  AGREED=0; BREW_TRIED=1; cur brew
  if [ "$MODE" = ask ]; then
    note "This downloads Homebrew from https://brew.sh; its installer asks for your Mac password itself, in this window."
    if ! ask "Install Homebrew now?"; then note "Not installed. Run this script again when you are ready."; return 1; fi
  fi
  AGREED=1
  note "Running: /bin/bash -c \"\$(curl -fsSL $BREW_URL)\""
  note "It runs in this window without the 20-minute bound: type your Mac password when it asks (nothing shows while you type), and press Return when it asks."
  if [ -t 0 ]; then /bin/bash -c "$(curl -fsSL "$BREW_URL")"; rc=$?
  elif [ -r /dev/tty ]; then /bin/bash -c "$(curl -fsSL "$BREW_URL")" </dev/tty; rc=$?
  else note "This window has no keyboard input, so the Homebrew installer cannot ask for the password."; fi
  for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    if [ -x "$b" ]; then eval "$("$b" shellenv)"; BREW="$b"; break; fi
  done
  hash -r
  if [ -n "$BREW" ]; then say "[installed] Homebrew ($BREW)."; return 0; fi
  [ "$rc" -eq 0 ] || note "The install did not finish (exit code $rc)."
  note "Without Homebrew this script cannot install Git, Node.js and the other tools on this Mac."
  return 1
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
  local v; cur git; v=$(git_v); set_version git "$v"
  if [ -n "$v" ]; then say "[ok] Git is installed ($v)."; return 0; fi
  say "[missing] Git is not installed."; return 1
}
check_node() {
  local v m; cur node; v=$(node_v); m=$(major "$v"); set_version node "$v"
  if [ "$m" -ge 20 ]; then say "[ok] Node.js $v is installed (20 or newer is needed)."; return 0; fi
  if [ -n "$v" ]; then say "[missing] Node.js $v is too old (20 or newer is needed)."
  else say "[missing] Node.js is not installed (20 or newer is needed)."; fi
  return 1
}
check_claude() {   # 0 ok, 1 not installed, 2 installed but its folder is not on PATH
  local v; cur claude; v=$(claude_v); set_version claude "$v"
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
  local rc
  if [ "$OS" = win ]; then
    offer "Claude Code" 1 "Claude Code from claude.ai (the official installer)" \
      'powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://claude.ai/install.ps1 | iex"'
  else
    offer "Claude Code" 1 "Claude Code from claude.ai (the official installer)" "curl -fsSL https://claude.ai/install.sh | bash"
  fi
  rc=$?; hash -r
  [ "$TIMED_OUT" = 1 ] && return 1
  if [ "$rc" -eq 0 ] && { [ -n "$(claude_v)" ] || claude_file; }; then return 0; fi
  [ "$AGREED" = 1 ] || return 1
  note "The official installer did not work; trying the npm route instead."
  if ! command -v npm >/dev/null 2>&1; then note "npm was not found: install Node.js first, then run this script again."; return 1; fi
  note "This downloads Claude Code from the npm registry."
  note "Running: npm install -g @anthropic-ai/claude-code"
  run_bounded "npm install -g @anthropic-ai/claude-code"; rc=$?
  path_refresh
  if [ "$TIMED_OUT" = 1 ]; then say "[missing] Claude Code: the install took longer than 20 minutes and was stopped; run this script again."; return 1; fi
  return "$rc"
}

# put <name> <install function> <check function>: installs one required item: [installed] and a re-check
# at the end when it worked, otherwise it stays missing.
put() {
  cur "${3#check_}"
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

say "Marketing Team Harness: first-time setup"
say "Folder: $(pwd)"
if [ "$MODE" = check ]; then say "Mode: check only. Nothing is installed; only bootstrap.log and dashboard/bootstrap-result.json are written."
elif [ "$MODE" = ask ]; then say "Mode: one question before each install. Enter means No."
elif [ "$YES" = 1 ]; then say "Mode: check everything, then install all that is missing, with no question (--yes)."
else say "Mode: check everything, then one question installs all that is missing. Enter means Yes."; fi
say "No token or password is ever asked for here."
# The setup wizard opens now, before the first check, and ticks every step of this run as it lands.
if [ "$MODE" != check ] && [ -f dashboard/setup.html ]; then
  mkdir -p dashboard 2>/dev/null; LIVE_ON=1; LIVE_STARTED=$(iso_now); write_live
  if open_wizard; then PAGE_OPENED=1; say "The setup wizard opened in your browser (dashboard/setup.html): it ticks every step as it happens."
  else say "Open dashboard/setup.html in a browser to watch every step tick as it happens."; fi
fi

say ""
say "Required"
if [ "$OS" = mac ]; then
  cur brew
  if [ -n "$BREW" ]; then say "[ok] Homebrew is installed ($BREW): the installer this script uses on a Mac."
  else
    say "[missing] Homebrew is not installed (the installer this script uses on a Mac, from https://brew.sh)."
    case "$MODE" in
      check) MISSING=1 ;;
      ask) do_brew || MISSING=1 ;;
      *) PLAN="$PLAN brew" ;;
    esac
  fi
fi
check_git || need git "Git" install_git check_git https://git-scm.com/downloads
check_node || need node "Node.js" install_node check_node https://nodejs.org/en/download
check_claude; rc=$?
if [ "$rc" -eq 1 ]; then need claude "Claude Code" install_claude check_claude
elif [ "$rc" -eq 2 ]; then MISSING=1; fi

copy_env() {   # copies .env.example to .env; an .env that exists by now is left as it is
  cur env
  if [ -f .env ]; then say "[ok] .env exists (contents never shown)."; return; fi
  if cp .env.example .env; then
    chmod 600 .env 2>/dev/null
    say "[installed] .env created from .env.example (contents never shown)."
    note "Later the Owner pastes the Meta System User token into .env with a text editor, never into the chat."
  else say "[missing] .env could not be created. Copy .env.example to .env by hand."; MISSING=1; fi
}
cur env
if [ -f .env ]; then say "[ok] .env exists (contents never shown)."
elif [ ! -f .env.example ]; then say "[missing] .env.example is missing, so .env cannot be created. Unzip the harness again."; MISSING=1
elif [ "$MODE" = check ]; then say "[missing] .env does not exist yet. Run this script without --check to create it from .env.example."; MISSING=1
elif [ "$MODE" = ask ]; then copy_env
else say "[missing] .env does not exist yet."; ENV_TODO=1; fi

# The harness files: every path of docs/release-manifest.txt under the harness's own areas must exist (presence
# only, no hashing). Company-written areas (config/, plans/, memory notes such as memory/business/ and
# memory/HOME.en.md) are rewritten or deleted by the wizard, so they are not counted.
check_manifest() {
  local mf=docs/release-manifest.txt line p n=0 k=0 first=""
  cur manifest
  if [ ! -f "$mf" ]; then say "[skipped] The harness file list (docs/release-manifest.txt) is not in this folder, so the files were not counted."; return 0; fi
  while IFS= read -r line || [ -n "$line" ]; do
    line=${line%$'\r'}
    case "$line" in *" "*) ;; *) continue ;; esac
    p=${line#* }; p=${p# }; p=${p#\*}
    case "$p" in
      .claude/*|creatives/tools/*|creatives/landing-template/*|creatives/preview-template/*|dashboard/*|docs/*) ;;
      memory/tools/*|memory/templates/*|vendor/*|control-room/*) ;;
      CLAUDE.md|.mcp.json|.env.example|bootstrap.ps1|bootstrap.sh|ONBOARDING.md|README.md) ;;
      *) continue ;;
    esac
    n=$((n + 1))
    if [ ! -e "$p" ]; then k=$((k + 1)); [ -n "$first" ] || first=$p; fi
  done < "$mf"
  if [ "$k" -eq 0 ]; then say "[ok] The harness files are complete ($n files checked)."; return 0; fi
  say "[missing] $k of the harness files are missing (first: $first). Unzip the harness again."
  MISSING=1
}
check_manifest

# Recommended: the Claude desktop app and Google Chrome. The app's Code tab is where the harness runs (it carries
# its own copy of Claude Code; the scheduled memory routines, Remote Control and the pairing with the Claude in
# Chrome extension live there). The extension is the harness's hands in the Owner's own browser during /connect,
# and it runs in Chrome (or in Microsoft Edge; the guided setup and its video use Chrome, so Chrome is planned only
# when neither browser is present). Installed with the Homebrew casks
# (claude, google-chrome) on a Mac and winget (Anthropic.Claude, Google.Chrome) on Windows; on Linux the app comes
# from Anthropic's apt package (claude-desktop) and the script only points to it. Neither item fails the run.
say ""
say "Recommended"
CLAUDE_APP_PAGE=https://claude.ai/download
CHROME_PAGE=https://www.google.com/chrome/
winpath_u() { cygpath -u "$1" 2>/dev/null || printf '%s' "$1"; }
claude_app_path() {   # where the desktop app is (printed), or nothing
  local p
  case "$OS" in
    mac) for p in /Applications/Claude.app "$HOME/Applications/Claude.app"; do
           [ -d "$p" ] && { out "$p"; return 0; }; done ;;
    win) for p in "${LOCALAPPDATA:+$(winpath_u "$LOCALAPPDATA")/Microsoft/WindowsApps/claude-desktop.exe}" \
                  "${LOCALAPPDATA:+$(winpath_u "$LOCALAPPDATA")/AnthropicClaude/claude.exe}" \
                  "${LOCALAPPDATA:+$(winpath_u "$LOCALAPPDATA")/Programs/Claude/Claude.exe}" \
                  "${PROGRAMFILES:+$(winpath_u "$PROGRAMFILES")/Claude/Claude.exe}"; do
           [ -n "$p" ] && [ -f "$p" ] && { out "$p"; return 0; }; done
         if command -v powershell.exe >/dev/null 2>&1 && powershell.exe -NoProfile -Command 'if (Get-AppxPackage -Name Claude -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }' >/dev/null 2>&1; then
           out "the Microsoft Store build"; return 0; fi ;;
    *) p=$(command -v claude-desktop 2>/dev/null) && { out "$p"; return 0; } ;;
  esac
  return 1
}
chrome_path() {   # Google Chrome (printed), or nothing
  local p base
  case "$OS" in
    mac) [ -d "/Applications/Google Chrome.app" ] && { out "/Applications/Google Chrome.app"; return 0; } ;;
    win) for base in "${PROGRAMFILES:-}" "$(printenv 'ProgramFiles(x86)')" "${LOCALAPPDATA:-}"; do
           [ -n "$base" ] || continue
           base=$(winpath_u "$base")
           [ -f "$base/Google/Chrome/Application/chrome.exe" ] && { out "$base/Google/Chrome/Application/chrome.exe"; return 0; }
         done ;;
    *) for p in google-chrome google-chrome-stable; do
         command -v "$p" >/dev/null 2>&1 && { out "$p"; return 0; }; done ;;
  esac
  return 1
}
edge_found() {   # true when Microsoft Edge is installed
  local base
  case "$OS" in
    mac) [ -d "/Applications/Microsoft Edge.app" ] ;;
    win) for base in "${PROGRAMFILES:-}" "$(printenv 'ProgramFiles(x86)')"; do
           [ -n "$base" ] && [ -f "$(winpath_u "$base")/Microsoft/Edge/Application/msedge.exe" ] && return 0; done; return 1 ;;
    *) command -v microsoft-edge >/dev/null 2>&1 || command -v microsoft-edge-stable >/dev/null 2>&1 ;;
  esac
}
app_from() { if [ "$OS" = win ] || [ "$OS" = mac ]; then pkg_from; fi; }   # nothing on Linux: apt, by hand
app_hint() {   # what to do instead when this script cannot install the app here
  if [ "$OS" = linux ]; then
    note "Install it from Anthropic's apt repository: sudo apt install claude-desktop (the steps are at https://code.claude.com/docs/en/desktop-linux),"
    note "or run the harness from a terminal: type claude in this folder."
  else pkg_hint "the Claude desktop app" "$CLAUDE_APP_PAGE"; fi
}
cask_pkg() {   # cask_pkg <name> <Homebrew cask> <winget id>: installs with winget (Windows) or a Homebrew cask (Mac)
  local from; from=$(app_from); TIMED_OUT=0
  [ -n "$from" ] || return 1
  if [ "$OS" = win ]; then offer "$1" 0 "$1 from $from" "winget install --id $3 $WINGET_FLAGS"
  elif [ -n "$BREW" ]; then offer "$1" 0 "$1 from $from" "$BREW install --cask $2"
  else return 1; fi
}
do_claude_app() {   # installs the desktop app (after its question under --ask)
  local p; cur app
  if [ -z "$(app_from)" ]; then
    app_hint
    say "[skipped] The Claude desktop app. Install it later; the harness also runs from a terminal."; return 1
  fi
  if cask_pkg "the Claude desktop app" claude Anthropic.Claude; then
    p=$(claude_app_path)
    if [ -n "$p" ]; then say "[installed] The Claude desktop app ($p)."
    else say "[installed] The Claude desktop app. Open it, sign in, and click the Code tab."; fi
    return 0
  fi
  [ "$TIMED_OUT" = 1 ] || say "[skipped] The Claude desktop app. Install it later from $CLAUDE_APP_PAGE"; return 1
}
do_chrome() {   # installs Google Chrome (after its question under --ask)
  local p; cur chrome
  if [ -z "$(app_from)" ]; then
    pkg_hint "Google Chrome" "$CHROME_PAGE"
    say "[skipped] Google Chrome. Install it later from $CHROME_PAGE"; return 1
  fi
  if cask_pkg "Google Chrome" google-chrome Google.Chrome; then
    p=$(chrome_path)
    if [ -n "$p" ]; then say "[installed] Google Chrome ($p)."
    else say "[installed] Google Chrome. A new terminal window may be needed before this script finds it."; fi
    return 0
  fi
  [ "$TIMED_OUT" = 1 ] || say "[skipped] Google Chrome. Install it later from $CHROME_PAGE"; return 1
}
cur app
APP_WHY="recommended: its Code tab is where the harness runs, with the memory routines and the Claude in Chrome pairing"
app_path=$(claude_app_path)
if [ -n "$app_path" ]; then say "[ok] The Claude desktop app is installed ($app_path)."
elif [ "$MODE" = check ]; then say "[missing] The Claude desktop app is not installed ($APP_WHY). Run this script without --check to install it."; RECO_MISSING="$RECO_MISSING app"
elif [ "$MODE" = all ] && [ -z "$(app_from)" ]; then
  say "[missing] The Claude desktop app is not installed ($APP_WHY)."
  app_hint; RECO_MISSING="$RECO_MISSING app"
else
  say "[missing] The Claude desktop app is not installed ($APP_WHY)."
  if [ "$MODE" = all ]; then PLAN="$PLAN app"; else do_claude_app; fi
fi
cur chrome
chrome_now=$(chrome_path)
if [ -n "$chrome_now" ]; then say "[ok] Google Chrome is installed ($chrome_now): for the Claude in Chrome extension and the ad screenshots."
elif edge_found; then
  say "[skipped] Google Chrome is not installed; Microsoft Edge was found, and the Claude in Chrome extension runs in Edge too."
  if [ "$OS" = win ]; then note "The guided setup and its video use Chrome. To add it: winget install --id Google.Chrome $WINGET_FLAGS (or $CHROME_PAGE)"
  elif [ "$OS" = mac ]; then note "The guided setup and its video use Chrome. To add it: brew install --cask google-chrome (or $CHROME_PAGE)"
  else note "The guided setup and its video use Chrome. To add it: $CHROME_PAGE"; fi
else
  CHROME_WHY="recommended: the Claude in Chrome extension that /connect uses and the ad screenshots need a browser, and neither Chrome nor Edge was found"
  if [ "$MODE" = check ]; then say "[missing] Google Chrome is not installed ($CHROME_WHY). Run this script without --check to install it."; RECO_MISSING="$RECO_MISSING chrome"
  elif [ "$MODE" = all ] && [ -z "$(app_from)" ]; then
    say "[missing] Google Chrome is not installed ($CHROME_WHY)."
    pkg_hint "Google Chrome" "$CHROME_PAGE"; RECO_MISSING="$RECO_MISSING chrome"
  else
    say "[missing] Google Chrome is not installed ($CHROME_WHY)."
    if [ "$MODE" = all ]; then PLAN="$PLAN chrome"; else do_chrome; fi
  fi
fi

say ""
say "Optional"
do_playwright() {   # installs playwright-core into node_modules here (after its question under --ask)
  cur playwright
  if offer "playwright-core" 0 "playwright-core (a few megabytes) from the npm registry into node_modules in this folder" "npm install --no-save --no-package-lock playwright-core"
  then say "[installed] playwright-core."
  elif [ "$TIMED_OUT" = 0 ]; then say "[skipped] playwright-core. Install it later with: npm install --no-save --no-package-lock playwright-core"; fi
}
cur playwright
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
obsidian_path() {   # the Obsidian app found (printed), or nothing
  local p
  case "$OS" in
    mac) for p in /Applications/Obsidian.app "$HOME/Applications/Obsidian.app"; do
           [ -d "$p" ] && { out "$p"; return 0; }; done ;;
    win) for p in "${LOCALAPPDATA:+$(winpath_u "$LOCALAPPDATA")/Programs/Obsidian/Obsidian.exe}" \
                  "${PROGRAMFILES:+$(winpath_u "$PROGRAMFILES")/Obsidian/Obsidian.exe}"; do
           [ -n "$p" ] && [ -f "$p" ] && { out "$p"; return 0; }; done ;;
    *) p=$(command -v obsidian 2>/dev/null) && { out "$p"; return 0; }
       for p in /snap/bin/obsidian /var/lib/flatpak/exports/bin/md.obsidian.Obsidian \
                "$HOME/.local/share/flatpak/exports/bin/md.obsidian.Obsidian"; do
         [ -x "$p" ] && { out "$p"; return 0; }; done ;;
  esac
  return 1
}
obsidian_from() { if [ "$OS" = win ] || [ "$OS" = mac ]; then pkg_from; fi; }   # nothing on Linux: no cask there
obsidian_cmd() {
  if [ "$OS" = win ]; then out "winget install --id Obsidian.Obsidian $WINGET_FLAGS"
  else out "${BREW:-brew} install --cask obsidian"; fi
}
do_obsidian() {   # installs Obsidian (after its question under --ask)
  local from p; cur obsidian; from=$(obsidian_from); TIMED_OUT=0
  if [ -z "$from" ] || { [ "$OS" = mac ] && [ -z "$BREW" ]; }; then
    pkg_hint "Obsidian" "$OBSIDIAN_PAGE"
    say "[skipped] Obsidian. Install it later; the vault notes are plain Markdown files and work without it."; return 1
  fi
  if offer "Obsidian" 0 "Obsidian (free, also for commercial use) from $from" "$(obsidian_cmd)"; then
    p=$(obsidian_path)
    if [ -n "$p" ]; then say "[installed] Obsidian ($p)."
    else say "[installed] Obsidian. A new terminal window may be needed before this script finds it."; fi
    return 0
  fi
  [ "$TIMED_OUT" = 1 ] || say "[skipped] Obsidian. Install it later with: $(obsidian_cmd) (or from $OBSIDIAN_PAGE)"; return 1
}
cur obsidian
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
# With Node.js 20 or 21 (enough for the harness) the Node.js LTS upgrade is an optional item before it: winget
# on Windows (it upgrades its own install and installs the LTS over a foreign one), Homebrew on a Mac.
HF_DIR="$(pwd)/vendor/hyperframes"
if [ "$OS" = win ] && command -v cygpath >/dev/null 2>&1; then HF_DIR=$(cygpath -m "$HF_DIR"); fi
hf_installed() { claude plugin list 2>/dev/null | grep -qi hyperframes; }
ffmpeg_v() { command -v ffmpeg >/dev/null 2>&1 && ffmpeg -version 2>/dev/null | head -n 1 | sed 's/ Copyright.*//'; }
do_ffmpeg() {   # installs FFmpeg (after its question under --ask)
  cur ffmpeg
  if pkg "FFmpeg" ffmpeg Gyan.FFmpeg https://ffmpeg.org/download.html 0; then
    hash -r; set_version ffmpeg "$(ffmpeg_v)"
    say "[installed] FFmpeg. A new terminal window may be needed before the command is found."; return 0
  fi
  [ "$TIMED_OUT" = 1 ] || say "[skipped] FFmpeg. The video plugin cannot render until it is installed."; return 1
}
check_ffmpeg() {   # FFmpeg for the video plugin: reports it; --ask offers it, the one-question install plans it
  local v; cur ffmpeg; v=$(ffmpeg_v); set_version ffmpeg "$v"
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
node_up_cmd() {
  if [ "$OS" = win ]; then out "winget install --id OpenJS.NodeJS.LTS $WINGET_FLAGS"
  else out "${BREW:-brew} upgrade node || ${BREW:-brew} install node"; fi
}
do_node_upgrade() {   # the Node.js LTS upgrade for the video plugin (after its question under --ask)
  local v m p; cur node_upgrade; TIMED_OUT=0
  if [ "$OS" != win ] && [ -z "$BREW" ]; then pkg_hint "the Node.js LTS" https://nodejs.org/en/download; return 1; fi
  if offer "the Node.js LTS upgrade" 0 "the Node.js LTS from $(pkg_from)" "$(node_up_cmd)"; then
    v=$(node_v); m=$(major "$v")
    if [ "$m" -lt 22 ] && [ "$OS" = mac ]; then   # a Node.js from nodejs.org may come first on PATH: Homebrew's goes first
      p="$("$BREW" --prefix 2>/dev/null)/bin"
      if [ -x "$p/node" ]; then PATH="$p:$PATH"; export PATH; hash -r; v=$(node_v); m=$(major "$v"); fi
    fi
    if [ "$m" -ge 22 ]; then set_version node_upgrade "$v"; say "[installed] Node.js LTS upgrade ($v): the video plugin can be installed now."; return 0; fi
  fi
  [ "$TIMED_OUT" = 1 ] && return 1
  say "[skipped] The Node.js LTS upgrade. Node.js $(node_v) stays (the harness works with it); for the video plugin install the current LTS from https://nodejs.org/en/download."
  return 1
}
install_hyperframes() {   # adds the vendored marketplace (one that already exists is fine), then installs
  local out rc line
  TIMED_OUT=0
  note "Running: claude plugin marketplace add \"$HF_DIR\""
  out=$(claude plugin marketplace add "$HF_DIR" 2>&1); rc=$?
  if [ -n "$out" ]; then printf '%s\n' "$out" | while IFS= read -r line; do note "$line"; done; fi
  if [ "$rc" -ne 0 ] && ! printf '%s' "$out" | grep -qi 'already'; then
    note "Adding the marketplace did not finish (exit code $rc)."; return 1
  fi
  note "Running: claude plugin install hyperframes@hyperframes"
  run_bounded "claude plugin install hyperframes@hyperframes"; rc=$?
  if [ "$TIMED_OUT" = 1 ]; then say "[skipped] The HyperFrames video plugin: the install took longer than 20 minutes and was stopped; run this script again."; return 1; fi
  hf_installed && return 0
  note "The install did not finish (exit code $rc)."; return 1
}
hf_node=$(node_v); hf_major=$(major "$hf_node")
hf_files=0; [ -f vendor/hyperframes/.claude-plugin/marketplace.json ] && hf_files=1
hf_claude=0; { [ -n "$(claude_v)" ] || in_plan claude; } && hf_claude=1
if [ "$hf_major" -ge 20 ] && [ "$hf_major" -lt 22 ] && [ "$hf_files" = 1 ] && [ "$hf_claude" = 1 ]; then
  cur node_upgrade
  set_version node_upgrade "$hf_node"
  up_line="Node.js $hf_node is enough for the harness; the video plugin needs 22 or newer (optional upgrade)."
  if [ "$MODE" = check ]; then say "[skipped] $up_line"
  elif [ -z "$(pkg_from)" ]; then say "[skipped] $up_line"; pkg_hint "the Node.js LTS" https://nodejs.org/en/download
  else
    say "[missing] $up_line"
    if [ "$MODE" = all ]; then PLAN="$PLAN node-upgrade"
    else do_node_upgrade; hf_node=$(node_v); hf_major=$(major "$hf_node"); fi
  fi
fi
cur hyperframes
if [ "$hf_claude" = 0 ]; then say "[skipped] The HyperFrames video plugin needs Claude Code first (optional: only for silent video ads)."
elif [ "$hf_major" -lt 22 ] && ! in_plan node && ! in_plan node-upgrade; then
  if hf_installed; then say "[ok] The HyperFrames video plugin is installed, but it needs Node.js 22 or newer to render (${hf_node:-none found})."
  else say "[skipped] The HyperFrames video plugin needs Node.js 22 or newer (${hf_node:-none found}; the harness itself needs 20 or newer)."; fi
  if [ "$MODE" = check ] && [ "$hf_major" -ge 20 ] && [ "$hf_files" = 1 ]; then note "Run this script without --check to upgrade Node.js (optional), or install the current Node.js LTS from https://nodejs.org/en/download."
  else note "Install the current Node.js LTS (https://nodejs.org/en/download), then run this script again."; fi
else
  check_ffmpeg
  cur hyperframes
  if hf_installed; then say "[ok] The HyperFrames video plugin is installed."
  elif [ "$hf_files" = 0 ]; then
    say "[skipped] The HyperFrames video plugin's files are missing from vendor/hyperframes. Unzip the harness again to get them."
  elif [ "$MODE" = check ]; then say "[skipped] The HyperFrames video plugin is not installed (optional: only for silent video ads)."
  else
    say "[missing] The HyperFrames video plugin is not installed (optional: only for silent video ads)."
    if [ "$MODE" = all ]; then PLAN="$PLAN hyperframes"
    else
      note "The plugin's files are in this folder (vendor/hyperframes); the renderer itself (npx hyperframes) is fetched from the npm registry the first time a video is made."
      TIMED_OUT=0
      if ask "Install the HyperFrames video plugin now?" && install_hyperframes
      then say "[installed] The HyperFrames video plugin. Start a new Claude Code session so it loads."
      elif [ "$TIMED_OUT" = 0 ]; then say "[skipped] The HyperFrames video plugin. Install it later with the two lines in vendor/hyperframes/VENDOR.md."; fi
    fi
  fi
fi

# The one-question install (a default run, or --yes): the plan, one question, then every planned item in the
# order of the table above, with no further question. The items that need an earlier one (playwright-core needs
# npm; the plugin needs Claude Code and Node.js 22 or newer) look for it again first.
plan_line() {   # one line of the plan: the item and where it comes from
  case "$1" in
    brew)         say "  - Homebrew, the installer this script uses on a Mac, from https://brew.sh; its installer asks for your Mac password itself, in this window" ;;
    git)          say "  - Git, from $(pkg_from)" ;;
    node)         if [ "$OS" = win ]; then say "  - Node.js LTS, from $(pkg_from)"; else say "  - Node.js, from $(pkg_from)"; fi ;;
    claude)       say "  - Claude Code, from claude.ai (the official installer; the npm registry if that fails)" ;;
    app)          say "  - The Claude desktop app (its Code tab is where the harness runs), from $(app_from)" ;;
    chrome)       say "  - Google Chrome (for the Claude in Chrome extension and the ad screenshots), from $(app_from)" ;;
    playwright)   say "  - playwright-core (a few megabytes), from the npm registry into node_modules in this folder" ;;
    obsidian)     say "  - Obsidian for the memory vault (free, also for commercial use), from $(obsidian_from)" ;;
    node-upgrade) say "  - Node.js LTS upgrade (the video plugin needs 22 or newer; the harness itself needs 20), from $(pkg_from)" ;;
    ffmpeg)       say "  - FFmpeg, from $(pkg_from)" ;;
    hyperframes)  say "  - The HyperFrames video plugin, from vendor/hyperframes in this folder (its renderer comes from npm on first use)" ;;
  esac
}
playwright_now() {
  cur playwright; path_refresh
  if command -v npm >/dev/null 2>&1; then do_playwright; return; fi
  say "[skipped] playwright-core needs Node.js first (optional: only the still renderer needs it)."
  note "Open a new terminal window in this folder and run this script again to add it."
}
hyperframes_now() {
  local v m; cur hyperframes; path_refresh; v=$(node_v); m=$(major "$v")
  if [ -z "$(claude_v)" ]; then say "[skipped] The HyperFrames video plugin needs Claude Code first (optional: only for silent video ads)."
  elif [ "$m" -lt 22 ]; then say "[skipped] The HyperFrames video plugin needs Node.js 22 or newer (${v:-none found}; the harness itself needs 20 or newer)."
  elif install_hyperframes; then say "[installed] The HyperFrames video plugin. Start a new Claude Code session so it loads."; return
  else [ "$TIMED_OUT" = 1 ] || say "[skipped] The HyperFrames video plugin. Install it later with the two lines in vendor/hyperframes/VENDOR.md."; return; fi
  note "Open a new terminal window in this folder and run this script again to add it."
}
if [ "$MODE" = all ]; then
  [ -f dashboard/setup-page.mjs ] && { [ -n "$(node_v)" ] || in_plan node; } && PAGE_TODO=1
  cur ""
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
      [ "$PAGE_TODO" = 1 ] && say "  - fill the setup wizard (dashboard/setup.html) with the next steps, /connect and /campaign"
    fi
    if [ "$OS" = win ] && { in_plan git || in_plan node || in_plan app || in_plan chrome || in_plan obsidian || in_plan node-upgrade || in_plan ffmpeg; }; then
      say "winget may ask Windows for permission (UAC) while it installs."
    fi
    if in_plan brew; then say "Each install is stopped if it takes longer than 20 minutes; the run then goes on and says so (Homebrew's own installer excepted: it waits for your password)."
    else say "Each install is stopped if it takes longer than 20 minutes; the run then goes on and says so."; fi
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
    in_plan brew && { doing brew; do_brew || MISSING=1; }
    in_plan git && { doing git; put "Git" install_git check_git; }
    in_plan node && { doing node; put "Node.js" install_node check_node; }
    in_plan claude && { doing claude; put "Claude Code" install_claude check_claude; }
    in_plan app && { doing app; do_claude_app; }
    in_plan chrome && { doing chrome; do_chrome; }
    [ "$ENV_TODO" = 1 ] && { doing env; copy_env; }
    in_plan playwright && { doing playwright; playwright_now; }
    in_plan obsidian && { doing obsidian; do_obsidian; }
    in_plan node-upgrade && { doing node_upgrade; do_node_upgrade; }
    in_plan ffmpeg && { doing ffmpeg; do_ffmpeg; }
    in_plan hyperframes && { doing hyperframes; hyperframes_now; }
    LIVE_CUR=""; write_live
  fi
fi

if [ -n "$RECHECK" ]; then
  say ""
  say "Checking again what this run installed"
  path_refresh; again=0
  for c in $RECHECK; do "$c" || again=1; done
  if [ "$again" = 1 ]; then MISSING=1; note "Not found yet: open a new terminal window in this folder and run this script again."; fi
fi
# A tool installed by this run (Node.js above all) is found by the steps below in this same window.
[ "$MODE" = check ] || path_refresh

# Every copy is a new business: memory/tools/instance.mjs compares the instance marker (.harness-instance.json,
# never committed) with this folder and this computer. A run without --check resets a new copy at once, with no
# question: another company's files go to .previous-company/<stamp>/, the blank templates come back and the
# marker is written. --check only reports. It never fails the run. Item: ok (this folder's own harness, or reset
# now), todo (a new copy, under --check), skipped (no Node.js or no tool yet).
cur instance
if [ -f memory/tools/instance.mjs ] && [ -n "$(node_v)" ]; then
  if [ "$MODE" = check ]; then
    node memory/tools/instance.mjs --check --quiet >/dev/null 2>&1; rc=$?
    if [ "$rc" = 0 ]; then say "[ok] This folder is its own harness: the business set up here stays."; set_status instance ok
    elif [ "$rc" = 3 ]; then say "[todo] This folder is a new copy: run this script without --check to start it as a new business (another company's files, if any, are archived in .previous-company/)."; set_status instance todo
    else say "[skipped] The new-copy check could not run here (node memory/tools/instance.mjs --check says why)."; fi
  else
    res=$(node memory/tools/instance.mjs --reset --quiet 2>/dev/null); rc=$?
    case "$rc:$res" in
      0:same) say "[ok] This folder is its own harness: the business set up here stays."; set_status instance ok ;;
      0:marked) say "[ok] This folder starts as a new business: nothing of another company was here."; set_status instance ok ;;
      "0:archived "*) say "[ok] This folder starts as a new business: the previous company's files were moved to ${res#archived }/ and the blank templates put back."; set_status instance ok ;;
      *) say "[skipped] The new-copy check could not run here (node memory/tools/instance.mjs --reset says why)." ;;
    esac
  fi
fi

# Obsidian set up with no click: memory/tools/obsidian-setup.mjs registers this folder as a vault in Obsidian's
# own config (obsidian.json), turns on its command line interface there and starts the app on the vault.
# --check runs it with --check (a report line, nothing changed); a declined run leaves it out. It never fails
# the run. OBS_SETUP: ok, failed, noapp, nonode, notool or skipped.
cur obsidian_setup
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
[ "$OBS_SETUP" = ok ] && set_status obsidian_setup ok

# The memory routines (.claude/routines/): a nightly memory check and a weekly consolidation review that alert
# the Owner's phone and never act. The desktop app keeps their schedules itself, so only /campaign can register
# them; this script counts the scheduled tasks whose prompt names this folder and never creates one.
cur routines
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
  else say "[todo] The memory routines are not registered yet: /campaign registers them in the Claude desktop app (one question)."; fi
fi
if [ "$ROUTINES" -ge 2 ]; then set_status routines ok; else set_status routines todo; fi
cur ""

say ""
say "What remains"
if [ "$DECLINED" = 1 ]; then say "  First: run this script again and press Enter at the question to install what is marked [missing] above."
elif [ "$MISSING" = 1 ]; then
  if [ "$MODE" = check ]; then say "  First: run this script without --check to install what is marked [missing] above."
  else say "  First: install what is marked [missing] above (run this script again, or install it by hand)."; fi
fi
if [ -n "$RECO_MISSING" ]; then
  reco=""
  case " $RECO_MISSING " in *" app "*) reco="the Claude desktop app" ;; esac
  case " $RECO_MISSING " in *" chrome "*) reco="${reco:+$reco and }Google Chrome" ;; esac
  say "  Also: $reco marked [missing] above: run this script again without --check, or install from the page on that line."
fi
say "  1. Open the Claude desktop app, sign in, click the Code tab and open this folder (Open folder...; trust it when asked)."
say "     A terminal works too (type claude in this folder), but the memory routines and the Claude in Chrome pairing are the app's."
say "  2. When Claude Code asks whether to use the two servers in .mcp.json (meta-ads and fal), approve them; if it does not ask, /mcp lists them."
say "  3. Install the Claude in Chrome extension in Chrome and sign in to it with the same Claude account"
say "     (in the app: your initials at the lower left > Settings > Customize > Connectors > Claude in Chrome > Configure; from a terminal here: claude --chrome)."
say "  4. In the Code tab type /connect: the connections pass. It asks your language first, then what you already have in Meta,"
say "     leads every login in your own Chrome (the Meta business, the Page, the ad account, the developer app and the System User,"
say "     the pixel, WhatsApp, fal), stores the upload token from your clipboard without ever showing it, and ends with /health green."
say "  5. Then type /campaign: the first campaign A to Z (the interview, the market research, the plan, copy, creatives,"
say "     the campaign built PAUSED and shown to you)."
if [ "$ROUTINES" -ge 2 ]; then say "     The two memory routines are already registered for this folder."
else say "     /campaign registers them too: two memory routines, a nightly check and a weekly review that alert your phone and never act."; fi
say "  6. The Owner's Meta console steps stay listed in docs/meta-setup-guide.md, with their pitfalls, for reference."
# The memory vault in Obsidian: the result of obsidian-setup.mjs above, after a run that went ahead. Nothing
# for the Owner to click; the memory hooks ship in .claude/settings.json.
if [ "$MODE" != check ] && [ "$DECLINED" = 0 ]; then
  case "$OBS_SETUP" in
    ok)     say "  7. Obsidian is set up: the vault is registered, the command line interface is on, the app opened on your HOME page."
            say "     (If Obsidian was already open before this run, close and reopen it once so its command line answers.)" ;;
    notool) say "  7. Obsidian is not set up: memory/tools/obsidian-setup.mjs is missing. Unzip the harness again to get it." ;;
    noapp)  say "  7. Obsidian is not installed, so the memory vault is not set up in it yet (the notes work without it)."
            say "     Install it (run this script again, or get it free from $OBSIDIAN_PAGE); then node memory/tools/obsidian-setup.mjs finishes it." ;;
    nonode) say "  7. Obsidian is installed but not set up yet: this window does not find Node.js."
            say "     Open a new terminal window in this folder and run: node memory/tools/obsidian-setup.mjs" ;;
    *)      say "  7. Obsidian could not be set up from here. Run: node memory/tools/obsidian-setup.mjs (it says why, and finishes it)." ;;
  esac
fi
# The setup progress page (dashboard/setup.html): written and opened at the end of a run that went ahead,
# never under --check or after a No. The marks are this run's results: done when the tool was found or installed.
if [ "$MODE" != check ] && [ "$DECLINED" = 0 ] && [ -f dashboard/setup-page.mjs ]; then
  if [ -n "$(node_v)" ]; then
    ran() { case " $RECHECK " in *" $1 "*) return 0 ;; esac; return 1; }
    pg_node=$(node_v); pg_major=$(major "$pg_node")
    mark_git=todo; { [ -n "$(git_v)" ] || ran check_git; } && mark_git=done
    mark_node=todo; { [ "$pg_major" -ge 20 ] || ran check_node; } && mark_node=done
    mark_claude=todo; { [ -n "$(claude_v)" ] || ran check_claude; } && mark_claude=done
    mark_obsidian=todo; [ -n "$obs_now" ] && mark_obsidian=done
    mark_app=todo; [ -n "$(claude_app_path)" ] && mark_app=done
    obs_marks=(); page_open=""; [ "$PAGE_OPENED" = 1 ] || page_open=--open
    [ "$OBS_SETUP" = ok ] && obs_marks=(--mark "obsidian.vault_opened=done" --mark "obsidian.cli=done")
    say ""
    if node dashboard/setup-page.mjs --mark "install.git=$mark_git" --mark "install.node=$mark_node" \
         --mark "install.claude=$mark_claude" --mark "app.desktop=$mark_app" --mark "obsidian.installed=$mark_obsidian" ${obs_marks[@]+"${obs_marks[@]}"} ${page_open:+"$page_open"} >/dev/null 2>&1
    then if [ "$PAGE_OPENED" = 1 ]; then say "The setup wizard now shows the next steps too (/connect, then /campaign); keep it beside Claude Code: dashboard/setup.html"
         else say "The setup wizard opened in your browser; keep it beside Claude Code: dashboard/setup.html"; fi
    else say "The setup wizard could not be filled with the next steps (node dashboard/setup-page.mjs failed); /connect fills it later."; fi
  elif [ "$PAGE_TODO" = 1 ]; then
    say ""
    say "The setup wizard shows the installation; its next steps appear once Node.js is found (a new terminal window, or /connect fills them)."
  fi
fi
say ""
say "This run is logged in bootstrap.log; its results are in dashboard/bootstrap-result.json."
if [ "$DECLINED" = 1 ]; then say "Result: nothing was installed; run this script again when you are ready."; finish 1; fi
if [ "$MISSING" = 1 ]; then say "Result: something required is still missing (marked [missing] above)."; finish 1; fi
say "Result: everything required is in place."
finish 0
