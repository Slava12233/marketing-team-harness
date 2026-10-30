// memory/tools/tools.test.mjs: self-contained tests for the vault tools and hooks (node:test, no dependencies).
// Each test builds its own fixture vault in a temp folder; the real vault is never written.
// Run from the harness root: timeout 120 node --test memory/tools/tools.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { scanSecrets, scrubSecrets, parseFrontmatter, splitFrontmatter, contentHash, allowedEmails, ownerLanguage, vaultTimezone } from './lib.mjs';
import { buildAll, HOT_MAX_LINES, HOT_MAX_BYTES, HOT_REL } from './build-hot.mjs';
import { lint } from './lint.mjs';

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const HARNESS = path.resolve(TOOLS, '..', '..');
const FIXED_NOW = new Date('2026-10-26T10:00:00Z');

const fm = obj => '---\n' + Object.entries(obj).map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.join(', ')}]` : v}`).join('\n') + '\n---\n\n';

function write(root, rel, text) {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text, 'utf8');
}

/** A double-brace placeholder as the config templates ship it (built here so this file holds no template token). */
const PH = name => '{{' + name + '}}';

/** config/ files of a fictional company (the same bold labels and tables as the template's config/*.md). */
function writeConfig(root, { chat = 'English (LTR)', tz = 'Europe/London' } = {}) {
  write(root, 'config/company.md', '# Company\n\n**Name:** Test Gyms Ltd\n\n**Short name:** Test Gyms\n\n**Launch date:** 2026-11-16 00:00 Europe/London (fictional)\n');
  write(root, 'config/operator.md', [
    '# Operator and Owner', '', '**Owner:** Owner Person (fictional), owner@testgyms.example', '', '**Operators:** Op Person (fictional)', '',
    `**Chat language:** ${chat}`, '', `**Timezone:** ${tz}`, '', '**Working days:** Mon–Fri', '',
    '## Routine times', '', '| Routine | Command | Time |', '|---|---|---|',
    '| Morning | `/morning` | 08:30, Mon–Fri |', '| Session close | `/sync` | 18:00 |', '| Weekly round | `/next-round` | Monday 10:00 |', '',
  ].join('\n'));
  write(root, 'config/goals.md', [
    '# Goals and money', '', '## Hard caps', '', '| Cap | Amount | Set by |', '|---|---|---|',
    '| Daily (all campaigns together) | £60 | the Owner, 2026-10-26 |', '| Weekly (all campaigns together) | £420 | the Owner, 2026-10-26 |',
    '| Monthly (all campaigns together, calendar month) | £1,500 | the Owner, 2026-10-26 |', `| Per campaign (its lifetime spending limit) | ${PH('CAMPAIGN_CAP')} | ${PH('CAP_SET_BY')} |`, '',
  ].join('\n'));
  write(root, 'config/accounts.md', '# Accounts\n\n## Meta\n\n| Field | Value |\n|---|---|\n| `meta_ad_account_id` | `100000000000001` |\n| `currency` | GBP |\n');
}

