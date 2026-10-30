# Running the harness in OpenAI Codex

The harness is written for Claude Code, and it also runs in OpenAI Codex (the Codex app or the Codex CLI). The rules, the skills, the agents, the hooks and the tools are the same; only the files Codex reads are different, and they are generated from the Claude ones so the two never drift.

## What Codex reads

| Codex file | Made from | What it is |
|---|---|---|
| `AGENTS.md` | `CLAUDE.md` | The rulebook: a Codex preface (how each Claude feature maps to Codex, the go ticket), then `CLAUDE.md` word for word. Its `@config/*.md` imports are replaced by one line, because Codex has no imports: the session-start hook puts the config files into the context instead |
| `.agents/skills/<name>/` | `.claude/skills/<name>/` | Every skill, copied. A description longer than 1,024 characters is cut at a sentence; a skill that is explicit-only in Claude (`disable-model-invocation: true`) gets `agents/openai.yaml` with `allow_implicit_invocation: false` |
| `.codex/agents/<name>.toml` | `.claude/agents/<name>.md` | The ten agents: name, description, the model (opus → `gpt-6.1-sol` high, sonnet → `gpt-6-luna` medium) and the instructions, behind a preamble that names the tools the agent must never call and the skills it reads first |
| `.codex/config.toml` | `.mcp.json` | The MCP servers (`meta-ads`, `fal`), the network on for the `workspace-write` sandbox (the Node tools call Meta's and Google's APIs), the size limit for `AGENTS.md` |
| `.codex/hooks.json` | `.claude/settings.json` | The same hooks with `--codex`: the session start (HOT plus the config files), the checkpoint before a compaction (Codex's transcript format is read too), the account guard on every `mcp__meta-ads__*` call |

**Never edit these files by hand.** Change the Claude source, then run:

```bash
node memory/tools/codex-sync.mjs --write
```

`node memory/tools/codex-sync.mjs --check` (the default) writes nothing and exits 1 when a Codex file is stale, missing or left over; the scrub gate (`docs/scrub-check.sh`) runs it, so a release cannot ship them out of step. `memory/tools/codex-sync.test.mjs` is its test.

## The first session in Codex

1. **Run the bootstrap for Codex.** Its first question is which app runs the harness (Claude Code or Codex); `-Codex` / `--codex` answers it:

   ```bash
   powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 -Yes -Codex
   ```

   On a Mac: `bash bootstrap.sh --yes --codex`. It installs Git, Node.js, the Codex CLI (`npm install -g @openai/codex`), the Codex app (Windows: from the Microsoft Store through winget; Mac: it points to the download at chatgpt.com/codex), Google Chrome for the Codex Chrome extension, Obsidian and the rest, and nothing of Claude: the HyperFrames plugin and the memory routines are Claude-only and are skipped. The answer is kept in `dashboard/agent.json` (never committed); the setup wizard shows the Codex chapters (the Codex app, the Codex Chrome extension, `codex mcp login`, the hooks in `/hooks`) from it. Sign in to the Codex app with the company's ChatGPT account.
2. **Open the harness folder in Codex** (the folder itself, not a folder above it: the hooks are started from there) and **trust the project** when Codex asks. Without the trust Codex ignores `.codex/`: no MCP servers, no hooks.
3. **Trust the hooks:** `/hooks` in Codex, review the three hooks, trust them. **Until the hooks are trusted the account guard is off**, and the harness makes no Meta write. A hook changed by an upgrade has to be trusted again.
4. **Log in to the MCP servers** in a terminal:

   ```bash
   codex mcp login meta-ads
   ```

   ```bash
   codex mcp login fal
   ```

   Then start a new Codex session, so the tools load.
5. **The browser:** the Codex Chrome extension (Codex app → Plugins → Chrome) takes the place of Claude in Chrome for the console chapters of `$connect`.
6. Type **`$connect`**, then **`$campaign`**: the commands are skills in Codex (`$morning`, `$health`, `$sync` and the rest the same way).

## What is different in Codex

- **The go ticket.** Claude takes tools away from a sub-agent (`media-buyer` cannot call `ads_activate_entity`); Codex cannot. So under Codex the account guard refuses every call that turns something on, deletes or touches money unless a go ticket names its ids: `ads_activate_entity`, every delete, an `ads_update_entity` that sets ACTIVE, DELETED or ARCHIVED or a budget, bid, spend cap or end time, `ads_boost_ig_post` and an experiment create. The main session writes the ticket in the turn of the Owner's go:

  ```bash
  node .claude/hooks/account-guard.mjs --ticket --go "<the Owner's words>" --ids <id,id>
  ```

  A ticket lives 30 minutes (`--minutes`, at most 60), in `memory/state/go-ticket.json` (never committed); `--ticket --clear` removes it. The go-log row is written as before. Google Ads needs no ticket: `google-ads.mjs` already refuses without `--go`.
- **Questions.** The interview rounds use Codex's `request_user_input` when it is offered (Plan mode); otherwise the harness asks the round in the chat as numbered questions with lettered options, the recommended one first.
- **No control room and no chat widgets.** They belong to the Claude desktop app. The harness shows Markdown tables instead; `dashboard/setup.html` and `dashboard/state.json` still open in a browser.
- **The sandbox.** The network is on for `workspace-write` (`.codex/config.toml`). `google-ads.mjs login` listens on 127.0.0.1 for Google's answer: approve it when Codex asks.
- **Sub-agents** start only when asked; the skills already ask for them by name.

## Not yet proven on a live account

Each of these is written from Codex's documentation (read 2026-10-30) and covered by the tests on files, not by a live run. Check them in the first Codex session:
- whether Meta's MCP login (`codex mcp login meta-ads`) accepts Codex as a client;
- the account guard on a real Meta call: a read of another account must be refused;
- that Codex honours `project_doc_max_bytes` from the project's `.codex/config.toml` (if `AGENTS.md` arrives cut off, set it in `~/.codex/config.toml` too);
- the agent names with a hyphen (`media-buyer`) and the two model names.
