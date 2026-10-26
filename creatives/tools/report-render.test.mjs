// creatives/tools/report-render.test.mjs: tests of report-render.mjs. No browser, no network: the HTML side only,
// in throwaway folders under the system temp folder. Run: node --test creatives/tools/report-render.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  buildHtml, findBrowser, langCode, readCompanyName, readReporting, renderMarkdown, stripFrontmatter,
} from './report-render.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'report-render.mjs');
const PLACEHOLDER = '{{' + 'COMPANY_NAME' + '}}';   // built, so the scrub gate's placeholder warning stays quiet

const REPORT = `---
type: report
created: 2026-11-02
updated: 2026-11-02
status: done
maintained_by: harness
categories: [reports, client]
summary: Client report, week of 2026-10-26.
as_of: 2026-11-02T09:30+00:00
source: ads_get_ad_entities
---

# Weekly report, 26 October – 1 November 2026

**The answer.** Trials rose; cost per trial fell; we keep the budget.

<!-- an internal note the client never sees -->

| Metric | This week | Previous week | Target |
|---|--:|--:|--:|
| Spend | £120.00 | £98.10 | |
| Results | 11 | 7 | |

- one
- two

> Short version for WhatsApp: hello.
`;

function withRoot(files, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'report-render-test-'));
  try {
    for (const [rel, text] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, rel)), { recursive: true });
      writeFileSync(join(dir, rel), text);
    }
    return fn(dir);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('frontmatter is stripped', () => {
  assert.ok(!stripFrontmatter(REPORT).includes('maintained_by'));
  const html = renderMarkdown(REPORT);
  assert.ok(!html.includes('maintained_by'));
  assert.ok(!html.includes('ads_get_ad_entities'));
  assert.match(html, /^<h1>Weekly report/);
});

test('HTML comments are dropped', () => {
  assert.ok(!renderMarkdown(REPORT).includes('internal note'));
});

test('a table renders to <table> with its alignment', () => {
  const html = renderMarkdown(REPORT);
  assert.match(html, /<table>\n<thead><tr><th>Metric<\/th><th class="al-end">This week<\/th>/);
  assert.match(html, /<td>Spend<\/td><td class="al-end">£120.00<\/td>/);
  assert.match(html, /<\/tbody>\n<\/table>/);
});

test('lists, blockquotes, bold and headings render', () => {
  const html = renderMarkdown(REPORT);
  assert.match(html, /<ul>\n<li>one<\/li>\n<li>two<\/li>\n<\/ul>/);
  assert.match(html, /<blockquote>\n<p>Short version for WhatsApp: hello.<\/p>\n<\/blockquote>/);
  assert.match(html, /<strong>The answer.<\/strong>/);
  assert.match(renderMarkdown('1. a\n2. b'), /<ol>\n<li>a<\/li>\n<li>b<\/li>\n<\/ol>/);
});

test('a <script> in the source is escaped, and unsafe links lose their href', () => {
  const src = 'Hello <script>alert(1)</script> and <img src=x onerror=alert(1)>\n\n[x](javascript:alert(1)) [y](https://example.com)';
  const html = buildHtml({ markdown: src, company: 'Example Co' });
  assert.ok(!/<script/i.test(html), 'no script element in the document');
  assert.ok(!/<img/i.test(html), 'no img element in the document');
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes('<a href="https://example.com">y</a>'));
});

test('rtl sets dir="rtl" on <html>; ltr is the default', () => {
  assert.match(buildHtml({ markdown: '# x', lang: 'he', dir: 'rtl' }), /<html lang="he" dir="rtl">/);
  assert.match(buildHtml({ markdown: '# x' }), /<html lang="en" dir="ltr">/);
});

test('the document is self-contained: embedded CSS, print rules, no external resource', () => {
  const html = buildHtml({ markdown: REPORT, company: 'Example Co' });
  assert.match(html, /<style>[\s\S]*@media print[\s\S]*<\/style>/);
  assert.match(html, /@page \{ size: A4;/);
  assert.match(html, /counter\(page\)/);
  assert.ok(!/<link\b/i.test(html) && !/\bsrc=/i.test(html) && !/@import/i.test(html));
  assert.match(html, /<div class="date">2026-11-02<\/div>/);
});

test('the company name is read from a temp config; a placeholder reads as empty', () => {
  withRoot({ 'config/company.md': '<!-- header -->\n# Company\n\n**Name:** Example Co Ltd\n<!-- setup: hint -->\n\n**Short name:** Example\n' }, dir => {
    assert.equal(readCompanyName(dir), 'Example Co Ltd');
  });
  withRoot({ 'config/company.md': `# Company\n\n**Name:** ${PLACEHOLDER}\n` }, dir => {
    assert.equal(readCompanyName(dir), '');
  });
});

test('config/reporting.md gives the language and the direction', () => {
  withRoot({ 'config/reporting.md': '**Report language:** Hebrew\n\n**Report direction:** rtl\n' }, dir => {
    assert.deepEqual(readReporting(dir), { lang: 'he', dir: 'rtl' });
  });
  assert.equal(langCode('French'), 'fr');
  assert.equal(langCode('pt-BR'), 'pt-br');
  assert.equal(langCode('Klingon'), null);
});

test('the command line writes <name>.html beside the report, with the config of the folder above it', () => {
  withRoot({
    'config/company.md': '**Name:** Example Co Ltd\n',
    'config/reporting.md': '**Report language:** Hebrew\n\n**Report direction:** rtl\n',
    'reports/2026-11-02-client-report.md': REPORT,
  }, dir => {
    const report = join(dir, 'reports', '2026-11-02-client-report.md');
    const r = spawnSync(process.execPath, [SCRIPT, report], { encoding: 'utf8', timeout: 30_000 });
    assert.equal(r.status, 0, r.stderr);
    const out = join(dir, 'reports', '2026-11-02-client-report.html');
    assert.ok(existsSync(out));
    const html = readFileSync(out, 'utf8');
    assert.match(html, /<html lang="he" dir="rtl">/);
    assert.match(html, /<div class="company">Example Co Ltd<\/div>/);
    assert.match(html, /<title>Example Co Ltd · Weekly report/);
  });
});

test('flags win over the config; --out sets the path; a missing report exits 2', () => {
  withRoot({
    'config/company.md': '**Name:** Example Co Ltd\n',
    'config/reporting.md': '**Report language:** Hebrew\n\n**Report direction:** rtl\n',
    'r.md': '# Hi\n',
  }, dir => {
    const out = join(dir, 'out', 'x.html');
    const r = spawnSync(process.execPath, [SCRIPT, join(dir, 'r.md'), '--lang', 'en', '--dir', 'ltr', '--out', out, '--root', dir], { encoding: 'utf8', timeout: 30_000 });
    assert.equal(r.status, 0, r.stderr);
    assert.match(readFileSync(out, 'utf8'), /<html lang="en" dir="ltr">/);
    const missing = spawnSync(process.execPath, [SCRIPT, join(dir, 'nope.md')], { encoding: 'utf8', timeout: 30_000 });
    assert.equal(missing.status, 2);
    const bad = spawnSync(process.execPath, [SCRIPT, join(dir, 'r.md'), '--dir', 'up'], { encoding: 'utf8', timeout: 30_000 });
    assert.equal(bad.status, 2);
  });
});

test('the browser lookup honours REPORT_RENDER_BROWSER (nothing is launched)', () => {
  assert.equal(findBrowser(undefined, { REPORT_RENDER_BROWSER: process.execPath, PATH: '' }), process.execPath);
  assert.equal(findBrowser(process.execPath, { PATH: '' }), process.execPath);
});
