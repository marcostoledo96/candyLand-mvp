import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const receiptPath = new URL('../openspec/changes/2026-06-candyland-v2/runtime-admin-orders-receipt.json', import.meta.url);
const rule = 'sha256(utf8(JSON.stringify(recursive-key-sort(receipt-without-identitySha256))))';

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]));
  }
  return value;
}

const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
const payload = Object.fromEntries(Object.entries(receipt).filter(([key]) => key !== 'identitySha256'));
const canonical = JSON.stringify(sortKeys(payload));
const actual = createHash('sha256').update(canonical, 'utf8').digest('hex');

if (receipt.identityCanonicalization !== rule || receipt.identityCommand !== 'npm run assert:admin-runtime-receipt' || receipt.identitySha256 !== actual) {
  throw new Error(`runtime receipt identity mismatch: expected ${actual}, received ${receipt.identitySha256}`);
}

console.log(`assert:admin-runtime-receipt: PASS ${actual}`);
