# bootstrap.ps1: the first command for a new copy of the Marketing Team Harness, for Windows (Windows
# PowerShell 5.1 or PowerShell 7). On macOS, bootstrap.sh does the same steps.
# Run it from the harness folder (the one that contains CLAUDE.md and .mcp.json):
#   powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1          check everything, list what is missing, then one question installs all of it
#   powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 -Ask     ask per item: one y/N question before each install
#   powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 -Yes     install everything that is missing, with no question at all
#   powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 -Check   report only: no questions, no installs, nothing changed
#   powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 -Help    show the usage
# The one install takes every missing item, required and optional alike (Git, Node.js, Claude Code,
# playwright-core, Obsidian for the memory vault, FFmpeg, the HyperFrames video plugin from vendor\hyperframes),
# copies .env.example to .env, sets Obsidian up for the vault (memory/tools/obsidian-setup.mjs: the vault is
# registered, the command line interface is on, the app opens; no click) and opens the setup progress page.
# Enter at its question means Yes; Enter at an -Ask question means No.
# Tags: [ok] already there, [installed] put in place by this run, [missing] not there, [skipped] an optional
# item left out. Exit codes: 0 everything required is present, 1 something required is missing or the
# install was declined, 2 wrong folder or unknown option. It never asks for, reads or prints a token: .env is
# only copied from .env.example.
param([switch]$Check, [switch]$Ask, [switch]$Yes, [switch]$Help)
Set-StrictMode -Version 2
$ErrorActionPreference = 'Continue'

$Missing = $false; $Recheck = @(); $Done = $false; $Agreed = $false
$Plan = @(); $EnvTodo = $false; $PageTodo = $false; $Go = $false; $Declined = $false; $NoAnswer = $false
function Say([string]$text) { Write-Host $text }
function Note([string]$text) { Write-Host ('        ' + $text) }
function Show-Usage {
  Say 'Usage: powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 [-Ask | -Yes | -Check] [-Help]'
  Say '  (no option)  check, list what is missing, then one question installs all of it (Enter means Yes)'
  Say '  -Ask         ask per item: one y/N question before each install (Enter means No)'
  Say '  -Yes         install everything that is missing, required and optional, with no question'
  Say '  -Check       report only: no questions, no installs, nothing changed'
  Say '  -Help        show this text'
  Say 'Given together, the more careful option wins: -Check, then -Ask, then -Yes.'
  Say 'Run it from the harness folder (the one that contains CLAUDE.md and .mcp.json).'
}
if ($args.Count -gt 0) { Say ('Unknown option: ' + ($args -join ' ')); Show-Usage; exit 2 }
if ($Help) { Show-Usage; exit 0 }
if ([Environment]::OSVersion.Platform -ne 'Win32NT') { Say 'bootstrap.ps1 is for Windows. On macOS, run: bash bootstrap.sh'; exit 2 }
$Mode = 'all'
if ($Check) { $Mode = 'check' } elseif ($Ask) { $Mode = 'ask' }

if (-not ((Test-Path -LiteralPath 'CLAUDE.md' -PathType Leaf) -and (Test-Path -LiteralPath '.mcp.json' -PathType Leaf))) {
  Say 'This is not the harness folder: it must contain CLAUDE.md and .mcp.json.'
  $here = $PSScriptRoot
  if ($here -and (Test-Path -LiteralPath (Join-Path $here 'CLAUDE.md')) -and (Test-Path -LiteralPath (Join-Path $here '.mcp.json'))) {
    Say 'Type this line and press Enter, then run the script again:'
    Say ('  cd "' + $here + '"')
  } else {
    Say 'Type cd and a space, drag the harness folder into this window, press Enter, then run: powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1'
  }
  exit 2
}

# Read-Answer: one typed line with the spaces taken out, or $null when nothing could be read (the input is
# closed, or PowerShell runs non-interactive). When the input is not a console, Read-Host itself prints the
# line after the question, so the log shows it.
function Read-Answer {
  $line = $null
  try { $line = Read-Host } catch { $line = $null }
  if ($null -eq $line) { Write-Host ''; return $null }
  return ($line -replace '\s', '')
}

# Ask-Item <question>: one -Ask question; true for yes. Enter, or no answer at all, means No.
function Ask-Item([string]$question) {
  Write-Host ('        ' + $question + ' [y/N]: ') -NoNewline
  return ((Read-Answer) -match '^(y|yes)$')
}

