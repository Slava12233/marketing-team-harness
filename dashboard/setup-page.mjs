#!/usr/bin/env node
// dashboard/setup-page.mjs: writes dashboard/setup.html, the setup progress page the Operator keeps open in a
// browser beside Claude Code while /setup runs. Node 20+, no dependencies. It finds the harness folder by walking
// up from its own folder, so it runs from anywhere.
//   node dashboard/setup-page.mjs                         regenerate the page from the files and the marks
//   node dashboard/setup-page.mjs --mark <key>=<status>   record a mark (repeatable), then regenerate
//   node dashboard/setup-page.mjs --lang he|en            store the page's default language, then regenerate
//   node dashboard/setup-page.mjs --open | --print        also open it in the default browser | print it as text
// Statuses: todo, doing, done, owner (waiting for the Owner's click), na. A mark (dashboard/setup-progress.json)
// counts only where the files give no answer: the Console steps table of config/accounts.md, checklist.md,
// .mcp.json, whether .env exists (it is never opened), the config/*.md placeholders, plans/*first-flight-plan.md,
// dashboard/state.json, .claude/settings.json (the memory hooks, shipped), memory/business/company.md, and, outside
// the folder, whether the Obsidian app is installed and what Obsidian's global config (obsidian.json) says: this
// folder in its vault list, and "cli": true (both written by memory/tools/obsidian-setup.mjs, never a click). The
// page shows names and public ids only, never a secret, and loads nothing from the internet.
// Exit codes: 0 written, 1 a file could not be written, 2 wrong usage (unknown option, key or status).
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const STATUSES = ['todo', 'doing', 'done', 'owner', 'na'];
const GLYPHS = { done: '✓', todo: '○', doing: '◐', owner: '●', na: '–' };
const CHAPTERS = [
  { id: 'c0', info: true },
  { id: 'c1', items: ['install.git', 'install.node', 'install.claude', 'install.env', 'install.mcpjson', 'install.approved'] },
  { id: 'vault', items: ['obsidian.installed', 'obsidian.vault_opened', 'obsidian.cli', 'obsidian.hooks', 'memory.business_filled', 'memory.routines'] },
  { id: 'c2', items: ['meta.portfolio', 'meta.page', 'meta.adaccount', 'meta.payment', 'meta.phone', 'meta.people'] },
  { id: 'c3', items: ['meta.login', 'login.tools'] },
  { id: 'c4', items: ['meta.pixel'] },
  { id: 'c5', items: ['meta.apptoken', 'token.check'] },
  { id: 'c6', items: ['meta.whatsapp', 'meta.leadads', 'meta.leadscenter', 'meta.domain', 'meta.webhook', 'meta.instagram'] },
  { id: 'c7', items: ['fal.login'] },
  { id: 'c8', items: [...'abcdefghi'].map(r => 'interview.' + r).concat(['setup.pages', 'setup.files', 'setup.plan']) },
  { id: 'c9', items: ['health.run'] },
  { id: 'c10', items: ['flight.copy', 'flight.compliance', 'flight.creative', 'flight.upload', 'flight.build', 'flight.preview'] },
  { id: 'c11', info: true },
];
const KEYS = CHAPTERS.flatMap(c => c.items || []);
// Item → the first words of its row in the Console steps table of config/accounts.md (the row names are the
// contract with /setup; checklist.md carries the same names). The last two rows are optional: shown only once
// a file answers them with something other than n/a, or a mark exists.
const CONSOLE = {
  'meta.portfolio': 'Business portfolio', 'meta.page': 'Page', 'meta.adaccount': 'Ad account owned by the portfolio',
  'meta.payment': 'Payment method on the ad account', 'meta.phone': 'Phone number verified on the ad account',
  'meta.login': 'MCP login', 'meta.pixel': 'Pixel / dataset', 'meta.apptoken': 'Developer app',
  'meta.whatsapp': 'WhatsApp Business number', 'meta.leadads': 'Lead Ads terms', 'meta.leadscenter': 'Leads Center access',
  'meta.domain': 'Domain verified', 'meta.webhook': 'Lead webhook subscription', 'meta.instagram': 'Instagram linked',
};
const OPTIONAL = ['meta.webhook', 'meta.instagram'];

// Interview round → the config files it writes; the round is done once they hold no {{ placeholder.
const ROUND_FILES = { a: ['operator.md'], b: ['company.md'], c: ['product.md'], d: ['audiences.md'], e: ['brand.md'],
  f: ['claims.md'], g: ['accounts.md', 'product-team.md'], h: ['operator.md'], i: ['goals.md'] };

