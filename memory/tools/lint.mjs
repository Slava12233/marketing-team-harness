#!/usr/bin/env node
// memory/tools/lint.mjs: the vault lint of contract memory/README.md section 7. Node 20+, no dependencies.
// Scope: every markdown note under memory/, reports/ and plans/ (memory/templates/ skipped). Links resolve
// against every markdown file of the vault (root, docs/, reports/, plans/ included) and every other file
// outside the ignored folders (.base dashboards, images), the way Obsidian resolves them.
// FAIL: a token shape, an email outside the allow-list (lib.mjs allowedEmails: the addresses written in
//   config/operator.md and config/company.md, plus the commit co-author and GitHub noreply addresses), a phone
//   number of any country, or an .env name with a value; a wikilink
//   to a note that does not exist (WARN inside memory/archive/ and fenced code blocks; inline `code` is not a
//   link); a memory/ note over 300 lines (INDEX.md excepted: one line per note; reports/ and plans/ over 300
//   lines are a WARN, since reports are never edited after they are read); memory/HOT.md over 60 lines or 8,192 bytes;
//   HOME.md over 150 lines; a generated note (or HOME's generated block) whose hash does not match; a learning
//   or decision edited after its day (updated later than created) without status superseded; a note without
//   type, created or summary.
// WARN: a figure (an amount with a currency symbol or a three-letter currency code, or a percentage) in a fact
//   note without as_of; inbox/proposals.md
//   holding an entry older than 7 days; an active campaign whose as_of (else updated) is older than 7 days; a
//   session note outside its month folder.
// Usage: node memory/tools/lint.mjs [--fix-frontmatter-updated] [--root <dir>]
//   --fix-frontmatter-updated  sets a missing `updated` to `created`, and on harness- or agent-maintained notes
//   (not learnings, decisions, generated or owner notes) raises `updated` to the file's modification date.
// Prints one line per finding, `FAIL|WARN path: reason` (never the matched secret), then a count. Exit 1 on a FAIL.
import fs from 'node:fs';
import path from 'node:path';
import {
  findRoot, parseFlags, loadNotes, buildResolver, extractWikilinks, scanSecrets, envExampleNames, allowedEmails, contentHash,
  lineCount, vaultNow, vaultTimezone, dateOf, daysBetween, str, setFrontmatterKey, isMain,
} from './lib.mjs';
import { readHomeBlock, HOT_REL, HOT_MAX_LINES, HOT_MAX_BYTES } from './build-hot.mjs';

const NOTE_MAX = 300;
const HOME_MAX = 150;
const FIGURE_RE = /(?:[£$€₪¥₹]|\b[A-Z]{3}\b)\s?\d|\d[\d,.]*\s?(?:[£$€₪¥₹]|\b[A-Z]{3}\b)(?![A-Za-z])|\d+(?:\.\d+)?\s?%/;
const FACT_TYPES = new Set(['state', 'business', 'campaign', 'flight', 'audience', 'experiment', 'learning', 'review']);