# Confirm-All <question>: the one question of a default run; true for yes. Enter means Yes; no answer at all
# (the input is closed) means No and sets $script:NoAnswer.
function Confirm-All([string]$question) {
  Write-Host ($question + ' [Y/n]: ') -NoNewline
  $answer = Read-Answer
  if ($null -eq $answer) { $script:NoAnswer = $true; return $false }
  return ($answer -match '^(y|yes)?$')
}

# Offer <name> <required> <what it downloads> <command as shown> <scriptblock>: runs one install. Under -Ask it
# first states the download and asks; in the one-question install (a default run after its yes, or -Yes) it
# runs at once, the plan having named the source. Callers invoke Offer as a plain statement, never inside an
# expression, so an installer's own prompts reach the console. Sets $script:Agreed when the install goes ahead
# and $script:Done when the command succeeded.
function Offer([string]$name, [bool]$required, [string]$from, [string]$shown, [scriptblock]$run) {
  $script:Done = $false; $script:Agreed = $false
  if ($Mode -eq 'ask') {
    Note "This downloads $from."
    if (-not (Ask-Item "Install $name now?")) {
      if ($required) { Note 'Not installed. Run this script again when you are ready.' }
      return
    }
  }
  $script:Agreed = $true
  Note "Running: $shown"
  $global:LASTEXITCODE = 0
  try { & $run } catch { Note ('The install stopped with an error: ' + $_.Exception.Message); return }
  if ($LASTEXITCODE -ne 0) { Note "The install did not finish (exit code $LASTEXITCODE)."; return }
  $script:Done = $true
}

# Get-PkgFrom: where Install-Pkg installs from, in the plan's words; '' when winget is missing.
function Get-PkgFrom {
  if (Get-Command winget -ErrorAction SilentlyContinue) { return 'the winget catalogue (the Windows Package Manager)' }
  return ''
}
# Show-PkgHint <name> <download page>: what to do instead when winget is missing.
function Show-PkgHint([string]$name, [string]$page) {
  Note 'winget (the Windows Package Manager) was not found. Get App Installer from the Microsoft Store:'
  Note "https://apps.microsoft.com/detail/9NBLGGH4NNS1 , or download $name from $page"
}
# Install-Pkg <name> <winget id> <download page> [<required, $true by default>]: installs one package with winget.
function Install-Pkg([string]$name, [string]$id, [string]$page, [bool]$required = $true) {
  $script:Done = $false; $script:Agreed = $false
  $from = Get-PkgFrom
  if (-not $from) { Show-PkgHint $name $page; return }
  Offer $name $required "$name from $from" "winget install --id $id -e --source winget" ({ & winget install --id $id -e --source winget }.GetNewClosure())
}

# Adds the Machine and User PATH entries an installer just wrote to this window's PATH (nothing is removed).
function Update-SessionPath {
  $have = @($env:Path -split ';')
  foreach ($scope in @('Machine', 'User')) {
    $p = [Environment]::GetEnvironmentVariable('Path', $scope)
    if (-not $p) { continue }
    foreach ($d in ($p -split ';')) { if ($d -and ($have -notcontains $d)) { $env:Path = $env:Path + ';' + $d; $have += $d } }
  }
}

function Get-Version([string]$exe) {   # first line of "<exe> --version", or '' when absent or failing
  if (-not (Get-Command $exe -ErrorAction SilentlyContinue)) { return '' }
  $global:LASTEXITCODE = 0
  try { $out = @(& $exe --version 2>$null) } catch { return '' }
  if ($LASTEXITCODE -ne 0 -or $out.Count -eq 0) { return '' }
  return ([string]$out[0]).Trim()
}

function Test-Git {
  $v = Get-Version 'git'
  if ($v) { Say "[ok] Git is installed ($v)."; return 0 }
  Say '[missing] Git is not installed.'; return 1
}
function Test-Node {
  $v = Get-Version 'node'; $m = 0
  if ($v -match '^v?(\d+)\.') { $m = [int]$Matches[1] }
  if ($m -ge 20) { Say "[ok] Node.js $v is installed (20 or newer is needed)."; return 0 }
  if ($v) { Say "[missing] Node.js $v is too old (20 or newer is needed)." } else { Say '[missing] Node.js is not installed (20 or newer is needed).' }
  return 1
}
$ClaudeDir = Join-Path $env:USERPROFILE '.local\bin'
function Test-Claude {   # 0 ok, 1 not installed, 2 installed but its folder is not on PATH
  $v = Get-Version 'claude'
  if ($v) { Say "[ok] Claude Code is installed ($v)."; return 0 }
  if (Test-Path -LiteralPath (Join-Path $ClaudeDir 'claude.exe')) {
    Say "[missing] Claude Code is installed in $ClaudeDir, but that folder is not on your PATH yet."
    Note 'Open a new terminal window. If claude is still not found, add that folder to your PATH (the installer printed how).'
    return 2
  }
  Say '[missing] Claude Code is not installed.'; return 1
}

