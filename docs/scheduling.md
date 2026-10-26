# Scheduling the morning run and the client report

How the Owner or the Operator makes `/morning` and the weekly client report (`/client-report`) run by themselves on their own computer. **The harness never touches your scheduler**: it does not create, change or delete a scheduled task, a launchd job or a crontab line. You set it up once with the steps below, and you can remove it the same way.

Lines marked **verify on your machine** were written from the tools' documentation and could not be tested on every system; run them by hand once before you rely on them.

## Before you schedule anything

1. **The Meta login must already exist for this user account.** The scheduled run uses the same Claude Code login and the same `meta-ads` MCP login as your own sessions, read from your user's credential store. Open the harness folder in Claude Code once, run `/mcp` → `meta-ads` → log in, and let the scheduler run **as you, while you are logged in** (not as SYSTEM, root or another user, which have no login). If the Meta login expires, the scheduled run fails and says so in its log; log in again by hand.
2. **Run the check by hand first**, from the harness folder:

   ```
   claude -p "/health"
   ```

   It must end with the green/yellow/red table and no red line on the Meta login. If it asks for a permission or fails here, a scheduled run will fail the same way.
3. **A scheduled run is read-only toward the ad account.** `/morning` reads the account, writes `reports/YYYY-MM-DD-morning.md` and the vault notes, and never activates, pauses, changes a budget or spends. `/client-report` writes `reports/YYYY-MM-DD-client-report.md` and its `.html` (and `.pdf` when Edge or Chrome is installed) and **never sends anything**: the Owner reads it, the Operator sends it through the channel in `config/reporting.md`. A decision the run would need ends up in the report as a line for you, never as an action.
4. **One run at a time.** Leave at least 30 minutes between scheduled runs, and do not start a session in the same folder while one is running. Every command below carries a time bound so a stuck run is stopped.
5. **Times are your computer's clock.** Use the routine times in `config/operator.md`; if the computer's time zone differs from the one in that file, convert them.

### Permissions in a run nobody watches

A scheduled run cannot answer a permission prompt: a tool that is not allowed is refused and the run carries on without it (the report says what it could not do). Two flags keep the run working and safe; both are passed on the command line, so no settings file changes (**verify on your machine**: `claude --help` lists the flags of your version):

- `--max-turns 80` stops a run that loops;
- `--disallowedTools` names the account-changing Meta tools, so even a mistaken step cannot change the account:

  ```
  --disallowedTools "mcp__meta-ads__ads_activate_entity,mcp__meta-ads__ads_update_entity,mcp__meta-ads__ads_create_campaign,mcp__meta-ads__ads_create_ad_set,mcp__meta-ads__ads_create_ad,mcp__meta-ads__ads_create_creative,mcp__meta-ads__ads_creative_update,mcp__meta-ads__ads_creative_delete,mcp__meta-ads__ads_create_custom_audience,mcp__meta-ads__ads_update_custom_audience,mcp__meta-ads__ads_update_custom_audience_users,mcp__meta-ads__ads_delete_custom_audience,mcp__meta-ads__ads_experiment_abtest_create_test,mcp__meta-ads__ads_experiment_abtest_update_test,mcp__meta-ads__ads_experiment_lift_create_test,mcp__meta-ads__ads_pixel_event_create,mcp__meta-ads__ads_pixel_event_update,mcp__meta-ads__ads_pixel_event_delete"
  ```

If the hand run in step 2 stopped at a permission prompt, allow the read tools it asked for once in an interactive session ("always allow" in the prompt). Never schedule a run with `--dangerously-skip-permissions`.

## Windows: Task Scheduler

Windows has no `timeout` command that stops another program after N minutes (its `timeout` only waits), so the time bound lives in a small PowerShell script that starts Claude Code, waits at most N minutes, and stops the whole process tree after that.

**1. Save this script outside the harness folder**, for example as `run-routine.ps1` in a folder of your own such as `Documents\harness-schedule\`. Replace `<harness folder>` with the full path of your harness folder.

```powershell
# run-routine.ps1: runs one harness routine headless with a time bound. Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File run-routine.ps1 -Routine /morning -Minutes 10
param([Parameter(Mandatory = $true)][string]$Routine, [int]$Minutes = 10)

