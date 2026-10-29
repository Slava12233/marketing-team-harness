# bootstrap.ps1: the first command for a new copy of the Marketing Team Harness, for Windows (Windows
# PowerShell 5.1 or PowerShell 7). On macOS, bootstrap.sh does the same steps.
# Run it from the harness folder (the one that contains CLAUDE.md and .mcp.json):
#   powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1          check everything, list what is missing, then one question installs all of it
#   powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 -Ask     ask per item: one y/N question before each install
#   powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 -Yes     install everything that is missing, with no question at all
#   powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 -Check   report only: no questions, no installs
#   powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 -Help    show the usage
# The one install takes every missing item, required, recommended and optional alike (Git, Node.js, Claude Code,
# the Claude desktop app, Google Chrome, playwright-core, Obsidian for the memory vault, the Node.js LTS upgrade
# the video plugin needs when Node.js is 20 or 21, FFmpeg, the HyperFrames video plugin from vendor\hyperframes),
# copies .env.example to .env (and limits it to this Windows user), sets Obsidian up for the vault
# (memory/tools/obsidian-setup.mjs: the vault is registered, the command line interface is on, the app opens; no
# click) and opens the setup progress page. After each install this window's PATH is refreshed, so a Node.js
# installed by this run is used by the later steps of the same run.
# Each installer (winget, the Claude Code installer, npm, claude plugin install) runs under a 20-minute bound:
# past it the install is stopped (its process tree is killed), reported, and the run goes on.
# The harness files listed in docs/release-manifest.txt are checked for presence (no hashing) at the end of
# Required; company-written areas (config/, plans/, the memory notes) are not counted.
# Every copy is a new business: memory/tools/instance.mjs compares the instance marker (.harness-instance.json)
# with this folder and computer; a new copy (no marker, or one from another folder or computer) is reset with no
# question (-Check only reports it): another company's files are moved to .previous-company/<stamp>/ (nothing
# is deleted), the blank templates of templates/company/ come back, .env is recreated from .env.example.
# Every run writes bootstrap.log in this folder (overwritten per run: the mode, the date and every line this
# script prints, never the contents of .env) and dashboard/bootstrap-result.json (the mode, the exit code and
# each item's tag and version), -Check included.
# Enter at its question means Yes; Enter at an -Ask question means No.
# Tags: [ok] already there, [installed] put in place by this run, [missing] not there, [skipped] an optional
# item left out, [todo] a step a later command does. Exit codes: 0 everything required is present, 1 something
# required is missing or the install was declined, 2 wrong folder or unknown option. It never asks for, reads
# or prints a token: .env is only copied from .env.example.
param([switch]$Check, [switch]$Ask, [switch]$Yes, [switch]$Help)
Set-StrictMode -Version 2
$ErrorActionPreference = 'Continue'

$Missing = $false; $Recheck = @(); $Done = $false; $Agreed = $false; $RecoMissing = @(); $TimedOut = $false
$Plan = @(); $EnvTodo = $false; $PageTodo = $false; $Go = $false; $Declined = $false; $NoAnswer = $false
$LogPath = ''; $Cur = ''; $BoundMs = 1200000
$WingetFlags = '-e --source winget --accept-package-agreements --accept-source-agreements'
$ClaudeDir = Join-Path $env:USERPROFILE '.local\bin'
# The items of dashboard/bootstrap-result.json, each with the tag of the last line printed for it.
$ItemKeys = @('git', 'node', 'claude', 'env', 'manifest', 'app', 'chrome', 'playwright', 'obsidian', 'node_upgrade', 'ffmpeg', 'hyperframes', 'obsidian_setup', 'routines', 'instance')
$Items = @{}
foreach ($k in $ItemKeys) { $Items[$k] = @{ status = 'skipped'; version = '' } }

