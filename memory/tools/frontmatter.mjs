#!/usr/bin/env node
// memory/tools/frontmatter.mjs: adds the vault frontmatter (contract memory/README.md section 2) to every
// reports/**/*.md and plans/**/*.md that has none (Node 20+, no dependencies). A file that already starts with frontmatter is never touched.
//   type: report | plan; created and updated: the first YYYY-MM-DD in the file's name (the YYYY-MM-DD- prefix,
//   or the dated folder for files inside one), else the file's modification date (in the timezone of config/operator.md);
//   status: done (reports) | active (plans); maintained_by: harness; categories: [reports] | [plans];
//   summary: the first heading's text; campaign_ids: every 15-to-18-digit number in the file, as strings.
// Usage: node memory/tools/frontmatter.mjs [--dry-run | --apply] [--root <dir>]   (--dry-run is the default)
import fs from 'node:fs';
import path from 'node:path';
import { findRoot, parseFlags, walkMarkdown, readText, splitFrontmatter, serializeFrontmatter, vaultNow, vaultTimezone, oneLine, isMain } from './lib.mjs';

function dateFromPath(rel) {
  const base = path.posix.basename(rel);
  const m = /(\d{4}-\d{2}-\d{2})/.exec(base) || /(\d{4}-\d{2}-\d{2})/.exec(path.posix.dirname(rel));
  return m ? m[1] : null;
}

function firstHeading(body) {
  const lines = body.split('\n');
  let fence = false;
  for (const l of lines) {
    if (/^\s*(```|~~~)/.test(l)) { fence = !fence; continue; }
    if (fence) continue;
    const m = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(l);
    if (m) return m[1];
  }
  const first = lines.find(l => l.trim() && !/^\s*(<!--|```|\||---)/.test(l));
  return first || '';
}

const plain = s => oneLine(String(s)
  .replace(/\[\[([^\]|]+)(?:\\?\|([^\]]+))?\]\]/g, (_, a, b) => b || a)
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/[*_`]/g, '')
  .replace(/<[^>]+>/g, ''), 240);

export function planFrontmatter(root, rel) {
  const abs = path.join(root, rel);
  const text = readText(abs);
  if (text === null || splitFrontmatter(text).hasFm || text.startsWith('---\n')) return null;
  const isReport = rel.startsWith('reports/');
  let mdate = null;
  try { mdate = vaultNow(fs.statSync(abs).mtime, vaultTimezone(root)).date; } catch { /* ignore */ }
  const created = dateFromPath(rel) || mdate;
  const ids = [...new Set([...text.matchAll(/(?<!\d)\d{15,18}(?!\d)/g)].map(m => m[0]))];
  const fm = {
    type: isReport ? 'report' : 'plan', created, updated: created, status: isReport ? 'done' : 'active',
    maintained_by: 'harness', categories: [isReport ? 'reports' : 'plans'],
    summary: plain(firstHeading(text)) || path.posix.basename(rel, '.md'),
  };
  if (ids.length) fm.campaign_ids = ids;
  return { rel, abs, fm, content: serializeFrontmatter(fm) + '\n' + text.replace(/^\n+/, '') };
}

export function run(root, { apply = false } = {}) {
  const targets = walkMarkdown(root).filter(r => r.startsWith('reports/') || r.startsWith('plans/'));
  const planned = targets.map(r => planFrontmatter(root, r)).filter(Boolean);
  if (apply) for (const p of planned) fs.writeFileSync(p.abs, p.content, 'utf8');
  return { targets: targets.length, planned };
}

if (isMain(import.meta.url)) {
  const { flags } = parseFlags();
  const apply = flags.has('apply');
  const { targets, planned } = run(findRoot(), { apply });
  for (const p of planned) {
    console.log(`${apply ? 'ADDED' : 'WOULD ADD'} ${p.rel}: type ${p.fm.type}, created ${p.fm.created}, summary "${p.fm.summary}"${p.fm.campaign_ids ? `, ${p.fm.campaign_ids.length} ids` : ''}`);
  }
  console.log(`frontmatter: ${planned.length} of ${targets} reports and plans ${apply ? 'given' : 'would get'} frontmatter; the rest already have it${apply ? '' : ' (dry run; --apply writes)'}`);
}