const stripFences = body => body.replace(/^\s*(```|~~~)[\s\S]*?^\s*\1.*$/gm, '');

export function lint(root, { today = null, fixUpdated = false } = {}) {
  const tz = vaultTimezone(root);
  if (!today) today = vaultNow(new Date(), tz).date;
  const findings = [];
  const add = (level, rel, reason) => findings.push({ level, rel, reason });
  const notes = loadNotes(root);
  const resolver = buildResolver(root);
  const envNames = envExampleNames(root);
  const allowed = allowedEmails(root);
  const fixed = [];

  for (const n of notes) {
    const fm = n.fm;
    const type = str(fm.type);
    const status = str(fm.status).toLowerCase();
    const generated = str(fm.maintained_by) === 'generated';

    for (const h of scanSecrets(n.text, { envNames, allowed })) {
      add('FAIL', n.rel, `line ${h.line}: ${h.kind === 'env-value' ? `.env name ${h.name} written with a value` : `${h.kind} shape`}`);
    }

    if (!n.hasFm) add('FAIL', n.rel, 'no frontmatter (type, created, summary required)');
    else for (const k of ['type', 'created', 'summary']) if (!str(fm[k])) add('FAIL', n.rel, `frontmatter without ${k}`);

    const lines = lineCount(n.text);
    if (n.rel === HOT_REL) {
      const bytes = Buffer.byteLength(n.text, 'utf8');
      if (lines > HOT_MAX_LINES || bytes > HOT_MAX_BYTES) add('FAIL', n.rel, `over its cap: ${lines} lines, ${bytes} bytes (max ${HOT_MAX_LINES} lines, ${HOT_MAX_BYTES} bytes)`);
    } else if (n.rel === 'memory/HOME.md') {
      if (lines > HOME_MAX) add('FAIL', n.rel, `${lines} lines, over the ${HOME_MAX}-line cap (/consolidate)`);
    } else if (n.rel !== 'memory/INDEX.md' && lines > NOTE_MAX) {
      // Reports are written once and never edited after the Owner has read them (CLAUDE.md rule 1), so an old long
      // report or plan is a warning; a memory/ note over the cap fails.
      const frozen = n.rel.startsWith('reports/') || n.rel.startsWith('plans/');
      add(frozen ? 'WARN' : 'FAIL', n.rel, `${lines} lines, over the ${NOTE_MAX}-line cap: ${frozen ? 'split new ones; old reports stay as written' : 'split into linked notes'}`);
    }

    if (generated) {
      if (!str(fm.content_hash)) add('FAIL', n.rel, 'generated note without content_hash');
      else if (contentHash(n.body) !== str(fm.content_hash)) add('FAIL', n.rel, 'hand-edited generated note (content_hash does not match): rerun its generator');
    }
    if (n.rel === 'memory/HOME.md') {
      const b = readHomeBlock(n.text);
      if (!b) add('WARN', n.rel, 'no %% generated:start %% / %% generated:end %% markers');
      else if (b.hash && contentHash(b.inner) !== b.hash) add('FAIL', n.rel, 'hand-edited generated block (hash does not match): rerun build-hot.mjs');
      else if (!b.hash) add('WARN', n.rel, 'generated block not built yet: run build-hot.mjs');
    }

    if ((type === 'learning' || type === 'decision') && status !== 'superseded') {
      const c = dateOf(fm.created); const u = dateOf(fm.updated);
      if (c && u && u > c) add('FAIL', n.rel, `${type} edited after its day (created ${c}, updated ${u}) without status superseded: write a superseding note`);
    }

    for (const l of extractWikilinks(n.text)) {
      if (l.inInlineCode || !l.target) continue;
      if (resolver.resolve(l.target)) continue;
      const soft = l.inFence || n.rel.startsWith('memory/archive/');
      add(soft ? 'WARN' : 'FAIL', n.rel, `line ${l.line}: dead link ${l.raw}${l.inFence ? ' (in a code block)' : soft ? ' (in archive)' : ''}`);
    }

    if (n.rel.startsWith('memory/') && FACT_TYPES.has(type) && !generated && !str(fm.as_of) && FIGURE_RE.test(stripFences(n.body))) {
      add('WARN', n.rel, 'a figure without as_of in the frontmatter');
    }

    if (type === 'campaign' && status === 'active' && !n.rel.startsWith('memory/archive/')) {
      const d = dateOf(fm.as_of) || dateOf(fm.updated);
      if (!d) add('WARN', n.rel, 'active campaign without as_of: its ## Current state has no read time');
      else if (daysBetween(d, today) > 7) add('WARN', n.rel, `active campaign whose ## Current state is ${daysBetween(d, today)} days old (as_of ${d})`);
    }

    const sm = /^memory\/sessions\/(?:(.+)\/)?(\d{4}-\d{2})-\d{2}\.md$/.exec(n.rel);
    if (sm && sm[1] !== sm[2]) add('WARN', n.rel, `session note outside its month folder memory/sessions/${sm[2]}/ (build-hot.mjs rotates it)`);

    if (n.rel === 'memory/inbox/proposals.md') {
      const dates = [...n.body.matchAll(/^\s*-\s+(\d{4}-\d{2}-\d{2})/gm)].map(m => m[1]).sort();
      if (dates.length && daysBetween(dates[0], today) > 7) add('WARN', n.rel, `holds a proposal from ${dates[0]}, older than 7 days: merge it at /sync`);
    }

    if (fixUpdated && n.hasFm && !generated) {
      let text = n.text; let to = null;
      if (!str(fm.updated) && dateOf(fm.created)) to = dateOf(fm.created);
      const harnessy = /^(harness|agent:.+)$/.test(str(fm.maintained_by));
      if (harnessy && type !== 'learning' && type !== 'decision' && n.mtime) {
        const m = vaultNow(n.mtime, tz).date;
        const cur = to || dateOf(fm.updated);
        if (!cur || m > cur) to = m;
      }
      if (to && to !== dateOf(fm.updated)) {
        text = setFrontmatterKey(text, 'updated', to);
        fs.writeFileSync(n.abs, text, 'utf8');
        fixed.push(`${n.rel}: updated -> ${to}`);
      }
    }
  }
  return { findings, fixed, count: notes.length };
}

if (isMain(import.meta.url)) {
  const { flags } = parseFlags();
  const root = findRoot();
  const { findings, fixed, count } = lint(root, { fixUpdated: flags.has('fix-frontmatter-updated') });
  for (const f of fixed) console.log(`FIXED ${f}`);
  const order = { FAIL: 0, WARN: 1 };
  findings.sort((a, b) => order[a.level] - order[b.level] || a.rel.localeCompare(b.rel));
  for (const f of findings) console.log(`${f.level} ${f.rel}: ${f.reason}`);
  const fails = findings.filter(f => f.level === 'FAIL').length;
  console.log(`lint: ${count} notes, ${fails} FAIL, ${findings.length - fails} WARN`);
  process.exit(fails ? 1 : 0);
}