function Install-Claude {
  $cmd = '[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12; irm https://claude.ai/install.ps1 | iex'
  Offer 'Claude Code' $true 'Claude Code from claude.ai (the official installer)' 'irm https://claude.ai/install.ps1 | iex' ({ & powershell -NoProfile -ExecutionPolicy Bypass -Command $cmd }.GetNewClosure())
  Update-SessionPath
  if ($script:Done -and ((Get-Command claude -ErrorAction SilentlyContinue) -or (Test-Path -LiteralPath (Join-Path $ClaudeDir 'claude.exe')))) { return }
  if (-not $script:Agreed) { return }
  $script:Done = $false
  Note 'The official installer did not work; trying the npm route instead.'
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Note 'npm was not found: install Node.js first, then run this script again.'; return }
  Note 'This downloads Claude Code from the npm registry.'
  Note 'Running: npm install -g @anthropic-ai/claude-code'
  $global:LASTEXITCODE = 0
  & npm install -g '@anthropic-ai/claude-code'
  $script:Done = ($LASTEXITCODE -eq 0)
}

# Put <name> <item>: installs one required item: [installed] and a re-check at the end when it worked,
# otherwise it stays missing.
function Put([string]$name, [string]$item) {
  if ($item -eq 'git') { Install-Pkg 'Git' 'Git.Git' 'https://git-scm.com/downloads' }
  elseif ($item -eq 'node') { Install-Pkg 'Node.js' 'OpenJS.NodeJS.LTS' 'https://nodejs.org/en/download' }
  else { Install-Claude }
  if ($script:Done) {
    Update-SessionPath
    Say "[installed] $name. A new terminal window may be needed before the command is found."
    $script:Recheck += $item
  } else { $script:Missing = $true }
}
# Need <name> <item> [<download page>]: after the [missing] line of a required item. -Check records it, -Ask
# installs it now (one question), and the one-question install adds it to the plan, or says why this script
# cannot install it here.
function Need([string]$name, [string]$item, [string]$page = '') {
  if ($Mode -eq 'check') { $script:Missing = $true; return }
  if ($Mode -eq 'ask') { Put $name $item; return }
  if (($item -eq 'claude') -or (Get-PkgFrom)) { $script:Plan += $item; return }
  Show-PkgHint $name $page; $script:Missing = $true
}

Say 'Marketing Team Harness: first-time setup'
Say ('Folder: ' + (Get-Location).Path)
if ($Mode -eq 'check') { Say 'Mode: check only. Nothing is installed or changed.' }
elseif ($Mode -eq 'ask') { Say 'Mode: one question before each install. Enter means No.' }
elseif ($Yes) { Say 'Mode: check everything, then install all that is missing, with no question (-Yes).' }
else { Say 'Mode: check everything, then one question installs all that is missing. Enter means Yes.' }
Say 'No token or password is ever asked for here.'

Say ''
Say 'Required'
if ((Test-Git) -ne 0) { Need 'Git' 'git' 'https://git-scm.com/downloads' }
if ((Test-Node) -ne 0) { Need 'Node.js' 'node' 'https://nodejs.org/en/download' }
$rc = Test-Claude
if ($rc -eq 1) { Need 'Claude Code' 'claude' } elseif ($rc -eq 2) { $Missing = $true }

$browser = ''
foreach ($base in @(${env:ProgramFiles(x86)}, $env:ProgramFiles)) {
  if (-not $base) { continue }
  if (-not $browser -and (Test-Path -LiteralPath (Join-Path $base 'Microsoft\Edge\Application\msedge.exe'))) { $browser = 'Microsoft Edge' }
  if (-not $browser -and (Test-Path -LiteralPath (Join-Path $base 'Google\Chrome\Application\chrome.exe'))) { $browser = 'Google Chrome' }
}
if ($browser) { Say "[ok] A browser for ad screenshots is installed ($browser)." }
else {
  Say '[missing] Neither Microsoft Edge nor Google Chrome was found. Only the ad screenshots need one, so the setup goes on.'
  Note 'Download one: https://www.microsoft.com/edge/download or https://www.google.com/chrome/'
}

