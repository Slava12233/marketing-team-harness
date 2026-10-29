# upgrade.ps1: brings a new release of the Marketing Team Harness into this copy without touching the company's
# files. For Windows (Windows PowerShell 5.1 or PowerShell 7); on macOS, upgrade.sh does the same steps.
# Usage, from the harness folder:
#   powershell -ExecutionPolicy Bypass -File .\upgrade.ps1 <release zip or unzipped release folder>          plan, then one question
#   powershell -ExecutionPolicy Bypass -File .\upgrade.ps1 <release zip or unzipped release folder> -Check   plan only; nothing changed
#   powershell -ExecutionPolicy Bypass -File .\upgrade.ps1 <release zip or unzipped release folder> -Yes     no question; also lets an
#                                                                                                            equal or older release through
# Each step is printed:
#   (a) this folder is a harness copy (CLAUDE.md, memory\README.md, config\) and the source is a release
#       (CHANGELOG.md, docs\TEMPLATE-SPEC.md, docs\UPGRADE-PATHS.txt); a zip is extracted to a temporary folder
#   (b) both versions (the first "## [x.y.z]" heading of each CHANGELOG.md); a release that is not newer is
#       refused unless -Yes (under -Check it is a warning and the plan still shows)
#   (c) the plan, from the release's docs\UPGRADE-PATHS.txt: files replaced, added, kept, skipped as [never],
#       harness files you changed locally (against docs\release-manifest.txt when this copy has one), files
#       only in your copy; -Check stops here
#   (d) one question: Apply the upgrade now? [y/N] (Enter means No; -Yes skips it)
#   (e) every file about to be overwritten is copied to .upgrade-backup\<YYYY-MM-DD-HHMM>\ (same relative
#       path), then the release's files are copied in
#   (f) node memory/tools/lint.mjs, node memory/tools/build-hot.mjs --by upgrade and node memory/tools/instance.mjs
#       --adopt (the instance marker for this folder when it has none: an upgrade keeps the business), when they exist
#   (g) what to do next
# It never pushes, never runs git, never opens .env and never prints a secret.
# Exit codes: 0 upgraded (or -Check done), 1 refused, declined or failed, 2 usage.
param(
  [Parameter(Position = 0)][string]$Source = '',
  [switch]$Check, [switch]$Yes, [switch]$Help,
  [Parameter(ValueFromRemainingArguments = $true)][string[]]$Rest
)
Set-StrictMode -Version 2
$ErrorActionPreference = 'Continue'

