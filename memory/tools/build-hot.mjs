#!/usr/bin/env node
// memory/tools/build-hot.mjs: generates the vault's derived files from the notes (contract memory/README.md
// sections 1, 3, 4, 6 and 8). Node 20+, no dependencies. "Hot" is HOT every session gets first.
//   memory/HOT.md     what every session must know (<= 60 lines, <= 8,192 bytes), injected by the SessionStart hook
//   memory/INDEX.md        one line per note, grouped by folder
//   memory/HOME.md         only the block between %% generated:start %% and %% generated:end %%, labelled in the
//                          Owner's chat language (config/operator.md: Hebrew or English; English when unset)
//   dashboard/state.json   the control-room pane's data in the shape control-room/marketing-team reads; every
//                          existing key kept, values from the notes and config/
// It also files a session note that sits outside its month folder into memory/sessions/YYYY-MM/ (rotation).
// Usage: node memory/tools/build-hot.mjs [--check] [--print] [--by sync] [--root <dir>] [--now <ISO date>]
//   --by     who regenerated: "sync" or "/sync" both give "/sync" (default build-hot.mjs); with --by, generatedAt
//            is stamped on every writing run, without it only when a value changed
//   --check  writes nothing; exit 1 when any output would change (generated_at / generatedAt alone do not count)
//   --print  writes nothing; prints HOT, HOME's block and state.json
// A missing source gives a missing value (omitted, null, or the previous value of a state.json key that the
// pane needs); a number is never made up. Times are in the timezone of config/operator.md (UTC when unset).
import fs from 'node:fs';
import path from 'node:path';
import {
  findRoot, parseFlags, loadNotes, readText, writeIfChanged, contentHash, lineCount, oneLine, vaultNow, vaultTimezone,
  ownerLanguage, configLine, dateOf, daysBetween, splitFrontmatter, parseFrontmatter, serializeFrontmatter, getSection,
  getBullets, parseTables, col, str, buildResolver, listAgents, isMain,
} from './lib.mjs';

export const HOT_REL = 'memory/HOT.md';
export const HOT_MAX_LINES = 60;
export const HOT_MAX_BYTES = 8192;
export const GEN_LINE = 'Never hand-edit; run node memory/tools/build-hot.mjs';
export const RULE_LINE = 'Read the note before you act; re-read live before you change; names and public ids only';
export const HOME_START = '%% generated:start %%';
export const HOME_END = '%% generated:end %%';
const LANES = ['measure', 'create', 'gate', 'build', 'close'];
const OWNER_ORDER = ['owner', 'operator', 'product-team', 'lawyer', 'harness'];
const CLOSED = /^(done|archived|superseded)$/i;

/** The fixed lanes of the harness (docs/TEMPLATE-SPEC.md §6), as the control room expects them. */
export const TEAM_LANES = {
  Measure: ['performance-analyst', 'signals-auditor', 'cro-auditor'],
  Create: ['creative-director', 'copywriter', 'competitor-researcher'],
  Gate: ['compliance-reviewer', 'test-designer'],
  Build: ['media-buyer'],
  Close: ['harness-librarian'],
};

/** Owner-facing labels of HOME's generated block, by chat language. */
export const LABELS = {
  en: {
    today: 'Today', money: 'Money vs caps', open: 'Open items by owner', learnings: 'Newest learnings',
    none: 'none', noneYet: 'none yet', noCaps: 'no caps recorded', noState: 'no memory/state/current.md yet',
    asOf: s => `state as of ${s}`, more: n => `and ${n} more in the open-items table below`,
    daysTo: (d, ld) => `${d} days to launch (${ld})`, launchDay: ld => `launch day (${ld})`, since: ld => `launched ${ld}`,
    owners: { owner: 'Owner', operator: 'Operator', harness: 'Claude', 'product-team': 'Product team', lawyer: 'Lawyer' },
  },
  he: {
    today: 'היום', money: 'כסף מול תקרות', open: 'פריטים פתוחים לפי בעלים', learnings: 'למידות אחרונות',
    none: 'אין', noneYet: 'אין עדיין', noCaps: 'אין תקרות רשומות', noState: 'אין עדיין memory/state/current.md',
    asOf: s => `מצב נכון ל-${s}`, more: n => `ועוד ${n} בטבלת הפריטים הפתוחים למטה`,
    daysTo: (d, ld) => `${d} ימים להשקה (${ld})`, launchDay: ld => `יום ההשקה (${ld})`, since: ld => `הושק ב-${ld}`,
    owners: { owner: 'הבעלים', operator: 'המפעיל', harness: 'Claude', 'product-team': 'צוות המוצר', lawyer: 'עו"ד' },
  },
};