function Copy-Env {   # copies .env.example to .env; an .env that exists by now is left as it is
  if (Test-Path -LiteralPath '.env' -PathType Leaf) { Say '[ok] .env exists (contents never shown).'; return }
  try {
    Copy-Item -LiteralPath '.env.example' -Destination '.env' -ErrorAction Stop
    Say '[installed] .env created from .env.example (contents never shown).'
    Note 'Later the Owner pastes the Meta System User token into .env with a text editor, never into the chat.'
  } catch { Say '[missing] .env could not be created. Copy .env.example to .env by hand.'; $script:Missing = $true }
}
if (Test-Path -LiteralPath '.env' -PathType Leaf) { Say '[ok] .env exists (contents never shown).' }
elseif (-not (Test-Path -LiteralPath '.env.example' -PathType Leaf)) { Say '[missing] .env.example is missing, so .env cannot be created. Unzip the harness again.'; $Missing = $true }
elseif ($Mode -eq 'check') { Say '[missing] .env does not exist yet. Run this script without -Check to create it from .env.example.'; $Missing = $true }
elseif ($Mode -eq 'ask') { Copy-Env }
else { Say '[missing] .env does not exist yet.'; $EnvTodo = $true }

Say ''
Say 'Optional'
function Invoke-Playwright {   # installs playwright-core into node_modules here (after its question under -Ask)
  Offer 'playwright-core' $false 'playwright-core (a few megabytes) from the npm registry into node_modules in this folder' 'npm install --no-save --no-package-lock playwright-core' { & npm install --no-save --no-package-lock playwright-core }
  if ($script:Done) { Say '[installed] playwright-core.' } else { Say '[skipped] playwright-core. Install it later with: npm install --no-save --no-package-lock playwright-core' }
}
if (Test-Path -LiteralPath 'node_modules\playwright-core\package.json') { Say '[ok] playwright-core is installed (for the still renderer).' }
elseif ($Mode -eq 'check') { Say '[skipped] playwright-core is not installed (optional: only the still renderer needs it).' }
elseif (-not (Get-Command npm -ErrorAction SilentlyContinue) -and -not ($Plan -contains 'node')) { Say '[skipped] playwright-core needs Node.js first (optional: only the still renderer needs it).' }
else {
  Say '[missing] playwright-core is not installed (optional: only the still renderer needs it).'
  if ($Mode -eq 'all') { $Plan += 'playwright' } else { Invoke-Playwright }
}

# Obsidian (free, also for commercial use; Sync and Publish are optional paid services) opens the folder as the
# memory vault: notes, links and the Bases dashboards over memory/. This script installs the app; after the
# install phase memory/tools/obsidian-setup.mjs registers the vault, turns on the command line interface and
# starts the app, so the Owner clicks nothing in Obsidian. The memory hooks ship in .claude/settings.json.
$ObsidianCmd = 'winget install --id Obsidian.Obsidian -e --accept-package-agreements --accept-source-agreements'
$ObsidianPage = 'https://obsidian.md/download'
function Get-ObsidianPath {   # Obsidian.exe of a per-user or a machine install, or '' when neither is there
  $places = @()
  if ($env:LOCALAPPDATA) { $places += (Join-Path $env:LOCALAPPDATA 'Programs\Obsidian\Obsidian.exe') }
  if ($env:ProgramFiles) { $places += (Join-Path $env:ProgramFiles 'Obsidian\Obsidian.exe') }
  if ($env:ProgramW6432) { $places += (Join-Path $env:ProgramW6432 'Obsidian\Obsidian.exe') }   # a 32-bit PowerShell window
  foreach ($p in $places) { if (Test-Path -LiteralPath $p -PathType Leaf) { return $p } }
  return ''
}

function Invoke-Obsidian {   # installs Obsidian (after its question under -Ask)
  $script:Done = $false
  $from = Get-PkgFrom
  if (-not $from) {
    Show-PkgHint 'Obsidian' $ObsidianPage
    Say '[skipped] Obsidian. Install it later; the vault notes are plain Markdown files and work without it.'
    return
  }
  Offer 'Obsidian' $false "Obsidian (free, also for commercial use) from $from" $ObsidianCmd { & winget install --id Obsidian.Obsidian -e --accept-package-agreements --accept-source-agreements }
  $p = Get-ObsidianPath
  if ($script:Done -and $p) { Say "[installed] Obsidian ($p)." }
  elseif ($script:Done) { Say '[installed] Obsidian. A new terminal window may be needed before this script finds it.' }
  else { Say ('[skipped] Obsidian. Install it later with: ' + $ObsidianCmd + ' (or from ' + $ObsidianPage + ')') }
}
$obsPath = Get-ObsidianPath
if ($obsPath) { Say "[ok] Obsidian is installed for the memory vault ($obsPath)." }
elseif ($Mode -eq 'check') { Say '[skipped] Obsidian is not installed (optional: it shows the memory vault, memory/, as linked notes and dashboards).' }
elseif (($Mode -eq 'all') -and -not (Get-PkgFrom)) {
  Say '[skipped] Obsidian is not installed (optional: it shows the memory vault, memory/, as linked notes and dashboards).'
  Show-PkgHint 'Obsidian' $ObsidianPage
}
else {
  Say '[missing] Obsidian is not installed (optional: it shows the memory vault, memory/, as linked notes and dashboards).'
  if ($Mode -eq 'all') { $Plan += 'obsidian' } else { Invoke-Obsidian }
}

