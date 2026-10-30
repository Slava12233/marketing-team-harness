#!/usr/bin/env node
// PreCompact hook (Node 20+, no dependencies): before a compaction, appends a "## Checkpoint HH:MM" block (in the
// timezone of config/operator.md, UTC when unset) to today's
// session note memory/sessions/YYYY-MM/YYYY-MM-DD.md with the text of the last 8 assistant messages, each
// scrubbed by the vault's secrets scanner (a hit becomes [redacted]) and trimmed to 300 characters, so the
// session after the compaction resumes from the note. Creates the note from memory/templates/session.md when
// it is missing. Always exits 0 and prints nothing: it never blocks compaction.
// Hook contract (https://code.claude.com/docs/en/hooks, read 2026-10-26):
//   stdin  JSON with the common fields session_id, transcript_path (the session's .jsonl transcript), cwd,
//          permission_mode, hook_event_name ("PreCompact"), plus `trigger` ("manual" for /compact, "auto")
//          and `custom_instructions` (what the user passed to /compact, else null).
//   Exit code 2 or {"decision":"block"} would block compaction; this hook does neither.
//   env    CLAUDE_PROJECT_DIR, the project root where the session started.
// Transcript lines read: {"type":"assistant","message":{"content":[{"type":"text","text":"..."}, ...]}};
// thinking, tool_use and tool_result blocks and sidechain (sub-agent) lines are skipped.
// Codex (--codex in .codex/hooks.json) sends the same fields; its transcript is a rollout file whose assistant lines are
// {"type":"response_item","payload":{"type":"message","role":"assistant","content":[{"type":"output_text","text":"..."}]}}.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MAX_BLOCKS = 8;
const MAX_CHARS = 300;

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

function findVault(starts) {
  for (const s of starts) {
    if (!s) continue;
    let dir = path.resolve(s);
    for (let i = 0; i < 8; i++) {
      if (fs.existsSync(path.join(dir, 'memory', 'README.md')) || fs.existsSync(path.join(dir, 'memory', 'templates'))) return dir;
      const up = path.dirname(dir);
      if (up === dir) break;
      dir = up;
    }
  }
  return null;
}

/** The text blocks of the last `max` assistant messages of a JSONL transcript (oldest first). */
export function lastAssistantTexts(jsonl, max = MAX_BLOCKS) {
  const texts = [];
  for (const line of String(jsonl).split('\n')) {
    if (!line.trim()) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o && o.type === 'response_item' && o.payload && o.payload.type === 'message' && o.payload.role === 'assistant') {
      for (const b of Array.isArray(o.payload.content) ? o.payload.content : []) {
        if (b && b.type === 'output_text' && typeof b.text === 'string' && b.text.trim()) texts.push(b.text);
      }
      continue;
    }
    if (!o || o.type !== 'assistant' || o.isSidechain) continue;
    const content = o.message && o.message.content;
    if (typeof content === 'string') { if (content.trim()) texts.push(content); continue; }
    if (!Array.isArray(content)) continue;
    for (const b of content) if (b && b.type === 'text' && typeof b.text === 'string' && b.text.trim()) texts.push(b.text);
  }
  return texts.slice(-max);
}

/** Today's date, month and time in the vault's timezone (lib.mjs reads it from config/operator.md). */
function localNow(lib, vault, d = new Date()) {
  const n = lib.vaultNow(d, lib.vaultTimezone(vault));
  return { date: n.date, month: n.date.slice(0, 7), time: n.time };
}

export async function checkpoint(input, { root, now = new Date() } = {}) {
  const vault = root || findVault([process.env.CLAUDE_PROJECT_DIR, input.cwd, process.cwd(), path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')]);
  if (!vault || !input.transcript_path) return null;
  let lib;
  try { lib = await import(pathToFileURL(path.join(vault, 'memory', 'tools', 'lib.mjs')).href); } catch { return null; } // no scanner, no write
  let jsonl;
  try { jsonl = fs.readFileSync(input.transcript_path, 'utf8'); } catch { return null; }
  const envNames = lib.envExampleNames(vault);
  const allowed = lib.allowedEmails(vault);
  const lines = lastAssistantTexts(jsonl).map(t => {
    const one = lib.scrubSecrets(t.replace(/\s+/g, ' ').trim(), { envNames, allowed });
    return one.length > MAX_CHARS ? one.slice(0, MAX_CHARS - 1).trimEnd() + '…' : one;
  });
  if (!lines.length) return null;

  const { date, month, time } = localNow(lib, vault, now);
  const file = path.join(vault, 'memory', 'sessions', month, `${date}.md`);
  let text;
  if (fs.existsSync(file)) {
    text = fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n');
  } else {
    const tpl = fs.existsSync(path.join(vault, 'memory', 'templates', 'session.md'))
      ? fs.readFileSync(path.join(vault, 'memory', 'templates', 'session.md'), 'utf8').replace(/\r\n?/g, '\n')
      : '---\ntype: session\ncreated: {{date}}\nupdated: {{date}}\nstatus: open\nmaintained_by: harness\ncategories: [sessions]\nsummary: \n---\n\n# {{date}}\n\n## Close\n';
    text = tpl.replace(/\{\{date\}\}/g, date).replace(/\{\{title\}\}/g, date)
      .replace(/^summary:[ \t]*$/m, `summary: "Session ${date}; note opened by the PreCompact hook."`);
  }
  const trigger = input.trigger ? ` (${String(input.trigger).replace(/[^a-z]/gi, '')})` : '';
  const block = [`## Checkpoint ${time}`, `<!-- PreCompact hook${trigger}: the last ${lines.length} assistant messages, scrubbed, ${MAX_CHARS} characters each -->`, ...lines.map(l => `- ${l}`), ''].join('\n');
  const close = /^## Close[ \t]*$/m.exec(text);
  text = close ? `${text.slice(0, close.index)}${block}\n${text.slice(close.index)}` : `${text.replace(/\n*$/, '\n\n')}${block}`;
  text = text.replace(/^(---\n[\s\S]*?^updated:)[ \t]*\S*[ \t]*$/m, `$1 ${date}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
  return { file, count: lines.length };
}

const isMain = (() => { try { return path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] || ''); } catch { return false; } })();
if (isMain) {
  const guard = setTimeout(() => process.exit(0), 20000);
  try {
    let input = {};
    try { input = JSON.parse(readStdin() || '{}'); } catch { input = {}; }
    await checkpoint(input);
  } catch {
    // never block compaction
  }
  clearTimeout(guard);
  process.exit(0);
}
