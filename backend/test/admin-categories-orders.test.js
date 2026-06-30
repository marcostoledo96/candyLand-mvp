// Admin categories + orders CRUD — pure helper unit checks (RED-first TDD).
// Pure stdlib asserts, no test framework, no DB.
// Run: node test/admin-categories-orders.test.js
// Covers: slugify, category DTO mapping, category input validation,
// order status normalization/allowlist, order DTO mapping, order status input validation.

const assert = require('assert');
// routes/admin wires requireAdmin(process.env.JWT_SECRET) at require time,
// so set a test secret before importing it (matches admin-auth.test.js).
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const {
  slugify,
  mapCategoryToAdminDto,
  validateCategoryInput,
  ORDER_STATUSES,
  normalizeOrderStatus,
  isValidOrderStatus,
  mapOrderToAdminDto,
  validateOrderStatusInput,
} = require('../routes/admin');

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

console.log('slugify:');
test('slugify lowercases and hyphenates a simple name', () => {
  assert.equal(slugify('Gomitas'), 'gomitas');
});
test('slugify replaces spaces with hyphens', () => {
  assert.equal(slugify('Caramelos Duros'), 'caramelos-duros');
});
test('slugify collapses punctuation and accents (basic)', () => {
  assert.equal(slugify('Chupetines! Y Más'), 'chupetines-y-mas');
});
test('slugify trims surrounding whitespace', () => {
  assert.equal(slugify('  Bombones  '), 'bombones');
});
test('slugify returns empty string for non-string input', () => {
  assert.equal(slugify(null), '');
  assert.equal(slugify(undefined), '');
  assert.equal(slugify(123), '');
});

console.log('\ncategory DTO mapping:');
test('mapCategoryToAdminDto derives slug and active constant from a Prisma row', () => {
  const dto = mapCategoryToAdminDto({ id: 3, name: 'Gomitas', createdAt: new Date(), updatedAt: new Date() });
  assert.equal(dto.id, 3);
  assert.equal(dto.name, 'Gomitas');
  assert.equal(dto.slug, 'gomitas');
  // ponytail: schema has no Category.active; all categories considered active until column exists.
  assert.equal(dto.active, true);
});
test('mapCategoryToAdminDto handles missing createdAt/updatedAt gracefully', () => {
  const dto = mapCategoryToAdminDto({ id: 1, name: 'X' });
  assert.equal(dto.id, 1);
  assert.equal(dto.slug, 'x');
  assert.equal(dto.active, true);
});

console.log('\ncategory input validation:');
test('validateCategoryInput accepts a valid name', () => {
  const r = validateCategoryInput({ name: 'Gomitas' });
  assert.equal(r.ok, true);
  assert.equal(r.normalized.name, 'Gomitas');
});
test('validateCategoryInput rejects missing name (create)', () => {
  const r = validateCategoryInput({});
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('name')));
});
test('validateCategoryInput rejects empty name', () => {
  const r = validateCategoryInput({ name: '   ' });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('name')));
});
test('validateCategoryInput rejects non-string name (null)', () => {
  const r = validateCategoryInput({ name: null });
  assert.equal(r.ok, false);
  assert.equal(r.normalized.name, undefined);
});
test('validateCategoryInput rejects non-string name (number)', () => {
  const r = validateCategoryInput({ name: 42 });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('string')));
});
test('validateCategoryInput trims name before length check', () => {
  const r = validateCategoryInput({ name: '  Gomitas  ' });
  assert.equal(r.ok, true);
  assert.equal(r.normalized.name, 'Gomitas');
});
test('validateCategoryInput rejects names longer than 100 chars', () => {
  const r = validateCategoryInput({ name: 'x'.repeat(101) });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('100')));
});
test('validateCategoryInput partial mode allows missing name', () => {
  const r = validateCategoryInput({}, { partial: true });
  assert.equal(r.ok, true);
});
test('validateCategoryInput partial mode still validates present name', () => {
  const r = validateCategoryInput({ name: '' }, { partial: true });
  assert.equal(r.ok, false);
});

