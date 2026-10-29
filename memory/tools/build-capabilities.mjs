#!/usr/bin/env node
// memory/tools/build-capabilities.mjs: generates the capability map under memory/capabilities/ from what is
// installed (contract memory/README.md sections 1 and 3). Node 20+, no dependencies. The notes are machine-facing
// and stay English; generated_at is in the timezone of config/operator.md (UTC when unset).
//   skills.md       one row per .claude/skills/*/SKILL.md (name, description, third-party source from skills-lock.json, path)
//   agents.md       one row per .claude/agents/*.md (name, model, description, tools summary, skills)
//   commands.md     the workflow-command skills present (morning, health, next-round, sync, consolidate, setup)
//   connections.md  MCP servers from .mcp.json and memory/tooling/tool-inventory.md (name, URL, tool prefix; never a token)
//   hooks.md        .claude/hooks/* with the event from docs/hooks-paste-block.md and whether .claude/settings*.json names it
// Usage: node memory/tools/build-capabilities.mjs [--check] [--root <dir>]
//   --check  writes nothing; exit 1 when any file would change (generated_at alone does not count)
// Every cell passes the secrets scrubber, so a token or a value never lands in the map.
import fs from 'node:fs';
import path from 'node:path';
import {
  findRoot, parseFlags, readText, contentHash, oneLine, vaultNow, vaultTimezone, dateOf, splitFrontmatter, parseFrontmatter,
  serializeFrontmatter, parseTables, str, listAgents, listSkills, scrubSecrets, writeIfChanged, isMain,
} from './lib.mjs';

const GEN_LINE = 'Never hand-edit; run node memory/tools/build-capabilities.mjs';
const COMMANDS = ['connect', 'campaign', 'morning', 'health', 'next-round', 'sync', 'consolidate', 'setup'];

const cell = (s, max = 600) => scrubSecrets(oneLine(str(s), max)).replace(/\|/g, '\\|') || '—';
const table = (header, rows) => [
  `| ${header.join(' | ')} |`, `|${header.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.join(' | ')} |`),
];

function skillsNote(root) {
  const skills = listSkills(root);
  const third = skills.filter(s => s.source !== 'project').length;
  return {
    file: 'skills.md', title: 'Skills',
    summary: `The ${skills.length} skills under .claude/skills (${third} third-party, pinned in skills-lock.json), generated.`,
    lines: [
      `${skills.length} skills; "project" means written for this harness, anything else is the third-party source in \`skills-lock.json\`.`, '',
      ...table(['Name', 'Description', 'Source', 'Path'], skills.map(s => [`\`${s.name}\``, cell(s.description), cell(s.source), `\`${s.path}\``])),
    ],
  };
}

function toolsSummary(a) {
  const short = t => t.replace(/^mcp__([\w-]+)__/, '$1:');
  if (a.tools.length) return `only ${a.tools.length}: ${a.tools.map(short).join(', ')}`;
  if (a.disallowedTools.length) return `all except ${a.disallowedTools.length}: ${a.disallowedTools.map(short).join(', ')}`;
  return 'all (inherits the session tools)';
}

function agentsNote(root) {
  const agents = listAgents(root);
  return {
    file: 'agents.md', title: 'Agents',
    summary: `The ${agents.length} sub-agents under .claude/agents with model, job and tool access, generated.`,
    lines: [
      `${agents.length} agents. Delegation rule: sonnet for reading and verifying, opus for drafting and judging, never inherit.`, '',
      ...table(['Name', 'Model', 'Description', 'Tools', 'Skills'], agents.map(a => [
        `\`${a.name}\``, a.model ? `\`${a.model}\`` : '—', cell(a.description), cell(toolsSummary(a), 900), cell(a.skills.join(', ')),
      ])),
    ],
  };
}

/** The files a command writes: backticked vault paths on body lines that say write, append, regenerate…; else the description. */
function writesOf(skill) {
  const desc = skill.description;
  const paths = [];
  for (const line of str(skill.body).split('\n')) {
    if (!/\bwrit|append|regenerat|goes to|rewrit|creat|\bsave/i.test(line)) continue;
    for (const m of line.matchAll(/`((?:memory|reports|plans|dashboard|creatives)\/[^`\s]*)`/g)) {
      if (!paths.includes(m[1])) paths.push(m[1]);
    }
  }
  if (/read-only|never fixes/i.test(desc) && !paths.length) return 'nothing (read-only)';
  if (paths.length) return paths.slice(0, 10).map(p => `\`${p}\``).join(', ') + (paths.length > 10 ? `, and ${paths.length - 10} more` : '');
  const sentences = str(desc).split(/(?<=[.;])\s+/);
  const w = sentences.filter(s => /\bwrit|regenerat|\breport|commit|\bbuild|\bupdate|\bclose/i.test(s));
  if (w.length) return w.join(' ');
  if (/read-only|never fixes|reads only/i.test(desc)) return 'nothing (read-only)';
  return 'see the skill';
}

