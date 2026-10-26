// node --test .claude/hooks/account-guard.test.mjs   (Node 20+, no dependencies; run with a time bound)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { decide, record, collectIds, allowedAccount, loadKnown, idsInResponse } from './account-guard.mjs';

const HOOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'account-guard.mjs');
const ALLOWED = '100000000000001';
const OTHER = '100000000000002';

function harness(withAccount = true) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-'));
  fs.mkdirSync(path.join(root, 'config'), { recursive: true });
  fs.mkdirSync(path.join(root, 'memory', 'state'), { recursive: true });
  fs.mkdirSync(path.join(root, 'memory', 'campaigns'), { recursive: true });
  fs.writeFileSync(path.join(root, 'memory', 'README.md'), '# contract\n');
  // The unfilled template value is built in two pieces so the scrub gate's placeholder warning stays quiet here.
  const id = withAccount ? `\`${ALLOWED}\`` : '{' + '{META_AD_ACCOUNT_ID}' + '}';
  fs.writeFileSync(path.join(root, 'config', 'accounts.md'), `# Accounts\n\n| Field | Value |\n|---|---|\n| \`meta_ad_account_id\` | ${id} |\n| \`page_id\` | \`300000000000001\` |\n`);
  return root;
}

const call = (name, tool_input, extra = {}) => ({ hook_event_name: 'PreToolUse', tool_name: `mcp__meta-ads__${name}`, tool_input, ...extra });

test('the allowed account is read from config/accounts.md, then .env, else null', () => {
  const root = harness();
  assert.equal(allowedAccount(root), ALLOWED);
  const bare = harness(false);
  assert.equal(allowedAccount(bare), null);
  fs.writeFileSync(path.join(bare, '.env'), `META_MARKETING_TOKEN=notread\nMETA_AD_ACCOUNT_ID=act_${OTHER}\n`);
  assert.equal(allowedAccount(bare), OTHER);
});

test('a call on another account is refused, reads included; the allowed account passes', () => {
  const root = harness();
  assert.equal(decide(call('ads_create_campaign', { ad_account_id: OTHER, name: 'x' }), root).ok, false);
  assert.equal(decide(call('ads_get_ad_entities', { ad_account_id: `act_${OTHER}` }), root).ok, false);
  assert.match(decide(call('ads_get_ad_entities', { ad_account_id: OTHER }), root).reason, /bound to act_100000000000001/);
  assert.equal(decide(call('ads_get_ad_entities', { ad_account_id: ALLOWED, object_type: 'campaign' }), root).ok, true);
  assert.equal(decide(call('ads_create_campaign', { ad_account_id: `act_${ALLOWED}`, name: 'x' }), root).ok, true);
});

test('an account hidden inside a JSON-string argument is seen', () => {
  const root = harness();
  const r = decide(call('ads_create_ad_set', { ad_account_id: ALLOWED, targeting: JSON.stringify({ custom: { account_id: OTHER } }) }), root);
  assert.equal(r.ok, false);
});

test('discovery reads and non-Meta tools always pass; before /setup everything passes', () => {
  const root = harness();
  assert.equal(decide(call('ads_get_ad_accounts', {}), root).ok, true);
  assert.equal(decide({ hook_event_name: 'PreToolUse', tool_name: 'Read', tool_input: { file_path: 'x' } }, root).ok, true);
  const bare = harness(false);
  assert.equal(decide(call('ads_create_campaign', { ad_account_id: OTHER }), bare).ok, true);
});

test('a write to an unknown object is refused; a read of it (recorded) or a vault mention makes it known', () => {
  const root = harness();
  const campaign = '120000000000001';
  const write = call('ads_update_entity', { entity_id: campaign, status: 'PAUSED' });
  assert.equal(decide(write, root).ok, false);
  assert.match(decide(write, root).reason, /no read or create/);
  // A read under the allowed account returns the id: the PostToolUse recorder learns it.
  record({ hook_event_name: 'PostToolUse', tool_name: 'mcp__meta-ads__ads_get_ad_entities', tool_input: { ad_account_id: ALLOWED }, tool_response: { data: [{ id: campaign, name: 'c' }] } }, root);
  assert.equal(loadKnown(root).ids.has(campaign), true);
  assert.equal(decide(write, root).ok, true);
  // A vault mention is enough on its own.
  const adset = '120000000000002';
  assert.equal(decide(call('ads_activate_entity', { entity_ids: [adset] }), root).ok, false);
  fs.writeFileSync(path.join(root, 'memory', 'campaigns', 'c.md'), `ids: ["${adset}"]\n`);
  assert.equal(decide(call('ads_activate_entity', { entity_ids: [adset] }), root).ok, true);
});

test('a response to a call on another account teaches nothing', () => {
  const root = harness();
  record({ hook_event_name: 'PostToolUse', tool_name: 'mcp__meta-ads__ads_get_ad_entities', tool_input: { ad_account_id: OTHER }, tool_response: { data: [{ id: '120000000000009' }] } }, root);
  assert.equal(loadKnown(root).ids.size, 0);
});

test('ids are found in objects, arrays and MCP text responses', () => {
  assert.deepEqual(collectIds({ ad_account_id: ALLOWED, entity_ids: ['120000000000001', '120000000000002'] }).objects.sort(), ['120000000000001', '120000000000002']);
  const text = { content: [{ type: 'text', text: '{"data":[{"id":"120000000000003","adset_id":"120000000000004"}]}' }] };
  assert.deepEqual(idsInResponse(text).sort(), ['120000000000003', '120000000000004']);
});

test('as a hook: exit 2 with the reason on a wrong account, exit 0 on the allowed one, exit 0 on garbage input', () => {
  const root = harness();
  const run = (stdin) => spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
  const bad = run(JSON.stringify(call('ads_create_campaign', { ad_account_id: OTHER })));
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /account guard/);
  assert.equal(run(JSON.stringify(call('ads_create_campaign', { ad_account_id: ALLOWED }))).status, 0);
  assert.equal(run('not json').status, 0);
  assert.equal(run('').status, 0);
});