# The HyperFrames video plugin (Apache-2.0, by HeyGen) ships in this folder, in vendor\hyperframes: the script
# adds that folder as the plugin's marketplace and never adds one from GitHub. The renderer needs Node.js 22
# or newer and FFmpeg; it is fetched from the npm registry (npx hyperframes) the first time a video is made.
$hfDir = Join-Path (Get-Location).ProviderPath 'vendor\hyperframes'
function Test-Hyperframes {   # true when "claude plugin list" names hyperframes; a failed check counts as no
  try { $list = (@(& claude plugin list 2>$null) -join "`n") } catch { return $false }
  return ($list -match 'hyperframes')
}
function Get-FFmpegVersion {   # first line of "ffmpeg -version" without its copyright part, or '' when absent or failing
  if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { return '' }
  $global:LASTEXITCODE = 0
  try { $out = @(& ffmpeg -version 2>$null) } catch { return '' }
  if ($LASTEXITCODE -ne 0 -or $out.Count -eq 0) { return '' }
  return (([string]$out[0]) -replace ' Copyright.*$', '').Trim()
}
function Invoke-FFmpeg {   # installs FFmpeg (after its question under -Ask)
  Install-Pkg 'FFmpeg' 'Gyan.FFmpeg' 'https://ffmpeg.org/download.html' $false
  if ($script:Done) { Update-SessionPath; Say '[installed] FFmpeg. A new terminal window may be needed before the command is found.' }
  else { Say '[skipped] FFmpeg. The video plugin cannot render until it is installed.' }
}
function Test-FFmpeg {   # FFmpeg for the video plugin: reports it; -Ask offers it, the one-question install plans it
  $v = Get-FFmpegVersion
  if ($v) { Say "[ok] FFmpeg is installed for the video plugin ($v)."; return }
  if ($Mode -eq 'check') { Say '[skipped] FFmpeg is not installed (optional: the video plugin needs it to render).'; return }
  if (($Mode -eq 'all') -and -not (Get-PkgFrom)) {
    Say '[skipped] FFmpeg is not installed (optional: the video plugin needs it to render).'
    Show-PkgHint 'FFmpeg' 'https://ffmpeg.org/download.html'; return
  }
  Say '[missing] FFmpeg is not installed (optional: the video plugin needs it to render).'
  if ($Mode -eq 'all') { $script:Plan += 'ffmpeg'; return }
  Invoke-FFmpeg
}
function Install-Hyperframes {   # adds the vendored marketplace (one that already exists is fine), then installs
  $script:Done = $false
  Note ('Running: claude plugin marketplace add "' + $hfDir + '"')
  $global:LASTEXITCODE = 0
  $out = @(& claude plugin marketplace add $hfDir 2>&1 | ForEach-Object { [string]$_ })
  $rc = $LASTEXITCODE
  foreach ($line in $out) { Note $line }
  if ($rc -ne 0 -and -not (($out -join "`n") -match 'already')) { Note "Adding the marketplace did not finish (exit code $rc)."; return }
  Note 'Running: claude plugin install hyperframes@hyperframes'
  $global:LASTEXITCODE = 0
  & claude plugin install hyperframes@hyperframes
  $rc = $LASTEXITCODE
  if (Test-Hyperframes) { $script:Done = $true; return }
  Note "The install did not finish (exit code $rc)."
}
$hfNode = Get-Version 'node'; $hfMajor = 0
if ($hfNode -match '^v?(\d+)\.') { $hfMajor = [int]$Matches[1] }
$hfFound = if ($hfNode) { $hfNode } else { 'none found' }
if (-not (Get-Version 'claude') -and -not ($Plan -contains 'claude')) { Say '[skipped] The HyperFrames video plugin needs Claude Code first (optional: only for silent video ads).' }
elseif (($hfMajor -lt 22) -and -not ($Plan -contains 'node')) {
  if (Test-Hyperframes) { Say "[ok] The HyperFrames video plugin is installed, but it needs Node.js 22 or newer to render ($hfFound)." }
  else { Say "[skipped] The HyperFrames video plugin needs Node.js 22 or newer ($hfFound; the harness itself needs 20 or newer)." }
  Note 'Install the current Node.js LTS (https://nodejs.org/en/download), then run this script again.'
}
else {
  Test-FFmpeg
  if (Test-Hyperframes) { Say '[ok] The HyperFrames video plugin is installed.' }
  elseif (-not (Test-Path -LiteralPath 'vendor\hyperframes\.claude-plugin\marketplace.json' -PathType Leaf)) { Say "[skipped] The HyperFrames video plugin's files are missing from vendor/hyperframes. Unzip the harness again to get them." }
  elseif ($Mode -eq 'check') { Say '[skipped] The HyperFrames video plugin is not installed (optional: only for silent video ads).' }
  else {
    Say '[missing] The HyperFrames video plugin is not installed (optional: only for silent video ads).'
    if ($Mode -eq 'all') { $Plan += 'hyperframes' }
    else {
      Note "The plugin's files are in this folder (vendor/hyperframes); the renderer itself (npx hyperframes) is fetched from the npm registry the first time a video is made."
      $Done = $false
      if (Ask-Item 'Install the HyperFrames video plugin now?') { Install-Hyperframes }
      if ($Done) { Say '[installed] The HyperFrames video plugin. Start a new Claude Code session so it loads.' } else { Say '[skipped] The HyperFrames video plugin. Install it later with the two lines in vendor/hyperframes/VENDOR.md.' }
    }
  }
}