function Write-Log([string]$text) {   # one line into bootstrap.log (only what this script prints)
  if (-not $script:LogPath) { return }
  try { Add-Content -LiteralPath $script:LogPath -Value $text -Encoding UTF8 -ErrorAction Stop } catch { }
}
function Set-Result([string]$item, [string]$status) {   # a re-check's [ok] keeps an [installed]
  if (-not $item) { return }
  if (($status -eq 'ok') -and ($script:Items[$item].status -eq 'installed')) { return }
  $script:Items[$item].status = $status
}
function Set-Version([string]$item, [string]$version) { if ($item -and $version) { $script:Items[$item].version = $version } }
function Say([string]$text) {
  Write-Host $text
  Write-Log $text
  $m = [regex]::Match($text, '^\[(ok|installed|missing|skipped|todo)\] ')
  if ($m.Success) { Set-Result $script:Cur $m.Groups[1].Value }
}
function Note([string]$text) { Write-Host ('        ' + $text); Write-Log ('        ' + $text) }
function Get-Capital([string]$text) { if (-not $text) { return $text }; return ($text.Substring(0, 1).ToUpper() + $text.Substring(1)) }
function Get-Major([string]$v) { if ($v -match '^v?(\d+)\.') { return [int]$Matches[1] }; return 0 }
function Format-JsonText([string]$text) { return (($text -replace '\\', '\\' -replace '"', '\"') -replace '[\x00-\x1f]', '') }
function Get-RunMode { if ($Mode -eq 'all' -and $Yes) { return 'yes' }; return $Mode }
function Get-Now { return (Get-Date).ToString("yyyy-MM-dd'T'HH':'mm':'sszzz", [Globalization.CultureInfo]::InvariantCulture) }
function Write-Result([int]$code) {   # dashboard/bootstrap-result.json, written by hand (Node.js may be what is missing)
  $lines = @('{', ('  "ran": "' + (Get-Now) + '",'), ('  "mode": "' + (Get-RunMode) + '",'), '  "script": "bootstrap.ps1",', ('  "exit": ' + $code + ','), '  "items": {')
  $i = 0
  foreach ($k in $ItemKeys) {
    $i++; $sep = ','; if ($i -eq $ItemKeys.Count) { $sep = '' }
    $lines += ('    "' + $k + '": {"status": "' + $Items[$k].status + '", "version": "' + (Format-JsonText $Items[$k].version) + '"}' + $sep)
  }
  $lines += @('  }', '}')
  try {
    $dir = Join-Path (Get-Location).ProviderPath 'dashboard'
    if (-not (Test-Path -LiteralPath $dir -PathType Container)) { New-Item -ItemType Directory -Path $dir -ErrorAction Stop | Out-Null }
    [System.IO.File]::WriteAllText((Join-Path $dir 'bootstrap-result.json'), (($lines -join "`n") + "`n"))
  } catch { Write-Host 'dashboard/bootstrap-result.json could not be written.' }
}
function Stop-Run([int]$code) { Write-Result $code; exit $code }
function Show-Usage {
  Say 'Usage: powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 [-Ask | -Yes | -Check] [-Help]'
  Say '  (no option)  check, list what is missing, then one question installs all of it (Enter means Yes)'
  Say '  -Ask         ask per item: one y/N question before each install (Enter means No)'
  Say '  -Yes         install everything that is missing, required and optional, with no question'
  Say '  -Check       report only: no questions, no installs (it writes only bootstrap.log and dashboard/bootstrap-result.json)'
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
$Root = (Get-Location).ProviderPath
# bootstrap.log: overwritten per run; the mode, the date, then every line Say and Note print.
$LogPath = Join-Path $Root 'bootstrap.log'
try { [System.IO.File]::WriteAllText($LogPath, ('bootstrap.ps1, mode ' + (Get-RunMode) + ', ' + (Get-Now) + "`r`n")) } catch { $LogPath = '' }

# Read-Answer: one typed line with the spaces taken out, or $null when nothing could be read (the input is
# closed, or PowerShell runs non-interactive). When the input is not a console, Read-Host itself prints the
# line after the question, so the console shows it. The log gets the decision (yes or no), never the typing.
function Read-Answer {
  $line = $null
  try { $line = Read-Host } catch { $line = $null }
  if ($null -eq $line) { Write-Host ''; return $null }
  return ($line -replace '\s', '')
}

# Ask-Item <question>: one -Ask question; true for yes. Enter, or no answer at all, means No.
function Ask-Item([string]$question) {
  Write-Host ('        ' + $question + ' [y/N]: ') -NoNewline
  $yesNow = ((Read-Answer) -match '^(y|yes)$')
  $said = 'no'; if ($yesNow) { $said = 'yes' }
  Write-Log ('        ' + $question + ' [y/N]: ' + $said)
  return $yesNow
}

# Confirm-All <question>: the one question of a default run; true for yes. Enter means Yes; no answer at all
# (the input is closed) means No and sets $script:NoAnswer.
function Confirm-All([string]$question) {
  Write-Host ($question + ' [Y/n]: ') -NoNewline
  $answer = Read-Answer
  if ($null -eq $answer) { $script:NoAnswer = $true; Write-Log ($question + ' [Y/n]: (no answer)'); return $false }
  $yesNow = ($answer -match '^(y|yes)?$')
  $said = 'no'; if ($yesNow) { $said = 'yes' }
  Write-Log ($question + ' [Y/n]: ' + $said)
  return $yesNow
}

# Adds the Machine and User PATH entries an installer just wrote to this window's PATH, and the Claude Code
# folder (%USERPROFILE%\.local\bin) when it exists (nothing is removed).
function Update-SessionPath {
  $have = @($env:Path -split ';')
  foreach ($scope in @('Machine', 'User')) {
    $p = [Environment]::GetEnvironmentVariable('Path', $scope)
    if (-not $p) { continue }
    foreach ($d in ($p -split ';')) { if ($d -and ($have -notcontains $d)) { $env:Path = $env:Path + ';' + $d; $have += $d } }
  }
  if ((Test-Path -LiteralPath $ClaudeDir -PathType Container) -and ($have -notcontains $ClaudeDir)) { $env:Path = $env:Path + ';' + $ClaudeDir }
}

# Invoke-Bounded <command> <arguments as one line>: runs one installer in this window under the 20-minute
# bound. Past it the process tree is killed (taskkill /T /F), $script:TimedOut is set and the exit code is 124.
# A .cmd (npm) runs through cmd.exe. Sets $global:LASTEXITCODE.
function Invoke-Bounded([string]$exe, [string]$argLine) {
  $script:TimedOut = $false
  $file = ''
  foreach ($c in @(Get-Command $exe -CommandType Application -All -ErrorAction SilentlyContinue)) {
    if ($c.Path -match '\.(exe|cmd|bat|com)$') { $file = $c.Path; break }
  }
  if (-not $file) { Note "$exe was not found."; $global:LASTEXITCODE = 127; return }
  if ($file -match '\.(cmd|bat)$') {
    $argLine = '/d /s /c ""' + $file + '" ' + $argLine + '"'
    $file = Join-Path $env:SystemRoot 'System32\cmd.exe'
  }
  $sp = @{ FilePath = $file; NoNewWindow = $true; PassThru = $true }
  if ($argLine) { $sp['ArgumentList'] = $argLine }
  try { $proc = Start-Process @sp -ErrorAction Stop } catch { Note ('The install could not start: ' + $_.Exception.Message); $global:LASTEXITCODE = 1; return }
  $null = $proc.Handle   # keeps the handle, so the exit code can be read after the process ends
  if (-not $proc.WaitForExit($BoundMs)) {
    & taskkill /PID $proc.Id /T /F *> $null
    $script:TimedOut = $true; $global:LASTEXITCODE = 124; return
  }
  $proc.WaitForExit()
  $global:LASTEXITCODE = $proc.ExitCode
}

# Offer <name> <required> <what it downloads> <command as shown> <command> <arguments>: runs one install.
# Under -Ask it first states the download and asks; in the one-question install (a default run after its yes,
# or -Yes) it runs at once, the plan having named the source. Callers invoke Offer as a plain statement, never
# inside an expression, so an installer's own output reaches the console. Sets $script:Agreed when the install
# goes ahead, $script:Done when the command succeeded and $script:TimedOut (with its [missing] or [skipped]
# line) when the 20-minute bound stopped it.
function Offer([string]$name, [bool]$required, [string]$from, [string]$shown, [string]$exe, [string]$argLine) {
  $script:Done = $false; $script:Agreed = $false; $script:TimedOut = $false
  if ($Mode -eq 'ask') {
    Note "This downloads $from."
    if (-not (Ask-Item "Install $name now?")) {
      if ($required) { Note 'Not installed. Run this script again when you are ready.' }
      return
    }
  }
  $script:Agreed = $true
  Note "Running: $shown"
  Invoke-Bounded $exe $argLine
  $rc = $LASTEXITCODE
  Update-SessionPath
  if ($script:TimedOut) {
    $tag = '[skipped]'; if ($required) { $tag = '[missing]' }
    Say ($tag + ' ' + (Get-Capital $name) + ': the install took longer than 20 minutes and was stopped; run this script again.')
    return
  }
  if ($rc -ne 0) { Note "The install did not finish (exit code $rc)."; return }
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
  $script:Done = $false; $script:Agreed = $false; $script:TimedOut = $false
  $from = Get-PkgFrom
  if (-not $from) { Show-PkgHint $name $page; return }
  $wargs = "install --id $id $WingetFlags"
  Offer $name $required "$name from $from" "winget $wargs" 'winget' $wargs
}

function Get-Version([string]$exe) {   # first line of "<exe> --version", or '' when absent or failing
  if (-not (Get-Command $exe -ErrorAction SilentlyContinue)) { return '' }
  $global:LASTEXITCODE = 0
  try { $out = @(& $exe --version 2>$null) } catch { return '' }
  if ($LASTEXITCODE -ne 0 -or $out.Count -eq 0) { return '' }
  return ([string]$out[0]).Trim()
}

function Test-Git {
  $script:Cur = 'git'
  $v = Get-Version 'git'; Set-Version 'git' $v
  if ($v) { Say "[ok] Git is installed ($v)."; return 0 }
  Say '[missing] Git is not installed.'; return 1
}
function Test-Node {
  $script:Cur = 'node'
  $v = Get-Version 'node'; $m = Get-Major $v; Set-Version 'node' $v
  if ($m -ge 20) { Say "[ok] Node.js $v is installed (20 or newer is needed)."; return 0 }
  if ($v) { Say "[missing] Node.js $v is too old (20 or newer is needed)." } else { Say '[missing] Node.js is not installed (20 or newer is needed).' }
  return 1
}
function Test-Claude {   # 0 ok, 1 not installed, 2 installed but its folder is not on PATH
  $script:Cur = 'claude'
  $v = Get-Version 'claude'; Set-Version 'claude' $v
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
  Offer 'Claude Code' $true 'Claude Code from claude.ai (the official installer)' 'irm https://claude.ai/install.ps1 | iex' 'powershell' ('-NoProfile -ExecutionPolicy Bypass -Command "' + $cmd + '"')
  if ($script:TimedOut) { return }
  if ($script:Done -and ((Get-Command claude -ErrorAction SilentlyContinue) -or (Test-Path -LiteralPath (Join-Path $ClaudeDir 'claude.exe')))) { return }
  if (-not $script:Agreed) { return }
  $script:Done = $false
  Note 'The official installer did not work; trying the npm route instead.'
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Note 'npm was not found: install Node.js first, then run this script again.'; return }
  Note 'This downloads Claude Code from the npm registry.'
  Note 'Running: npm install -g @anthropic-ai/claude-code'
  Invoke-Bounded 'npm' 'install -g @anthropic-ai/claude-code'
  $rc = $LASTEXITCODE
  Update-SessionPath
  if ($script:TimedOut) { Say '[missing] Claude Code: the install took longer than 20 minutes and was stopped; run this script again.'; return }
  $script:Done = ($rc -eq 0)
}