$Harness = '<harness folder>'
$LogDir  = Join-Path $env:LOCALAPPDATA 'harness-schedule'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Stamp   = Get-Date -Format 'yyyy-MM-dd-HHmm'
$Name    = $Routine.Trim('/')
$Out     = Join-Path $LogDir "$Stamp-$Name.out.log"
$Err     = Join-Path $LogDir "$Stamp-$Name.err.log"

$Deny = 'mcp__meta-ads__ads_activate_entity,mcp__meta-ads__ads_update_entity,mcp__meta-ads__ads_create_campaign,mcp__meta-ads__ads_create_ad_set,mcp__meta-ads__ads_create_ad,mcp__meta-ads__ads_create_creative,mcp__meta-ads__ads_creative_update,mcp__meta-ads__ads_creative_delete,mcp__meta-ads__ads_create_custom_audience,mcp__meta-ads__ads_update_custom_audience,mcp__meta-ads__ads_update_custom_audience_users,mcp__meta-ads__ads_delete_custom_audience,mcp__meta-ads__ads_experiment_abtest_create_test,mcp__meta-ads__ads_experiment_abtest_update_test,mcp__meta-ads__ads_experiment_lift_create_test,mcp__meta-ads__ads_pixel_event_create,mcp__meta-ads__ads_pixel_event_update,mcp__meta-ads__ads_pixel_event_delete'