const EN = {
  code: 'en', dir: 'ltr', locale: 'en-GB', title: 'Setup progress', defaultCompany: 'Marketing Team Harness',
  progress: '{done}/{tracked} done', next: 'Next', yourClick: 'Your click', wizard: 'The wizard is on it',
  chapterN: 'Chapter {n}', allDone: 'Every tracked step is done.', lastUpdate: 'Last update',
  reload: 'This page reloads every 5 seconds. It shows names and public ids only, never a secret: a token, a password or a key never goes into chat or onto this page.',
  byHand: 'To update it by hand, run `node dashboard/setup-page.mjs` in the harness folder.',
  langName: { en: 'English', he: 'עברית' },
  status: { todo: 'to do', doing: 'in progress', done: 'done', owner: 'your turn', na: 'n/a' },
  chapters: { c0: 'Before you start', c1: 'Install', vault: 'The memory vault (Obsidian)', c2: 'Meta business basics', c3: 'Claude Code connected to Meta',
    c4: 'Pixel and tracking', c5: 'Developer app and upload token', c6: 'WhatsApp, lead forms, domain', c7: 'fal (optional)',
    c8: '`/setup` interview', c9: '`/health`', c10: 'First flight built PAUSED', c11: 'The routine' },
  info: {
    c0: ['A Claude plan (Max recommended; Pro runs into its limits on creative rounds and builds)',
      'A Facebook profile that administers the business', 'A computer with Windows or macOS'],
    c11: ['`/morning` every working day', '`/next-round` once a week', '`/sync` at the end of every session'],
  },
  items: {
    'install.git': 'Git installed', 'install.node': 'Node.js 20 or newer installed', 'install.claude': 'Claude Code installed',
    'install.env': '`.env` created from `.env.example` (its contents are never shown)',
    'install.mcpjson': '`.mcp.json` declares the `meta-ads` server',
    'install.approved': 'The two servers in `.mcp.json` approved in Claude Code',
    'obsidian.installed': 'Obsidian installed (free, also for commercial use)',
    'obsidian.vault_opened': 'This folder registered in Obsidian as a vault',
    'obsidian.cli': "Obsidian's command line interface on",
    'obsidian.hooks': 'Memory hooks in `.claude/settings.json` (shipped)',
    'memory.business_filled': 'The business note `memory/business/company.md` filled in by `/setup`',
    'memory.routines': 'The two memory routines registered (nightly check, weekly review; phone alerts)',
    'meta.portfolio': 'Business portfolio', 'meta.page': 'Facebook Page', 'meta.adaccount': 'Ad account owned by the portfolio',
    'meta.payment': 'Payment method on the ad account', 'meta.phone': 'Phone number verified on the ad account',
    'meta.people': 'People and roles', 'meta.login': 'Meta login in Claude Code (`meta-ads`)',
    'login.tools': 'Meta tools loaded in a new session; the account read shows the ad account',
    'meta.pixel': 'Pixel / dataset created and installed (or "no website")',
    'meta.apptoken': 'Developer app (Business type) and System User token in `.env`',
    'token.check': 'Upload token check passed (`meta-upload.mjs --check`)',
    'meta.whatsapp': 'WhatsApp Business number linked to the Page', 'meta.leadads': 'Lead Ads terms accepted on the Page',
    'meta.leadscenter': 'Leads Center access for whoever answers leads', 'meta.domain': 'Domain verified',
    'meta.webhook': 'Lead webhook subscription (advanced)', 'meta.instagram': 'Instagram linked for ads (optional)',
    'fal.login': 'fal logged in (`/mcp` → `fal`), for paid pictures and clips',
    'interview.a': 'Round (a): who runs this', 'interview.b': 'Round (b): the company',
    'interview.c': 'Round (c): product and funnels', 'interview.d': 'Round (d): audiences', 'interview.e': 'Round (e): brand',
    'interview.f': 'Round (f): claims and law', 'interview.g': 'Round (g): accounts and tracking',
    'interview.h': 'Round (h): routines and the go', 'interview.i': 'Round (i): goals and money',
    'setup.pages': 'Destination pages fetched', 'setup.files': '`config/` files written, no placeholder left',
    'setup.plan': 'First flight plan drafted in `plans/`', 'health.run': '`/health` run and its green/yellow/red table read',
    'flight.copy': 'Ad copy written', 'flight.compliance': 'Compliance gate passed',
    'flight.creative': 'Creative made (at least one still)', 'flight.upload': 'Media uploaded to the ad account',
    'flight.build': 'Campaign built PAUSED', 'flight.preview': "Meta's preview images sent to the Owner",
  },
  hints: {
    'obsidian.vault_opened': 'Nothing to click: the bootstrap does it, or run `node memory/tools/obsidian-setup.mjs` in the harness folder',
    'obsidian.cli': 'Nothing to click: the bootstrap does it, or run `node memory/tools/obsidian-setup.mjs` in the harness folder',
    'obsidian.hooks': 'The file ships with the harness; if it was deleted or replaced, restore its block from `docs/hooks-paste-block.md`',
    'memory.routines': 'Nothing to click: `/setup` step 5.6 registers them in the Claude desktop app (one question)',
    'meta.portfolio': 'Business Settings → Business portfolio', 'meta.page': 'Business Settings → Accounts → Pages',
    'meta.adaccount': 'Business Settings → Accounts → Ad accounts (time zone and currency are permanent)',
    'meta.payment': 'Ad account → Payment settings',
    'meta.phone': 'Ad account settings → verify the phone number (required before any activation)',
    'meta.people': 'Business Settings → Users → People',
    'meta.login': "In Claude Code: `/mcp` → `meta-ads` → log in with the Owner's Facebook",
    'meta.pixel': 'Events Manager → Connect data sources → Web',
    'meta.apptoken': '`developers.facebook.com` → Create app (Business) → Marketing API; Business Settings → System users → Generate token → paste into `.env`, never into chat',
    'meta.whatsapp': 'Page settings → Linked accounts → WhatsApp', 'meta.leadads': 'The Page → Lead Ads terms',
    'meta.leadscenter': 'Business Suite → Leads Center → notifications', 'meta.domain': 'Business Settings → Brand safety → Domains',
    'meta.webhook': 'Only with a product team: Webhooks on the developer app',
    'meta.instagram': 'Business Settings → Accounts → Instagram accounts',
  },
};
const HE = {
  code: 'he', dir: 'rtl', locale: 'he-IL', title: 'התקדמות ההתקנה', defaultCompany: 'Marketing Team Harness',
  progress: '{done}/{tracked} בוצעו', next: 'הצעד הבא', yourClick: 'הלחיצה שלכם', wizard: 'האשף מטפל בזה',
  chapterN: 'פרק {n}', allDone: 'כל השלבים שבמעקב בוצעו.', lastUpdate: 'עדכון אחרון',
  reload: 'הדף מתרענן כל 5 שניות. מוצגים בו שמות ומזהים ציבוריים בלבד, אף פעם לא סוד: טוקן, סיסמה או מפתח לא נכנסים לצ׳אט ולא לדף הזה.',
  byHand: 'לעדכון ידני, הריצו `node dashboard/setup-page.mjs` בתיקיית הפרויקט.',
  langName: { en: 'English', he: 'עברית' },
  status: { todo: 'לביצוע', doing: 'בתהליך', done: 'בוצע', owner: 'התור שלכם', na: 'לא רלוונטי' },
  chapters: { c0: 'לפני שמתחילים', c1: 'התקנה', vault: 'כספת הזיכרון (Obsidian)', c2: 'יסודות העסק ב-Meta', c3: 'חיבור Claude Code ל-Meta',
    c4: 'פיקסל ומעקב', c5: 'אפליקציית מפתחים וטוקן העלאה', c6: 'WhatsApp, טופסי לידים, דומיין', c7: 'fal (אופציונלי)',
    c8: 'הראיון של `/setup`', c9: '`/health`', c10: 'קמפיין ראשון בנוי במצב PAUSED', c11: 'השגרה' },
  info: {
    c0: ['מנוי Claude (מומלץ Max; ב-Pro נתקלים במגבלות השימוש בסבבי קריאייטיב ובבנייה)',
      'פרופיל פייסבוק שמנהל את העסק', 'מחשב עם Windows או macOS'],
    c11: ['`/morning` בכל יום עבודה', '`/next-round` פעם בשבוע', '`/sync` בסוף כל סשן'],
  },
  items: {
    'install.git': 'Git מותקן', 'install.node': 'Node.js בגרסה 20 ומעלה מותקן', 'install.claude': 'Claude Code מותקן',
    'install.env': 'הקובץ `.env` נוצר מתוך `.env.example` (התוכן שלו לא מוצג אף פעם)',
    'install.mcpjson': 'הקובץ `.mcp.json` מגדיר את השרת `meta-ads`',
    'install.approved': 'שני השרתים שב-`.mcp.json` אושרו ב-Claude Code',
    'obsidian.installed': 'Obsidian מותקן (חינמי, גם לשימוש מסחרי)',
    'obsidian.vault_opened': 'התיקייה רשומה ב-Obsidian ככספת (vault)',
    'obsidian.cli': 'ממשק שורת הפקודה של Obsidian פעיל',
    'obsidian.hooks': 'ה-hooks של הזיכרון בקובץ `.claude/settings.json` (מגיעים עם הכלי)',
    'memory.business_filled': 'פתק העסק `memory/business/company.md` מולא על ידי `/setup`',
    'memory.routines': 'שתי רוטינות הזיכרון נרשמו (בדיקה לילית, סקירה שבועית; התראות לטלפון)',
    'meta.portfolio': 'תיק עסקי', 'meta.page': 'עמוד פייסבוק', 'meta.adaccount': 'חשבון מודעות בבעלות התיק העסקי',
    'meta.payment': 'אמצעי תשלום בחשבון המודעות', 'meta.phone': 'מספר טלפון מאומת בחשבון המודעות',
    'meta.people': 'אנשים ותפקידים', 'meta.login': 'התחברות ל-Meta ב-Claude Code דרך `meta-ads`',
    'login.tools': 'הכלים של Meta נטענו בסשן חדש, וקריאת החשבון מציגה את חשבון המודעות',
    'meta.pixel': 'פיקסל / מערך נתונים נוצר והותקן (או "אין אתר")',
    'meta.apptoken': 'אפליקציית מפתחים (מסוג Business) וטוקן של System User בקובץ `.env`',
    'token.check': 'בדיקת טוקן ההעלאה עברה: `meta-upload.mjs --check`',
    'meta.whatsapp': 'מספר WhatsApp Business מקושר לעמוד', 'meta.leadads': 'תנאי מודעות הלידים אושרו בעמוד',
    'meta.leadscenter': 'גישה למרכז הלידים למי שעונה ללידים', 'meta.domain': 'הדומיין אומת',
    'meta.webhook': 'מינוי Webhook ללידים (מתקדם)', 'meta.instagram': 'Instagram מקושר למודעות (אופציונלי)',
    'fal.login': 'התחברות ל-fal דרך `/mcp`, לתמונות ולקליפים בתשלום',
    'interview.a': 'סבב (a): מי מפעיל את זה', 'interview.b': 'סבב (b): החברה', 'interview.c': 'סבב (c): המוצר והמשפכים',
    'interview.d': 'סבב (d): הקהלים', 'interview.e': 'סבב (e): המותג', 'interview.f': 'סבב (f): טענות פרסומיות והחוק',
    'interview.g': 'סבב (g): חשבונות ומעקב', 'interview.h': 'סבב (h): שגרות ואישור ההפעלה', 'interview.i': 'סבב (i): יעדים וכסף',
    'setup.pages': 'דפי היעד נטענו ונבדקו', 'setup.files': 'קובצי `config/` נכתבו, בלי ממלאי מקום שנשארו',
    'setup.plan': 'תוכנית הקמפיין הראשון נוסחה בתיקייה `plans/`', 'health.run': 'הרצתם `/health` וקראתם את טבלת הירוק/צהוב/אדום',
    'flight.copy': 'נוסחי המודעות נכתבו', 'flight.compliance': 'בדיקת הציות עברה',
    'flight.creative': 'הקריאייטיב מוכן (לפחות תמונה אחת)', 'flight.upload': 'המדיה הועלתה לחשבון המודעות',
    'flight.build': 'הקמפיין נבנה במצב PAUSED', 'flight.preview': 'תמונות התצוגה המקדימה של Meta נשלחו לבעלים',
  },
  hints: {
    'obsidian.vault_opened': 'אין מה ללחוץ: סקריפט ההתקנה עושה את זה, או הריצו `node memory/tools/obsidian-setup.mjs` בתיקיית הפרויקט',
    'obsidian.cli': 'אין מה ללחוץ: סקריפט ההתקנה עושה את זה, או הריצו `node memory/tools/obsidian-setup.mjs` בתיקיית הפרויקט',
    'obsidian.hooks': 'הקובץ מגיע עם הכלי; אם נמחק או הוחלף, שחזרו את הבלוק שלו מ-`docs/hooks-paste-block.md`',
    'memory.routines': 'אין מה ללחוץ: שלב 5.6 של `/setup` רושם אותן באפליקציית Claude (שאלה אחת)',
    'meta.portfolio': 'הגדרות העסק ← תיק עסקי', 'meta.page': 'הגדרות העסק ← חשבונות ← עמודים',
    'meta.adaccount': 'הגדרות העסק ← חשבונות ← חשבונות מודעות (אזור הזמן והמטבע קבועים לתמיד)',
    'meta.payment': 'חשבון המודעות ← הגדרות תשלום',
    'meta.phone': 'הגדרות חשבון המודעות ← אימות מספר הטלפון (חובה לפני כל הפעלה)',
    'meta.people': 'הגדרות העסק ← משתמשים ← אנשים',
    'meta.login': 'ב-Claude Code: `/mcp` ← `meta-ads` ← התחברות עם הפייסבוק של הבעלים',
    'meta.pixel': 'מנהל האירועים ← חיבור מקורות נתונים ← אתר אינטרנט',
    'meta.apptoken': '`developers.facebook.com` ← יצירת אפליקציה (Business) ← Marketing API; הגדרות העסק ← משתמשי מערכת ← יצירת טוקן ← הדבקה בקובץ `.env`, אף פעם לא בצ׳אט',
    'meta.whatsapp': 'הגדרות העמוד ← חשבונות מקושרים ← WhatsApp', 'meta.leadads': 'העמוד ← תנאי מודעות הלידים',
    'meta.leadscenter': 'Business Suite ← מרכז הלידים ← התראות', 'meta.domain': 'הגדרות העסק ← בטיחות המותג ← דומיינים',
    'meta.webhook': 'רק עם צוות מוצר: Webhooks באפליקציית המפתחים',
    'meta.instagram': 'הגדרות העסק ← חשבונות ← חשבונות Instagram',
  },
};
const STRINGS = { en: EN, he: HE };