# Put <name> <item>: installs one required item: [installed] and a re-check at the end when it worked,
# otherwise it stays missing.
function Put([string]$name, [string]$item) {
  $script:Cur = $item
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
Say ('Folder: ' + $Root)
if ($Mode -eq 'check') { Say 'Mode: check only. Nothing is installed; only bootstrap.log and dashboard/bootstrap-result.json are written.' }
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

function Protect-Env {   # limits .env to this Windows user (read and write); a failure is a note, never fatal
  $global:LASTEXITCODE = 0
  try { & icacls '.env' /inheritance:r /grant:r ("${env:USERNAME}:(R,W)") *> $null } catch { $global:LASTEXITCODE = 1 }
  if ($LASTEXITCODE -ne 0) { Note 'The permissions of .env could not be limited to your Windows user (icacls); the file works as it is.' }
}
function Copy-Env {   # copies .env.example to .env; an .env that exists by now is left as it is
  $script:Cur = 'env'
  if (Test-Path -LiteralPath '.env' -PathType Leaf) { Say '[ok] .env exists (contents never shown).'; return }
  try {
    Copy-Item -LiteralPath '.env.example' -Destination '.env' -ErrorAction Stop
    Say '[installed] .env created from .env.example (contents never shown).'
    Note 'Later the Owner pastes the Meta System User token into .env with a text editor, never into the chat.'
    Protect-Env
  } catch { Say '[missing] .env could not be created. Copy .env.example to .env by hand.'; $script:Missing = $true }
}
$Cur = 'env'
if (Test-Path -LiteralPath '.env' -PathType Leaf) { Say '[ok] .env exists (contents never shown).' }
elseif (-not (Test-Path -LiteralPath '.env.example' -PathType Leaf)) { Say '[missing] .env.example is missing, so .env cannot be created. Unzip the harness again.'; $Missing = $true }
elseif ($Mode -eq 'check') { Say '[missing] .env does not exist yet. Run this script without -Check to create it from .env.example.'; $Missing = $true }
elseif ($Mode -eq 'ask') { Copy-Env }
else { Say '[missing] .env does not exist yet.'; $EnvTodo = $true }

# The harness files: every path of docs/release-manifest.txt under the harness's own areas must exist (presence
# only, no hashing). Company-written areas (config/, plans/, memory notes such as memory/business/ and
# memory/HOME.en.md) are rewritten or deleted by the wizard, so they are not counted.
$ManifestDirs = @('.claude/', 'creatives/tools/', 'creatives/landing-template/', 'creatives/preview-template/', 'dashboard/', 'docs/', 'memory/tools/', 'memory/templates/', 'vendor/', 'control-room/')
$ManifestFiles = @('CLAUDE.md', '.mcp.json', '.env.example', 'bootstrap.ps1', 'bootstrap.sh', 'ONBOARDING.md', 'README.md')
function Test-HarnessFiles {
  $script:Cur = 'manifest'
  $mf = Join-Path $Root 'docs\release-manifest.txt'
  if (-not (Test-Path -LiteralPath $mf -PathType Leaf)) { Say '[skipped] The harness file list (docs/release-manifest.txt) is not in this folder, so the files were not counted.'; return }
  $n = 0; $k = 0; $first = ''
  foreach ($line in [System.IO.File]::ReadAllLines($mf)) {
    $i = $line.IndexOf(' ')
    if ($i -lt 1) { continue }
    $p = $line.Substring($i + 1).TrimStart(' ', '*').TrimEnd()
    $take = ($ManifestFiles -ccontains $p)
    if (-not $take) { foreach ($d in $ManifestDirs) { if ($p.StartsWith($d, [StringComparison]::Ordinal)) { $take = $true; break } } }
    if (-not $take) { continue }
    $n++
    if (-not [System.IO.File]::Exists((Join-Path $Root $p))) { $k++; if (-not $first) { $first = $p } }
  }
  if ($k -eq 0) { Say "[ok] The harness files are complete ($n files checked)."; return }
  Say "[missing] $k of the harness files are missing (first: $first). Unzip the harness again."
  $script:Missing = $true
}
Test-HarnessFiles

# Recommended: the Claude desktop app and Google Chrome. The app's Code tab is where the harness runs (it carries
# its own copy of Claude Code; the scheduled memory routines, Remote Control and the pairing with the Claude in
# Chrome extension live there). The extension is the harness's hands in the Owner's own browser during /connect,
# and it runs in Chrome (or in Microsoft Edge; the guided setup and its video use Chrome, so Chrome is planned only
# when neither browser is present). winget's Anthropic.Claude package
# carries the Store build (an MSIX whose launcher, claude-desktop.exe, lands in the user's WindowsApps folder) and a
# per-user exe installer (AnthropicClaude). Neither item fails the run when it is missing.
Say ''
Say 'Recommended'
$ClaudeAppArgs = "install --id Anthropic.Claude $WingetFlags"
$ClaudeAppCmd = "winget $ClaudeAppArgs"
$ClaudeAppPage = 'https://claude.ai/download'
$ChromeArgs = "install --id Google.Chrome $WingetFlags"
$ChromeCmd = "winget $ChromeArgs"
$ChromePage = 'https://www.google.com/chrome/'
function Get-ClaudeAppPath {   # where the desktop app is, or '' when it is not there
  $places = @()
  if ($env:LOCALAPPDATA) {
    $places += (Join-Path $env:LOCALAPPDATA 'Microsoft\WindowsApps\claude-desktop.exe')
    $places += (Join-Path $env:LOCALAPPDATA 'AnthropicClaude\claude.exe')
    $places += (Join-Path $env:LOCALAPPDATA 'Programs\Claude\Claude.exe')
  }
  if ($env:ProgramFiles) { $places += (Join-Path $env:ProgramFiles 'Claude\Claude.exe') }
  foreach ($p in $places) { if (Test-Path -LiteralPath $p -PathType Leaf) { return $p } }
  $pkg = $null
  try { $pkg = @(Get-AppxPackage -Name Claude -ErrorAction SilentlyContinue) } catch { $pkg = $null }
  if ($pkg -and $pkg.Count -gt 0) { return ('the Microsoft Store build, version ' + $pkg[0].Version) }
  return ''
}
function Get-ChromePath {   # chrome.exe of a machine or a per-user install, or ''
  $places = @()
  foreach ($base in @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:ProgramW6432)) { if ($base) { $places += (Join-Path $base 'Google\Chrome\Application\chrome.exe') } }
  if ($env:LOCALAPPDATA) { $places += (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe') }
  foreach ($p in $places) { if (Test-Path -LiteralPath $p -PathType Leaf) { return $p } }
  return ''
}
function Test-Edge {   # true when Microsoft Edge is installed (enough for the ad screenshots, not for the extension)
  foreach ($base in @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:ProgramW6432)) {
    if ($base -and (Test-Path -LiteralPath (Join-Path $base 'Microsoft\Edge\Application\msedge.exe') -PathType Leaf)) { return $true }
  }
  return $false
}
function Invoke-ClaudeApp {   # installs the desktop app (after its question under -Ask)
  $script:Cur = 'app'; $script:Done = $false; $script:TimedOut = $false
  $from = Get-PkgFrom
  if (-not $from) {
    Show-PkgHint 'the Claude desktop app' $ClaudeAppPage
    Say ('[skipped] The Claude desktop app. Install it later from ' + $ClaudeAppPage + '; the harness also runs from a terminal (type claude in this folder).')
    return
  }
  Offer 'the Claude desktop app' $false "the Claude desktop app from $from" $ClaudeAppCmd 'winget' $ClaudeAppArgs
  $p = Get-ClaudeAppPath
  if ($script:Done -and $p) { Say "[installed] The Claude desktop app ($p)." }
  elseif ($script:Done) { Say '[installed] The Claude desktop app. Open it from the Start menu, sign in, and click the Code tab.' }
  elseif (-not $script:TimedOut) { Say ('[skipped] The Claude desktop app. Install it later with: ' + $ClaudeAppCmd + ' (or from ' + $ClaudeAppPage + ')') }
}
function Invoke-Chrome {   # installs Google Chrome (after its question under -Ask)
  $script:Cur = 'chrome'; $script:Done = $false; $script:TimedOut = $false
  $from = Get-PkgFrom
  if (-not $from) {
    Show-PkgHint 'Google Chrome' $ChromePage
    Say ('[skipped] Google Chrome. Install it later from ' + $ChromePage)
    return
  }
  Offer 'Google Chrome' $false "Google Chrome from $from" $ChromeCmd 'winget' $ChromeArgs
  $p = Get-ChromePath
  if ($script:Done -and $p) { Say "[installed] Google Chrome ($p)." }
  elseif ($script:Done) { Say '[installed] Google Chrome. A new terminal window may be needed before this script finds it.' }
  elseif (-not $script:TimedOut) { Say ('[skipped] Google Chrome. Install it later with: ' + $ChromeCmd + ' (or from ' + $ChromePage + ')') }
}
$Cur = 'app'
$appWhy = 'recommended: its Code tab is where the harness runs, with the memory routines and the Claude in Chrome pairing'
$appPath = Get-ClaudeAppPath
if ($appPath) { Say "[ok] The Claude desktop app is installed ($appPath)." }
elseif ($Mode -eq 'check') { Say "[missing] The Claude desktop app is not installed ($appWhy). Run this script without -Check to install it."; $RecoMissing += 'the Claude desktop app' }
elseif (($Mode -eq 'all') -and -not (Get-PkgFrom)) {
  Say "[missing] The Claude desktop app is not installed ($appWhy)."
  Show-PkgHint 'the Claude desktop app' $ClaudeAppPage; $RecoMissing += 'the Claude desktop app'
}
else {
  Say "[missing] The Claude desktop app is not installed ($appWhy)."
  if ($Mode -eq 'all') { $Plan += 'app' } else { Invoke-ClaudeApp }
}
$Cur = 'chrome'
$chromePath = Get-ChromePath
if ($chromePath) { Say "[ok] Google Chrome is installed ($chromePath): for the Claude in Chrome extension and the ad screenshots." }
elseif (Test-Edge) {
  Say '[skipped] Google Chrome is not installed; Microsoft Edge was found, and the Claude in Chrome extension runs in Edge too.'
  Note ('The guided setup and its video use Chrome. To add it: ' + $ChromeCmd + ' (or ' + $ChromePage + ')')
}
else {
  $chromeWhy = 'recommended: the Claude in Chrome extension that /connect uses and the ad screenshots need a browser, and neither Chrome nor Edge was found'
  if ($Mode -eq 'check') { Say "[missing] Google Chrome is not installed ($chromeWhy). Run this script without -Check to install it."; $RecoMissing += 'Google Chrome' }
  elseif (($Mode -eq 'all') -and -not (Get-PkgFrom)) {
    Say "[missing] Google Chrome is not installed ($chromeWhy)."
    Show-PkgHint 'Google Chrome' $ChromePage; $RecoMissing += 'Google Chrome'
  }
  else {
    Say "[missing] Google Chrome is not installed ($chromeWhy)."
    if ($Mode -eq 'all') { $Plan += 'chrome' } else { Invoke-Chrome }
  }
}

Say ''
Say 'Optional'
function Invoke-Playwright {   # installs playwright-core into node_modules here (after its question under -Ask)
  $script:Cur = 'playwright'
  Offer 'playwright-core' $false 'playwright-core (a few megabytes) from the npm registry into node_modules in this folder' 'npm install --no-save --no-package-lock playwright-core' 'npm' 'install --no-save --no-package-lock playwright-core'
  if ($script:Done) { Say '[installed] playwright-core.' }
  elseif (-not $script:TimedOut) { Say '[skipped] playwright-core. Install it later with: npm install --no-save --no-package-lock playwright-core' }
}
$Cur = 'playwright'
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
$ObsidianArgs = "install --id Obsidian.Obsidian $WingetFlags"
$ObsidianCmd = "winget $ObsidianArgs"
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
  $script:Cur = 'obsidian'; $script:Done = $false; $script:TimedOut = $false
  $from = Get-PkgFrom
  if (-not $from) {
    Show-PkgHint 'Obsidian' $ObsidianPage
    Say '[skipped] Obsidian. Install it later; the vault notes are plain Markdown files and work without it.'
    return
  }
  Offer 'Obsidian' $false "Obsidian (free, also for commercial use) from $from" $ObsidianCmd 'winget' $ObsidianArgs
  $p = Get-ObsidianPath
  if ($script:Done -and $p) { Say "[installed] Obsidian ($p)." }
  elseif ($script:Done) { Say '[installed] Obsidian. A new terminal window may be needed before this script finds it.' }
  elseif (-not $script:TimedOut) { Say ('[skipped] Obsidian. Install it later with: ' + $ObsidianCmd + ' (or from ' + $ObsidianPage + ')') }
}
$Cur = 'obsidian'
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
# With Node.js 20 or 21 (enough for the harness) the Node.js LTS upgrade is an optional item before it: winget
# upgrades its own install and installs the LTS over a foreign one, the normal Node.js upgrade path.
$hfDir = Join-Path $Root 'vendor\hyperframes'
$NodeUpArgs = "install --id OpenJS.NodeJS.LTS $WingetFlags"
$NodeUpCmd = "winget $NodeUpArgs"
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
  $script:Cur = 'ffmpeg'
  Install-Pkg 'FFmpeg' 'Gyan.FFmpeg' 'https://ffmpeg.org/download.html' $false
  if ($script:Done) { Update-SessionPath; Set-Version 'ffmpeg' (Get-FFmpegVersion); Say '[installed] FFmpeg. A new terminal window may be needed before the command is found.' }
  elseif (-not $script:TimedOut) { Say '[skipped] FFmpeg. The video plugin cannot render until it is installed.' }
}
function Test-FFmpeg {   # FFmpeg for the video plugin: reports it; -Ask offers it, the one-question install plans it
  $script:Cur = 'ffmpeg'
  $v = Get-FFmpegVersion; Set-Version 'ffmpeg' $v
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
function Invoke-NodeUpgrade {   # the Node.js LTS upgrade for the video plugin (after its question under -Ask)
  $script:Cur = 'node_upgrade'
  Offer 'the Node.js LTS upgrade' $false ('the Node.js LTS from ' + (Get-PkgFrom)) $NodeUpCmd 'winget' $NodeUpArgs
  if ($script:TimedOut) { return }
  $v = Get-Version 'node'
  if ($script:Done -and ((Get-Major $v) -ge 22)) {
    Set-Version 'node_upgrade' $v
    Say "[installed] Node.js LTS upgrade ($v): the video plugin can be installed now."
    return
  }
  $script:Done = $false
  Say ("[skipped] The Node.js LTS upgrade. Node.js $v stays (the harness works with it); for the video plugin install the current LTS from https://nodejs.org/en/download.")
}
function Install-Hyperframes {   # adds the vendored marketplace (one that already exists is fine), then installs
  $script:Done = $false; $script:TimedOut = $false
  Note ('Running: claude plugin marketplace add "' + $hfDir + '"')
  $global:LASTEXITCODE = 0
  $out = @(& claude plugin marketplace add $hfDir 2>&1 | ForEach-Object { [string]$_ })
  $rc = $LASTEXITCODE
  foreach ($line in $out) { Note $line }
  if ($rc -ne 0 -and -not (($out -join "`n") -match 'already')) { Note "Adding the marketplace did not finish (exit code $rc)."; return }
  Note 'Running: claude plugin install hyperframes@hyperframes'
  Invoke-Bounded 'claude' 'plugin install hyperframes@hyperframes'
  $rc = $LASTEXITCODE
  if ($script:TimedOut) { Say '[skipped] The HyperFrames video plugin: the install took longer than 20 minutes and was stopped; run this script again.'; return }
  if (Test-Hyperframes) { $script:Done = $true; return }
  Note "The install did not finish (exit code $rc)."
}
$hfNode = Get-Version 'node'; $hfMajor = Get-Major $hfNode
$hfFound = 'none found'; if ($hfNode) { $hfFound = $hfNode }
$hfFiles = Test-Path -LiteralPath 'vendor\hyperframes\.claude-plugin\marketplace.json' -PathType Leaf
$hfClaude = ([bool](Get-Version 'claude')) -or ($Plan -contains 'claude')
if (($hfMajor -ge 20) -and ($hfMajor -lt 22) -and $hfFiles -and $hfClaude) {
  $Cur = 'node_upgrade'
  Set-Version 'node_upgrade' $hfNode
  $upLine = "Node.js $hfNode is enough for the harness; the video plugin needs 22 or newer (optional upgrade)."
  if ($Mode -eq 'check') { Say "[skipped] $upLine" }
  elseif (-not (Get-PkgFrom)) { Say "[skipped] $upLine"; Show-PkgHint 'the Node.js LTS' 'https://nodejs.org/en/download' }
  else {
    Say "[missing] $upLine"
    if ($Mode -eq 'all') { $Plan += 'node-upgrade' }
    else {
      Invoke-NodeUpgrade
      $hfNode = Get-Version 'node'; $hfMajor = Get-Major $hfNode
      $hfFound = 'none found'; if ($hfNode) { $hfFound = $hfNode }
    }
  }
}
$Cur = 'hyperframes'
if (-not $hfClaude) { Say '[skipped] The HyperFrames video plugin needs Claude Code first (optional: only for silent video ads).' }
elseif (($hfMajor -lt 22) -and -not ($Plan -contains 'node') -and -not ($Plan -contains 'node-upgrade')) {
  if (Test-Hyperframes) { Say "[ok] The HyperFrames video plugin is installed, but it needs Node.js 22 or newer to render ($hfFound)." }
  else { Say "[skipped] The HyperFrames video plugin needs Node.js 22 or newer ($hfFound; the harness itself needs 20 or newer)." }
  if (($Mode -eq 'check') -and ($hfMajor -ge 20) -and $hfFiles) { Note 'Run this script without -Check to upgrade Node.js (optional), or install the current Node.js LTS from https://nodejs.org/en/download.' }
  else { Note 'Install the current Node.js LTS (https://nodejs.org/en/download), then run this script again.' }
}
else {
  Test-FFmpeg
  $Cur = 'hyperframes'
  if (Test-Hyperframes) { Say '[ok] The HyperFrames video plugin is installed.' }
  elseif (-not $hfFiles) { Say "[skipped] The HyperFrames video plugin's files are missing from vendor/hyperframes. Unzip the harness again to get them." }
  elseif ($Mode -eq 'check') { Say '[skipped] The HyperFrames video plugin is not installed (optional: only for silent video ads).' }
  else {
    Say '[missing] The HyperFrames video plugin is not installed (optional: only for silent video ads).'
    if ($Mode -eq 'all') { $Plan += 'hyperframes' }
    else {
      Note "The plugin's files are in this folder (vendor/hyperframes); the renderer itself (npx hyperframes) is fetched from the npm registry the first time a video is made."
      $Done = $false; $TimedOut = $false
      if (Ask-Item 'Install the HyperFrames video plugin now?') { Install-Hyperframes }
      if ($Done) { Say '[installed] The HyperFrames video plugin. Start a new Claude Code session so it loads.' }
      elseif (-not $TimedOut) { Say '[skipped] The HyperFrames video plugin. Install it later with the two lines in vendor/hyperframes/VENDOR.md.' }
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
  elseif ($item -eq 'app') { Say ('  - The Claude desktop app (its Code tab is where the harness runs), from ' + (Get-PkgFrom)) }
  elseif ($item -eq 'chrome') { Say ('  - Google Chrome (for the Claude in Chrome extension and the ad screenshots), from ' + (Get-PkgFrom)) }
  elseif ($item -eq 'playwright') { Say '  - playwright-core (a few megabytes), from the npm registry into node_modules in this folder' }
  elseif ($item -eq 'obsidian') { Say ('  - Obsidian for the memory vault (free, also for commercial use), from ' + (Get-PkgFrom)) }
  elseif ($item -eq 'node-upgrade') { Say ('  - Node.js LTS upgrade (the video plugin needs 22 or newer; the harness itself needs 20), from ' + (Get-PkgFrom)) }
  elseif ($item -eq 'ffmpeg') { Say ('  - FFmpeg, from ' + (Get-PkgFrom)) }
  else { Say '  - The HyperFrames video plugin, from vendor/hyperframes in this folder (its renderer comes from npm on first use)' }
}
function Install-PlaywrightNow {
  $script:Cur = 'playwright'
  Update-SessionPath
  if (Get-Command npm -ErrorAction SilentlyContinue) { Invoke-Playwright; return }
  Say '[skipped] playwright-core needs Node.js first (optional: only the still renderer needs it).'
  Note 'Open a new terminal window in this folder and run this script again to add it.'
}
function Install-HyperframesNow {
  $script:Cur = 'hyperframes'
  Update-SessionPath
  $v = Get-Version 'node'; $m = Get-Major $v
  $found = 'none found'; if ($v) { $found = $v }
  if (-not (Get-Version 'claude')) { Say '[skipped] The HyperFrames video plugin needs Claude Code first (optional: only for silent video ads).' }
  elseif ($m -lt 22) { Say "[skipped] The HyperFrames video plugin needs Node.js 22 or newer ($found; the harness itself needs 20 or newer)." }
  else {
    Install-Hyperframes
    if ($script:Done) { Say '[installed] The HyperFrames video plugin. Start a new Claude Code session so it loads.' }
    elseif (-not $script:TimedOut) { Say '[skipped] The HyperFrames video plugin. Install it later with the two lines in vendor/hyperframes/VENDOR.md.' }
    return
  }
  Note 'Open a new terminal window in this folder and run this script again to add it.'
}
if ($Mode -eq 'all') {
  if ((Test-Path -LiteralPath 'dashboard/setup-page.mjs' -PathType Leaf) -and ((Get-Version 'node') -or ($Plan -contains 'node'))) { $PageTodo = $true }
  $Cur = ''
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
    $wingetItems = @('git', 'node', 'app', 'chrome', 'obsidian', 'node-upgrade', 'ffmpeg')
    $usesWinget = $false
    foreach ($w in $wingetItems) { if ($Plan -contains $w) { $usesWinget = $true } }
    if ($usesWinget) { Say 'winget may ask Windows for permission (UAC) while it installs.' }
    Say 'Each install is stopped if it takes longer than 20 minutes; the run then goes on and says so.'
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
    if ($Plan -contains 'app') { Invoke-ClaudeApp }
    if ($Plan -contains 'chrome') { Invoke-Chrome }
    if ($EnvTodo) { Copy-Env }
    if ($Plan -contains 'playwright') { Install-PlaywrightNow }
    if ($Plan -contains 'obsidian') { Invoke-Obsidian }
    if ($Plan -contains 'node-upgrade') { Invoke-NodeUpgrade }
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
# A tool installed by this run (Node.js above all) is found by the steps below in this same window.
if ($Mode -ne 'check') { Update-SessionPath }

# Every copy is a new business: memory/tools/instance.mjs compares the instance marker (.harness-instance.json,
# never committed) with this folder and this computer. A run without -Check resets a new copy at once, with no
# question: another company's files go to .previous-company/<stamp>/, the blank templates come back and the
# marker is written. -Check only reports. It never fails the run. Item: ok (this folder's own harness, or reset
# now), todo (a new copy, under -Check), skipped (no Node.js or no tool yet).
$Cur = 'instance'
if ((Test-Path -LiteralPath 'memory/tools/instance.mjs' -PathType Leaf) -and (Get-Version 'node')) {
  $global:LASTEXITCODE = 0
  if ($Mode -eq 'check') {
    try { & node memory/tools/instance.mjs --check --quiet *> $null } catch { $global:LASTEXITCODE = 1 }
    $rc = $LASTEXITCODE
    if ($rc -eq 0) { Say '[ok] This folder is its own harness: the business set up here stays.'; Set-Result 'instance' 'ok' }
    elseif ($rc -eq 3) { Say "[todo] This folder is a new copy: run this script without -Check to start it as a new business (another company's files, if any, are archived in .previous-company/)."; Set-Result 'instance' 'todo' }
    else { Say '[skipped] The new-copy check could not run here (node memory/tools/instance.mjs --check says why).' }
  } else {
    $out = $null
    try { $out = & node memory/tools/instance.mjs --reset --quiet 2> $null } catch { $global:LASTEXITCODE = 1 }
    $rc = $LASTEXITCODE
    $res = [string](@($out) | Where-Object { $_ } | Select-Object -First 1)
    if (($rc -eq 0) -and ($res -eq 'same')) { Say '[ok] This folder is its own harness: the business set up here stays.'; Set-Result 'instance' 'ok' }
    elseif (($rc -eq 0) -and ($res -eq 'marked')) { Say '[ok] This folder starts as a new business: nothing of another company was here.'; Set-Result 'instance' 'ok' }
    elseif (($rc -eq 0) -and $res.StartsWith('archived ')) { Say "[ok] This folder starts as a new business: the previous company's files were moved to $($res.Substring(9))/ and the blank templates put back."; Set-Result 'instance' 'ok' }
    else { Say '[skipped] The new-copy check could not run here (node memory/tools/instance.mjs --reset says why).' }
  }
}

# Obsidian set up with no click: memory/tools/obsidian-setup.mjs registers this folder as a vault in Obsidian's
# own config (obsidian.json), turns on its command line interface there and starts the app on the vault.
# -Check runs it with --check (a report line, nothing changed); a declined run leaves it out. It never fails
# the run. $ObsSetup: ok, failed, noapp, nonode, notool or skipped.
$Cur = 'obsidian_setup'
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
if ($ObsSetup -eq 'ok') { Set-Result 'obsidian_setup' 'ok' }

# The memory routines (.claude/routines/): a nightly memory check and a weekly consolidation review that alert
# the Owner's phone and never act. The desktop app keeps their schedules itself, so only /campaign can register
# them; this script counts the scheduled tasks whose prompt names this folder and never creates one.
$Cur = 'routines'
$Routines = 0
$taskDir = Join-Path $HOME '.claude\scheduled-tasks'
if (Test-Path -LiteralPath $taskDir -PathType Container) {
  $herePath = (Get-Location).Path.Replace('/', '\').TrimEnd('\').ToLowerInvariant()
  foreach ($d in Get-ChildItem -LiteralPath $taskDir -Directory -ErrorAction SilentlyContinue) {
    $skill = Join-Path $d.FullName 'SKILL.md'
    if (-not (Test-Path -LiteralPath $skill -PathType Leaf)) { continue }
    $body = (Get-Content -LiteralPath $skill -Raw -ErrorAction SilentlyContinue)
    if ($body -and $body.Replace('/', '\').ToLowerInvariant().Contains($herePath)) { $Routines++ }
  }
}
if ($Mode -eq 'check') {
  if ($Routines -ge 2) { Say "[ok] The memory routines are registered for this folder ($Routines scheduled tasks)." }
  else { Say '[todo] The memory routines are not registered yet: /campaign registers them in the Claude desktop app (one question).' }
}
if ($Routines -ge 2) { Set-Result 'routines' 'ok' } else { Set-Result 'routines' 'todo' }
$Cur = ''

Say ''
Say 'What remains'
if ($Declined) { Say '  First: run this script again and press Enter at the question to install what is marked [missing] above.' }
elseif ($Missing) {
  if ($Mode -eq 'check') { Say '  First: run this script without -Check to install what is marked [missing] above.' }
  else { Say '  First: install what is marked [missing] above (run this script again, or install it by hand).' }
}
if ($RecoMissing.Count -gt 0) { Say ('  Also: ' + ($RecoMissing -join ' and ') + ' marked [missing] above: run this script again without -Check, or install from the page on that line.') }
Say '  1. Open the Claude desktop app, sign in, click the Code tab and open this folder (Open folder...; trust it when asked).'
Say "     A terminal works too (type claude in this folder), but the memory routines and the Claude in Chrome pairing are the app's."
Say '  2. When Claude Code asks whether to use the two servers in .mcp.json (meta-ads and fal), approve them; if it does not ask, /mcp lists them.'
Say '  3. Install the Claude in Chrome extension in Chrome and sign in to it with the same Claude account'
Say '     (in the app: your initials at the lower left > Settings > Customize > Connectors > Claude in Chrome > Configure; from a terminal here: claude --chrome).'
Say '  4. In the Code tab type /connect: the connections pass. It asks your language first, then what you already have in Meta,'
Say '     leads every login in your own Chrome (the Meta business, the Page, the ad account, the developer app and the System User,'
Say '     the pixel, WhatsApp, fal), stores the upload token from your clipboard without ever showing it, and ends with /health green.'
Say '  5. Then type /campaign: the first campaign A to Z (the interview, the market research, the plan, copy, creatives,'
Say '     the campaign built PAUSED and shown to you).'
if ($Routines -ge 2) { Say '     The two memory routines are already registered for this folder.' }
else { Say '     /campaign registers them too: two memory routines, a nightly check and a weekly review that alert your phone and never act.' }
Say "  6. The Owner's Meta console steps stay listed in docs/meta-setup-guide.md, with their pitfalls, for reference."
# The memory vault in Obsidian: the result of obsidian-setup.mjs above, after a run that went ahead. Nothing
# for the Owner to click; the memory hooks ship in .claude/settings.json.
if (($Mode -ne 'check') -and -not $Declined) {
  if ($ObsSetup -eq 'ok') {
    Say '  7. Obsidian is set up: the vault is registered, the command line interface is on, the app opened on your HOME page.'
    Say '     (If Obsidian was already open before this run, close and reopen it once so its command line answers.)'
  }
  elseif ($ObsSetup -eq 'notool') {
    Say '  7. Obsidian is not set up: memory/tools/obsidian-setup.mjs is missing. Unzip the harness again to get it.'
  }
  elseif ($ObsSetup -eq 'noapp') {
    Say '  7. Obsidian is not installed, so the memory vault is not set up in it yet (the notes work without it).'
    Say ('     Install it (run this script again, or get it free from ' + $ObsidianPage + '); then node memory/tools/obsidian-setup.mjs finishes it.')
  }
  elseif ($ObsSetup -eq 'nonode') {
    Say '  7. Obsidian is installed but not set up yet: this window does not find Node.js.'
    Say '     Open a new terminal window in this folder and run: node memory/tools/obsidian-setup.mjs'
  }
  else {
    Say '  7. Obsidian could not be set up from here. Run: node memory/tools/obsidian-setup.mjs (it says why, and finishes it).'
  }
}
# The setup progress page (dashboard/setup.html): written and opened at the end of a run that went ahead,
# never under -Check or after a No. The marks are this run's results: done when the tool was found or installed.
if (($Mode -ne 'check') -and -not $Declined -and (Test-Path -LiteralPath 'dashboard/setup-page.mjs' -PathType Leaf)) {
  $pageNode = Get-Version 'node'
  if ($pageNode) {
    $pageMajor = Get-Major $pageNode
    $markGit = 'todo'; if ((Get-Version 'git') -or ($Recheck -contains 'git')) { $markGit = 'done' }
    $markNode = 'todo'; if (($pageMajor -ge 20) -or ($Recheck -contains 'node')) { $markNode = 'done' }
    $markClaude = 'todo'; if ((Get-Version 'claude') -or ($Recheck -contains 'claude')) { $markClaude = 'done' }
    $markObsidian = 'todo'; if ($obsNow) { $markObsidian = 'done' }
    $markApp = 'todo'; if (Get-ClaudeAppPath) { $markApp = 'done' }
    $pageArgs = @('dashboard/setup-page.mjs', '--mark', "install.git=$markGit", '--mark', "install.node=$markNode", '--mark', "install.claude=$markClaude", '--mark', "app.desktop=$markApp", '--mark', "obsidian.installed=$markObsidian")
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
Say 'This run is logged in bootstrap.log; its results are in dashboard/bootstrap-result.json.'
if ($Declined) { Say 'Result: nothing was installed; run this script again when you are ready.'; Stop-Run 1 }
if ($Missing) { Say 'Result: something required is still missing (marked [missing] above).'; Stop-Run 1 }
Say 'Result: everything required is in place.'
Stop-Run 0