$script:Work = ''
function Say([string]$text) { Write-Host $text }
function Note([string]$text) { Write-Host ('        ' + $text) }
function Step([string]$id, [string]$text) { Write-Host ''; Write-Host "($id) $text" }
function Finish([int]$code) {
  if ($script:Work -and (Test-Path -LiteralPath $script:Work)) { Remove-Item -LiteralPath $script:Work -Recurse -Force -ErrorAction SilentlyContinue }
  exit $code
}
function Refuse([string]$text) { Write-Host "REFUSED: $text"; Finish 1 }
function Show-Usage {
  Say 'Usage: powershell -ExecutionPolicy Bypass -File .\upgrade.ps1 <path to the new release zip or an unzipped release folder> [-Check] [-Yes]'
  Say '  -Check   show the plan only: nothing is copied, nothing is changed'
  Say '  -Yes     apply without the question; also lets an equal or older release through'
  Say 'Run it from the harness folder (the one that contains CLAUDE.md, memory\ and config\).'
}
if ($Help) { Show-Usage; exit 0 }
if ($Rest -and $Rest.Count -gt 0) { Say ('Unknown option or a second path: ' + ($Rest -join ' ')); Show-Usage; exit 2 }
if (-not $Source) { Show-Usage; exit 2 }
if ($Source.StartsWith('-')) { Say "Unknown option: $Source"; Show-Usage; exit 2 }
$root = $PSScriptRoot
if (-not $root) { Say 'Run this file as a script: powershell -ExecutionPolicy Bypass -File .\upgrade.ps1 <path>'; exit 2 }
$root = (Get-Item -LiteralPath $root).FullName.TrimEnd('\')
# A relative release path is taken from the folder the command was typed in.
if (-not [System.IO.Path]::IsPathRooted($Source)) { $Source = Join-Path (Get-Location).Path $Source }

# Rel <full path> <base>: the path relative to base, with forward slashes.
function Rel([string]$full, [string]$base) { return $full.Substring($base.Length + 1).Replace('\', '/') }
function Native([string]$base, [string]$rel) { return (Join-Path $base ($rel.Replace('/', '\'))) }
# List-Files <folder> [<sub-folder, forward slashes>]: every file below, as relative paths (no .git, no node_modules).
function List-Files([string]$base, [string]$sub = '') {
  $start = $base; if ($sub) { $start = Native $base $sub }
  if (-not (Test-Path -LiteralPath $start -PathType Container)) { return @() }
  return @(Get-ChildItem -LiteralPath $start -Recurse -File -Force -ErrorAction SilentlyContinue | ForEach-Object {
      Rel $_.FullName $base } | Where-Object { $_ -notmatch '^\.git/' -and $_ -notmatch '(^|/)node_modules/' })
}
function Sort-Ordinal([string[]]$items) {   # the same order as LC_ALL=C sort
  $a = [string[]]@($items | Where-Object { $_ }); [Array]::Sort($a, [StringComparer]::Ordinal); return $a
}
function Hash-Of([string]$path) { return (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() }

# -----------------------------------------------------------------------------------------------------------
Step 'a' 'This folder is a harness copy, and the source is a release'
if (-not ((Test-Path -LiteralPath (Join-Path $root 'CLAUDE.md') -PathType Leaf) -and
          (Test-Path -LiteralPath (Join-Path $root 'memory\README.md') -PathType Leaf) -and
          (Test-Path -LiteralPath (Join-Path $root 'config') -PathType Container))) {
  Refuse 'this is not a harness folder: it must contain CLAUDE.md, memory\README.md and config\. Run upgrade.ps1 from the harness folder.'
}
$script:Work = Join-Path ([System.IO.Path]::GetTempPath()) ('upgrade-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $script:Work | Out-Null
$rel = ''
if (Test-Path -LiteralPath $Source -PathType Leaf) {
  if ($Source -notmatch '\.zip$') { Refuse "$Source is a file but not a .zip: give the release zip or an unzipped release folder." }
  $dest = Join-Path $script:Work 'release'
  try { Expand-Archive -LiteralPath $Source -DestinationPath $dest -Force -ErrorAction Stop } catch { Refuse ('the zip could not be extracted: ' + $_.Exception.Message) }
  $rel = $dest
  Note "extracted $Source to a temporary folder"
} elseif (Test-Path -LiteralPath $Source -PathType Container) {
  $rel = (Get-Item -LiteralPath $Source).FullName.TrimEnd('\')
} else {
  Refuse "$Source was not found."
}
# A release zip holds one top folder (marketing-team-harness\); step into it.
if (-not (Test-Path -LiteralPath (Join-Path $rel 'CHANGELOG.md'))) {
  $subs = @(Get-ChildItem -LiteralPath $rel -Directory -Force)
  if ($subs.Count -eq 1) { $rel = $subs[0].FullName.TrimEnd('\') }
}
if (-not ((Test-Path -LiteralPath (Join-Path $rel 'CHANGELOG.md') -PathType Leaf) -and
          (Test-Path -LiteralPath (Join-Path $rel 'docs\TEMPLATE-SPEC.md') -PathType Leaf))) {
  Refuse 'the source is not a harness release: it must contain CHANGELOG.md and docs\TEMPLATE-SPEC.md.'
}
if ($rel -eq $root) { Refuse 'the source is this harness folder itself: give the new release instead.' }
$manifest = Join-Path $rel 'docs\UPGRADE-PATHS.txt'
if (-not (Test-Path -LiteralPath $manifest -PathType Leaf)) { Refuse 'the release has no docs/UPGRADE-PATHS.txt, so it does not say which files it may write.' }
Note "harness folder: $root"
Note "release:        $rel"
Write-Host 'ok'

# -----------------------------------------------------------------------------------------------------------
Step 'b' 'Versions'
function Version-Of([string]$file) {
  foreach ($l in [System.IO.File]::ReadAllLines($file)) { if ($l -match '^## \[(\d+\.\d+\.\d+)\]') { return $Matches[1] } }
  return ''
}
$vOld = Version-Of (Join-Path $root 'CHANGELOG.md'); $vNew = Version-Of (Join-Path $rel 'CHANGELOG.md')
$vOldShown = $vOld; if (-not $vOldShown) { $vOldShown = 'no version heading (an unreleased copy)' }
$vNewShown = $vNew; if (-not $vNewShown) { $vNewShown = 'no version heading' }
Note "this copy:   $vOldShown"
Note "the release: $vNewShown"
$newer = $false
if (-not $vNew) { $newer = $false } elseif (-not $vOld) { $newer = $true } else { $newer = ([version]$vNew -gt [version]$vOld) }
if ($newer) { Write-Host 'ok: the release is newer' }
elseif ($Yes) { Write-Host 'warning: the release is not newer than this copy; going on because of -Yes' }
elseif ($Check) { Write-Host 'warning: the release is not newer than this copy; an apply would be refused without -Yes' }
else {
  $a = $vNew; if (-not $a) { $a = 'no version' }; $b = $vOld; if (-not $b) { $b = 'no version' }
  Refuse "the release ($a) is not newer than this copy ($b). To install it anyway, add -Yes."
}

# -----------------------------------------------------------------------------------------------------------
Step 'c' "The plan (from the release's docs/UPGRADE-PATHS.txt)"
# One rule per path. Glob to regex: the regex characters are escaped, **/ -> (.*/)?, ** -> .*, * -> [^/]*,
# ? -> [^/]; a trailing / means "everything under the folder". A "!path" line under [never] is an exception.
$rules = New-Object System.Collections.ArrayList
$replDirs = New-Object System.Collections.ArrayList
$sec = ''
foreach ($raw in [System.IO.File]::ReadAllLines($manifest)) {
  $line = ($raw -replace '#.*$', '').Trim()
  if (-not $line) { continue }
  if ($line -eq '[replace]') { $sec = 'replace'; continue }
  if ($line -eq '[add-only]') { $sec = 'add'; continue }
  if ($line -eq '[never]') { $sec = 'never'; continue }
  if ($line.StartsWith('[')) { Refuse "docs/UPGRADE-PATHS.txt has an unknown section: $line" }
  if (-not $sec) { Refuse "docs/UPGRADE-PATHS.txt has a path before the first section: $line" }
  $s = $sec
  if ($line.StartsWith('!')) {
    if ($sec -ne 'never') { Refuse "docs/UPGRADE-PATHS.txt has a ! line outside [never]: $line" }
    $s = 'unnever'; $line = $line.Substring(1)
  }
  $dir = $line.EndsWith('/'); $p = $line.TrimEnd('/')
  $out = New-Object System.Text.StringBuilder
  for ($i = 0; $i -lt $p.Length; $i++) {
    $c = $p[$i]
    if ($c -eq '*') {
      if ($p.Length -ge $i + 3 -and $p.Substring($i, 3) -eq '**/') { [void]$out.Append('(.*/)?'); $i += 2 }
      elseif ($p.Length -ge $i + 2 -and $p.Substring($i, 2) -eq '**') { [void]$out.Append('.*'); $i += 1 }
      else { [void]$out.Append('[^/]*') }
    } elseif ($c -eq '?') { [void]$out.Append('[^/]') }
    elseif ('.[]^$+(){}|\'.IndexOf($c) -ge 0) { [void]$out.Append('\').Append($c) }
    else { [void]$out.Append($c) }
  }
  $end = '$'; if ($dir) { $end = '/' }
  [void]$rules.Add([pscustomobject]@{ Sec = $s; Rx = [regex]('^' + $out.ToString() + $end) })
  if ($s -eq 'replace' -and $dir -and $p -notmatch '[*?]') { [void]$replDirs.Add($p) }
}
# Classify <path>: never (unless a !path exception matches), else add, else replace, else none.
function Classify([string]$path) {
  $ex = $false
  foreach ($r in $rules) { if ($r.Sec -eq 'unnever' -and $r.Rx.IsMatch($path)) { $ex = $true; break } }
  if (-not $ex) { foreach ($r in $rules) { if ($r.Sec -eq 'never' -and $r.Rx.IsMatch($path)) { return 'never' } } }
  foreach ($r in $rules) { if ($r.Sec -eq 'add' -and $r.Rx.IsMatch($path)) { return 'add' } }
  foreach ($r in $rules) { if ($r.Sec -eq 'replace' -and $r.Rx.IsMatch($path)) { return 'replace' } }
  return 'none'
}

$relFiles = @(Sort-Ordinal (List-Files $rel))
$relSet = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::Ordinal)
foreach ($f in $relFiles) { [void]$relSet.Add($f) }
# Harness files of this copy that the release no longer carries (everything under a plain [replace] folder).
$mine = @(); foreach ($d in $replDirs) { $mine += @(List-Files $root $d) }
$onlyMine = @(Sort-Ordinal (@($mine | Select-Object -Unique | Where-Object { -not $relSet.Contains($_) -and (Classify $_) -eq 'replace' })))
# The hashes recorded by the previous release, when this copy has its list.
$old = @{}
$oldList = Join-Path $root 'docs\release-manifest.txt'
if (Test-Path -LiteralPath $oldList -PathType Leaf) {
  foreach ($l in [System.IO.File]::ReadAllLines($oldList)) {
    if ($l -match '^\\?([0-9a-fA-F]{64}) [ *](.+)$') { $old[$Matches[2]] = $Matches[1].ToLowerInvariant() }
  }
}

# One entry per release file: category replace, local, add, unchanged, kept, differs, never or none.
$plan = New-Object System.Collections.ArrayList
foreach ($p in $relFiles) {
  $s = Classify $p
  $cat = $s
  if ($s -eq 'add' -or $s -eq 'replace') {
    $mineFile = Native $root $p
    if (-not (Test-Path -LiteralPath $mineFile -PathType Leaf)) { $cat = 'add' }
    else {
      $hm = Hash-Of $mineFile; $hr = Hash-Of (Native $rel $p)
      if ($s -eq 'add') { if ($hr -eq $hm) { $cat = 'kept' } else { $cat = 'differs' } }
      elseif ($hr -eq $hm) { $cat = 'unchanged' }
      elseif ($old.ContainsKey($p) -and $old[$p] -ne $hm) { $cat = 'local' }
      else { $cat = 'replace' }
    }
  }
  [void]$plan.Add([pscustomobject]@{ Cat = $cat; Path = $p })
}
function Of([string]$cat) { return @($plan | Where-Object { $_.Cat -eq $cat } | ForEach-Object { $_.Path }) }
function Show([string]$cat, [string]$title) {
  $list = @(Of $cat)
  Say ("  ${title}: " + $list.Count)
  foreach ($p in $list) { Say ('        ' + $p) }
}
Show 'replace' 'Replaced from the release (the old file goes to the backup)'
Show 'local'   'Replaced, but CHANGED IN THIS COPY since the last release (your edit goes to the backup)'
Show 'add'     'Added (new in the release, not in this copy)'
Show 'differs' "Kept as yours although the release's version differs ([add-only]: compare by hand if you like)"
Show 'never'   "Skipped: [never] (the company's files; not written)"
Show 'none'    'Not listed in docs/UPGRADE-PATHS.txt (left alone)'
Say ('  Only in this copy, under a harness folder (left in place; delete by hand if unused): ' + $onlyMine.Count)
foreach ($p in $onlyMine) { Say ('        ' + $p) }
Say ('  Already identical (nothing to do): ' + @(Of 'unchanged').Count + "; kept as yours ([add-only], same as the release): " + @(Of 'kept').Count)
if (-not (Test-Path -LiteralPath $oldList -PathType Leaf)) {
  Note 'This copy has no docs/release-manifest.txt, so local edits to harness files cannot be told apart:'
  Note 'every differing harness file is listed as replaced. Its old version still goes to the backup.'
}
$overwrite = @(@(Of 'replace') + @(Of 'local'))
$write = @($overwrite + @(Of 'add'))
if ($Check) { Write-Host ''; Write-Host ('-Check: nothing was changed. ' + $write.Count + ' files would be written.'); Finish 0 }
if ($write.Count -eq 0) { Write-Host ''; Write-Host 'Nothing to copy: this copy already matches the release.'; Finish 0 }

# -----------------------------------------------------------------------------------------------------------
Step 'd' 'Confirm'
if ($Yes) { Write-Host '-Yes: no question' }
else {
  Write-Host 'Apply the upgrade now? [y/N]: ' -NoNewline
  $answer = $null
  try { $answer = Read-Host } catch { $answer = $null }
  if ($null -eq $answer) { Write-Host ''; $answer = '' }
  if (($answer -replace '\s', '') -notmatch '^(y|yes)$') { Write-Host 'Not applied. Nothing was changed.'; Finish 1 }
}

# -----------------------------------------------------------------------------------------------------------
$stamp = Get-Date -Format 'yyyy-MM-dd-HHmm'
$bkRel = ".upgrade-backup/$stamp"; $k = 2
while (Test-Path -LiteralPath (Native $root $bkRel)) { $bkRel = ".upgrade-backup/$stamp-$k"; $k++ }
$bk = Native $root $bkRel
Step 'e' "Back up to $bkRel/, then copy"
try { New-Item -ItemType Directory -Force -Path $bk -ErrorAction Stop | Out-Null } catch { Refuse "the backup folder $bkRel could not be made. Nothing was changed." }
$nb = 0
foreach ($p in $overwrite) {
  $to = Native $bk $p
  try {
    New-Item -ItemType Directory -Force -Path (Split-Path $to) -ErrorAction Stop | Out-Null
    Copy-Item -LiteralPath (Native $root $p) -Destination $to -Force -ErrorAction Stop
  } catch { Refuse "the backup of $p failed. Nothing was overwritten; the partial backup is in $bkRel/." }
  $nb++
}
$vFrom = $vOld; if (-not $vFrom) { $vFrom = 'unreleased' }
$vTo = $vNew; if (-not $vTo) { $vTo = 'no version' }
$addedText = @("# Upgrade ${stamp}: $vFrom -> $vTo, from $Source",
  '# The files under this folder are the versions the upgrade overwrote. The files below were ADDED by the',
  '# upgrade (they have no backup); to roll back fully, delete them after copying the backup back.') + @(Of 'add')
[System.IO.File]::WriteAllText("$bk.added.txt", (($addedText -join "`n") + "`n"), (New-Object System.Text.UTF8Encoding($false)))
Write-Host "ok: $nb files backed up"
$nc = 0; $fail = 0
foreach ($p in $write) {
  $to = Native $root $p
  try {
    New-Item -ItemType Directory -Force -Path (Split-Path $to) -ErrorAction Stop | Out-Null
    Copy-Item -LiteralPath (Native $rel $p) -Destination $to -Force -ErrorAction Stop
    $nc++
  } catch { $fail++; Note "FAILED: $p" }
}
Write-Host "ok: $nc files copied"
if ($fail -gt 0) {
  Write-Host "REFUSED: $fail files could not be copied (listed above). To roll back, copy everything in $bkRel/ back into this folder."
  Finish 1
}

# -----------------------------------------------------------------------------------------------------------
Step 'f' 'Check the vault'
if (Get-Command node -CommandType Application -ErrorAction SilentlyContinue) {
  Push-Location -LiteralPath $root
  if (Test-Path -LiteralPath 'memory\tools\lint.mjs') { & node memory/tools/lint.mjs; Write-Host "lint.mjs exit code: $LASTEXITCODE" }
  else { Write-Host 'memory/tools/lint.mjs is not there: skipped' }
  if (Test-Path -LiteralPath 'memory\tools\build-hot.mjs') { & node memory/tools/build-hot.mjs --by upgrade; Write-Host "build-hot.mjs exit code: $LASTEXITCODE" }
  else { Write-Host 'memory/tools/build-hot.mjs is not there: skipped' }
  # An upgrade in place keeps the business: the instance marker is written when the folder has none, so the
  # new-copy check does not take this company for a copy (a marker from another folder is left as it is).
  if (Test-Path -LiteralPath 'memory	oolsinstance.mjs') { & node memory/tools/instance.mjs --adopt; Write-Host "instance.mjs exit code: $LASTEXITCODE" }
  Pop-Location
} else {
  Write-Host 'Node.js was not found: lint.mjs and build-hot.mjs were skipped (run powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 -Check)'
}

# -----------------------------------------------------------------------------------------------------------
Step 'g' 'Next'
$fromShown = $vOld; if (-not $fromShown) { $fromShown = 'an unreleased copy' }
$toShown = $vNew; if (-not $toShown) { $toShown = 'the release' }
Say "Upgraded from $fromShown to $toShown."
Say '1. Close Claude Code and open a new session in this folder, so it loads the new rules, skills and agents.'
Say '2. Type /health and wait for the table.'
Say "3. When /health is green, the backup folder $bkRel/ (and $bkRel.added.txt) can be deleted."
Say "To roll back: copy everything in $bkRel/ back into this folder, and delete the files listed in $bkRel.added.txt."
Finish 0
