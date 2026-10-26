# control-room/: the always-on control room

`marketing-team` is a Claude Code mod (a plugin of function hooks) that keeps the state of the marketing harness in view while you work: a pane beside the chat, a one-line band above the prompt, a status line, the hint under the prompt and the spinner's words. It **only reads**: `dashboard/state.json` and the agent files in `.claude/agents/`. It never writes a file, never calls a tool and never touches the ad account. In a project that has neither `dashboard/state.json` nor `.claude/agents/` it stays silent, so a user-scope install does not disturb other projects.

```
control-room/
  README.md                       this page
  .claude-plugin/marketplace.json makes this folder a local marketplace that lists the mod
  marketing-team/
    .claude-plugin/plugin.json    the manifest (name marketing-team)
    hooks/hooks.json              names the hooks module
    hooks/register.tsx            the hooks module
    types/index.d.ts              the state contract and the shape of dashboard/state.json
    tests/pane.test.tsx           tests (claude plugin test control-room/marketing-team)
```

## What it shows

| Where | What |
|---|---|
| **Pane** (opens at session start when the window is wide enough; `/team` reopens it) | The title `Control room · <company>`; tiles for the launch countdown (only when `launch` is set), active campaigns and agents running now; **working now** (the subagents the engine reports as running); **next routine** with a Prepare button that fills the prompt with the command, then the other routines with their day and time; **next task** (the first task, highlighted, with its owner), the next four, and a count per owner; **money and campaigns** (`liveToday`, today's spend, caps, each campaign with status, spend and result, the next go); **the team** by lane with model, access (Builds paused, Reads Meta, No account, read from each agent's tools) and a Brief button; the **skills** called this session; when the data was last written. |
| **Band above the prompt** | How many agents are working and which, the next routine and when, the launch countdown, a button that opens the pane. |
| **Status line** | Launch countdown · next routine at its time · what is running. |
| **Prompt hint** | `<next routine> at <time> (in …) · type /<command> · /team for the control room`. |
| **Spinner** | The names of the agents working (`copywriter and media-buyer working`) while subagents run. |
| **Toast** | When a routine falls due: `<routine>: time for /<command>`, once a day per routine. |

All words are English. Times are shown in `routines.timezone` (the Operator's time zone from `config/operator.md`), or the machine's own zone when it is null.

## Where the data comes from

The mod reads `dashboard/state.json` every minute and after every turn (only when the file changed). `/morning` and `/sync` write it, and the main session rewrites it after any state change (publish, pause, budget, new object). They copy the company name from `config/company.md`, the launch date, routine times, working days and time zone from `config/operator.md`, and every number from a live read only; a number no live read gave is left null. The shipped file is the empty shape:

```json
{
  "company": null,                       // short company name, e.g. from config/company.md
  "generatedAt": null,                   // ISO time of the write
  "launch": null,                        // ISO date or null (no countdown when null)
  "routines": { "timezone": null,        // IANA zone from config/operator.md, e.g. "Europe/Paris"
                "items": [] },           // [{ "id", "label", "command": "morning", "time": "08:30", "days": [1,2,3,4,5] }] (0 = Sunday)
  "working": [],                         // agents a writer saw running (the pane uses the engine's live list)
  "tasks": [],                           // [{ "title", "owner" }] in priority order; owners as in checklist.md
  "money": { "currency": null, "dailySpend": null, "caps": [], "liveToday": null, "nextGo": null },
  "campaigns": [],                       // [{ "id", "name", "label", "status": "ACTIVE|PAUSED|…", "spent", "result" }]
  "team": {},                            // { "<lane>": ["agent-id", …] }; empty = the default lanes below
  "skillsUsed": []                       // [{ "name", "count" }] from the last session (shown until a skill is called)
}
```

(The comments are for this page only; the file itself is plain JSON.) The mod tolerates a half-filled file: missing keys read as empty. Default lanes when `team` is empty: Measure (performance-analyst, signals-auditor, cro-auditor), Create (creative-director, copywriter, competitor-researcher), Gate (compliance-reviewer, test-designer), Build (media-buyer), Close (harness-librarian); an agent in no lane is listed under Other.

## Install it (per user, by the Owner)

Installing a plugin changes Claude Code's own behaviour, so it is **the Owner's step**: the harness prepares these lines and stops. Nothing is turned on until the Owner types the command and answers its questions. Run it from the repository root, in a terminal session of Claude Code.

**Try it for one session** (nothing is installed):

```bash
claude --plugin-dir ./control-room/marketing-team
```

**Install it for every session** (this folder is a local marketplace; give its absolute path):

```text
/plugin install marketing-team --marketplace <absolute path to this repository>/control-room
```

or from a shell:

```bash
claude plugin install marketing-team --marketplace "<absolute path to this repository>/control-room"
```

Claude Code then asks `Add marketplace?` (answer `y`) and a scope (user scope first; press Enter). That answer is the Owner's click that turns the control room on; it ends with `Installed marketing-team. Plugin is now active.` and runs in that session at once and in every session started after. Because the marketplace is a folder and the entry is a relative path, Claude Code reads the mod from this folder itself: after editing the mod, run `/reload-plugins`.

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with the folder's path, then Add plugin.

**Alternative for sessions started by another host:** name the folder in `CLAUDE_CODE_PLUGIN_DIRS` (in the process environment or the `env` block of the user's `~/.claude/settings.json`, never a project's settings). That edit is also the Owner's.

To turn it off: `/plugin` → the plugin → disable or uninstall.

## Check it

```bash
claude plugin validate control-room/marketing-team    # manifest, hooks module, state contract
claude plugin test control-room/marketing-team        # the tests in tests/
```