function commandsNote(root) {
  const skills = listSkills(root);
  const cmds = COMMANDS.map(n => skills.find(s => s.name === n || s.dir === n)).filter(Boolean);
  return {
    file: 'commands.md', title: 'Commands',
    summary: `The ${cmds.length} workflow commands (${cmds.map(c => '/' + c.name).join(', ') || 'none'}) and what each writes, generated from their skills.`,
    lines: [
      `Typed as \`/<name>\`; each is a skill under \`.claude/skills/\`. None of them activates or spends.`, '',
      ...table(['Command', 'What it writes', 'Description', 'Path'], cmds.map(c => [`\`/${c.name}\``, cell(writesOf(c), 900), cell(c.description), `\`${c.path}\``])),
    ],
  };
}

function connectionsNote(root) {
  const rows = []; const seen = new Set();
  let mcp = null;
  try { mcp = JSON.parse(fs.readFileSync(path.join(root, '.mcp.json'), 'utf8')); } catch { mcp = null; }
  for (const [name, cfg] of Object.entries(mcp?.mcpServers || {})) {
    const where = cfg.url ? cfg.url.split('?')[0] : cfg.command ? `command \`${path.basename(String(cfg.command))}\`` : '—';
    rows.push([`\`${name}\``, cell(where), `\`mcp__${name}__*\``, '`.mcp.json`']);
    seen.add(`mcp__${name}__`);
  }
  const inv = readText(path.join(root, 'memory', 'tooling', 'tool-inventory.md'));
  if (inv) {
    for (const t of parseTables(splitFrontmatter(inv).body)) {
      for (const r of t.rows) {
        const joined = r.join(' ');
        const prefix = (/mcp__[\w-]+__/.exec(joined) || [])[0] || null;
        const url = (/https?:\/\/[^\s)`|,]+/.exec(r[0] || '') || /https?:\/\/[^\s)`|,]+/.exec(joined) || [])[0] || null;
        if (!prefix && !url) continue;
        if (prefix && seen.has(prefix)) continue;
        if (prefix) seen.add(prefix);
        const bold = /\*\*([^*]+)\*\*/.exec(r[0] || '');
        const name = bold ? bold[1] : oneLine(str(r[0]).replace(/`[^`]*`/g, '').replace(/\(.*?\)/g, ''), 60);
        rows.push([cell(name, 80), url ? cell(url.split('?')[0]) : '—', prefix ? `\`${prefix}*\`` : '—', '[[tool-inventory]]']);
      }
    }
  }
  const sources = [mcp ? '`.mcp.json`' : null, inv ? '[[tool-inventory]]' : null].filter(Boolean);
  return {
    file: 'connections.md', title: 'Connections',
    summary: `The ${rows.length} MCP servers and tool families the harness knows (name, URL, tool prefix), generated; no tokens.`,
    lines: [
      sources.length ? `Sources: ${sources.join(' and ')}. Auth lives in Claude Code's credential store and the repo-root \`.env\` (names only).` : 'No `.mcp.json` and no `memory/tooling/tool-inventory.md` yet: nothing to list.', '',
      ...(rows.length ? table(['Server', 'URL or command', 'Tool prefix', 'Source'], rows) : []),
    ],
  };
}

function pasteBlockEvents(root) {
  const map = new Map();
  const t = readText(path.join(root, 'docs', 'hooks-paste-block.md'));
  if (!t) return map;
  for (const m of t.matchAll(/```json\n([\s\S]*?)```/g)) {
    let j; try { j = JSON.parse(m[1]); } catch { continue; }
    for (const [event, groups] of Object.entries(j.hooks || {})) {
      for (const g of groups || []) for (const h of g.hooks || []) {
        const file = (/[\w.-]+\.(?:mjs|js|ps1|sh|py|cmd)/.exec(String(h.command || '')) || [])[0];
        if (file) map.set(file, { event, matcher: g.matcher || '' });
      }
    }
  }
  return map;
}