/** A small, valid vault: config, state, goals, a campaign, learnings, open items, HOME, a report and a plan, state.json. */
function fixture({ learnings = 7, openItems = 2, longSummaries = false, config = true, chat } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-fixture-'));
  if (config) writeConfig(root, { chat });
  const base = { created: '2026-10-26', updated: '2026-10-26', status: 'active', maintained_by: 'harness' };
  write(root, 'memory/README.md', fm({ type: 'contract', ...base, categories: '[memory]', summary: 'Fixture contract.' }) + '# Contract\n\nSee [[current]] and [[business/goals|goals]].\n');
  write(root, 'memory/state/current.md', fm({ type: 'state', ...base, categories: '[state]', summary: 'Fixture state.', as_of: '2026-10-26T09:00+01:00', source: 'ads_get_ad_entities' }) + [
    '# Current state', '',
    '## Campaigns', '',
    '| Campaign | Id | Status | Daily | Spent | Result |', '|---|---|---|---|---|---|',
    '| 2026-11-TEST_Camp-A | `100000000000101` | ACTIVE | 15 | 100.00 GBP | 4 trials |',
    '| 2026-11-TEST_Camp-B | `100000000000102` | PAUSED | 30 | 0 GBP | — |',
    '| OLD-DO-NOT-RUN | `100000000000103` | DELETED | — | — | — |', '',
    '## Money', '', '- Daily spend: 20.00 GBP by 09:00', '- Live today: Camp-A 20.00 GBP by 09:00', '- Next go: Camp-B at 30 GBP a day', '',
    '## Next actions', '', '1. Owner: answer the six chats', '2. Read the day-3 numbers of [[2026-11-TEST_Camp-A]]', '3. Prepare the spend statement', '4. Fourth action that must not reach HOT', '',
  ].join('\n'));
  write(root, 'memory/business/goals.md', fm({ type: 'business', ...base, categories: '[business, money]', summary: 'Fixture goals.', as_of: '2026-10-26', source: 'fixture' }) + [
    '# Goals', '', '## Caps in force', '', '| Campaign | Daily | Cap | Period | Status |', '|---|---|---|---|---|',
    '| Camp-A `100000000000101` | 15 | 210 | campaign | ACTIVE |', '| Camp-B | 30 | not recorded | | PAUSED |', '',
  ].join('\n'));
  write(root, 'memory/campaigns/_about.md', fm({ type: 'contract', ...base, categories: '[campaigns]', summary: 'What goes in campaigns/.' }) + '# campaigns/\n');
  write(root, 'memory/campaigns/2026-11-TEST_Camp-A.md', fm({ type: 'campaign', ...base, categories: '[campaigns]', summary: 'Fixture campaign A.', ids: '["100000000000101"]', daily_budget: 15, cap: 210, start: '2026-10-25', end: '2026-11-07', as_of: '2026-10-26T09:00+01:00', source: 'ads_get_ad_entities' }) + '# 2026-11-TEST_Camp-A\n\n## Current state\n\nActive.\n\n## Log\n- 2026-10-25 — created\n');
  write(root, 'memory/learnings/meta-platform/_about.md', fm({ type: 'contract', ...base, categories: '[learnings]', summary: 'What goes here.' }) + '# meta-platform/\n');
  for (let i = 1; i <= learnings; i++) {
    const day = String(1 + (i % 28)).padStart(2, '0');
    const summary = longSummaries ? `Learning ${i}: ` + 'a long explanation of a platform behaviour '.repeat(8) : `Learning ${i} summary.`;
    write(root, `memory/learnings/meta-platform/learning-${i}.md`, fm({ type: 'learning', created: `2026-10-${day}`, updated: `2026-10-${day}`, status: 'confirmed', maintained_by: 'harness', categories: '[learnings]', summary: `"${summary}"` }) + `# Learning ${i}\n\n**The fact.** Fixture.\n`);
  }
  for (let i = 1; i <= openItems; i++) {
    const owner = ['owner', 'lawyer', 'product-team', 'harness', 'operator'][i % 5];
    const summary = longSummaries ? `Open item ${i}: ` + 'a long description of what is waiting '.repeat(6) : `Open item ${i}.`;
    write(root, `memory/open/open-${i}.md`, fm({ type: 'open', created: '2026-10-20', updated: '2026-10-20', status: 'open', maintained_by: 'harness', categories: '[open]', owner, summary: `"${summary}"` }) + `# Open ${i}\n`);
  }
  write(root, 'memory/HOME.md', fm({ type: 'map', ...base, maintained_by: 'owner', categories: '[memory]', summary: 'Fixture home.' }) + '# Office\n\n%% generated:start %%\n(placeholder)\n%% generated:end %%\n\n## Campaigns\n\n![[campaigns.base]]\n');
  write(root, 'memory/bases/campaigns.base', ['filters:', '  and:', '    - \'type == "campaign"\'', 'views:', '  - type: table', '    name: "t"', ''].join('\n'));
  write(root, 'memory/templates/session.md', '---\ntype: session\ncreated: {{date}}\nupdated: {{date}}\nstatus: open\nmaintained_by: harness\ncategories: [sessions]\nsummary: \n---\n\n# {{date}}\n\n- \n\n## Close\n');
  write(root, 'reports/2026-10-25-fixture-report.md', '# Fixture report: day 3\n\nCampaign `100000000000101` and ad 100000000000199 spent 10 GBP.\n');
  write(root, 'plans/undated-plan.md', '# A plan without a date\n\nNothing.\n');
  // The control-room file as the template ships it (every key, null values), plus one unknown key that must survive.
  const shipped = JSON.parse(fs.readFileSync(path.join(HARNESS, 'dashboard', 'state.json'), 'utf8'));
  write(root, 'dashboard/state.json', JSON.stringify({ ...shipped, working: ['media-buyer'], skillsUsed: [{ name: 'morning', count: 2 }], extraKey: 'kept' }, null, 2) + '\n');
  write(root, '.claude/skills/morning/SKILL.md', '---\nname: morning\ndescription: "Session opener. Writes the morning report and regenerates HOT."\n---\n\n# morning\n');
  write(root, '.claude/agents/media-buyer.md', '---\nname: media-buyer\ndescription: "Builds paused objects."\nmodel: opus\ndisallowedTools: mcp__meta-ads__ads_activate_entity\n---\n\nBody.\n');
  write(root, '.claude/agents/new-helper.md', '---\nname: new-helper\ndescription: "An agent outside the fixed lanes."\nmodel: sonnet\ntools: Read\n---\n\nBody.\n');
  // A fictional company's example vault and a vendored plugin are not part of this vault.
  write(root, 'examples/acme/memory/HOME.md', '# not a note of this vault\n\n[[no-such-note-in-example]]\n');
  return root;
}

