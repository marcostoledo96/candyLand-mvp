// Public endpoints (categories + forms) — pure helper unit checks (RED-first TDD).
// Pure stdlib asserts, no test framework, no DB, no HTTP.
// Run: node test/public-endpoints.test.js
// Covers: shared slugify util, public category DTO mapping, contact/job/franchise
// input validators, email check, persistence-data normalization.

const assert = require('assert');
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const {
  slugify,
} = require('../utils/slug');
const {
  mapCategoryToPublicDto,
  validateContactInput,
  validateJobApplicationInput,
  validateFranchiseLeadInput,
  isValidEmail,
  PUBLIC_FIELD_LIMITS,
} = require('../routes/public');

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

console.log('shared slugify (utils/slug):');
test('slugify lowercases and hyphenates a simple name', () => {
  assert.equal(slugify('Gomitas'), 'gomitas');
});
test('slugify replaces spaces with hyphens', () => {
  assert.equal(slugify('Caramelos Duros'), 'caramelos-duros');
});
test('slugify strips accents and punctuation', () => {
  assert.equal(slugify('Chupetines! Y Más'), 'chupetines-y-mas');
});
test('slugify returns empty string for non-string input', () => {
  assert.equal(slugify(null), '');
  assert.equal(slugify(undefined), '');
  assert.equal(slugify(123), '');
});

console.log('\nemail check:');
test('isValidEmail accepts a normal email', () => {
  assert.equal(isValidEmail('a@b.com'), true);
});
test('isValidEmail rejects missing @', () => {
  assert.equal(isValidEmail('notanemail'), false);
});
test('isValidEmail rejects missing domain suffix', () => {
  assert.equal(isValidEmail('a@b'), false);
});
test('isValidEmail rejects empty and non-strings', () => {
  assert.equal(isValidEmail(''), false);
  assert.equal(isValidEmail(null), false);
  assert.equal(isValidEmail(undefined), false);
  assert.equal(isValidEmail(123), false);
});

console.log('\npublic category DTO mapping:');
test('mapCategoryToPublicDto exposes id, name, slug, activeProductCount', () => {
  const dto = mapCategoryToPublicDto({ id: 3, name: 'Gomitas', _count: { products: 5 } }, 3);
  assert.equal(dto.id, 3);
  assert.equal(dto.name, 'Gomitas');
  assert.equal(dto.slug, 'gomitas');
  assert.equal(dto.activeProductCount, 3);
});
test('mapCategoryToPublicDto uses explicit count when _count missing', () => {
  const dto = mapCategoryToPublicDto({ id: 1, name: 'X' }, 7);
  assert.equal(dto.activeProductCount, 7);
});
test('mapCategoryToPublicDto defaults activeProductCount to 0 when no count given', () => {
  const dto = mapCategoryToPublicDto({ id: 1, name: 'X' });
  assert.equal(dto.activeProductCount, 0);
});
test('mapCategoryToPublicDto MUST NOT expose products payload', () => {
  const dto = mapCategoryToPublicDto({ id: 1, name: 'X', products: [{ id: 99 }] }, 0);
  assert.ok(!('products' in dto), 'products MUST NOT be in public DTO');
});