function guessEvent(name) {
  const n = name.toLowerCase();
  if (n.includes('session-start')) return 'SessionStart';
  if (n.includes('pre-compact')) return 'PreCompact';
  if (n.includes('post-compact')) return 'PostCompact';
  if (n.includes('pre-tool') || n.includes('guard')) return 'PreToolUse';
  if (n.includes('post-tool')) return 'PostToolUse';
  if (n.includes('stop')) return 'Stop';
  return null;
}

function hooksNote(root) {
  const dir = path.join(root, '.claude', 'hooks');
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => /\.(mjs|js|ps1|sh|py|cmd)$/i.test(f)).sort(); } catch { files = []; }
  const events = pasteBlockEvents(root);
  const settings = ['settings.json', 'settings.local.json'].map(f => readText(path.join(root, '.claude', f)) || '').join('\n');
  const rows = files.map(f => {
    const text = readText(path.join(dir, f)) || '';
    const lines = text.split('\n').filter(l => !/^#!/.test(l));
    const comment = [];
    for (const l of lines) { const m = /^\s*(?:\/\/|#)\s?(.*)$/.exec(l); if (!m || /^hook contract/i.test(m[1].trim())) break; if (m[1].trim()) comment.push(m[1].trim()); if (comment.length >= 2) break; }
    const ev = events.get(f);
    const installed = settings.includes(f) ? 'yes' : 'no (paste block not applied)';
    return [`\`${f}\``, ev ? `\`${ev.event}\`${ev.matcher ? ` (${ev.matcher.replace(/\|/g, '\\|')})` : ''}` : (guessEvent(f) ? `\`${guessEvent(f)}\` (from the name)` : '—'), cell(comment.join(' ') || 'no header comment'), installed];
  });
  return {
    file: 'hooks.md', title: 'Hooks',
    summary: `The ${rows.length} hook scripts under .claude/hooks, their events and whether project settings install them, generated.`,
    lines: [
      'The hooks ship turned on in `.claude/settings.json` (nothing to paste); [[hooks-paste-block]] (`docs/`) holds the block to restore if that file is deleted or replaced. "Installed" reads the project settings files for the script name.', '',
      ...(rows.length ? table(['Hook', 'Event', 'What it does', 'Installed'], rows) : ['No hook scripts in `.claude/hooks/` yet.']),
    ],
  };
}

function render(n, created, generatedAt) {
  const body = [`# ${n.title}`, '', GEN_LINE, ...n.lines].join('\n') + '\n';
  return serializeFrontmatter({
    type: 'capability', created, status: 'active', maintained_by: 'generated', categories: ['capabilities'],
    summary: n.summary, generated_at: generatedAt, content_hash: contentHash(body),
  }) + '\n' + body;
}

export function buildCapabilities(root, { now = new Date(), write = true } = {}) {
  const { date: today, iso } = vaultNow(now, vaultTimezone(root));
  const generatedAt = iso.replace(/:\d{2}([+-])/, '$1');
  const hooksBlockExists = fs.existsSync(path.join(root, 'docs', 'hooks-paste-block.md'));
  const notes = [skillsNote(root), agentsNote(root), commandsNote(root), connectionsNote(root), hooksNote(root)];
  if (!hooksBlockExists) notes[4].lines[0] = notes[4].lines[0].replace('[[hooks-paste-block]] (`docs/`)', '`docs/hooks-paste-block.md` (not written yet)');
  const outputs = notes.map(n => {
    const rel = `memory/capabilities/${n.file}`;
    const abs = path.join(root, rel);
    const old = readText(abs);
    const oldFm = old ? parseFrontmatter(splitFrontmatter(old).fmText) : {};
    const created = dateOf(oldFm.created) || today;
    const same = old !== null && render(n, created, str(oldFm.generated_at)) === old;
    return { rel, abs, changed: !same, content: same ? old : render(n, created, generatedAt) };
  });
  if (write) for (const o of outputs) if (o.changed) writeIfChanged(o.abs, o.content);
  return { outputs };
}

if (isMain(import.meta.url)) {
  const { flags } = parseFlags();
  const root = findRoot();
  let res;
  try { res = buildCapabilities(root, { write: !flags.has('check') }); } catch (e) { console.error(`build-capabilities: failed: ${e.message}`); process.exit(2); }
  const changed = res.outputs.filter(o => o.changed).map(o => o.rel);
  if (flags.has('check')) {
    if (changed.length) { console.log(`build-capabilities --check: would change ${changed.join(', ')}`); process.exit(1); }
    console.log('build-capabilities --check: up to date');
  } else console.log(changed.length ? `build-capabilities: wrote ${changed.join(', ')}` : 'build-capabilities: nothing changed');
}
