# bootstrap.ps1: the first command for a new copy of the Marketing Team Harness, for Windows (Windows
# PowerShell 5.1 or PowerShell 7). On macOS, bootstrap.sh does the same steps.
# Run it from the harness folder (the one that contains CLAUDE.md and .mcp.json):
#   powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1          check, and offer to install what is missing
#   powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 -Check   report only: no questions, no installs
#   powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 -Yes     yes to every missing REQUIRED item
#   powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 -Help    show the usage
# Tags: [ok] already there, [installed] put in place by this run, [missing] not there, [skipped] an optional
# item left out. Exit codes: 0 everything required is present, 1 something required is missing, 2 wrong
# folder or unknown option. It never asks for, reads or prints a token: .env is only copied from .env.example.
param([switch]$Check, [switch]$Yes, [switch]$Help)
Set-StrictMode -Version 2
$ErrorActionPreference = 'Continue'

$Missing = $false; $Recheck = @(); $Done = $false; $Agreed = $false
function Say([string]$text) { Write-Host $text }
function Note([string]$text) { Write-Host ('        ' + $text) }
function Show-Usage {
  Say 'Usage: powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 [-Check] [-Yes] [-Help]'
  Say '  (no option)  check, and offer to install what is missing (one y/N question per item; Enter means No)'
  Say '  -Check       report only: no questions, no installs, nothing changed'
  Say '  -Yes         yes to every missing required item; optional items are skipped'
  Say '  -Help        show this text'
  Say 'Run it from the harness folder (the one that contains CLAUDE.md and .mcp.json).'
}
if ($args.Count -gt 0) { Say ('Unknown option: ' + ($args -join ' ')); Show-Usage; exit 2 }
if ($Help) { Show-Usage; exit 0 }
if ([Environment]::OSVersion.Platform -ne 'Win32NT') { Say 'bootstrap.ps1 is for Windows. On macOS, run: bash bootstrap.sh'; exit 2 }

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

# Ask <question> <required>: true for yes. Enter, or no answer at all, means No.
function Ask([string]$question, [bool]$required) {
  if ($Yes) {
    if ($required) { Note "$question [y/N]: yes (-Yes)"; return $true }
    return $false
  }
  $answer = ''
  try { $answer = Read-Host ('        ' + $question + ' [y/N]') } catch { $answer = '' }
  return ($answer -match '^\s*(y|yes)\s*$')
}

# Offer <name> <required> <what it downloads> <command as shown> <scriptblock>: states the download, asks once,
# runs the command. Callers invoke Offer as a plain statement, never inside an expression, so an installer's
# own prompts reach the console. Sets $script:Agreed on a yes and $script:Done when the command succeeded.
function Offer([string]$name, [bool]$required, [string]$from, [string]$shown, [scriptblock]$run) {
  $script:Done = $false; $script:Agreed = $false
  Note "This downloads $from."
  if (-not (Ask "Install $name now?" $required)) {
    if ($required) { Note 'Not installed. Run this script again when you are ready.' }
    return
  }
  $script:Agreed = $true
  Note "Running: $shown"
  $global:LASTEXITCODE = 0
  try { & $run } catch { Note ('The install stopped with an error: ' + $_.Exception.Message); return }
  if ($LASTEXITCODE -ne 0) { Note "The install did not finish (exit code $LASTEXITCODE)."; return }
  $script:Done = $true
}

# Install-Pkg <name> <winget id> <download page> [<required, $true by default>]: installs one package with winget.
function Install-Pkg([string]$name, [string]$id, [string]$page, [bool]$required = $true) {
  $script:Done = $false; $script:Agreed = $false
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Note 'winget (the Windows Package Manager) was not found. Get App Installer from the Microsoft Store:'
    Note "https://apps.microsoft.com/detail/9NBLGGH4NNS1 , or download $name from $page"
    return
  }
  Offer $name $required "$name from the winget catalogue (the Windows Package Manager)" "winget install --id $id -e --source winget" ({ & winget install --id $id -e --source winget }.GetNewClosure())
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

# Fix <name> <item>: after a [missing] line, installs unless -Check, and queues the item for the re-check.
function Fix([string]$name, [string]$item) {
  if ($Check) { $script:Missing = $true; return }
  if ($item -eq 'git') { Install-Pkg 'Git' 'Git.Git' 'https://git-scm.com/downloads' }
  elseif ($item -eq 'node') { Install-Pkg 'Node.js' 'OpenJS.NodeJS.LTS' 'https://nodejs.org/en/download' }
  else { Install-Claude }
  if ($script:Done) {
    Update-SessionPath
    Say "[installed] $name. A new terminal window may be needed before the command is found."
    $script:Recheck += $item
  } else { $script:Missing = $true }
}

Say 'Marketing Team Harness: first-time setup'
Say ('Folder: ' + (Get-Location).Path)
if ($Check) { Say 'Mode: check only. Nothing is installed or changed.' }
elseif ($Yes) { Say 'Mode: yes to every missing required item. Optional items are skipped.' }
else { Say 'Mode: one question before each install. Enter means No.' }
Say 'No token or password is ever asked for here.'

Say ''
Say 'Required'
if ((Test-Git) -ne 0) { Fix 'Git' 'git' }
if ((Test-Node) -ne 0) { Fix 'Node.js' 'node' }
$rc = Test-Claude
if ($rc -eq 1) { Fix 'Claude Code' 'claude' } elseif ($rc -eq 2) { $Missing = $true }

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