console.log('\norder status normalization:');
test('ORDER_STATUSES is a non-empty array of canonical uppercase statuses', () => {
  assert.ok(Array.isArray(ORDER_STATUSES) && ORDER_STATUSES.length > 0);
  ORDER_STATUSES.forEach((s) => assert.equal(s, s.toUpperCase()));
  assert.ok(ORDER_STATUSES.includes('PENDING'));
});
test('normalizeOrderStatus maps Spanish aliases to canonical uppercase', () => {
  assert.equal(normalizeOrderStatus('pendiente'), 'PENDING');
  assert.equal(normalizeOrderStatus('enviado'), 'SHIPPED');
  assert.equal(normalizeOrderStatus('entregado'), 'DELIVERED');
  assert.equal(normalizeOrderStatus('cancelado'), 'CANCELLED');
});
test('normalizeOrderStatus accepts canonical English case-insensitively', () => {
  assert.equal(normalizeOrderStatus('pending'), 'PENDING');
  assert.equal(normalizeOrderStatus('PENDING'), 'PENDING');
  assert.equal(normalizeOrderStatus('shipped'), 'SHIPPED');
});
test('normalizeOrderStatus returns null for unknown status', () => {
  assert.equal(normalizeOrderStatus('desconocido'), null);
  assert.equal(normalizeOrderStatus(''), null);
});
test('normalizeOrderStatus returns null for non-string input', () => {
  assert.equal(normalizeOrderStatus(null), null);
  assert.equal(normalizeOrderStatus(undefined), null);
  assert.equal(normalizeOrderStatus(123), null);
});
test('isValidOrderStatus returns true for canonical and aliases, false otherwise', () => {
  assert.equal(isValidOrderStatus('pendiente'), true);
  assert.equal(isValidOrderStatus('PENDING'), true);
  assert.equal(isValidOrderStatus('desconocido'), false);
});

console.log('\norder DTO mapping:');
test('mapOrderToAdminDto exposes id/status/total/payment/contact/items with subtotals', () => {
  const order = {
    id: 7,
    orderNumber: 'CL-123',
    status: 'PENDING',
    totalCents: 250,
    createdAt: new Date(),
    updatedAt: new Date(),
    payment: { method: 'CASH', status: 'PENDING', reference: null },
    customer: { id: 42, name: 'Ana', phone: '1', address: 'a', city: 'c', province: 'p', postalCode: '1' },
    items: [
      { productId: 10, quantity: 2, priceCents: 50, product: { id: 10, title: 'Caramelo' } },
      { productId: 11, quantity: 3, priceCents: 50, product: { id: 11, title: 'Chicle' } },
    ],
  };
  const dto = mapOrderToAdminDto(order);
  assert.equal(dto.id, 7);
  assert.equal(dto.orderNumber, 'CL-123');
  assert.equal(dto.status, 'PENDING');
  assert.equal(dto.totalCents, 250);
  assert.equal(dto.paymentMethod, 'CASH');
  assert.equal(dto.paymentStatus, 'PENDING');
  assert.deepEqual(dto.contact, { id: 42, name: 'Ana', phone: '1', address: 'a', city: 'c', province: 'p', postalCode: '1' });
  assert.equal(dto.items.length, 2);
  assert.equal(dto.items[0].productId, 10);
  assert.equal(dto.items[0].productTitle, 'Caramelo');
  assert.equal(dto.items[0].quantity, 2);
  assert.equal(dto.items[0].priceCents, 50);
  assert.equal(dto.items[0].subtotalCents, 100);
  assert.equal(dto.items[1].subtotalCents, 150);
});
test('mapOrderToAdminDto tolerates missing payment/customer/items', () => {
  const dto = mapOrderToAdminDto({ id: 1, orderNumber: 'CL-1', status: 'PENDING', totalCents: 0 });
  assert.equal(dto.paymentMethod, null);
  assert.equal(dto.paymentStatus, null);
  assert.equal(dto.contact, null);
  assert.deepEqual(dto.items, []);
});

console.log('\norder status input validation:');
test('validateOrderStatusInput accepts a valid alias and normalizes it', () => {
  const r = validateOrderStatusInput({ status: 'enviado' });
  assert.equal(r.ok, true);
  assert.equal(r.normalized.status, 'SHIPPED');
});
test('validateOrderStatusInput rejects missing status', () => {
  const r = validateOrderStatusInput({});
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('status')));
});
test('validateOrderStatusInput rejects unknown status', () => {
  const r = validateOrderStatusInput({ status: 'desconocido' });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('status')));
});
test('validateOrderStatusInput rejects non-string status', () => {
  const r = validateOrderStatusInput({ status: 5 });
  assert.equal(r.ok, false);
});

if (process.exitCode) {
  console.error('\nadmin-categories-orders tests FAILED');
} else {
  console.log('\nOK: admin-categories-orders asserts passed.');
}