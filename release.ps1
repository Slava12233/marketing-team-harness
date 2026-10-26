# release.ps1: the maintainer's release step for the Marketing Team Harness (buyers never run it).
# Usage: powershell -ExecutionPolicy Bypass -File .\release.ps1 vX.Y.Z      (macOS: bash release.sh vX.Y.Z)
# Each step is printed, and every check runs before the tag is made:
#   (a) the working tree is clean (git status --porcelain), no .env file is tracked, no file under vendor\ is
#       hidden by an ignore rule (it would be missing from the zip), dist\ is ignored
#   (b) docs/scrub-check.sh, run with Git for Windows' bash (Git Bash), prints "scrub gate: clean"
#   (c) CHANGELOG.md has a "## [X.Y.Z]" heading for this version
#   (d) the annotated tag vX.Y.Z is created (refused when the tag or the zip already exists)
#   (e) dist\marketing-team-harness-vX.Y.Z.zip is built from that tag with git archive
#   (f) the zip's path and size are printed, with the push command to run by hand
# This script never pushes. Exit codes: 0 released, 1 refused or failed, 2 usage.
param([string]$Tag = '')
Set-StrictMode -Version 2
$ErrorActionPreference = 'Continue'

function Step([string]$id, [string]$text) { Write-Host ''; Write-Host "($id) $text" }
function Refuse([string]$text) { Write-Host "REFUSED: $text"; exit 1 }
function Find-GitBash {   # Git for Windows' bash.exe (never the WSL launcher in System32), or ''
  $cands = @()
  $git = Get-Command git -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($git) { $cands += Join-Path (Split-Path (Split-Path $git.Path)) 'bin\bash.exe' }
  if ($env:ProgramFiles) { $cands += Join-Path $env:ProgramFiles 'Git\bin\bash.exe' }
  foreach ($c in $cands) { if (Test-Path -LiteralPath $c) { return $c } }
  $b = Get-Command bash -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($b -and ($b.Path -notmatch '\\System32\\bash\.exe$')) { return $b.Path }
  return ''
}

if ($Tag -notmatch '^v\d+\.\d+\.\d+$') { Write-Host 'Usage: powershell -ExecutionPolicy Bypass -File .\release.ps1 vX.Y.Z   (for example: v1.0.0)'; exit 2 }
$version = $Tag.Substring(1)
$root = $PSScriptRoot
if (-not $root) { Write-Host 'Run this file as a script: powershell -ExecutionPolicy Bypass -File .\release.ps1 vX.Y.Z'; exit 2 }
$G = @('-C', $root)
$zipName = "marketing-team-harness-$Tag.zip"
$zip = Join-Path (Join-Path $root 'dist') $zipName
if (-not (Get-Command git -CommandType Application -ErrorAction SilentlyContinue)) { Refuse 'git was not found.' }
& git @G rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) { Refuse 'this folder is not a git repository.' }
if (-not (Test-Path -LiteralPath (Join-Path $root 'docs\scrub-check.sh'))) { Refuse 'docs/scrub-check.sh was not found: run this from the harness repository.' }

Step 'a' 'The working tree is clean, no .env file is tracked, every file under vendor/ is tracked, and dist/ is ignored'
$dirty = @(& git @G status --porcelain)
if ($LASTEXITCODE -ne 0) { Refuse 'git status failed.' }
if ($dirty.Count -gt 0) {
  $dirty | Select-Object -First 20 | ForEach-Object { Write-Host $_ }
  Refuse 'the working tree is not clean: commit or stash the changes above first.'
}
$trackedEnv = @(& git @G ls-files -- .env '.env.*' | Where-Object { $_ -ne '.env.example' })
if ($trackedEnv.Count -gt 0) { Refuse ('a secrets file is tracked by git (' + ($trackedEnv -join ', ') + '): remove it with git rm --cached and commit first.') }
# A vendored folder carries its upstream's own .gitignore files, which can hide a file upstream tracks.
$hidden = @(& git @G ls-files --others --ignored --exclude-standard -- vendor)
if ($hidden.Count -gt 0) {
  $hidden | Select-Object -First 20 | ForEach-Object { Write-Host $_ }
  Refuse 'the vendored files above are hidden by an ignore rule and would be missing from the zip: add each with git add -f and commit first.'
}
New-Item -ItemType Directory -Force -Path (Join-Path $root 'dist') | Out-Null
& git @G check-ignore -q dist
if ($LASTEXITCODE -ne 0) { Refuse 'dist/ is not ignored: add the line dist/ to .gitignore, commit it, and run again.' }
Write-Host 'ok'

Step 'b' 'Scrub gate (bash docs/scrub-check.sh, run with Git Bash)'
$bash = Find-GitBash
if (-not $bash) { Refuse 'bash was not found. The scrub gate needs Git Bash: install Git for Windows (winget install --id Git.Git -e --source winget) and run again.' }
Push-Location -LiteralPath $root
$gate = @(& $bash docs/scrub-check.sh 2>&1)
$rc = $LASTEXITCODE
Pop-Location
$gate | ForEach-Object { Write-Host $_ }
if ($rc -ne 0 -or -not (($gate -join "`n") -match 'scrub gate: clean')) { Refuse 'the scrub gate is not clean (see above).' }

Step 'c' "CHANGELOG.md has a heading for $version"
$log = Join-Path $root 'CHANGELOG.md'
if (-not (Test-Path -LiteralPath $log)) { Refuse 'CHANGELOG.md is missing.' }
if (-not (Select-String -LiteralPath $log -Pattern ('^## \[' + [regex]::Escape($version) + '\]') -Quiet)) { Refuse "CHANGELOG.md has no heading ## [$version]." }
Write-Host 'ok'

Step 'd' "Tag $Tag"
& git @G rev-parse -q --verify "refs/tags/$Tag" *> $null
if ($LASTEXITCODE -eq 0) { Refuse "the tag $Tag already exists." }
if (Test-Path -LiteralPath $zip) { Refuse "dist/$zipName already exists: move it away first." }
& git @G tag -a $Tag -m "Marketing Team Harness $Tag"
if ($LASTEXITCODE -ne 0) { Refuse 'git tag failed.' }
Write-Host ("ok: $Tag on commit " + (& git @G rev-parse --short HEAD))

Step 'e' "Build dist/$zipName"
# git archive packs only the files tracked in the tagged commit, so .env, node_modules/, dist/ and every
# other untracked or ignored file can never be inside the zip.
& git @G archive --format=zip --prefix=marketing-team-harness/ -o $zip $Tag
if ($LASTEXITCODE -ne 0) { Refuse "git archive failed. The tag $Tag stays; remove it with: git tag -d $Tag" }
Write-Host ('ok: ' + @(& git @G ls-tree -r --name-only $Tag).Count + ' files')

Step 'f' 'Done'
$kb = [math]::Ceiling((Get-Item -LiteralPath $zip).Length / 1024)
Write-Host "Zip: $zip ($kb KB)"
Write-Host 'This script never pushes. To publish the branch and the tag, run by hand: git push origin main --tags'
exit 0
