// node --test memory/tools/codex-sync.test.mjs   (Node 20+, no dependencies; temp folders only; run with a time bound)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sync, agentsMd, codexSkill, codexAgent, configToml, hooksJson, shortDescription, claudeImports, DESCRIPTION_MAX, MODELS } from './codex-sync.mjs';

const HARNESS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function put(root, rel, text) {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-sync-'));
  put(root, 'CLAUDE.md', '# Harness\n\nIntro.\n\n@config/company.md\n@config/goals.md\n\n## Rules\n\nPAUSED always.\n');
  put(root, '.claude/skills/long/SKILL.md', `---\nname: long\ndescription: "${'One sentence here. '.repeat(80).trim()}"\n---\n\n# Long\n`);
  put(root, '.claude/skills/manual/SKILL.md', '---\nname: manual\ndescription: Only when asked.\ndisable-model-invocation: true\n---\n\nBody.\n');
  put(root, '.claude/skills/manual/references/notes.md', 'notes\n');
  put(root, '.claude/agents/buyer.md', '---\nname: buyer\ndescription: "Builds paused."\nmodel: opus\ndisallowedTools: mcp__meta-ads__ads_activate_entity, mcp__meta-ads__ads_creative_delete\nskills:\n  - long\n---\n\nYou build. A path C:\\x and three quotes """ stay intact.\n');
  put(root, '.mcp.json', JSON.stringify({ mcpServers: { 'meta-ads': { type: 'http', url: 'https://mcp.facebook.com/ads' } } }));
  put(root, '.claude/settings.json', JSON.stringify({ hooks: {
    SessionStart: [{ matcher: 'startup|resume', hooks: [{ type: 'command', command: 'node .claude/hooks/session-start.mjs', timeout: 15 }] }],
    SubagentStart: [{ matcher: '*', hooks: [{ type: 'command', command: 'node .claude/hooks/session-start.mjs', timeout: 15 }] }],
    PreToolUse: [{ matcher: 'mcp__meta-ads__.*', hooks: [{ type: 'command', command: 'node .claude/hooks/account-guard.mjs', timeout: 20 }] }],
  } }));
  return root;
}