console.log('\ncontact input validation:');
test('valid contact payload passes', () => {
  const r = validateContactInput({ name: 'Ana', email: 'a@b.com', message: 'hola' });
  assert.equal(r.ok, true);
  assert.equal(r.normalized.name, 'Ana');
  assert.equal(r.normalized.email, 'a@b.com');
  assert.equal(r.normalized.message, 'hola');
  assert.equal(r.normalized.phone, undefined);
});
test('missing name fails with 400-shape errors', () => {
  const r = validateContactInput({ email: 'a@b.com', message: 'hola' });
  assert.equal(r.ok, false);
  assert.ok(r.errors.length > 0);
});
test('missing email fails', () => {
  const r = validateContactInput({ name: 'Ana', message: 'hola' });
  assert.equal(r.ok, false);
});
test('missing message fails', () => {
  const r = validateContactInput({ name: 'Ana', email: 'a@b.com' });
  assert.equal(r.ok, false);
});
test('optional phone accepted and trimmed', () => {
  const r = validateContactInput({ name: 'Ana', email: 'a@b.com', message: 'hola', phone: '  11 ' });
  assert.equal(r.ok, true);
  assert.equal(r.normalized.phone, '11');
});
test('invalid email rejected', () => {
  const r = validateContactInput({ name: 'Ana', email: 'nope', message: 'hola' });
  assert.equal(r.ok, false);
});
test('over-length message rejected', () => {
  const r = validateContactInput({ name: 'Ana', email: 'a@b.com', message: 'x'.repeat(PUBLIC_FIELD_LIMITS.message + 1) });
  assert.equal(r.ok, false);
});
test('non-string name rejected', () => {
  const r = validateContactInput({ name: 123, email: 'a@b.com', message: 'hola' });
  assert.equal(r.ok, false);
});

console.log('\njob application input validation:');
test('valid job application passes', () => {
  const r = validateJobApplicationInput({ fullName: 'Bo', email: 'b@c.com', position: 'Cajero' });
  assert.equal(r.ok, true);
  assert.equal(r.normalized.fullName, 'Bo');
  assert.equal(r.normalized.position, 'Cajero');
});
test('missing fullName fails', () => {
  const r = validateJobApplicationInput({ email: 'b@c.com', position: 'Cajero' });
  assert.equal(r.ok, false);
});
test('missing position fails', () => {
  const r = validateJobApplicationInput({ fullName: 'Bo', email: 'b@c.com' });
  assert.equal(r.ok, false);
});
test('optional phone/message/cvUrl accepted', () => {
  const r = validateJobApplicationInput({
    fullName: 'Bo', email: 'b@c.com', position: 'Cajero',
    phone: '11', message: 'msg', cvUrl: 'https://cv.example/x.pdf',
  });
  assert.equal(r.ok, true);
  assert.equal(r.normalized.phone, '11');
  assert.equal(r.normalized.message, 'msg');
  assert.equal(r.normalized.cvUrl, 'https://cv.example/x.pdf');
});
test('over-length cvUrl rejected', () => {
  const r = validateJobApplicationInput({
    fullName: 'Bo', email: 'b@c.com', position: 'Cajero',
    cvUrl: 'x'.repeat(PUBLIC_FIELD_LIMITS.cvUrl + 1),
  });
  assert.equal(r.ok, false);
});

console.log('\nfranchise lead input validation:');
test('valid franchise lead passes', () => {
  const r = validateFranchiseLeadInput({ fullName: 'Cy', email: 'c@d.com', city: 'Rosario' });
  assert.equal(r.ok, true);
  assert.equal(r.normalized.city, 'Rosario');
});
test('missing city fails', () => {
  const r = validateFranchiseLeadInput({ fullName: 'Cy', email: 'c@d.com' });
  assert.equal(r.ok, false);
});
test('missing fullName fails', () => {
  const r = validateFranchiseLeadInput({ email: 'c@d.com', city: 'Rosario' });
  assert.equal(r.ok, false);
});
test('optional phone/message accepted', () => {
  const r = validateFranchiseLeadInput({ fullName: 'Cy', email: 'c@d.com', city: 'Rosario', phone: '11', message: 'hi' });
  assert.equal(r.ok, true);
  assert.equal(r.normalized.phone, '11');
  assert.equal(r.normalized.message, 'hi');
});
test('invalid email rejected', () => {
  const r = validateFranchiseLeadInput({ fullName: 'Cy', email: 'nope', city: 'Rosario' });
  assert.equal(r.ok, false);
});

if (process.exitCode) {
  console.error('\npublic-endpoints tests FAILED');
} else {
  console.log('\nOK: public-endpoints asserts passed.');
}