# release.ps1: the maintainer's release step for the Marketing Team Harness (buyers never run it).
# Usage: powershell -ExecutionPolicy Bypass -File .\release.ps1 vX.Y.Z [-SkipTests]      (macOS: bash release.sh vX.Y.Z [--skip-tests])
#        powershell -ExecutionPolicy Bypass -File .\release.ps1 -Manifest   (only rewrites docs/release-manifest.txt and
#        exits 0; stage new files with git add first so they are listed, then commit the manifest)
# Each step is printed, and every check runs before the tag is made:
#   (a) the working tree is clean (git status --porcelain), no .env file is tracked, no file under vendor\ is
#       hidden by an ignore rule (it would be missing from the zip), dist\ is ignored
#   (b) docs/scrub-check.sh, run with Git for Windows' bash (Git Bash), prints "scrub gate: clean"
#   (b2) the node test suites pass, one after the other, each given at most 300 s and stopped (with its process
#        tree) past that: memory/tools/tools.test.mjs, dashboard/setup-page.test.mjs,
#        .claude/hooks/account-guard.test.mjs, bootstrap.test.mjs and every creatives/tools/*.test.mjs; -SkipTests bypasses them
#        with a printed warning (then run docs/regression-run.md before publishing)
#   (b3) docs/release-manifest.txt ("<sha256>  <path>" for every tracked file but itself, LF) matches the tree;
#        a missing or stale manifest refuses the release with the command that rewrites it (-Manifest)
#   (c) CHANGELOG.md has a "## [X.Y.Z]" heading for this version
#   (d) the annotated tag vX.Y.Z is created (refused when the tag or the zip already exists)
#   (e) dist\marketing-team-harness-vX.Y.Z.zip is built from that tag with git archive
#   (f) the zip's path and size are printed, with the push command to run by hand
# This script never pushes. Exit codes: 0 released, 1 refused or failed, 2 usage.
param([string]$Tag = '', [switch]$SkipTests, [switch]$Manifest)
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

if ($Manifest -and $Tag) { Write-Host 'Usage: powershell -ExecutionPolicy Bypass -File .\release.ps1 -Manifest   (no version: it only rewrites docs/release-manifest.txt)'; exit 2 }
if (-not $Manifest -and $Tag -notmatch '^v\d+\.\d+\.\d+$') { Write-Host 'Usage: powershell -ExecutionPolicy Bypass -File .\release.ps1 vX.Y.Z [-SkipTests]   (for example: v1.0.0), or .\release.ps1 -Manifest'; exit 2 }
$version = if ($Tag) { $Tag.Substring(1) } else { '' }
$root = $PSScriptRoot
if (-not $root) { Write-Host 'Run this file as a script: powershell -ExecutionPolicy Bypass -File .\release.ps1 vX.Y.Z'; exit 2 }
$G = @('-C', $root)
$zipName = "marketing-team-harness-$Tag.zip"
$zip = Join-Path (Join-Path $root 'dist') $zipName
if (-not (Get-Command git -CommandType Application -ErrorAction SilentlyContinue)) { Refuse 'git was not found.' }
& git @G rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) { Refuse 'this folder is not a git repository.' }
if (-not (Test-Path -LiteralPath (Join-Path $root 'docs\scrub-check.sh'))) { Refuse 'docs/scrub-check.sh was not found: run this from the harness repository.' }

$manifestRel = 'docs/release-manifest.txt'
$manifestPath = Join-Path $root 'docs\release-manifest.txt'
# "<sha256>  <path>" for every tracked file except the manifest itself, in git's order, LF line endings:
# the same text as release.sh writes. Returns $null (with a message) when a file cannot be hashed.
function Get-ManifestText {
  $files = @(& git @G -c core.quotepath=off ls-files -- . ":(exclude)$manifestRel")
  if ($LASTEXITCODE -ne 0) { Write-Host 'git ls-files failed.'; return $null }
  $sb = New-Object System.Text.StringBuilder
  foreach ($f in $files) {
    $full = Join-Path $root $f
    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { Write-Host "tracked but missing from the disk: $f"; return $null }
    $h = (Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash.ToLowerInvariant()
    [void]$sb.Append($h).Append('  ').Append($f).Append("`n")
  }
  return $sb.ToString()
}
if ($Manifest) {
  Step 'manifest' "Rewrite $manifestRel from the tracked files (nothing else runs)"
  $text = Get-ManifestText
  if ($null -eq $text) { Refuse 'the manifest could not be computed (see above).' }
  [System.IO.File]::WriteAllText($manifestPath, $text, (New-Object System.Text.UTF8Encoding($false)))
  $n = ($text.Split("`n") | Where-Object { $_ -ne '' }).Count
  Write-Host "ok: $n files listed in $manifestRel. Commit it, then run the release."
  exit 0
}

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

Step 'b2' 'Node test suites (one after the other, each bounded at 300 s)'
if ($SkipTests) {
  Write-Host 'WARNING: -SkipTests was given: the node test suites were NOT run. Run them by hand (docs/regression-run.md) before you publish this zip.'
} else {
  $node = Get-Command node -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $node) { Refuse 'node was not found: install Node.js 20 or newer (or pass -SkipTests, not recommended).' }
  $suites = @('memory/tools/tools.test.mjs', 'dashboard/setup-page.test.mjs', '.claude/hooks/account-guard.test.mjs', 'bootstrap.test.mjs')
  foreach ($s in $suites) { if (-not (Test-Path -LiteralPath (Join-Path $root $s))) { Refuse "the test suite $s is missing." } }
  $toolsDir = Join-Path $root 'creatives\tools'
  if (Test-Path -LiteralPath $toolsDir) {
    $suites += @(Get-ChildItem -LiteralPath $toolsDir -Filter '*.test.mjs' -File | Sort-Object Name | ForEach-Object { 'creatives/tools/' + $_.Name })
  }
  foreach ($s in $suites) {
    Write-Host "-> node --test $s   (at most 300 s)"
    $p = Start-Process -FilePath $node.Path -ArgumentList @('--test', ('"' + $s + '"')) -WorkingDirectory $root -NoNewWindow -PassThru
    $null = $p.Handle   # keeps the exit code readable after the process ends
    if (-not $p.WaitForExit(300000)) {
      try { $p.Kill($true) } catch { & taskkill /PID $p.Id /T /F *> $null }   # the whole tree: the test runner starts child processes
      Refuse "$s did not finish within 300 s and was stopped. Check that no node process is left over (tasklist) before running again."
    }
    $p.WaitForExit()
    if ($p.ExitCode -ne 0) { Refuse "$s failed (exit $($p.ExitCode)): see the output above." }
  }
  Write-Host "ok: $($suites.Count) suites passed"
}

Step 'b3' "Release manifest ($manifestRel matches the tracked files)"
$expected = Get-ManifestText
if ($null -eq $expected) { Refuse 'the release manifest could not be computed (see above).' }
$current = if (Test-Path -LiteralPath $manifestPath -PathType Leaf) { [System.IO.File]::ReadAllText($manifestPath) } else { $null }
if ($null -eq $current -or -not [string]::Equals($current, $expected, [System.StringComparison]::Ordinal)) {
  Refuse 'docs/release-manifest.txt is stale: run `bash release.sh --manifest` (or `-Manifest`) to rewrite it, commit, and run the release again'
}
Write-Host ('ok: ' + ($expected.Split("`n") | Where-Object { $_ -ne '' }).Count + ' files')

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