const norm = s => String(s ?? '').replace(/[`"'“”‘’*]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const plain = s => String(s).replace(/`/g, '');
const isDir = p => { try { return statSync(p).isDirectory(); } catch { return false; } };

function findRoot(from) {   // the nearest folder up from this script that holds CLAUDE.md and config/
  for (let dir = resolve(from); ; dir = dirname(dir)) {
    if (existsSync(join(dir, 'CLAUDE.md')) && isDir(join(dir, 'config'))) return dir;
    if (dirname(dir) === dir) return resolve(from, '..');
  }
}

function tables(md) {   // every Markdown table outside HTML comments: rows of trimmed cells, separator rows dropped
  const out = []; let cur = null;
  for (const line of md.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/)) {
    const t = line.trim();
    if (!t.startsWith('|')) { cur = null; continue; }
    const cells = t.replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(s => s.trim());
    if (cells.every(c => /^:?-+:?$/.test(c))) continue;
    if (!cur) out.push(cur = []);
    cur.push(cells);
  }
  return out;
}
function table(md, ...cols) {   // the first table whose header names these columns, as rows of { column: cell }
  for (const t of tables(md)) {
    const head = t[0].map(norm);
    if (cols.every(c => head.includes(c))) return t.slice(1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
  }
  return [];
}
function cellStatus(cell) {   // a status cell of config/accounts.md or checklist.md → a page status, or null (no answer)
  if (cell == null || String(cell).includes('{{')) return null;
  const s = norm(cell);
  if (s.startsWith('done')) return 'done';
  if (s.startsWith('open') || s.startsWith('blocked')) return 'owner';
  return s.startsWith('n/a') || s === 'na' ? 'na' : null;
}

const WIN = process.platform === 'win32', MAC = process.platform === 'darwin';
const samePath = p => {   // one spelling of a folder path, for comparing two of them
  let s = resolve(String(p));
  try { s = realpathSync(s); } catch { /* keep the resolved spelling */ }
  s = s.replace(/[\\/]+$/, '');
  return WIN ? s.toLowerCase() : s;
};
function obsidianApp(env) {   // true when the Obsidian app is where its installers put it
  const home = env.HOME || env.USERPROFILE || '';
  const places = WIN ? [env.LOCALAPPDATA && join(env.LOCALAPPDATA, 'Programs', 'Obsidian', 'Obsidian.exe'),
    env.ProgramFiles && join(env.ProgramFiles, 'Obsidian', 'Obsidian.exe')]
    : MAC ? ['/Applications/Obsidian.app', home && join(home, 'Applications', 'Obsidian.app')]
    : ['/usr/bin/obsidian', '/snap/bin/obsidian', '/var/lib/flatpak/exports/bin/md.obsidian.Obsidian',
      home && join(home, '.local', 'bin', 'obsidian'), home && join(home, '.local', 'share', 'flatpak', 'exports', 'bin', 'md.obsidian.Obsidian')];
  return places.some(p => p && existsSync(p));
}
function obsidianConfig(env) {   // Obsidian's global config (obsidian.json) parsed, or null when absent or unreadable
  const home = env.HOME || env.USERPROFILE || '';
  const reg = WIN ? env.APPDATA && join(env.APPDATA, 'obsidian', 'obsidian.json')
    : MAC ? home && join(home, 'Library', 'Application Support', 'obsidian', 'obsidian.json')
    : join(env.XDG_CONFIG_HOME || join(home, '.config'), 'obsidian', 'obsidian.json');
  try { const c = JSON.parse(readFileSync(reg, 'utf8')); return c && typeof c === 'object' ? c : null; } catch { return null; }
}
function vaultListed(root, cfg) {   // true when the config's vault list names this folder
  const want = samePath(root), vaults = (cfg && cfg.vaults) || {};
  return Object.values(vaults).some(v => v && typeof v.path === 'string' && v.path !== '' && samePath(v.path) === want);
}

function facts(root, env = process.env) {   // what the files say; .env is checked for existence only and never opened
  const read = rel => { try { return readFileSync(join(root, rel), 'utf8'); } catch { return null; } };
  const ls = rel => { try { return readdirSync(join(root, rel)); } catch { return []; } };
  const json = rel => { try { return JSON.parse(read(rel)) || {}; } catch { return {}; } };
  const acc = read('config/accounts.md') || '', chk = read('checklist.md') || '';
  const steps = table(acc, 'step', 'status'), rows = table(chk, 'item', 'status'), fields = table(acc, 'field', 'value');
  const find = (list, col, words) => list.find(r => norm(r[col]).startsWith(norm(words)));
  const line = (rel, label) => {
    const m = (read(rel) || '').match(new RegExp('\\*\\*' + label + ':\\*\\*[ \\t]*(.*)', 'i'));
    return m && !m[1].includes('{{') ? m[1].replace(/<!--.*?-->/g, '').trim() : '';
  };
  const complete = {};
  for (const n of ls('config')) if (/\.md$/i.test(n) && n.toLowerCase() !== 'readme.md') complete[n] = !(read('config/' + n) ?? '{{').includes('{{');
  const pixel = find(fields, 'field', 'pixel_id'), campaigns = json('dashboard/state.json').campaigns;
  return {
    step: words => find(steps, 'step', words), item: words => find(rows, 'item', words), complete,
    servers: Object.keys(json('.mcp.json').mcpServers || {}), env: existsSync(join(root, '.env')),
    pixelNoSite: !!pixel && !pixel.value.includes('{{') && /no website/i.test(pixel.value),
    plan: ls('plans').some(n => /first-flight-plan\.md$/i.test(n)),
    built: Array.isArray(campaigns) && campaigns.some(c => c && /^(PAUSED|ACTIVE)$/i.test(String(c.status))),
    company: line('config/company.md', 'Short name').split(/;| \(/)[0].trim().slice(0, 60) || null,
    chat: line('config/operator.md', 'Chat language'),
    obsidian: obsidianApp(env), ...(cfg => ({ vault: vaultListed(root, cfg), cli: !!cfg && cfg.cli === true }))(obsidianConfig(env)),
    hooks: (read('.claude/settings.json') || '').includes('session-start.mjs'),
    business: (b => b !== null && !b.includes('<fill at /setup>'))(read('memory/business/company.md')),
    routines: ((read('config/operator.md') || '').match(/^\|\s*Nightly memory check\s*\|.*$/m) || [''])[0],
  };
}

function fileAnswer(key, f) {   // the files' answer for one item: a status, or null when they do not say
  if (key === 'install.env') return f.env ? 'done' : 'todo';
  if (key === 'install.mcpjson') return f.servers.includes('meta-ads') ? 'done' : 'todo';
  if (key === 'meta.people') return cellStatus(f.item('People and roles')?.status);
  if (key === 'obsidian.installed') return f.obsidian ? 'done' : null;
  if (key === 'obsidian.vault_opened') return f.vault ? 'done' : 'todo';
  if (key === 'obsidian.cli') return f.cli ? 'done' : 'todo';
  if (key === 'obsidian.hooks') return f.hooks ? 'done' : 'todo';
  if (key === 'memory.business_filled') return f.business ? 'done' : 'todo';
  if (key === 'memory.routines') return !f.routines || f.routines.includes('{{') ? null : /not registered/i.test(f.routines) ? 'na' : 'done';
  if (CONSOLE[key]) {
    const row = f.step(CONSOLE[key]);
    if (key === 'meta.pixel' && (f.pixelNoSite || /no website/.test(norm(row?.status)) || norm(row?.note).startsWith('no website'))) return 'na';
    return cellStatus(row?.status) || cellStatus(f.item(CONSOLE[key])?.status);
  }
  if (key.startsWith('interview.')) return ROUND_FILES[key.slice(-1)].every(n => f.complete[n]) ? 'done' : null;
  if (key === 'setup.files') {
    const v = Object.values(f.complete);
    return v.length && v.every(Boolean) ? 'done' : v.some(Boolean) ? 'doing' : 'todo';
  }
  if (key === 'setup.plan') return f.plan ? 'done' : null;
  if (key === 'flight.build') return f.built ? 'done' : null;
  return null;
}

function buildModel(root, progress) {   // the files win, then the mark, then the default
  const f = facts(root), marks = progress.marks;
  const lang = progress.lang || (/hebrew|עברית/i.test(f.chat) ? 'he' : 'en');
  const real = c => c != null && !String(c).includes('{{') && norm(c) !== '';
  let done = 0, tracked = 0, next = null;
  const fallback = key => (key === 'fal.login' && !f.servers.includes('fal') ? 'na' : 'todo');
  const chapters = CHAPTERS.map((c, n) => {
    if (c.info) return { id: c.id, n, info: true };
    const items = [];
    for (const key of c.items) {
      const status = fileAnswer(key, f) || marks[key] || fallback(key);
      const answered = OPTIONAL.includes(key) && (real(f.step(CONSOLE[key])?.status) || real(f.item(CONSOLE[key])?.status));
      if (OPTIONAL.includes(key) && (status === 'na' || (!answered && !marks[key]))) continue;
      items.push({ key, status });
    }
    const has = s => items.some(i => i.status === s);
    const d = items.filter(i => i.status === 'done').length, t = items.filter(i => i.status !== 'na').length;
    const status = d === t ? 'done' : has('owner') ? 'owner' : has('doing') ? 'doing' : 'todo';
    const open = items.find(i => i.status === 'todo' || i.status === 'doing' || i.status === 'owner');
    if (!next && open) next = { key: open.key, status: open.status, chapter: c.id, n };
    done += d; tracked += t;
    return { id: c.id, n, status, done: d, tracked: t, items };
  });
  return { lang, company: f.company, generatedAt: new Date().toISOString(), done, tracked, next, chapters };
}

// The page body. It runs here for the first paint and, as its own source text, in the browser when the
// language toggle is pressed, so it uses nothing but its arguments.
function renderPage(m, S, G) {
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function fmt(s) { return esc(s).replace(/`([^`]+)`/g, '<code dir="ltr">$1</code>'); }
  function tpl(s, v) { return s.replace(/\{(\w+)\}/g, function (_, k) { return v[k]; }); }
  var pct = m.tracked ? Math.round(100 * m.done / m.tracked) : 100, nx = m.next, h = '', when = m.generatedAt;
  h += '<h1>' + esc(S.title) + ' · ' + esc(m.company || S.defaultCompany) + '</h1>';
  h += '<div class="bar" role="progressbar" aria-label="' + esc(S.title) + '" aria-valuemin="0" aria-valuemax="' + m.tracked +
    '" aria-valuenow="' + m.done + '"><span style="width:' + pct + '%"></span></div>';
  h += '<p class="count">' + esc(tpl(S.progress, m)) + '</p>';
  h += '<section class="next st-' + (nx ? nx.status : 'done') + '"><h2>' + esc(S.next) + '</h2>';
  if (!nx) h += '<p class="what">' + esc(S.allDone) + '</p>';
  else {
    h += '<p class="what">' + fmt(S.items[nx.key]) + '</p><p class="who">';
    if (nx.status === 'owner') h += esc(S.yourClick) + (S.hints[nx.key] ? ': ' + fmt(S.hints[nx.key]) : '');
    else if (nx.status === 'doing') h += esc(S.wizard);
    else h += esc(tpl(S.chapterN, { n: nx.n })) + ' · ' + fmt(S.chapters[nx.chapter]) +
      (nx.key.indexOf('obsidian.') === 0 && S.hints[nx.key] ? ' · ' + fmt(S.hints[nx.key]) : '');
    h += '</p>';
  }
  h += '</section>';
  for (var i = 0; i < m.chapters.length; i++) {
    var c = m.chapters[i], head = '<span class="num">' + c.n + '</span><span class="title">' + fmt(S.chapters[c.id]) + '</span>';
    if (c.info) {
      h += '<section class="chapter info"><h2>' + head + '</h2><ul class="lines">';
      for (var j = 0; j < S.info[c.id].length; j++) h += '<li>' + fmt(S.info[c.id][j]) + '</li>';
      h += '</ul></section>';
      continue;
    }
    h += '<section class="chapter st-' + c.status + '"><h2><span class="glyph" role="img" aria-label="' + esc(S.status[c.status]) +
      '" title="' + esc(S.status[c.status]) + '">' + G[c.status] + '</span>' + head +
      (c.tracked ? '<span class="cnt">' + c.done + '/' + c.tracked + '</span>' : '') + '</h2><ul class="items">';
    for (var k = 0; k < c.items.length; k++) {
      // a hint shows on the Owner's turn, and on an open Obsidian item (it names the command that does it)
      var it = c.items[k], hint = (it.status === 'owner' || (it.status === 'todo' && it.key.indexOf('obsidian.') === 0)) && S.hints[it.key];
      h += '<li class="st-' + it.status + '"><label><input type="checkbox" disabled' + (it.status === 'done' ? ' checked' : '') +
        '><span class="text"><span class="label">' + fmt(S.items[it.key]) + '</span> <span class="st">' + G[it.status] + ' ' +
        esc(S.status[it.status]) + '</span>' + (hint ? '<span class="hint">' + fmt(hint) + '</span>' : '') + '</span></label></li>';
    }
    h += '</ul></section>';
  }
  try { when = new Date(m.generatedAt).toLocaleString(S.locale, { dateStyle: 'medium', timeStyle: 'medium' }); } catch (e) { /* keep ISO */ }
  h += '<footer><p>' + esc(S.lastUpdate) + ' ' + esc(when) + '</p><p>' + esc(S.reload) + '</p><p class="langs">';
  ['en', 'he'].forEach(function (l) {
    h += '<button type="button" data-lang="' + l + '" lang="' + l + '" dir="' + (l === 'he' ? 'rtl' : 'ltr') + '" aria-pressed="' +
      (l === S.code) + '">' + esc(S.langName[l]) + '</button> ';
  });
  return h + '</p><p>' + fmt(S.byHand) + '</p></footer>';
}

const CSS = `*{box-sizing:border-box}html,body{background:#fff}
body{margin:0;color:#101828;font:15px/1.5 -apple-system,"Segoe UI",Arial,sans-serif}
main{max-width:720px;margin:0 auto;padding:20px 16px 32px}.switching #app{visibility:hidden}
h1{font-size:20px;line-height:1.3;margin:0 0 12px;font-weight:600}
h2{font-size:16px;line-height:1.35;margin:0 0 6px;font-weight:600;display:flex;flex-wrap:wrap;gap:8px;align-items:baseline}
.bar{height:8px;background:#EAECF0;border-radius:4px;overflow:hidden}.bar span{display:block;height:100%;background:#0F6E56}
.count{margin:6px 0 16px;color:#475467;font-size:14px}
.next{border:1px solid #D0D5DD;border-radius:8px;padding:12px 14px;margin:0 0 20px}.next h2{font-size:13px;color:#475467;margin:0 0 2px}
.next p{margin:0}.next .what{font-weight:600}.next .who{color:#475467}.next.st-owner{border-color:#B45309}.next.st-owner .who{color:#B45309}
.chapter{border-top:1px solid #EAECF0;padding:12px 0}.num{color:#475467;min-width:1.4em}.glyph{min-width:1em;text-align:center}
.cnt{margin-inline-start:auto;color:#475467;font-size:13px;font-weight:400}
.chapter.st-done .glyph{color:#0F6E56}.chapter.st-owner .glyph{color:#B45309}.chapter.st-todo .glyph{color:#475467}
ul{list-style:none;margin:0;padding:0}.items li{padding:3px 0}.items label{display:flex;gap:8px;align-items:flex-start}
.items input{flex:none;margin:4px 0 0}.text{flex:1;min-width:0}.st{white-space:nowrap;font-size:13px;color:#475467}
.hint{display:block;font-size:13px;color:#475467}li.st-done .st{color:#0F6E56}li.st-owner .st,li.st-owner .hint{color:#B45309}
li.st-doing .st{color:#101828}li.st-na .label,li.st-na .st{color:#98A2B3}.lines li{color:#475467;padding:2px 0}
code{font-family:ui-monospace,Consolas,"Courier New",monospace;font-size:.9em;background:#F2F4F7;border-radius:4px;padding:0 4px}
footer{border-top:1px solid #EAECF0;margin-top:4px;padding-top:12px;color:#475467;font-size:13px}footer p{margin:0 0 8px}
button{font:inherit;color:#101828;background:#fff;border:1px solid #D0D5DD;border-radius:6px;padding:3px 10px;cursor:pointer}
button[aria-pressed="true"]{border-color:#101828;font-weight:600}`;

function pageHtml(model) {   // the whole page: first paint here, the data and both string tables embedded
  const S = STRINGS[model.lang], title = esc(S.title + ' · ' + (model.company || S.defaultCompany));
  const data = JSON.stringify({ model, strings: STRINGS, glyphs: GLYPHS })
    .replace(/[<>&]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
  const src = renderPage.toString();
  if (/<\/script|<!--/i.test(src)) throw new Error('renderPage must not contain a script end or comment opener');
  return `<!doctype html>
<html lang="${model.lang}" dir="${S.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="5">
<meta name="color-scheme" content="light">
<title>${title}</title>
<style>${CSS}</style>
<script>try{var l=localStorage.getItem('lang');if((l==='he'||l==='en')&&l!=='${model.lang}')document.documentElement.classList.add('switching')}catch(e){}</script>
</head>
<body>
<main id="app">${renderPage(model, S, GLYPHS)}</main>
<script type="application/json" id="setup-data">${data}</script>
<script>
(function () {
  var D = JSON.parse(document.getElementById('setup-data').textContent), root = document.documentElement, l = null;
  var render = ${src};
  function show(lang) {
    var S = D.strings[lang];
    root.lang = lang; root.dir = S.dir;
    document.title = S.title + ' · ' + (D.model.company || S.defaultCompany);
    document.getElementById('app').innerHTML = render(D.model, S, D.glyphs);
  }
  try { l = localStorage.getItem('lang'); } catch (e) {}
  try { if ((l === 'he' || l === 'en') && l !== D.model.lang) show(l); } finally { root.classList.remove('switching'); }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('button[data-lang]') : null;
    if (!b) return;
    l = b.getAttribute('data-lang');
    try { localStorage.setItem('lang', l); } catch (x) {}
    show(l);
  });
})();
</script>
</body>
</html>
`;
}

function writeAtomic(file, text) {   // temp file + rename, so a reload never meets a half-written page
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, text);
  try { renameSync(tmp, file); } catch { writeFileSync(file, text); try { unlinkSync(tmp); } catch { /* gone */ } }
}

function loadProgress(file) {   // dashboard/setup-progress.json, keeping only known keys and statuses
  let p = {};
  if (existsSync(file)) {
    try { p = JSON.parse(readFileSync(file, 'utf8')) || {}; } catch { console.error(`note: ${file} is not valid JSON; it is rewritten on the next mark`); }
  }
  const marks = {};
  for (const [k, v] of Object.entries(p.marks || {})) if (KEYS.includes(k) && STATUSES.includes(v)) marks[k] = v;
  return { updatedAt: p.updatedAt || null, ...(p.lang === 'he' || p.lang === 'en' ? { lang: p.lang } : {}), marks };
}

function openPage(file) {   // the default browser; a failure is reported, never fatal
  const win = process.platform === 'win32', mac = process.platform === 'darwin';
  try {
    if (win || mac) {
      const r = win ? spawnSync('cmd', ['/c', 'start', '""', `"${file}"`], { stdio: 'ignore', timeout: 15000, windowsVerbatimArguments: true })
        : spawnSync('open', [file], { stdio: 'ignore', timeout: 15000 });
      return !r.error && r.status === 0;
    }
    const c = spawn('xdg-open', [file], { stdio: 'ignore', detached: true });
    c.on('error', () => {}); c.unref();
    return true;
  } catch { return false; }
}

function printText(model) {   // the checklist as plain text, for the wizard to echo in chat
  const S = STRINGS[model.lang], out = [`${S.title} · ${model.company || S.defaultCompany}: ${S.progress.replace('{done}', model.done).replace('{tracked}', model.tracked)}`];
  for (const c of model.chapters) {
    out.push('', `${c.n}. ${plain(S.chapters[c.id])}` + (c.info ? '' : `  ${GLYPHS[c.status]}${c.tracked ? ` ${c.done}/${c.tracked}` : ''}`));
    if (c.info) for (const l of S.info[c.id]) out.push(`   · ${plain(l)}`);
    else for (const it of c.items) {
      const hinted = it.status === 'owner' || (it.status === 'todo' && it.key.startsWith('obsidian.'));
      const hint = hinted && S.hints[it.key] ? ` (${plain(S.hints[it.key])})` : '';
      out.push(`   ${GLYPHS[it.status]} ${plain(S.items[it.key])}: ${S.status[it.status]} [${it.key}]${hint}`);
    }
  }
  console.log(out.join('\n') + '\n');
}

const keyList = () => 'Valid keys:\n' + CHAPTERS.filter(c => c.items).map(c => `  ${plain(EN.chapters[c.id])}: ${c.items.join(' ')}`).join('\n') +
  `\nValid statuses: ${STATUSES.join(', ')} (owner = waiting for the Owner's click)`;
const usage = () => `Usage: node dashboard/setup-page.mjs [--mark <key>=<status>]... [--lang he|en] [--open] [--print] [--help]
Writes dashboard/setup.html, the setup progress page (offline; it reloads itself every 5 seconds).
  --mark <key>=<status>  record a mark in dashboard/setup-progress.json (repeatable); where the files answer, they win
  --lang he|en           store the page's default language (otherwise the chat language in config/operator.md)
  --open                 open the page in the default browser afterwards
  --print                also print the checklist as text
${keyList()}`;

function main(argv) {
  const o = { marks: [], lang: null, open: false, print: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    let a = argv[i], v = null;
    if (/^--(mark|lang)=/.test(a)) { v = a.slice(a.indexOf('=') + 1); a = a.slice(0, a.indexOf('=')); }
    if (a === '--mark' || a === '--lang') {
      if (v === null) v = argv[++i];
      if (v === undefined) { console.error(`${a} needs a value\n${usage()}`); return 2; }
      if (a === '--mark') o.marks.push(v); else o.lang = v;
    } else if (a === '--open' || a === '--print') o[a.slice(2)] = true;
    else if (a === '--help' || a === '-h') o.help = true;
    else { console.error(`Unknown option: ${a}\n${usage()}`); return 2; }
  }
  if (o.help) { console.log(usage()); return 0; }
  const marks = o.marks.map(m => (m.includes('=') ? [m.slice(0, m.indexOf('=')), m.slice(m.indexOf('=') + 1)] : [m, '']));
  const bad = marks.map(([k, s]) => (!KEYS.includes(k) ? `Unknown key: ${k}` : !STATUSES.includes(s) ? `Unknown status for ${k}: ${s || '(none)'}` : ''))
    .filter(Boolean);
  if (o.lang !== null && o.lang !== 'he' && o.lang !== 'en') bad.push(`Unknown language: ${o.lang} (he or en)`);
  if (bad.length) { console.error(`${bad.join('\n')}\n${keyList()}`); return 2; }

  const root = findRoot(dirname(fileURLToPath(import.meta.url)));
  const progFile = join(root, 'dashboard', 'setup-progress.json'), pageFile = join(root, 'dashboard', 'setup.html');
  const prog = loadProgress(progFile);
  let model;
  try {
    if (marks.length || o.lang) {
      for (const [k, s] of marks) prog.marks[k] = s;
      if (o.lang) prog.lang = o.lang;
      prog.updatedAt = new Date().toISOString();
      writeAtomic(progFile, JSON.stringify(prog, null, 2) + '\n');
    }
    model = buildModel(root, prog);
    writeAtomic(pageFile, pageHtml(model));
  } catch (e) { console.error(`setup page: could not write (${e.message})`); return 1; }

  const shown = Object.fromEntries(model.chapters.flatMap(c => (c.items || []).map(i => [i.key, i.status])));
  for (const [k, s] of marks) if ((shown[k] || 'na') !== s) console.error(`note: ${k} stays ${shown[k] || 'hidden'}: the files answer it, and they win over a mark`);
  if (o.print) printText(model);
  const nx = model.next ? `${plain(EN.items[model.next.key])} [${model.next.key}, ${EN.status[model.next.status]}]` : 'none';
  console.log(`setup page: ${model.done}/${model.tracked} done, next: ${nx} → dashboard/setup.html`);
  if (o.open) console.log(openPage(pageFile) ? `opened in the default browser: ${pageFile}` : `open this file in a browser: ${pageFile}`);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
