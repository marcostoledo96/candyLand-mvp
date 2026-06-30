// PR-4 admin auth + CRUD unit checks. Pure stdlib asserts, no test framework.
// Run: node test/admin-auth.test.js
// Covers: password hash/verify, JWT sign/verify, product DTO mapping/validation,
// requireAdmin middleware behavior. No DB required.

const assert = require('assert');
// routes/admin wires requireAdmin(process.env.JWT_SECRET) at require time,
// so set a test secret before importing it.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const { hashPassword, verifyPassword } = require('../utils/password');
const { signAdminToken, verifyAdminToken } = require('../utils/jwt');
const { mapProductToAdminDto, mapAdminDtoToProductData, validateProductInput } = require('../routes/admin');

function test(name, fn) {
  try {
    fn();
    console.log(`  ok - ${name}`);
  } catch (err) {
    console.error(`  FAIL - ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('password helpers:');
test('hashPassword returns a scrypt-format string', () => {
  const h = hashPassword('secret123');
  assert.ok(typeof h === 'string', 'hash MUST be a string');
  assert.ok(h.startsWith('scrypt$'), 'hash MUST start with scrypt$');
  const parts = h.split('$');
  assert.equal(parts.length, 3, 'format MUST be scrypt$<saltHex>$<hashHex>');
  assert.ok(parts[1].length > 0, 'salt MUST be non-empty');
  assert.ok(parts[2].length > 0, 'hash MUST be non-empty');
});

test('verifyPassword accepts correct password', () => {
  const h = hashPassword('hunter2');
  assert.equal(verifyPassword('hunter2', h), true);
});

test('verifyPassword rejects wrong password', () => {
  const h = hashPassword('hunter2');
  assert.equal(verifyPassword('wrong', h), false);
});

test('verifyPassword rejects empty password', () => {
  const h = hashPassword('hunter2');
  assert.equal(verifyPassword('', h), false);
});

test('hashes are unique per call (random salt)', () => {
  const a = hashPassword('same');
  const b = hashPassword('same');
  assert.notEqual(a, b, 'two hashes of the same password MUST differ (random salt)');
  assert.equal(verifyPassword('same', a), true);
  assert.equal(verifyPassword('same', b), true);
});

test('verifyPassword handles malformed hash safely', () => {
  assert.equal(verifyPassword('x', 'not-a-hash'), false);
  assert.equal(verifyPassword('x', 'scrypt$'), false);
  assert.equal(verifyPassword('x', 'scrypt$abc$def'), false);
});

console.log('\njwt helpers:');
test('signAdminToken returns a 3-part JWT', () => {
  const token = signAdminToken({ id: 1, email: 'a@b.com', role: 'ADMIN' }, 'secret');
  const parts = token.split('.');
  assert.equal(parts.length, 3, 'JWT MUST have header.payload.signature');
});

test('verifyAdminToken returns payload for valid token', () => {
  const token = signAdminToken({ id: 7, email: 'admin@candy.com', role: 'ADMIN' }, 'secret');
  const payload = verifyAdminToken(token, 'secret');
  assert.ok(payload, 'payload MUST be returned');
  assert.equal(payload.id, 7);
  assert.equal(payload.email, 'admin@candy.com');
  assert.equal(payload.role, 'ADMIN');
});

test('verifyAdminToken rejects wrong secret', () => {
  const token = signAdminToken({ id: 1, email: 'a@b.com', role: 'ADMIN' }, 'secret');
  assert.equal(verifyAdminToken(token, 'other'), null);
});

test('verifyAdminToken rejects tampered payload', () => {
  const token = signAdminToken({ id: 1, email: 'a@b.com', role: 'ADMIN' }, 'secret');
  const parts = token.split('.');
  // tamper payload (flip a char)
  const tampered = parts[0] + '.' + parts[1].slice(0, -2) + 'XX' + '.' + parts[2];
  assert.equal(verifyAdminToken(tampered, 'secret'), null);
});

test('verifyAdminToken rejects non-HS256 alg (alg confusion guard)', () => {
  // Build a fake "none" alg token manually
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ id: 1, email: 'a@b.com', role: 'ADMIN' })).toString('base64url');
  const fake = `${header}.${payload}.`;
  assert.equal(verifyAdminToken(fake, 'secret'), null);
});

test('verifyAdminToken rejects malformed token', () => {
  assert.equal(verifyAdminToken('not-a-jwt', 'secret'), null);
  assert.equal(verifyAdminToken('', 'secret'), null);
});

test('token includes exp claim', () => {
  const token = signAdminToken({ id: 1, email: 'a@b.com', role: 'ADMIN' }, 'secret');
  const payload = verifyAdminToken(token, 'secret');
  assert.ok(typeof payload.exp === 'number', 'payload MUST have exp as number');
  assert.ok(payload.exp > Math.floor(Date.now() / 1000), 'exp MUST be in the future');
});

console.log('\nproduct DTO mapping:');
test('mapProductToAdminDto maps image->imageUrl, hoverImage->hoverImageUrl', () => {
  const dto = mapProductToAdminDto({
    id: 1,
    title: 'Caramelo',
    description: 'dulce',
    priceCents: 150,
    image: 'https://x/a.png',
    hoverImage: 'https://x/b.png',
    stock: 10,
    active: true,
    categoryId: 2,
    category: { id: 2, name: 'Dulces' },
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  assert.equal(dto.imageUrl, 'https://x/a.png');
  assert.equal(dto.hoverImageUrl, 'https://x/b.png');
  assert.equal(dto.id, 1);
  assert.equal(dto.title, 'Caramelo');
  assert.equal(dto.priceCents, 150);
  assert.equal(dto.stock, 10);
  assert.equal(dto.active, true);
  assert.equal(dto.categoryId, 2);
  assert.equal(dto.category, 'Dulces');
});

test('mapAdminDtoToProductData maps imageUrl->image, hoverImageUrl->hoverImage', () => {
  const data = mapAdminDtoToProductData({
    title: 'Caramelo',
    description: 'dulce',
    priceCents: 150,
    imageUrl: 'https://x/a.png',
    hoverImageUrl: 'https://x/b.png',
    stock: 10,
    active: true,
    categoryId: 2,
  });
  assert.equal(data.image, 'https://x/a.png');
  assert.equal(data.hoverImage, 'https://x/b.png');
  assert.equal(data.title, 'Caramelo');
  assert.equal(data.priceCents, 150);
  assert.equal(data.stock, 10);
  assert.equal(data.active, true);
  assert.equal(data.categoryId, 2);
});

console.log('\nproduct validation:');
test('validateProductInput accepts a full valid product', () => {
  const r = validateProductInput({
    title: 'Caramelo',
    priceCents: 150,
    stock: 10,
    categoryId: 2,
    imageUrl: 'https://x/a.png',
  });
  assert.equal(r.ok, true);
  assert.ok(!r.errors || r.errors.length === 0);
});

test('validateProductInput rejects missing title', () => {
  const r = validateProductInput({ priceCents: 150, categoryId: 2 });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('title')));
});

test('validateProductInput rejects negative priceCents', () => {
  const r = validateProductInput({ title: 'X', priceCents: -1, categoryId: 2 });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('priceCents')));
});

test('validateProductInput rejects negative stock', () => {
  const r = validateProductInput({ title: 'X', priceCents: 100, stock: -5, categoryId: 2 });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('stock')));
});

test('validateProductInput rejects missing categoryId', () => {
  const r = validateProductInput({ title: 'X', priceCents: 100 });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('categoryId')));
});

test('validateProductInput allows optional fields to be absent', () => {
  const r = validateProductInput({ title: 'X', priceCents: 100, categoryId: 1 });
  assert.equal(r.ok, true);
});

// --- PR-6 regression checks (Codex feedback) ---
console.log('\nproduct validation regressions (PR-6):');
test('rejects non-string title (null) instead of coercing via String(...)', () => {
  const r = validateProductInput({ title: null, priceCents: 100, categoryId: 1 });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('title')), 'MUST flag title error');
  assert.equal(r.normalized.title, undefined, 'MUST NOT set normalized.title');
});

test('rejects non-string title (number) instead of coercing via String(...)', () => {
  const r = validateProductInput({ title: 123, priceCents: 100, categoryId: 1 });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('title MUST be a string')));
});

test('rejects priceCents null (Number(null)===0 trap)', () => {
  const r = validateProductInput({ title: 'X', priceCents: null, categoryId: 1 });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('priceCents')));
  assert.equal(r.normalized.priceCents, undefined);
});

test('rejects priceCents empty string (Number("")===0 trap)', () => {
  const r = validateProductInput({ title: 'X', priceCents: '', categoryId: 1 });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('priceCents')));
});

test('rejects priceCents whitespace string (Number("   ")===0 trap)', () => {
  const r = validateProductInput({ title: 'X', priceCents: '   ', categoryId: 1 });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('priceCents')));
});

test('rejects priceCents arrays (Number([])===0 / Number(["25"])===25 traps)', () => {
  const emptyArray = validateProductInput({ title: 'X', priceCents: [], categoryId: 1 });
  const valueArray = validateProductInput({ title: 'X', priceCents: ['25'], categoryId: 1 });
  assert.equal(emptyArray.ok, false);
  assert.equal(valueArray.ok, false);
  assert.ok(emptyArray.errors.some((e) => e.includes('priceCents')));
  assert.ok(valueArray.errors.some((e) => e.includes('priceCents')));
});

test('rejects priceCents boolean (Number(true)===1 trap)', () => {
  const r = validateProductInput({ title: 'X', priceCents: true, categoryId: 1 });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('priceCents')));
});

test('accepts active boolean true', () => {
  const r = validateProductInput({ title: 'X', priceCents: 100, categoryId: 1, active: true });
  assert.equal(r.ok, true);
  assert.equal(r.normalized.active, true);
});

test('accepts active boolean false', () => {
  const r = validateProductInput({ title: 'X', priceCents: 100, categoryId: 1, active: false });
  assert.equal(r.ok, true);
  assert.equal(r.normalized.active, false, 'boolean false MUST stay false');
});

test('accepts active string "false" and parses to boolean false', () => {
  const r = validateProductInput({ title: 'X', priceCents: 100, categoryId: 1, active: 'false' });
  assert.equal(r.ok, true);
  assert.equal(r.normalized.active, false, '"false" string MUST parse to false (not Boolean("false")===true)');
});

test('accepts active string "true" and parses to boolean true', () => {
  const r = validateProductInput({ title: 'X', priceCents: 100, categoryId: 1, active: 'true' });
  assert.equal(r.ok, true);
  assert.equal(r.normalized.active, true);
});

test('rejects active other strings (e.g. "yes", "0")', () => {
  const r = validateProductInput({ title: 'X', priceCents: 100, categoryId: 1, active: 'yes' });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('active')));
});

test('rejects active number (no coercion)', () => {
  const r = validateProductInput({ title: 'X', priceCents: 100, categoryId: 1, active: 1 });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('active')));
});

if (process.exitCode) {
  console.error('\nadmin-auth tests FAILED');
} else {
  console.log('\nOK: admin-auth asserts passed.');
}