test('AGENTS.md is the Codex preface plus CLAUDE.md with its imports replaced by one pointer line', () => {
  const claude = '# H\n\n@config/a.md\n@config/b.md\n\nRule one.\n';
  assert.deepEqual(claudeImports(claude), ['config/a.md', 'config/b.md']);
  const md = agentsMd(claude);
  assert.match(md, /^# AGENTS\.md: the harness rulebook for Codex/);
  assert.match(md, /\$connect/);
  assert.match(md, /--ticket --go/);
  assert.doesNotMatch(md, /^@config\//m);
  assert.match(md, /injected here by the session-start hook \(or read by you at the start\): `config\/a\.md`, `config\/b\.md`/);
  assert.match(md, /Rule one\./);
});

test('skills: a long description is cut at a sentence, an explicit-only skill gets agents/openai.yaml', () => {
  const long = 'Alpha beta. '.repeat(200).trim();
  const cut = shortDescription(long);
  assert.ok(cut.length <= DESCRIPTION_MAX, `length ${cut.length}`);
  assert.match(cut, /beta\.…$/);
  assert.equal(shortDescription('short'), 'short');
  const one = codexSkill(`---\nname: x\ndescription: "${long}"\n---\nBody\n`);
  assert.match(one.skill, /^---\nname: x\ndescription: ".*…"\n---\nBody\n$/s);
  assert.equal(one.openai, null);
  const manual = codexSkill('---\nname: m\ndescription: d\ndisable-model-invocation: true\n---\nB\n');
  assert.match(manual.openai, /allow_implicit_invocation: false/);
});

test('agents: the model is mapped, the taken-away tools become a rule, the body is a valid TOML string', () => {
  const toml = codexAgent('---\nname: a\ndescription: "D \\"q\\""\nmodel: sonnet\ndisallowedTools: t1, t2\nskills:\n  - s1\n---\n\nBody with \\ and """.\n', '.claude/agents/a.md');
  assert.match(toml, /^name = "a"$/m);
  assert.match(toml, new RegExp(`^model = "${MODELS.sonnet.model}"$`, 'm'));
  assert.match(toml, /Never call these tools .*: t1, t2\./);
  assert.match(toml, /\.agents\/skills\/s1\/SKILL\.md/);
  assert.match(toml, /Body with \\\\ and ""\\"\./); // backslash doubled, triple quote broken
  assert.equal((toml.match(/"""/g) || []).length, 2); // the block opens and closes once
});

test('config.toml and hooks.json come from .mcp.json and .claude/settings.json', () => {
  const toml = configToml({ mcpServers: { 'meta-ads': { url: 'https://mcp.facebook.com/ads' }, local: { command: 'node', args: ['x.mjs'] } } });
  assert.match(toml, /^\[mcp_servers\.meta-ads\]\nurl = "https:\/\/mcp\.facebook\.com\/ads"$/m);
  assert.match(toml, /^\[mcp_servers\.local\]\ncommand = "node"\nargs = \["x\.mjs"\]$/m);
  assert.match(toml, /^network_access = true$/m);
  const hooks = JSON.parse(hooksJson({ hooks: { SubagentStart: [{ matcher: '*', hooks: [{ type: 'command', command: 'node .claude/hooks/session-start.mjs', timeout: 15 }] }] } }));
  const h = hooks.hooks.SubagentStart[0];
  assert.equal(h.matcher, undefined); // Claude's "*" is every agent; Codex matchers are regexes, so it is left out
  assert.equal(h.hooks[0].command, 'node .claude/hooks/session-start.mjs --codex');
  assert.equal(h.hooks[0].commandWindows, h.hooks[0].command);
  assert.ok(h.hooks[0].additionalContextLimit > 100000);
});

test('sync: --check finds stale, missing and left-over files; --write fixes them all', () => {
  const root = fixture();
  const first = sync(root);
  assert.ok(first.stale.includes('AGENTS.md') && first.stale.includes('.codex/agents/buyer.toml'));
  const w = sync(root, { write: true });
  assert.equal(w.written.length, w.count);
  for (const rel of ['AGENTS.md', '.agents/skills/long/SKILL.md', '.agents/skills/manual/agents/openai.yaml', '.agents/skills/manual/references/notes.md', '.codex/config.toml', '.codex/hooks.json', '.codex/agents/buyer.toml']) {
    assert.ok(fs.existsSync(path.join(root, rel)), rel);
  }
  let r = sync(root);
  assert.deepEqual([r.stale, r.extra], [[], []]);
  // CRLF line ends (a Windows checkout) are not a change.
  const agentsPath = path.join(root, 'AGENTS.md');
  fs.writeFileSync(agentsPath, fs.readFileSync(agentsPath, 'utf8').replace(/\n/g, '\r\n'));
  assert.deepEqual(sync(root).stale, []);
  // A change to the source makes the copy stale; a removed skill leaves files over.
  put(root, '.claude/skills/manual/SKILL.md', '---\nname: manual\ndescription: Changed.\n---\n\nBody.\n');
  fs.rmSync(path.join(root, '.claude', 'skills', 'long'), { recursive: true });
  r = sync(root);
  assert.ok(r.stale.includes('.agents/skills/manual/SKILL.md'));
  assert.ok(r.extra.includes('.agents/skills/long/SKILL.md') && r.extra.includes('.agents/skills/manual/agents/openai.yaml'));
  sync(root, { write: true });
  r = sync(root);
  assert.deepEqual([r.stale, r.extra], [[], []]);
  assert.ok(!fs.existsSync(path.join(root, '.agents', 'skills', 'long', 'SKILL.md')));
});

test('this repository: the Codex files match the Claude source', () => {
  const r = sync(HARNESS);
  assert.deepEqual({ stale: r.stale, extra: r.extra }, { stale: [], extra: [] }, 'run node memory/tools/codex-sync.mjs --write');
});