# The one-question install (a default run, or -Yes): the plan, one question, then every planned item in the
# order of the table above, with no further question. The items that need an earlier one (playwright-core needs
# npm; the plugin needs Claude Code and Node.js 22 or newer) look for it again first.
function Show-PlanLine([string]$item) {   # one line of the plan: the item and where it comes from
  if ($item -eq 'git') { Say ('  - Git, from ' + (Get-PkgFrom)) }
  elseif ($item -eq 'node') { Say ('  - Node.js LTS, from ' + (Get-PkgFrom)) }
  elseif ($item -eq 'claude') { Say '  - Claude Code, from claude.ai (the official installer; the npm registry if that fails)' }
  elseif ($item -eq 'playwright') { Say '  - playwright-core (a few megabytes), from the npm registry into node_modules in this folder' }
  elseif ($item -eq 'obsidian') { Say ('  - Obsidian for the memory vault (free, also for commercial use), from ' + (Get-PkgFrom)) }
  elseif ($item -eq 'ffmpeg') { Say ('  - FFmpeg, from ' + (Get-PkgFrom)) }
  else { Say '  - The HyperFrames video plugin, from vendor/hyperframes in this folder (its renderer comes from npm on first use)' }
}
function Install-PlaywrightNow {
  Update-SessionPath
  if (Get-Command npm -ErrorAction SilentlyContinue) { Invoke-Playwright; return }
  Say '[skipped] playwright-core needs Node.js first (optional: only the still renderer needs it).'
  Note 'Open a new terminal window in this folder and run this script again to add it.'
}
function Install-HyperframesNow {
  Update-SessionPath
  $v = Get-Version 'node'; $m = 0
  if ($v -match '^v?(\d+)\.') { $m = [int]$Matches[1] }
  $found = 'none found'; if ($v) { $found = $v }
  if (-not (Get-Version 'claude')) { Say '[skipped] The HyperFrames video plugin needs Claude Code first (optional: only for silent video ads).' }
  elseif ($m -lt 22) { Say "[skipped] The HyperFrames video plugin needs Node.js 22 or newer ($found; the harness itself needs 20 or newer)." }
  else {
    Install-Hyperframes
    if ($script:Done) { Say '[installed] The HyperFrames video plugin. Start a new Claude Code session so it loads.' }
    else { Say '[skipped] The HyperFrames video plugin. Install it later with the two lines in vendor/hyperframes/VENDOR.md.' }
    return
  }
  Note 'Open a new terminal window in this folder and run this script again to add it.'
}
if ($Mode -eq 'all') {
  if ((Test-Path -LiteralPath 'dashboard/setup-page.mjs' -PathType Leaf) -and ((Get-Version 'node') -or ($Plan -contains 'node'))) { $PageTodo = $true }
  Say ''
  if ($Plan.Count -eq 0) {
    if ($Missing) { Say 'Nothing for this script to install here: for what is marked [missing] above, follow the step on its line or in its note.' }
    else { Say 'Nothing to install: every tool this script can install is in place.' }
    $Go = $true
  } else {
    Say 'This will install:'
    foreach ($item in $Plan) { Show-PlanLine $item }
    if ($EnvTodo -or $PageTodo) {
      Say 'and will:'
      if ($EnvTodo) { Say '  - copy .env.example to .env (its contents are never shown)' }
      if ($PageTodo) { Say '  - open the setup progress page (dashboard/setup.html) in your browser' }
    }
    if (($Plan -contains 'git') -or ($Plan -contains 'node') -or ($Plan -contains 'ffmpeg')) { Say 'winget may still show its own agreement prompts while it installs; answer them in this window.' }
    if ($Yes) { Say 'Install all of the above now? [Y/n]: yes (-Yes)'; $Go = $true }
    elseif (Confirm-All 'Install all of the above now?') { $Go = $true }
    else {
      $Declined = $true
      if ($NoAnswer) { Say 'No answer could be read, so nothing was installed. Run this script in a terminal window and press Enter at the question.' }
      else { Say 'Nothing was installed.' }
    }
  }
  if ($Go) {
    if ($Plan.Count -gt 0) { Say ''; Say 'Installing' }
    if ($Plan -contains 'git') { Put 'Git' 'git' }
    if ($Plan -contains 'node') { Put 'Node.js' 'node' }
    if ($Plan -contains 'claude') { Put 'Claude Code' 'claude' }
    if ($EnvTodo) { Copy-Env }
    if ($Plan -contains 'playwright') { Install-PlaywrightNow }
    if ($Plan -contains 'obsidian') { Invoke-Obsidian }
    if ($Plan -contains 'ffmpeg') { Invoke-FFmpeg }
    if ($Plan -contains 'hyperframes') { Install-HyperframesNow }
  }
}