if (Test-Path -LiteralPath '.env' -PathType Leaf) { Say '[ok] .env exists (contents never shown).' }
elseif (-not (Test-Path -LiteralPath '.env.example' -PathType Leaf)) { Say '[missing] .env.example is missing, so .env cannot be created. Unzip the harness again.'; $Missing = $true }
elseif ($Check) { Say '[missing] .env does not exist yet. Run this script without -Check to create it from .env.example.'; $Missing = $true }
else {
  try {
    Copy-Item -LiteralPath '.env.example' -Destination '.env' -ErrorAction Stop
    Say '[installed] .env created from .env.example (contents never shown).'
    Note 'Later the Owner pastes the Meta System User token into .env with a text editor, never into the chat.'
  } catch { Say '[missing] .env could not be created. Copy .env.example to .env by hand.'; $Missing = $true }
}

Say ''
Say 'Optional'
if (Test-Path -LiteralPath 'node_modules\playwright-core\package.json') { Say '[ok] playwright-core is installed (for the still renderer).' }
elseif ($Check) { Say '[skipped] playwright-core is not installed (optional: only the still renderer needs it).' }
elseif ($Yes) { Say '[skipped] playwright-core is not installed (optional items are skipped under -Yes).' }
elseif (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Say '[skipped] playwright-core needs Node.js first (optional: only the still renderer needs it).' }
else {
  Say '[missing] playwright-core is not installed (optional: only the still renderer needs it).'
  Offer 'playwright-core' $false 'playwright-core (a few megabytes) from the npm registry into node_modules in this folder' 'npm install --no-save --no-package-lock playwright-core' { & npm install --no-save --no-package-lock playwright-core }
  if ($Done) { Say '[installed] playwright-core.' } else { Say '[skipped] playwright-core. Install it later with: npm install --no-save --no-package-lock playwright-core' }
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
function Test-FFmpeg {   # FFmpeg for the video plugin: reports it, and offers it (optional) unless -Check or -Yes
  $v = Get-FFmpegVersion
  if ($v) { Say "[ok] FFmpeg is installed for the video plugin ($v)."; return }
  if ($Check) { Say '[skipped] FFmpeg is not installed (optional: the video plugin needs it to render).'; return }
  if ($Yes) { Say '[skipped] FFmpeg is not installed (optional items are skipped under -Yes).'; return }
  Say '[missing] FFmpeg is not installed (optional: the video plugin needs it to render).'
  Install-Pkg 'FFmpeg' 'Gyan.FFmpeg' 'https://ffmpeg.org/download.html' $false
  if ($script:Done) { Update-SessionPath; Say '[installed] FFmpeg. A new terminal window may be needed before the command is found.' }
  else { Say '[skipped] FFmpeg. The video plugin cannot render until it is installed.' }
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
if (-not (Get-Version 'claude')) { Say '[skipped] The HyperFrames video plugin needs Claude Code first (optional: only for silent video ads).' }
elseif ($hfMajor -lt 22) {
  if (Test-Hyperframes) { Say "[ok] The HyperFrames video plugin is installed, but it needs Node.js 22 or newer to render ($hfFound)." }
  else { Say "[skipped] The HyperFrames video plugin needs Node.js 22 or newer ($hfFound; the harness itself needs 20 or newer)." }
  Note 'Install the current Node.js LTS (https://nodejs.org/en/download), then run this script again.'
}
else {
  Test-FFmpeg
  if (Test-Hyperframes) { Say '[ok] The HyperFrames video plugin is installed.' }
  elseif (-not (Test-Path -LiteralPath 'vendor\hyperframes\.claude-plugin\marketplace.json' -PathType Leaf)) { Say "[skipped] The HyperFrames video plugin's files are missing from vendor/hyperframes. Unzip the harness again to get them." }
  elseif ($Check) { Say '[skipped] The HyperFrames video plugin is not installed (optional: only for silent video ads).' }
  elseif ($Yes) { Say '[skipped] The HyperFrames video plugin is not installed (optional items are skipped under -Yes).' }
  else {
    Say '[missing] The HyperFrames video plugin is not installed (optional: only for silent video ads).'
    Note "The plugin's files are in this folder (vendor/hyperframes); the renderer itself (npx hyperframes) is fetched from the npm registry the first time a video is made."
    $Done = $false
    if (Ask 'Install the HyperFrames video plugin now?' $false) { Install-Hyperframes }
    if ($Done) { Say '[installed] The HyperFrames video plugin. Start a new Claude Code session so it loads.' } else { Say '[skipped] The HyperFrames video plugin. Install it later with the two lines in vendor/hyperframes/VENDOR.md.' }
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

Say ''
Say 'What remains'
if ($Missing) {
  if ($Check) { Say '  First: run this script without -Check to install what is marked [missing] above.' }
  else { Say '  First: install what is marked [missing] above (run this script again, or install it by hand).' }
}
Say '  1. Open this folder in Claude Code: type claude in this folder (or open the folder in the Claude desktop app).'
Say '  2. Claude Code asks you to approve the two servers in .mcp.json (meta-ads and fal): approve them.'
Say '  3. In Claude Code type /mcp, pick meta-ads and log in, in the browser where the Owner is signed in to Facebook.'
Say '     Then pick fal and log in (optional: paid pictures). Start a new session afterwards so the tools load.'
Say '  4. Type /setup and answer the wizard.'
Say "  5. The Owner's Meta console steps are listed by the wizard and in docs/meta-setup-guide.md."
Say ''
if ($Missing) { Say 'Result: something required is still missing (marked [missing] above).'; exit 1 }
Say 'Result: everything required is in place.'
exit 0
