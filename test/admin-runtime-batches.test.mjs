import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const runnerPath = new URL('./admin-auth-products.playwright.mjs', import.meta.url);
const packagePath = new URL('../package.json', import.meta.url);
const receiptPath = new URL('../openspec/changes/2026-06-candyland-v2/runtime-admin-orders-receipt.json', import.meta.url);

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]));
  }
  return value;
}

test('runtime batch manifest is deterministic, covers 65 scenarios exactly once, and guards every batch', async () => {
  const source = await readFile(runnerPath, 'utf8');
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
  const match = source.match(/const RUNTIME_BATCHES = Object\.freeze\((\{[\s\S]*?\})\);/);
  assert.ok(match, 'runtime runner must define RUNTIME_BATCHES');

  const batches = Function(`return (${match[1]});`)();
  const scenarioIds = Object.values(batches).flat();

  assert.deepEqual(Object.keys(batches), ['auth-products', 'categories', 'product-form', 'orders-foundation', 'orders-races-failures']);
  assert.equal(scenarioIds.length, 65);
  assert.equal(new Set(scenarioIds).size, 65);
  assert.deepEqual([...scenarioIds].sort((a, b) => a - b), Array.from({ length: 65 }, (_, index) => index + 1));

  for (const batch of Object.keys(batches)) {
    assert.ok(source.includes(`shouldRun('${batch}')`), `runtime runner must guard ${batch}`);
  }
  assert.match(source, /page\.url\(\)\.match/, 'runtime runner must accept a deterministic URL batch filter without relying on unavailable URL globals');
  assert.ok(source.includes('detail.open = true'), 'standalone order batch must establish its native details precondition');
  assert.equal((source.match(/await orderSelect\.waitFor\(\{ state: 'attached' \}\)/g) ?? []).length, 3, 'order race batch must wait for attached controls after each details setup');
  assert.match(packageJson.scripts.test, /admin-runtime-batches\.test\.mjs/, 'root Node suite must include the batch-manifest guard');
});

test('runtime receipt identity hashes documented canonical bytes independently', async () => {
  const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
  const payload = Object.fromEntries(Object.entries(receipt).filter(([key]) => key !== 'identitySha256'));
  const canonical = JSON.stringify(sortKeys(payload));

  assert.equal(receipt.identityCanonicalization, 'sha256(utf8(JSON.stringify(recursive-key-sort(receipt-without-identitySha256))))');
  assert.equal(receipt.identityCommand, 'npm run assert:admin-runtime-receipt');
  assert.equal(createHash('sha256').update(canonical, 'utf8').digest('hex'), receipt.identitySha256);
  assert.match(packageJson.scripts['assert:admin-runtime-receipt'] ?? '', /assert-runtime-admin-orders-receipt\.mjs/);
});