/** Task owners in dashboard/state.json (the control-room pane is English). */
const OWNER_EN = LABELS.en.owners;

// ---------------------------------------------------------------- reading the vault

function ownerKey(o) {
  const k = str(o).toLowerCase().replace(/\s+/g, '-');
  return k === 'claude' ? 'harness' : k === 'counsel' ? 'lawyer' : k;
}

function ownerFromText(t) {
  const m = /^\s*(?:\*\*|\[|\()?\s*(owner|operator|harness|claude|product[- ]team|lawyer|counsel)\s*(?:\*\*|\]|\))?\s*[:—–-]\s*/i.exec(t);
  if (!m) return { owner: null, text: t };
  return { owner: ownerKey(m[1]), text: t.slice(m[0].length) };
}

/** Cap rows from a goals-style note: tables with an Amount or a Cap column. */
function capTables(body) {
  const out = [];
  for (const t of parseTables(body)) {
    const amountCol = col(t.header, /^amount$/i) !== -1 ? col(t.header, /^amount$/i) : col(t.header, /^cap$/i);
    if (amountCol <= 0 && !(amountCol === 0 && t.header.length > 1)) continue;
    const labelCol = amountCol === 0 ? 1 : 0;
    const periodCol = col(t.header, /^period$/i);
    for (const r of t.rows) out.push({ table: t, row: r, amountCol, labelCol, periodCol });
  }
  return out;
}

// A currency symbol or a three-letter ISO code next to a number (any currency; the rules never hard-code one).
const CUR = '(?:[£$€₪¥₹]|\\b[A-Z]{3}\\b)';
const AMOUNT_RE = new RegExp(`${CUR}\\s?(\\d[\\d,]*(?:\\.\\d+)?)|(\\d[\\d,]*(?:\\.\\d+)?)\\s?${CUR}`);
/** The number in an amount cell ("£750", "1,000 GBP", "2,100"); null for a placeholder or no number. */
function parseAmount(s) {
  const t = str(s).replace(/[`*]/g, '').trim();
  if (!t || t.includes('{{')) return null;
  const bare = t.replace(new RegExp(CUR, 'g'), '').trim();
  if (/^\d[\d,]*(\.\d+)?$/.test(bare)) return Number(bare.replace(/,/g, ''));
  const m = AMOUNT_RE.exec(t);
  return m ? Number((m[1] || m[2]).replace(/,/g, '')) : null;
}
function periodFrom(s) {
  const t = str(s).toLowerCase();
  if (!t) return null;
  if (/daily|\bday\b|ליום/.test(t)) return 'day';
  if (/weekly|\bweek\b|לשבוע/.test(t)) return 'week';
  if (/monthly|\bmonth\b|לחודש/.test(t)) return 'month';
  if (/campaign|lifetime|flight|total|כולל/.test(t)) return 'campaign';
  return null;
}
const cleanLabel = s => oneLine(str(s).replace(/`[^`]*`/g, '').replace(/\[\[([^\]|]+)(?:\\?\|([^\]]+))?\]\]/g, (_, a, b) => b || a).replace(/\*\*/g, '').replace(/\s{2,}/g, ' ').replace(/[\s,·-]+$/, ''), 120);

/** Caps and money lines from one goals-style body; rows still holding a placeholder are skipped. */
function capsFrom(body) {
  const lines = []; const caps = [];
  for (const { table, row, amountCol, labelCol, periodCol } of capTables(body)) {
    if (row.some(c => c.includes('{{') || c.includes('<fill'))) continue;
    lines.push(row.map((c, i) => (i === 0 || !c ? c : `${table.header[i]} ${c}`)).filter(Boolean).join(' · '));
    const label = cleanLabel(row[labelCol]);
    caps.push({ label, amount: parseAmount(row[amountCol]), period: periodCol !== -1 ? (periodFrom(row[periodCol]) || (str(row[periodCol]) ? oneLine(row[periodCol], 60) : null)) : periodFrom(label) });
  }
  return { lines, caps };
}