if ($Recheck.Count -gt 0) {
  Say ''
  Say 'Checking again what this run installed'
  Update-SessionPath
  $again = $false
  foreach ($item in $Recheck) {
    if ($item -eq 'git') { $rc = Test-Git } elseif ($item -eq 'node') { $rc = Test-Node } else { $rc = Test-Claude }
    if ($rc -ne 0) { $again = $true }
  }
  if ($again) { $Missing = $true; Note 'Not found yet: open a new terminal window in this folder and run this script again.' }
}

# Obsidian set up with no click: memory/tools/obsidian-setup.mjs registers this folder as a vault in Obsidian's
# own config (obsidian.json), turns on its command line interface there and starts the app on the vault.
# -Check runs it with --check (a report line, nothing changed); a declined run leaves it out. It never fails
# the run. $ObsSetup: ok, failed, noapp, nonode, notool or skipped.
$ObsSetup = 'skipped'
$obsNow = Get-ObsidianPath
if (-not $Declined) {
  if (-not (Test-Path -LiteralPath 'memory/tools/obsidian-setup.mjs' -PathType Leaf)) { $ObsSetup = 'notool' }
  elseif (-not $obsNow) { $ObsSetup = 'noapp' }
  elseif (-not (Get-Version 'node')) { $ObsSetup = 'nonode' }
  else {
    $obsArgs = @('--quiet')
    if ($Mode -eq 'check') { $obsArgs = @('--check', '--quiet') }
    $global:LASTEXITCODE = 0
    try { & node memory/tools/obsidian-setup.mjs @obsArgs *> $null } catch { $global:LASTEXITCODE = 1 }
    if ($LASTEXITCODE -eq 0) { $ObsSetup = 'ok' } else { $ObsSetup = 'failed' }
  }
  if ($Mode -eq 'check') {
    if ($ObsSetup -eq 'ok') { Say '[ok] Obsidian is set up for the memory vault: the vault is registered and the command line interface is on.' }
    elseif ($ObsSetup -eq 'failed') { Say '[skipped] Obsidian is not set up for this folder yet: run this script without -Check (or: node memory/tools/obsidian-setup.mjs).' }
    elseif ($ObsSetup -eq 'nonode') { Say '[skipped] Obsidian is not set up for this folder yet: it needs Node.js first; then run this script without -Check.' }
  }
}