# claude may be installed as claude.exe (native installer) or claude.cmd (npm); a .cmd file runs through cmd.exe.
$Claude = (Get-Command claude -ErrorAction Stop).Source
$ArgList = @('-p', $Routine, '--max-turns', '80', '--disallowedTools', $Deny)
if ($Claude -like '*.cmd') { $File = 'cmd.exe'; $ArgList = @('/c', "`"$Claude`"") + $ArgList } else { $File = $Claude }

$p = Start-Process -FilePath $File -ArgumentList $ArgList -WorkingDirectory $Harness `
     -RedirectStandardOutput $Out -RedirectStandardError $Err -NoNewWindow -PassThru
if (-not $p.WaitForExit($Minutes * 60 * 1000)) {
    taskkill /PID $p.Id /T /F | Out-Null
    Add-Content -Path $Err -Value "stopped after $Minutes minutes (time bound)"
    exit 124
}
exit $p.ExitCode
```

**2. Try it by hand** in PowerShell (**verify on your machine**):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Documents\harness-schedule\run-routine.ps1" -Routine /health -Minutes 10
```

The new report or table appears in the log folder (`%LOCALAPPDATA%\harness-schedule`), and `/morning` writes its report into the harness folder's `reports/`.

**3. Create the two tasks** in a Command Prompt (not as administrator; the tasks then run as you, only while you are logged on). Change the days and times to the ones in `config/operator.md` and `config/reporting.md` (**verify on your machine**):

```bat
schtasks /Create /TN "Marketing harness - morning" /SC WEEKLY /D MON,TUE,WED,THU,FRI /ST 08:30 /TR "powershell -NoProfile -ExecutionPolicy Bypass -File \"%USERPROFILE%\Documents\harness-schedule\run-routine.ps1\" -Routine /morning -Minutes 10"

schtasks /Create /TN "Marketing harness - client report" /SC WEEKLY /D MON /ST 09:30 /TR "powershell -NoProfile -ExecutionPolicy Bypass -File \"%USERPROFILE%\Documents\harness-schedule\run-routine.ps1\" -Routine /client-report -Minutes 10"
```

Check, run once now, and remove:

```bat
schtasks /Query /TN "Marketing harness - morning" /V /FO LIST
schtasks /Run /TN "Marketing harness - morning"
schtasks /Delete /TN "Marketing harness - morning" /F
```

A laptop that is asleep at the set time runs nothing; in Task Scheduler (the app) you can tick "Run task as soon as possible after a scheduled start is missed" on the task's Settings tab.

## macOS: launchd (recommended) or cron

launchd runs a job as you, inside your login session, so Claude Code can read its login from your Keychain. macOS has no `timeout` command; the `perl` line below sets the same kind of time bound (600 seconds) and is part of every macOS.

**1. Save this file** as `~/Library/LaunchAgents/com.example.marketing-harness.morning.plist`, replacing `<harness folder>` with the full path of your harness folder (**verify on your machine**):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.example.marketing-harness.morning</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd "<harness folder>" &amp;&amp; perl -e 'alarm shift; exec @ARGV' 600 claude -p "/morning" --max-turns 80 --disallowedTools "mcp__meta-ads__ads_activate_entity,mcp__meta-ads__ads_update_entity,mcp__meta-ads__ads_create_campaign,mcp__meta-ads__ads_create_ad_set,mcp__meta-ads__ads_create_ad,mcp__meta-ads__ads_create_creative,mcp__meta-ads__ads_creative_update,mcp__meta-ads__ads_creative_delete,mcp__meta-ads__ads_create_custom_audience,mcp__meta-ads__ads_update_custom_audience,mcp__meta-ads__ads_update_custom_audience_users,mcp__meta-ads__ads_delete_custom_audience,mcp__meta-ads__ads_experiment_abtest_create_test,mcp__meta-ads__ads_experiment_abtest_update_test,mcp__meta-ads__ads_experiment_lift_create_test,mcp__meta-ads__ads_pixel_event_create,mcp__meta-ads__ads_pixel_event_update,mcp__meta-ads__ads_pixel_event_delete"</string>
  </array>
  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Weekday</key><integer>1</integer><key>Hour</key><integer>8</integer><key>Minute</key><integer>30</integer></dict>
    <dict><key>Weekday</key><integer>2</integer><key>Hour</key><integer>8</integer><key>Minute</key><integer>30</integer></dict>
    <dict><key>Weekday</key><integer>3</integer><key>Hour</key><integer>8</integer><key>Minute</key><integer>30</integer></dict>
    <dict><key>Weekday</key><integer>4</integer><key>Hour</key><integer>8</integer><key>Minute</key><integer>30</integer></dict>
    <dict><key>Weekday</key><integer>5</integer><key>Hour</key><integer>8</integer><key>Minute</key><integer>30</integer></dict>
  </array>
  <key>StandardOutPath</key><string>/tmp/marketing-harness-morning.log</string>
  <key>StandardErrorPath</key><string>/tmp/marketing-harness-morning.err.log</string>
</dict>
</plist>
```

For the client report, copy the file as `com.example.marketing-harness.client-report.plist`, change the `Label` to match, `/morning` to `/client-report`, the log names, and keep one `StartCalendarInterval` entry (for example Weekday 1, Hour 9, Minute 30). Weekday 0 or 7 is Sunday.

**2. Load, run once, and remove** (**verify on your machine**; older macOS versions use `launchctl load` and `launchctl unload` with the file path instead):

```sh
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.example.marketing-harness.morning.plist
launchctl kickstart gui/$(id -u)/com.example.marketing-harness.morning
launchctl bootout gui/$(id -u)/com.example.marketing-harness.morning
```

A Mac that is asleep at the set time runs the job when it wakes.

### cron (Linux, or macOS if you prefer it)

`crontab -e`, then one line per routine. cron starts with an almost empty `PATH`, so set it to where `claude` lives (`command -v claude` tells you). On Linux, GNU `timeout` is there; on macOS use the `perl` bound from the plist instead, and note that cron jobs on macOS may not reach the Keychain, which is why launchd is recommended there (**verify on your machine**).

```sh
PATH=/usr/local/bin:/usr/bin:/bin:<folder that holds claude>
30 8 * * 1-5  cd "<harness folder>" && timeout 600 claude -p "/morning" --max-turns 80 --disallowedTools "<the list above>" >> "$HOME/harness-schedule-morning.log" 2>&1
30 9 * * 1    cd "<harness folder>" && timeout 600 claude -p "/client-report" --max-turns 80 --disallowedTools "<the list above>" >> "$HOME/harness-schedule-client-report.log" 2>&1
```

## After each run

- `/morning`: read `reports/YYYY-MM-DD-morning.md` (or start a session; the summary is in the newest session note). Anything labelled "Needs the Owner's go" waits for the Owner's message in a session.
- `/client-report`: the Owner reads `reports/YYYY-MM-DD-client-report.md` (or its `.html` / `.pdf`), then the Operator sends it by the channel in `config/reporting.md`. Nothing has been sent.
- A run that stopped at its time bound leaves a line in its log ("stopped after ... minutes", or exit code 124 on Linux, 142 on macOS); start a session and run the routine by hand once to see why. Do not shorten the schedule to retry.
- The scheduled run does not commit to git and does not run `/sync`; close the day with `/sync` in a session as usual.