/** Routine rows of config/operator.md → [{ id, label, command, time, days }]; days default to the working days. */
const DAY_IDX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
function daysFrom(s) {
  const t = str(s).toLowerCase();
  const range = /(sun|mon|tue|wed|thu|fri|sat)[a-z]*\s*[–-]\s*(sun|mon|tue|wed|thu|fri|sat)/.exec(t);
  if (range) {
    const out = []; let d = DAY_IDX[range[1]];
    for (let i = 0; i < 7; i++) { out.push(d); if (d === DAY_IDX[range[2]]) break; d = (d + 1) % 7; }
    return out;
  }
  const single = [...t.matchAll(/\b(sun|mon|tue|wed|thu|fri|sat)[a-z]*/g)].map(m => DAY_IDX[m[1]]);
  return single.length ? [...new Set(single)] : null;
}
export function routinesFrom(root) {
  const text = readText(path.join(root, 'config', 'operator.md'));
  if (!text) return null;
  const working = daysFrom(configLine(root, 'config/operator.md', 'Working days')) || [];
  const items = [];
  for (const t of parseTables(text)) {
    const ci = col(t.header, /^command$/i); const ti = col(t.header, /^time$/i); const ri = col(t.header, /^routine$/i);
    if (ci === -1 || ti === -1) continue;
    for (const r of t.rows) {
      const time = (/(\d{1,2}:\d{2})/.exec(r[ti] || '') || [])[1];
      const command = str(r[ci]).replace(/`/g, '').replace(/^\//, '').trim();
      if (!time || !command || r.some(c => c.includes('{{'))) continue;
      items.push({ id: command, label: str(r[ri] ?? command) || command, command, time: time.padStart(5, '0'), days: daysFrom(r[ti]) || working });
    }
  }
  return items.length ? { timezone: vaultTimezone(root), items } : null;
}

const isAbout = n => n.name.startsWith('_');

export function collect(root) {
  const notes = loadNotes(root);
  const byRel = new Map(notes.map(n => [n.rel, n]));
  const current = byRel.get('memory/state/current.md') || null;
  const goalsNote = byRel.get('memory/business/goals.md') || null;
  const isGenerated = n => str(n.fm.maintained_by) === 'generated';

  const nextActions = current ? getBullets(getSection(current.body, /^next actions/i)) : [];

  // Campaign rows of state/current.md (a table with a Status column under a heading or column naming campaigns).
  const currentCampaignRows = [];
  if (current) {
    for (const t of parseTables(current.body)) {
      const sc = col(t.header, /status/i);
      if (sc === -1) continue;
      if (!/campaign/i.test(t.heading) && col(t.header, /campaign/i) === -1) continue;
      for (const r of t.rows) if (!r.some(c => c.includes('<fill'))) currentCampaignRows.push({ header: t.header, row: r, status: str(r[sc]) });
    }
  }
  const activeOrPausedRows = currentCampaignRows.filter(r => /active|paused|live|scheduled/i.test(r.status));

  // Money vs caps: config/goals.md (the Owner's limits, typed by /setup), else memory/business/goals.md, else
  // the cap lines of state/current.md.
  let moneyLines = []; let caps = []; let goalsSource = null;
  const cfg = readText(path.join(root, 'config', 'goals.md'));
  if (cfg) { const r = capsFrom(cfg); if (r.caps.length) { ({ lines: moneyLines, caps } = r); goalsSource = 'config/goals.md'; } }
  if (!goalsSource && goalsNote) {
    const r = capsFrom(goalsNote.body);
    if (r.caps.length) { ({ lines: moneyLines, caps } = r); goalsSource = '[[business/goals|goals]]'; }
  }
  if (!goalsSource && current) {
    const cl = current.body.split('\n');
    for (let i = 0; i < cl.length; i++) {
      const l = cl[i];
      if (!/\bcaps?\b|spend_cap|תקרה/i.test(l) || /^\s*#/.test(l) || !l.trim() || l.includes('<fill')) continue;
      if (/^\s*\|/.test(l) && /^\s*\|?\s*:?-{3,}/.test(cl[i + 1] || '')) continue; // a table's header row
      const text = /^\s*\|/.test(l) ? l.split('|').map(s => s.trim()).filter(Boolean).join(' · ') : l.replace(/^\s*[-*]\s+/, '');
      moneyLines.push(text);
      const amount = parseAmount(text);
      if (amount !== null) caps.push({ label: cleanLabel(text.split(/[:·]/)[0]), amount, period: periodFrom(text) });
    }
    if (moneyLines.length) goalsSource = 'from state/current.md';
  }

  const openItems = notes
    .filter(n => !isGenerated(n) && !isAbout(n) && str(n.fm.owner) && /^open$/i.test(str(n.fm.status)))
    .map(n => ({ note: n, owner: ownerKey(n.fm.owner), summary: str(n.fm.summary) || n.title, updated: dateOf(n.fm.updated) || dateOf(n.fm.created) || '' }))
    .sort((a, b) => {
      const oa = OWNER_ORDER.indexOf(a.owner); const ob = OWNER_ORDER.indexOf(b.owner);
      return (oa === -1 ? 99 : oa) - (ob === -1 ? 99 : ob) || a.owner.localeCompare(b.owner) || b.updated.localeCompare(a.updated) || a.note.rel.localeCompare(b.note.rel);
    });

  const learnings = notes
    .filter(n => n.rel.startsWith('memory/learnings/') && !isAbout(n) && str(n.fm.type) === 'learning' && !/^(superseded|archived)$/i.test(str(n.fm.status)))
    .sort((a, b) => str(dateOf(b.fm.created)).localeCompare(str(dateOf(a.fm.created))) || str(b.fm.updated).localeCompare(str(a.fm.updated)) || a.rel.localeCompare(b.rel));

  const campaignNotes = notes.filter(n => str(n.fm.type) === 'campaign' && !isAbout(n) && !CLOSED.test(str(n.fm.status)) && !n.rel.startsWith('memory/archive/') && !n.rel.startsWith('memory/templates/'));

  const maps = LANES.map(l => ({ lane: l, rel: `memory/maps/${l}.md`, exists: byRel.has(`memory/maps/${l}.md`) }));
  return { root, notes, byRel, current, goalsSource, nextActions, currentCampaignRows, activeOrPausedRows, moneyLines, caps, openItems, learnings, campaignNotes, maps };
}

// ---------------------------------------------------------------- memory/HOT.md (English, machine-facing)

function hotBody(c, keep) {
  const L = ['# HOT', '', GEN_LINE, RULE_LINE, ''];
  const asOf = c.current ? str(c.current.fm.as_of) || str(c.current.fm.updated) : '';
  if (c.current) {
    L.push(`## Now · [[current]]${asOf ? ` · as_of ${asOf}` : ''}`);
    if (str(c.current.fm.plan)) L.push(`Plan to read first: ${oneLine(c.current.fm.plan, 160)}`);
    const na = c.nextActions.slice(0, 3);
    if (na.length) { L.push('Next actions:'); na.forEach((a, i) => L.push(`${i + 1}. ${oneLine(a, 260)}`)); } else L.push('Next actions: none written in state/current.md');
    const rows = c.activeOrPausedRows.slice(0, keep.campaigns);
    if (rows.length) {
      L.push(`Campaigns, active or paused (${rows.length}${rows.length < c.activeOrPausedRows.length ? ` of ${c.activeOrPausedRows.length}` : ''}):`);
      rows.forEach(r => L.push(`- ${oneLine(r.row.filter(Boolean).join(' · '), 240)}`));
    }
  } else {
    L.push('## Now', 'memory/state/current.md is missing: rebuild it from the campaign notes, the latest plan and one live read (memory-update).');
  }
  L.push('');
  L.push(`## Money vs caps${c.goalsSource ? ` · ${c.goalsSource}` : ''}`);
  if (c.moneyLines.length) c.moneyLines.slice(0, 8).forEach(m => L.push(`- ${oneLine(m, 220)}`)); else L.push('- no caps recorded');
  L.push('');
  const oi = c.openItems.slice(0, keep.open);
  L.push(`## Open items by owner (${oi.length}${oi.length < c.openItems.length ? ` of ${c.openItems.length}` : ''})`);
  if (oi.length) oi.forEach(o => L.push(`- ${o.owner} · [[${o.note.name}]] · ${oneLine(o.summary, 160)}`)); else if (!c.openItems.length) L.push('- none');
  L.push('');
  const ln = c.learnings.slice(0, Math.min(5, keep.learnings));
  const total = Math.min(5, c.learnings.length);
  L.push(`## Newest learnings (${ln.length}${ln.length < total ? ` of ${total}` : ''})`);
  if (ln.length) ln.forEach(n => L.push(`- ${dateOf(n.fm.created) || '?'} · [[${n.name}]] · ${oneLine(str(n.fm.summary) || n.title, 170)}`)); else if (!total) L.push('- none yet');
  L.push('');
  L.push('## Lane maps');
  L.push(c.maps.map(m => `${m.lane} \`${m.rel}\`${m.exists ? '' : ' (missing)'}`).join(' · '));
  return L.join('\n') + '\n';
}

function hotFile(c, created, generatedAt) {
  const keep = { learnings: 5, open: c.openItems.length, campaigns: c.activeOrPausedRows.length };
  const render = () => {
    const body = hotBody(c, keep);
    const fm = serializeFrontmatter({
      type: 'state', created, status: 'active', maintained_by: 'generated', categories: ['memory'],
      summary: 'What every session must know, generated from the vault notes; injected by the SessionStart hook.',
      generated_at: generatedAt, content_hash: contentHash(body),
    });
    return fm + '\n' + body;
  };
  let out = render();
  const over = s => lineCount(s) > HOT_MAX_LINES || Buffer.byteLength(s, 'utf8') > HOT_MAX_BYTES;
  while (over(out)) {
    if (keep.learnings > 0) keep.learnings--;
    else if (keep.open > 0) keep.open--;
    else if (keep.campaigns > 0) keep.campaigns--;
    else break;
    out = render();
  }
  return out;
}

// ---------------------------------------------------------------- INDEX.md

function indexFile(c, created, generatedAt) {
  const dup = buildResolver(c.root).duplicateBasenames();
  const notes = c.notes.filter(n => n.rel !== 'memory/INDEX.md' && n.rel !== HOT_REL);
  const groups = new Map();
  for (const n of notes) { if (!groups.has(n.folder)) groups.set(n.folder, []); groups.get(n.folder).push(n); }
  const order = [...groups.keys()].sort((a, b) => {
    const rank = f => (f.startsWith('memory') ? 0 : f.startsWith('plans') ? 1 : 2);
    return rank(a) - rank(b) || a.localeCompare(b);
  });
  const L = ['# INDEX', '', GEN_LINE, `${notes.length} notes (HOT and this index are not listed). One line each: \`- [[name]] · type · summary\`. Grep it; never read it whole past 300 lines.`];
  for (const f of order) {
    L.push('', `## ${f}`);
    for (const n of groups.get(f).sort((a, b) => a.rel.localeCompare(b.rel))) {
      const link = dup.has(n.name.toLowerCase()) ? `[[${n.rel.slice(0, -3)}|${n.name}]]` : `[[${n.name}]]`;
      L.push(`- ${link} · ${str(n.fm.type) || '?'} · ${oneLine(str(n.fm.summary) || '(no summary)', 300)}`);
    }
  }
  const body = L.join('\n') + '\n';
  return serializeFrontmatter({
    type: 'map', created, status: 'active', maintained_by: 'generated', categories: ['memory'],
    summary: 'One line per note in the vault, grouped by folder; generated, grep it.',
    generated_at: generatedAt, content_hash: contentHash(body),
  }) + '\n' + body;
}

// ---------------------------------------------------------------- HOME.md generated block (the Owner's language)

export function homeBlockLines(c, today, launchAt, lang = 'en') {
  const S = LABELS[lang] || LABELS.en;
  const L = [];
  let countdown = '';
  const ld = dateOf(launchAt);
  if (ld) { const d = daysBetween(today, ld); countdown = ` · ${d > 0 ? S.daysTo(d, ld) : d === 0 ? S.launchDay(ld) : S.since(ld)}`; }
  L.push(`### ${S.today}`, `${today}${countdown}${c.current && str(c.current.fm.as_of) ? ` · ${S.asOf(str(c.current.fm.as_of))} ([[current]])` : ''}`);
  c.nextActions.slice(0, 3).forEach((a, i) => L.push(`${i + 1}. ${oneLine(a, 220)}`));
  if (!c.current) L.push(S.noState);
  L.push('', `### ${S.money}`);
  if (c.moneyLines.length) c.moneyLines.slice(0, 8).forEach(m => L.push(`- ${oneLine(m, 200)}`)); else L.push(`- ${S.noCaps}`);
  L.push('', `### ${S.open}`);
  if (c.openItems.length) {
    c.openItems.slice(0, 15).forEach(o => L.push(`- ${S.owners[o.owner] || o.owner} · [[${o.note.name}]] · ${oneLine(o.summary, 150)}`));
    if (c.openItems.length > 15) L.push(`- ${S.more(c.openItems.length - 15)}`);
  } else L.push(`- ${S.none}`);
  L.push('', `### ${S.learnings}`);
  if (c.learnings.length) c.learnings.slice(0, 5).forEach(n => L.push(`- ${dateOf(n.fm.created) || '?'} · [[${n.name}]] · ${oneLine(str(n.fm.summary) || n.title, 150)}`)); else L.push(`- ${S.noneYet}`);
  return L;
}

const HOME_META_RE = /^%% content_hash: ([0-9a-f]+) · generated_at: (\S+) · .*%%$/;

/** Returns { text, found } with the block between the markers replaced. */
export function renderHome(homeText, lines, generatedAt) {
  const t = homeText.replace(/\r\n?/g, '\n');
  const a = t.indexOf(HOME_START); const b = t.indexOf(HOME_END);
  if (a === -1 || b === -1 || b < a) return { text: t, found: false };
  const inner = lines.join('\n');
  const meta = `%% content_hash: ${contentHash(inner)} · generated_at: ${generatedAt} · ${GEN_LINE} %%`;
  return { text: t.slice(0, a) + HOME_START + '\n' + meta + '\n' + inner + '\n' + t.slice(b), found: true };
}

/** The block's lines (without the meta line) and its recorded hash, for the lint. */
export function readHomeBlock(homeText) {
  const t = homeText.replace(/\r\n?/g, '\n');
  const a = t.indexOf(HOME_START); const b = t.indexOf(HOME_END);
  if (a === -1 || b === -1 || b < a) return null;
  const lines = t.slice(a + HOME_START.length, b).split('\n').slice(1, -1);
  const m = HOME_META_RE.exec(lines[0] || '');
  return { hash: m ? m[1] : null, generatedAt: m ? m[2] : null, inner: (m ? lines.slice(1) : lines).join('\n') };
}

// ---------------------------------------------------------------- dashboard/state.json (control-room shape)

function rowFor(c, name, ids) {
  return c.currentCampaignRows.find(r => r.row.some(cell => cell.includes(name) || ids.some(id => id && cell.includes(id)))) || null;
}
function cellBy(r, re) { if (!r) return null; const i = col(r.header, re); return i === -1 ? null : (str(r.row[i]) || null); }
/** 'YYYY-MM-DD[ HH:MM]…' → 'YYYY-MM-DDTHH:MM:00' (local time, which Date.parse reads); null when there is no date. */
export const launchIso = s => { const m = /(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?/.exec(str(s)); return m ? `${m[1]}T${m[2] || '00:00'}:00` : null; };
const idIn = s => (/(?<!\d)(\d{6,19})(?!\d)/.exec(str(s).replace(/`/g, '')) || [])[1] || null;

/**
 * The control-room data (docs/TEMPLATE-SPEC.md §9; control-room/marketing-team/hooks/register.tsx reads it):
 * company, generatedAt, launch, routines { timezone, items }, working, tasks [{ title, owner }], money { currency,
 * dailySpend, caps [{ label, amount, period }], liveToday, nextGo }, campaigns [{ id, name, label, status, spent,
 * result }], team { lane: [agents] }, skillsUsed. Unknown keys of the existing file are kept as they are.
 */
export function buildState(c, existing, { generatedAt, by, stamp = false }) {
  const root = c.root;
  const s = existing && typeof existing === 'object' ? structuredClone(existing) : {};
  const fm = c.current ? c.current.fm : {};
  const keepOr = (key, val, empty = null) => { s[key] = val ?? (key in s ? s[key] : empty); };

  const short = configLine(root, 'config/company.md', 'Short name').split(/;| \(/)[0].trim() || configLine(root, 'config/company.md', 'Name').split(/ \(/)[0].trim();
  keepOr('company', short || null);
  if (!('generatedAt' in s)) s.generatedAt = null;
  keepOr('launch', str(fm.launch_at) || launchIso(configLine(root, 'config/company.md', 'Launch date')));

  const routines = routinesFrom(root);
  if (routines) s.routines = routines;
  else if (!s.routines || typeof s.routines !== 'object') s.routines = { timezone: null, items: [] };
  if (!Array.isArray(s.working)) s.working = [];

  // Tasks: the next actions of state/current.md, then the open items; else the previous list.
  const tasks = [];
  for (const a of c.nextActions) {
    const { owner, text } = ownerFromText(a);
    tasks.push({ title: oneLine(text.replace(/\*\*/g, ''), 300), owner: OWNER_EN[owner || 'harness'] });
  }
  for (const o of c.openItems) {
    const title = oneLine(o.summary, 300);
    if (!tasks.some(t => t.title === title)) tasks.push({ title, owner: OWNER_EN[o.owner] || o.owner });
  }
  if (tasks.length) s.tasks = tasks; else if (!Array.isArray(s.tasks)) s.tasks = [];

  s.money = s.money && typeof s.money === 'object' && !Array.isArray(s.money) ? s.money : {};
  const curCell = str(parseTables(readText(path.join(root, 'config', 'accounts.md')) || '')
    .flatMap(t => t.rows).find(r => /currency/i.test(r[0] || ''))?.[1]);
  const currency = curCell.includes('{{') ? null : ((/\b([A-Z]{3})\b/.exec(curCell.replace(/`/g, '')) || [])[1] || null);
  if (currency) s.money.currency = currency; else if (!('currency' in s.money)) s.money.currency = null;
  const moneySec = c.current ? getBullets(getSection(c.current.body, /^money/i)) : [];
  const pick = re => { const b = moneySec.find(x => re.test(x)); const v = b ? b.replace(re, '').trim() : null; return v && !v.includes('<fill') ? v : null; };
  for (const [key, fmKey, re] of [
    ['dailySpend', 'money_daily_spend', /^\**daily spend\**\s*[:—-]\s*/i],
    ['liveToday', 'money_live_today', /^\**live today\**\s*[:—-]\s*/i],
    ['nextGo', 'money_next_go', /^\**next go\**\s*[:—-]\s*/i],
  ]) {
    const v = str(fm[fmKey]) || pick(re);
    if (v) s.money[key] = v; else if (!(key in s.money)) s.money[key] = null;
  }
  if (c.caps.length || !Array.isArray(s.money.caps)) s.money.caps = c.caps;

  // Campaigns: the campaign notes (spent and result from the state/current.md row of the same campaign),
  // else the active or paused rows of state/current.md, else the previous list.
  let campaigns = null;
  if (c.campaignNotes.length) {
    campaigns = c.campaignNotes.map(n => {
      const ids = (Array.isArray(n.fm.ids) ? n.fm.ids : str(n.fm.ids) ? [str(n.fm.ids)] : []).map(String);
      const name = str(n.fm.name) || n.name;
      const r = rowFor(c, name, ids);
      return {
        id: ids[0] || idIn(cellBy(r, /^id$|campaign id/i)) || null, name, label: str(n.fm.label) || str(n.fm.summary) || null,
        status: (str(n.fm.status) || cellBy(r, /status/i) || '').toUpperCase() || null,
        spent: cellBy(r, /spen/i) || str(n.fm.spent) || null,
        result: cellBy(r, /result/i) || str(n.fm.result) || null,
      };
    });
    const rank = x => (/ACTIVE|LIVE/.test(x.status || '') ? 0 : /PAUSED|SCHEDULED/.test(x.status || '') ? 1 : 2);
    campaigns.sort((a, b) => rank(a) - rank(b));
  } else if (c.activeOrPausedRows.length) {
    campaigns = c.activeOrPausedRows.map(r => ({
      id: idIn(cellBy(r, /^id$|campaign id/i)), name: cellBy(r, /^campaign$|^name$/i) || str(r.row[0]) || null, label: cellBy(r, /label|what|summary|note/i),
      status: (r.status || '').toUpperCase() || null, spent: cellBy(r, /spen/i), result: cellBy(r, /result/i),
    }));
  }
  if (campaigns) s.campaigns = campaigns; else if (!Array.isArray(s.campaigns)) s.campaigns = [];

  // Team: the fixed lanes with the agents present under .claude/agents (an unknown agent goes to Other).
  const present = listAgents(root).map(a => a.name);
  if (present.length) {
    const team = {};
    for (const [lane, agents] of Object.entries(TEAM_LANES)) { const here = agents.filter(a => present.includes(a)); if (here.length) team[lane] = here; }
    const other = present.filter(a => !Object.values(TEAM_LANES).flat().includes(a));
    if (other.length) team.Other = other;
    s.team = team;
  } else if (!s.team || typeof s.team !== 'object') s.team = {};
  if (!Array.isArray(s.skillsUsed)) s.skillsUsed = [];

  const changed = JSON.stringify({ ...s, generatedAt: null }) !== JSON.stringify({ ...(existing || {}), generatedAt: null });
  if (changed || !existing || stamp) s.generatedAt = generatedAt;
  if ('updatedBy' in s || stamp) s.updatedBy = (changed || !existing || stamp) ? by : s.updatedBy;
  return { state: s, changed: changed || !existing };
}

// ---------------------------------------------------------------- sessions rotation

function sessionMoves(root) {
  const dir = path.join(root, 'memory', 'sessions');
  const moves = [];
  const visit = (rel) => {
    let entries = [];
    try { entries = fs.readdirSync(path.join(dir, rel), { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) { if (!rel) visit(r); continue; }
      const m = /^(\d{4}-\d{2})-\d{2}\.md$/.exec(e.name);
      if (m && rel !== m[1]) moves.push({ from: path.join(dir, r), to: path.join(dir, m[1], e.name) });
    }
  };
  visit('');
  return moves.filter(mv => !fs.existsSync(mv.to));
}

// ---------------------------------------------------------------- main

export function buildAll(root, { by = 'build-hot.mjs', now = new Date(), write = true, stamp = false, lang = null } = {}) {
  const { date: today, iso } = vaultNow(now, vaultTimezone(root));
  const generatedAt = iso.replace(/:\d{2}([+-])/, '$1');
  const language = lang || ownerLanguage(root);
  const moves = sessionMoves(root);
  if (write) for (const mv of moves) { fs.mkdirSync(path.dirname(mv.to), { recursive: true }); fs.renameSync(mv.from, mv.to); }
  const c = collect(root);
  const outputs = [];

  const generated = (rel, make) => {
    const abs = path.join(root, rel);
    const old = readText(abs);
    const oldFm = old ? parseFrontmatter(splitFrontmatter(old).fmText) : {};
    const created = dateOf(oldFm.created) || today;
    const same = old !== null && make(created, str(oldFm.generated_at)) === old;
    outputs.push({ rel, abs, changed: !same, content: same ? old : make(created, generatedAt) });
  };
  generated(HOT_REL, (cr, g) => hotFile(c, cr, g));
  generated('memory/INDEX.md', (cr, g) => indexFile(c, cr, g));

  const homeAbs = path.join(root, 'memory', 'HOME.md');
  const homeText = readText(homeAbs);
  const stateAbs = path.join(root, 'dashboard', 'state.json');
  let existing = null;
  try { existing = JSON.parse(fs.readFileSync(stateAbs, 'utf8')); } catch { existing = null; }
  const launchCfg = configLine(root, 'config/company.md', 'Launch date');
  const launchAt = (c.current && str(c.current.fm.launch_at)) || (dateOf(launchCfg) ? launchCfg : null) || existing?.launch || null;
  let homeFound = false;
  if (homeText !== null) {
    const lines = homeBlockLines(c, today, launchAt, language);
    const prev = readHomeBlock(homeText);
    const keep = prev && prev.generatedAt ? renderHome(homeText, lines, prev.generatedAt) : null;
    homeFound = !!prev;
    if (keep && keep.text === homeText) outputs.push({ rel: 'memory/HOME.md', abs: homeAbs, changed: false, content: homeText });
    else if (prev) outputs.push({ rel: 'memory/HOME.md', abs: homeAbs, changed: true, content: renderHome(homeText, lines, generatedAt).text });
  }

  // stamp (an explicit --by on a writing run): generatedAt moves even when nothing else changed.
  const { state, changed } = buildState(c, existing, { generatedAt, by, stamp: stamp && write });
  outputs.push({ rel: 'dashboard/state.json', abs: stateAbs, changed: changed || (stamp && write), content: JSON.stringify(state, null, 2) + '\n' });

  if (write) for (const o of outputs) if (o.changed) writeIfChanged(o.abs, o.content);
  return { outputs, moves, homeFound, collected: c, language };
}

if (isMain(import.meta.url)) {
  const { flags, values } = parseFlags();
  const root = findRoot();
  const dry = flags.has('check') || flags.has('print');
  let res;
  try {
    // Git Bash rewrites an argument like "/sync" into a Windows path; keep the last segment and put the slash back.
    const by = String(values.by || 'build-hot.mjs').replace(/^.*[\\/]/, '');
    res = buildAll(root, { by: by.includes('.') ? by : '/' + by, now: values.now ? new Date(values.now) : new Date(), write: !dry, stamp: Boolean(values.by) });
  } catch (e) {
    console.error(`build-hot: failed: ${e.message}`);
    process.exit(2);
  }
  const changed = res.outputs.filter(o => o.changed).map(o => o.rel).concat(res.moves.map(m => path.relative(root, m.from).split(path.sep).join('/') + ' (rotate)'));
  if (flags.has('print')) {
    const hot = res.outputs.find(o => o.rel === HOT_REL);
    process.stdout.write(hot.content);
    const home = res.outputs.find(o => o.rel === 'memory/HOME.md');
    if (home) { const b = readHomeBlock(home.content); process.stdout.write(`\n----- HOME generated block (${res.language})\n` + (b ? b.inner : '(no markers)') + '\n'); }
    process.stdout.write('\n----- dashboard/state.json\n' + res.outputs.find(o => o.rel === 'dashboard/state.json').content);
    const idx = res.outputs.find(o => o.rel === 'memory/INDEX.md');
    process.stdout.write(`\n----- INDEX: ${idx.content.split('\n').filter(l => l.startsWith('- [[')).length} lines\n`);
  }
  const hot = res.outputs.find(o => o.rel === HOT_REL).content;
  const info = `HOT ${lineCount(hot)} lines, ${Buffer.byteLength(hot, 'utf8')} bytes; HOME labels ${res.language}`;
  if (!res.homeFound) console.error('build-hot: memory/HOME.md has no generated markers (or is missing); its block was not written');
  if (flags.has('check')) {
    if (changed.length) { console.log(`build-hot --check: would change ${changed.join(', ')}`); process.exit(1); }
    console.log(`build-hot --check: up to date (${info})`);
  } else if (!flags.has('print')) {
    console.log(changed.length ? `build-hot: wrote ${changed.join(', ')} (${info})` : `build-hot: nothing changed (${info})`);
  }
}