Say ''
Say 'What remains'
if ($Declined) { Say '  First: run this script again and press Enter at the question to install what is marked [missing] above.' }
elseif ($Missing) {
  if ($Mode -eq 'check') { Say '  First: run this script without -Check to install what is marked [missing] above.' }
  else { Say '  First: install what is marked [missing] above (run this script again, or install it by hand).' }
}
Say '  1. Open this folder in Claude Code: type claude in this folder (or open the folder in the Claude desktop app).'
Say '  2. Claude Code asks you to approve the two servers in .mcp.json (meta-ads and fal): approve them.'
Say '  3. In Claude Code type /mcp, pick meta-ads and log in, in the browser where the Owner is signed in to Facebook.'
Say '     Then pick fal and log in (optional: paid pictures). Start a new session afterwards so the tools load.'
Say '  4. Type /setup and answer the wizard.'
Say "  5. The Owner's Meta console steps are listed by the wizard and in docs/meta-setup-guide.md."
# The memory vault in Obsidian: the result of obsidian-setup.mjs above, after a run that went ahead. Nothing
# for the Owner to click; the memory hooks ship in .claude/settings.json.
if (($Mode -ne 'check') -and -not $Declined) {
  if ($ObsSetup -eq 'ok') {
    Say '  6. Obsidian is set up: the vault is registered, the command line interface is on, the app opened on your HOME page.'
    Say '     (If Obsidian was already open before this run, close and reopen it once so its command line answers.)'
  }
  elseif ($ObsSetup -eq 'notool') {
    Say '  6. Obsidian is not set up: memory/tools/obsidian-setup.mjs is missing. Unzip the harness again to get it.'
  }
  elseif ($ObsSetup -eq 'noapp') {
    Say '  6. Obsidian is not installed, so the memory vault is not set up in it yet (the notes work without it).'
    Say ('     Install it (run this script again, or get it free from ' + $ObsidianPage + '); then node memory/tools/obsidian-setup.mjs finishes it.')
  }
  elseif ($ObsSetup -eq 'nonode') {
    Say '  6. Obsidian is installed but not set up yet: this window does not find Node.js.'
    Say '     Open a new terminal window in this folder and run: node memory/tools/obsidian-setup.mjs'
  }
  else {
    Say '  6. Obsidian could not be set up from here. Run: node memory/tools/obsidian-setup.mjs (it says why, and finishes it).'
  }
}
# The setup progress page (dashboard/setup.html): written and opened at the end of a run that went ahead,
# never under -Check or after a No. The marks are this run's results: done when the tool was found or installed.
if (($Mode -ne 'check') -and -not $Declined -and (Test-Path -LiteralPath 'dashboard/setup-page.mjs' -PathType Leaf)) {
  $pageNode = Get-Version 'node'
  if ($pageNode) {
    $pageMajor = 0
    if ($pageNode -match '^v?(\d+)\.') { $pageMajor = [int]$Matches[1] }
    $markGit = if ((Get-Version 'git') -or ($Recheck -contains 'git')) { 'done' } else { 'todo' }
    $markNode = if (($pageMajor -ge 20) -or ($Recheck -contains 'node')) { 'done' } else { 'todo' }
    $markClaude = if ((Get-Version 'claude') -or ($Recheck -contains 'claude')) { 'done' } else { 'todo' }
    $markObsidian = if ($obsNow) { 'done' } else { 'todo' }
    $pageArgs = @('dashboard/setup-page.mjs', '--mark', "install.git=$markGit", '--mark', "install.node=$markNode", '--mark', "install.claude=$markClaude", '--mark', "obsidian.installed=$markObsidian")
    if ($ObsSetup -eq 'ok') { $pageArgs += @('--mark', 'obsidian.vault_opened=done', '--mark', 'obsidian.cli=done') }
    $pageArgs += '--open'
    Say ''
    $global:LASTEXITCODE = 0
    try { & node @pageArgs *> $null } catch { $global:LASTEXITCODE = 1 }
    if ($LASTEXITCODE -eq 0) { Say 'A progress page opened in your browser; keep it beside Claude Code: dashboard/setup.html' }
    else { Say 'The progress page could not be written (node dashboard/setup-page.mjs failed); /setup opens it later.' }
  } elseif ($PageTodo) {
    Say ''
    Say 'The progress page needs Node.js, which this window does not find yet; /setup opens it later.'
  }
}
Say ''
if ($Declined) { Say 'Result: nothing was installed; run this script again when you are ready.'; exit 1 }
if ($Missing) { Say 'Result: something required is still missing (marked [missing] above).'; exit 1 }
Say 'Result: everything required is in place.'
exit 0