const run = (script, args, opts = {}) => spawnSync(process.execPath, [path.join(TOOLS, script), ...args], { encoding: 'utf8', timeout: 60000, ...opts });
const keysDeep = (o, p = '') => Object.entries(o).flatMap(([k, v]) => [p + k, ...(v && typeof v === 'object' && !Array.isArray(v) ? keysDeep(v, p + k + '.') : [])]);
const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');

test('HOT stays under its caps and carries the rule, the first three next actions and the newest learnings', () => {
  const root = fixture({ learnings: 30, openItems: 60, longSummaries: true });
  buildAll(root, { now: FIXED_NOW });
  const hot = read(root, HOT_REL);
  const lines = hot.replace(/\n$/, '').split('\n').length;
  const bytes = Buffer.byteLength(hot, 'utf8');
  assert.ok(lines <= HOT_MAX_LINES, `HOT has ${lines} lines`);
  assert.ok(bytes <= HOT_MAX_BYTES, `HOT has ${bytes} bytes`);
  assert.match(hot, /Read the note before you act; re-read live before you change; names and public ids only/);
  assert.match(hot, /1\. Owner: answer the six chats/);
  assert.doesNotMatch(hot, /Fourth action/);
  assert.match(hot, /2026-11-TEST_Camp-A/);
  assert.doesNotMatch(hot, /OLD-DO-NOT-RUN/);
  assert.match(hot, /maintained_by: generated/);
  assert.match(hot, /## Money vs caps · config\/goals\.md/);
  console.log(`# HOT on the heavy fixture: ${lines} lines, ${bytes} bytes`);
  const small = fixture();
  buildAll(small, { now: FIXED_NOW });
  const hot2 = read(small, HOT_REL);
  console.log(`# HOT on the small fixture: ${hot2.replace(/\n$/, '').split('\n').length} lines, ${Buffer.byteLength(hot2, 'utf8')} bytes`);
  const ln = hot2.split('## Newest learnings')[1].split('\n## ')[0];
  assert.equal((ln.match(/^- /gm) || []).length, 5, 'five newest learnings');
  assert.match(ln, /learning-7/);
  assert.doesNotMatch(ln, /_about/, 'folder notes are not learnings');
});

test('INDEX has one line per note, grouped by folder, and skips examples/', () => {
  const root = fixture();
  buildAll(root, { now: FIXED_NOW });
  const index = read(root, 'memory/INDEX.md');
  const notes = ['memory', 'reports', 'plans'].flatMap(d => {
    const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.md') ? [path.join(dir, e.name)] : []);
    return walk(path.join(root, d));
  }).filter(f => !f.includes(`${path.sep}templates${path.sep}`) && !f.endsWith(`${path.sep}INDEX.md`) && !f.endsWith(`${path.sep}HOT.md`));
  const lines = index.split('\n').filter(l => l.startsWith('- [['));
  assert.equal(lines.length, notes.length);
  assert.match(index, /^## memory\/campaigns$/m);
  assert.match(index, /- \[\[2026-11-TEST_Camp-A\]\] · campaign · Fixture campaign A\./);
  assert.doesNotMatch(index, /examples/);
});

test('lint passes on a clean fixture, and finds dead links (FAIL) and fenced dead links (WARN)', () => {
  const root = fixture();
  buildAll(root, { now: FIXED_NOW });
  run('frontmatter.mjs', ['--apply', '--root', root]);
  let res = lint(root, { today: '2026-10-26' });
  assert.deepEqual(res.findings.filter(f => f.level === 'FAIL'), [], 'clean fixture has no FAIL');
  write(root, 'memory/learnings/tooling/dead.md', fm({ type: 'learning', created: '2026-10-26', updated: '2026-10-26', status: 'confirmed', maintained_by: 'harness', categories: '[learnings]', summary: 'Links.' }) +
    'See [[no-such-note]] and [[2026-11-TEST_Camp-A#Log|the log]] and ![[campaigns.base]] and `[[inline-code]]`.\n\n```\n[[fenced-missing]]\n```\n');
  res = lint(root, { today: '2026-10-26' });
  const dead = res.findings.filter(f => f.rel === 'memory/learnings/tooling/dead.md');
  assert.equal(dead.filter(f => f.level === 'FAIL').length, 1);
  assert.match(dead.find(f => f.level === 'FAIL').reason, /no-such-note/);
  assert.ok(dead.some(f => f.level === 'WARN' && /fenced-missing/.test(f.reason)));
  assert.ok(!dead.some(f => /inline-code|Camp-A|campaigns\.base/.test(f.reason)));
  assert.ok(!res.findings.some(f => f.rel.startsWith('examples/')), 'the example vault is not linted');
  const cli = run('lint.mjs', ['--root', root]);
  assert.equal(cli.status, 1);
  assert.match(cli.stdout, /^FAIL memory\/learnings\/tooling\/dead\.md: line \d+: dead link \[\[no-such-note\]\]/m);
});

test('the secrets scanner finds token, key, email, phone and .env shapes; config addresses are allowed', () => {
  const root = fixture();
  const allowed = allowedEmails(root);
  assert.ok(allowed.has('owner@testgyms.example') && allowed.has('noreply@anthropic.com'));
  const fakeMeta = 'EAA' + 'B'.repeat(45);
  const fakeSk = 'sk-' + 'a1'.repeat(12);
  const fakeFal = '0123abcd-0123-4567-89ab-0123456789ab:' + 'f'.repeat(32);
  const text = [
    `token ${fakeMeta}`, `key ${fakeSk}`, `fal ${fakeFal}`, 'mail someone@example.com',
    'phones 050-000-0000, +972 52 000 0000 and +44 7700 900123',
    'META_MARKETING_TOKEN=abc123notreal', 'allowed owner@testgyms.example, noreply@anthropic.com, 1+x@users.noreply.github.com',
    'placeholders META_MARKETING_TOKEN= and FAL_KEY=<value>', 'an id 120000000000000532 is not a phone, nor 2026-10-26 10:00, £1,500 or +20 %',
  ].join('\n');
  const kinds = scanSecrets(text, { allowed }).map(h => h.kind).sort();
  assert.deepEqual(kinds, ['api-key', 'email', 'env-value', 'fal-key', 'meta-token', 'phone', 'phone', 'phone'].sort());
  assert.ok(scanSecrets('owner@testgyms.example').some(h => h.kind === 'email'), 'without the config allow-list the address is a hit');
  const scrubbed = scrubSecrets(text, { allowed });
  assert.ok(!scrubbed.includes(fakeMeta) && !scrubbed.includes('someone@example.com') && !scrubbed.includes('050-000-0000') && !scrubbed.includes('7700 900123'));
  assert.match(scrubbed, /META_MARKETING_TOKEN=\[redacted\]/);
  assert.match(scrubbed, /owner@testgyms\.example/);
  write(root, 'memory/learnings/tooling/leak.md', fm({ type: 'learning', created: '2026-10-26', updated: '2026-10-26', status: 'confirmed', maintained_by: 'harness', categories: '[learnings]', summary: 'Leak.' }) + text + '\n');
  const res = lint(root, { today: '2026-10-26' });
  const leak = res.findings.filter(f => f.rel === 'memory/learnings/tooling/leak.md' && f.level === 'FAIL');
  assert.equal(leak.length, 8);
  assert.ok(leak.every(f => !f.reason.includes(fakeMeta) && !f.reason.includes('example.com')), 'lint never prints the secret');
});

test('frontmatter.mjs adds frontmatter to a report and a plan, dry-run writes nothing, and a second run touches nothing', () => {
  const root = fixture();
  const report = path.join(root, 'reports/2026-10-25-fixture-report.md');
  const before = fs.readFileSync(report, 'utf8');
  const dry = run('frontmatter.mjs', ['--root', root]);
  assert.equal(dry.status, 0);
  assert.match(dry.stdout, /WOULD ADD reports\/2026-10-25-fixture-report\.md/);
  assert.equal(fs.readFileSync(report, 'utf8'), before);
  assert.equal(run('frontmatter.mjs', ['--apply', '--root', root]).status, 0);
  const after = fs.readFileSync(report, 'utf8');
  const f = parseFrontmatter(splitFrontmatter(after).fmText);
  assert.equal(f.type, 'report');
  assert.equal(f.created, '2026-10-25');
  assert.equal(f.updated, '2026-10-25');
  assert.equal(f.status, 'done');
  assert.equal(f.maintained_by, 'harness');
  assert.deepEqual(f.categories, ['reports']);
  assert.equal(f.summary, 'Fixture report: day 3');
  assert.deepEqual(f.campaign_ids, ['100000000000101', '100000000000199']);
  assert.ok(after.endsWith(before));
  const plan = parseFrontmatter(splitFrontmatter(read(root, 'plans/undated-plan.md')).fmText);
  assert.equal(plan.type, 'plan');
  assert.equal(plan.status, 'active');
  assert.match(plan.created, /^\d{4}-\d{2}-\d{2}$/);
  const again = run('frontmatter.mjs', ['--apply', '--root', root]);
  assert.match(again.stdout, /frontmatter: 0 of 2/);
  assert.equal(fs.readFileSync(report, 'utf8'), after);
});

test('state.json keeps the control-room shape and every existing key, takes values from the vault and config, invents no number', () => {
  const root = fixture();
  const oldState = JSON.parse(read(root, 'dashboard/state.json'));
  buildAll(root, { now: FIXED_NOW, by: '/sync' });
  const s = JSON.parse(read(root, 'dashboard/state.json'));
  for (const k of keysDeep(oldState)) assert.ok(keysDeep(s).includes(k), `key ${k} kept`);
  assert.equal(s.extraKey, 'kept');
  assert.equal(s.company, 'Test Gyms');
  assert.match(s.generatedAt, /^2026-10-26T10:00\+00:00$/, 'generatedAt in the config timezone (Europe/London, GMT on that day)');
  assert.equal(s.launch, '2026-11-16T00:00:00');
  assert.equal(s.routines.timezone, 'Europe/London');
  assert.deepEqual(s.routines.items, [
    { id: 'morning', label: 'Morning', command: 'morning', time: '08:30', days: [1, 2, 3, 4, 5] },
    { id: 'sync', label: 'Session close', command: 'sync', time: '18:00', days: [1, 2, 3, 4, 5] },
    { id: 'next-round', label: 'Weekly round', command: 'next-round', time: '10:00', days: [1] },
  ]);
  assert.deepEqual(s.working, ['media-buyer']);
  assert.deepEqual(s.tasks[0], { title: 'answer the six chats', owner: 'Owner' });
  assert.equal(s.tasks[1].owner, 'Claude');
  assert.equal(s.money.currency, 'GBP');
  assert.equal(s.money.dailySpend, '20.00 GBP by 09:00');
  assert.equal(s.money.liveToday, 'Camp-A 20.00 GBP by 09:00');
  assert.equal(s.money.nextGo, 'Camp-B at 30 GBP a day');
  assert.deepEqual(s.money.caps, [
    { label: 'Daily (all campaigns together)', amount: 60, period: 'day' },
    { label: 'Weekly (all campaigns together)', amount: 420, period: 'week' },
    { label: 'Monthly (all campaigns together, calendar month)', amount: 1500, period: 'month' },
  ], 'caps from config/goals.md; the placeholder row is skipped');
  assert.equal(s.campaigns.length, 1);
  assert.deepEqual(s.campaigns[0], { id: '100000000000101', name: '2026-11-TEST_Camp-A', label: 'Fixture campaign A.', status: 'ACTIVE', spent: '100.00 GBP', result: '4 trials' });
  assert.deepEqual(s.team, { Build: ['media-buyer'], Other: ['new-helper'] });
  assert.deepEqual(s.skillsUsed, [{ name: 'morning', count: 2 }]);
  const second = buildAll(root, { now: new Date(FIXED_NOW.getTime() + 3600000) });
  assert.ok(second.outputs.every(o => !o.changed), 'a second build changes nothing');
});

test('without config/goals.md the caps come from memory/business/goals.md; without config/ the labels are English and the time UTC', () => {
  const root = fixture({ config: false });
  assert.equal(ownerLanguage(root), 'en');
  assert.equal(vaultTimezone(root), 'UTC');
  buildAll(root, { now: FIXED_NOW });
  const s = JSON.parse(read(root, 'dashboard/state.json'));
  assert.deepEqual(s.money.caps, [{ label: 'Camp-A', amount: 210, period: 'campaign' }, { label: 'Camp-B', amount: null, period: null }]);
  assert.equal(s.company, null);
  assert.deepEqual(s.routines, { timezone: null, items: [] });
  const home = read(root, 'memory/HOME.md');
  assert.match(home, /^### Today$/m);
  assert.match(home, /^### Money vs caps$/m);
  assert.match(home, /^- Owner · \[\[open-1\]\]|^- Lawyer · \[\[open-1\]\]/m);
});

test('HOME\'s block follows the chat language of config/operator.md (Hebrew or English)', () => {
  const he = fixture({ chat: 'Hebrew (עברית, RTL)' });
  assert.equal(ownerLanguage(he), 'he');
  buildAll(he, { now: FIXED_NOW });
  const homeHe = read(he, 'memory/HOME.md');
  assert.match(homeHe, /^### היום$/m);
  assert.match(homeHe, /^### כסף מול תקרות$/m);
  assert.match(homeHe, /21 ימים להשקה \(2026-11-16\)/);
  assert.doesNotMatch(homeHe, /### Today/);
  const en = fixture();
  buildAll(en, { now: FIXED_NOW });
  const homeEn = read(en, 'memory/HOME.md');
  assert.match(homeEn, /^### Today$/m);
  assert.match(homeEn, /21 days to launch \(2026-11-16\)/);
  assert.match(homeEn, /^### Open items by owner$/m);
  assert.match(homeEn, /^### Newest learnings$/m);
});

test('the hash check fails on a hand edit of HOT, a capability note or HOME\'s block, and --check reports it', () => {
  const root = fixture();
  assert.equal(run('build-capabilities.mjs', ['--root', root]).status, 0);
  buildAll(root, { now: FIXED_NOW });
  assert.equal(run('build-hot.mjs', ['--check', '--root', root, '--now', FIXED_NOW.toISOString()]).status, 0);
  assert.equal(run('build-capabilities.mjs', ['--check', '--root', root]).status, 0);
  assert.deepEqual(lint(root, { today: '2026-10-26' }).findings.filter(f => /hash|hand-edited/.test(f.reason)), []);
  const hotPath = path.join(root, HOT_REL);
  fs.writeFileSync(hotPath, fs.readFileSync(hotPath, 'utf8').replace('## Lane maps', '## Lane maps (edited by hand)'), 'utf8');
  const skPath = path.join(root, 'memory/capabilities/skills.md');
  fs.writeFileSync(skPath, fs.readFileSync(skPath, 'utf8') + 'a hand-added line\n', 'utf8');
  const homePath = path.join(root, 'memory/HOME.md');
  fs.writeFileSync(homePath, fs.readFileSync(homePath, 'utf8').replace('### Today', '### My day'), 'utf8');
  const hits = lint(root, { today: '2026-10-26' }).findings.filter(f => f.level === 'FAIL' && /hand-edited/.test(f.reason)).map(f => f.rel).sort();
  assert.deepEqual(hits, [HOT_REL, 'memory/HOME.md', 'memory/capabilities/skills.md'].sort());
  const check = run('build-hot.mjs', ['--check', '--root', root, '--now', FIXED_NOW.toISOString()]);
  assert.equal(check.status, 1);
  assert.match(check.stdout, /would change .*memory\/HOT\.md/);
  assert.equal(run('build-capabilities.mjs', ['--check', '--root', root]).status, 1);
  assert.equal(contentHash('a\r\nb  \n\n'), contentHash('a\nb'), 'hash tolerates CRLF and trailing spaces');
});

test('a learning edited after its day fails; a superseded one passes; missing type/created/summary fails', () => {
  const root = fixture();
  write(root, 'memory/learnings/money/edited.md', fm({ type: 'learning', created: '2026-10-20', updated: '2026-10-25', status: 'confirmed', maintained_by: 'harness', categories: '[learnings]', summary: 'Edited.' }) + 'x\n');
  write(root, 'memory/learnings/money/old.md', fm({ type: 'learning', created: '2026-10-20', updated: '2026-10-25', status: 'superseded', maintained_by: 'harness', categories: '[learnings]', summary: 'Old.' }) + 'x\n');
  write(root, 'memory/state/bare.md', '# No frontmatter\n');
  const f = lint(root, { today: '2026-10-26' }).findings.filter(x => x.level === 'FAIL');
  assert.ok(f.some(x => x.rel === 'memory/learnings/money/edited.md' && /edited after its day/.test(x.reason)));
  assert.ok(!f.some(x => x.rel === 'memory/learnings/money/old.md'));
  assert.ok(f.some(x => x.rel === 'memory/state/bare.md' && /no frontmatter/.test(x.reason)));
});

test('the SessionStart hook prints HOT as additionalContext, and nothing without it', () => {
  const root = fixture();
  const hook = path.join(HARNESS, '.claude', 'hooks', 'session-start.mjs');
  const empty = spawnSync(process.execPath, [hook], { input: JSON.stringify({ cwd: root, hook_event_name: 'SessionStart', source: 'startup' }), encoding: 'utf8', cwd: root, env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
  assert.equal(empty.status, 0);
  assert.equal(empty.stdout, '');
  buildAll(root, { now: FIXED_NOW });
  const res = spawnSync(process.execPath, [hook], { input: JSON.stringify({ cwd: root, hook_event_name: 'SessionStart', source: 'startup' }), encoding: 'utf8', cwd: root, env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
  assert.equal(res.status, 0);
  const out = JSON.parse(res.stdout);
  assert.equal(out.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(out.hookSpecificOutput.additionalContext, /Read the note before you act/);
  assert.doesNotMatch(out.hookSpecificOutput.additionalContext, /content_hash/);
});

test('the SessionStart hook with --codex also carries the files CLAUDE.md imports, in order', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-codex-'));
  fs.writeFileSync(path.join(root, 'CLAUDE.md'), '# H\n\n@config/b.md\n@config/a.md\n@config/missing.md\n');
  fs.mkdirSync(path.join(root, 'config'));
  fs.writeFileSync(path.join(root, 'config', 'a.md'), '# A file\r\n');
  fs.writeFileSync(path.join(root, 'config', 'b.md'), '# B file\n');
  const hook = path.join(HARNESS, '.claude', 'hooks', 'session-start.mjs');
  const run = (args) => spawnSync(process.execPath, [hook, ...args], { input: JSON.stringify({ cwd: root, hook_event_name: 'SubagentStart' }), encoding: 'utf8', cwd: root, env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
  assert.equal(run([]).stdout, ''); // Claude: no HOT, nothing (the imports are Claude's own)
  const out = JSON.parse(run(['--codex']).stdout).hookSpecificOutput;
  assert.equal(out.hookEventName, 'SubagentStart');
  assert.equal(out.additionalContext, 'config/b.md (imported by CLAUDE.md):\n\n# B file\n\n---\n\nconfig/a.md (imported by CLAUDE.md):\n\n# A file');
});

test('the quick guide START-HERE.html opens once per folder and computer, and again in a copied folder', async () => {
  const { openGuideOnce } = await import(pathToFileURL(path.join(HARNESS, '.claude', 'hooks', 'session-start.mjs')).href);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'guide-'));
  delete process.env.HARNESS_NO_GUIDE;
  const opened = [];
  const open = url => opened.push(url);
  assert.equal(openGuideOnce(root, { open }), false); // no guide in the folder
  fs.writeFileSync(path.join(root, 'START-HERE.html'), '<!doctype html>');
  assert.equal(openGuideOnce(root, { open, codex: true }), true);
  assert.match(opened[0], /^file:\/\/.*START-HERE\.html#codex$/);
  assert.equal(openGuideOnce(root, { open }), false); // the marker: once per folder
  const marker = path.join(root, 'dashboard', 'guide-opened.json');
  fs.writeFileSync(marker, JSON.stringify({ folder: path.join(os.tmpdir(), 'another-folder'), computer: os.hostname() }));
  assert.equal(openGuideOnce(root, { open }), true); // a folder copied from elsewhere opens it again
  assert.equal(opened.length, 2);
});

test('the PreCompact hook reads a Codex rollout transcript too', async () => {
  const { lastAssistantTexts } = await import(pathToFileURL(path.join(HARNESS, '.claude', 'hooks', 'pre-compact.mjs')).href);
  const lines = [
    { type: 'session_meta', payload: { id: 'x' } },
    { type: 'response_item', payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'question' }] } },
    { type: 'response_item', payload: { type: 'reasoning', summary: [{ type: 'summary_text', text: 'thinking' }] } },
    { type: 'response_item', payload: { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'the answer' }] } },
    { type: 'response_item', payload: { type: 'function_call', name: 'shell', arguments: '{}' } },
  ].map(o => JSON.stringify(o)).join('\n');
  assert.deepEqual(lastAssistantTexts(lines), ['the answer']);
});

test('the PreCompact hook appends a scrubbed checkpoint of the last 8 assistant texts to today\'s session note', () => {
  const root = fixture();
  fs.mkdirSync(path.join(root, 'memory', 'tools'), { recursive: true });
  fs.copyFileSync(path.join(TOOLS, 'lib.mjs'), path.join(root, 'memory', 'tools', 'lib.mjs'));
  const tr = path.join(root, 'transcript.jsonl');
  const lines = [];
  for (let i = 1; i <= 10; i++) {
    lines.push(JSON.stringify({ type: 'user', message: { role: 'user', content: `question ${i}` } }));
    lines.push(JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'thinking', thinking: 'secret thoughts' }, { type: 'text', text: `answer ${i} ` + (i === 10 ? 'mail someone@example.com, call +44 7700 900123 ' + 'x'.repeat(400) : '') }, { type: 'tool_use', name: 'Bash', input: { command: 'tool input text' } }] } }));
    lines.push(JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: 'tool result text' }] } }));
  }
  lines.push('not json');
  fs.writeFileSync(tr, lines.join('\n'), 'utf8');
  const hook = path.join(HARNESS, '.claude', 'hooks', 'pre-compact.mjs');
  const res = spawnSync(process.execPath, [hook], { input: JSON.stringify({ transcript_path: tr, cwd: root, hook_event_name: 'PreCompact', trigger: 'auto', custom_instructions: null }), encoding: 'utf8', cwd: root, env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
  assert.equal(res.status, 0);
  assert.equal(res.stdout, '');
  const monthDir = path.join(root, 'memory', 'sessions');
  const files = fs.readdirSync(monthDir, { recursive: true }).filter(f => String(f).endsWith('.md'));
  assert.equal(files.length, 1);
  const note = fs.readFileSync(path.join(monthDir, files[0]), 'utf8');
  assert.match(note, /^## Checkpoint \d{2}:\d{2}$/m);
  const block = note.split(/^## Checkpoint/m)[1].split(/^## Close/m)[0];
  const bullets = block.split('\n').filter(l => l.startsWith('- '));
  assert.equal(bullets.length, 8);
  assert.match(bullets[0], /answer 3/);
  assert.ok(bullets.every(b => b.length <= 302));
  assert.ok(!note.includes('someone@example.com') && !note.includes('7700 900123') && note.includes('[redacted]'));
  assert.ok(!/secret thoughts|tool input text|tool result text/.test(note));
  assert.ok(note.indexOf('## Checkpoint') < note.indexOf('## Close'));
  assert.doesNotMatch(note, /^summary:\s*$/m);
  const bad = spawnSync(process.execPath, [hook], { input: 'garbage', encoding: 'utf8', cwd: root });
  assert.equal(bad.status, 0);
});
