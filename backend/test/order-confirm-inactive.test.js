// PR-6 regression check: POST /api/orders/confirm MUST reject carts that
// contain admin soft-deleted (active=false) products with a 400.
// Stubs the prisma client via the require cache and drives a real HTTP
// server (stdlib http only, no supertest) so no real DB is needed.
// Run: node test/order-confirm-inactive.test.js

const assert = require('assert');
const http = require('http');
const Module = require('module');
const path = require('path');

// --- Stub prismaClient BEFORE app.js is required (it captures it at import) ---
const carts = new Map();

const fakePrisma = {
  cart: { findUnique: async ({ where: { id } }) => carts.get(id) || null },
  cartItem: { deleteMany: async () => ({ count: 0 }) },
  order: {
    create: async () => ({
      id: 99, orderNumber: 'CL-123456', totalCents: 50,
      items: [{ productId: 11, quantity: 1, priceCents: 50 }],
      payment: { method: 'CASH', status: 'PENDING' },
      customer: { id: 42, name: 'Test', phone: '1', address: 'a', city: 'c', province: 'p', postalCode: '1' },
    }),
  },
  product: {},
};

const origResolve = Module._resolveFilename;
const prismaClientPath = path.resolve(__dirname, '../prismaClient.js');
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === '../prismaClient' || request === './prismaClient' || request === prismaClientPath) {
    return '__stub_prismaClient__';
  }
  return origResolve.call(this, request, parent, ...rest);
};
require.cache['__stub_prismaClient__'] = {
  id: '__stub_prismaClient__', filename: '__stub_prismaClient__', loaded: true, exports: fakePrisma,
};

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const app = require('../app');

function test(name, fn) {
  return Promise.resolve(fn()).then(
    () => console.log(`  ok - ${name}`),
    (err) => { console.error(`  FAIL - ${name}`); console.error(err); process.exitCode = 1; }
  );
}

function postJson(cartId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({});
    const req = http.request(
      { method: 'POST', host: '127.0.0.1', port: server.address().port, path: `/api/orders/confirm?cartId=${encodeURIComponent(cartId)}`, headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } },
      (res) => {
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => {
          let parsed = body;
          try { parsed = JSON.parse(body); } catch { /* keep raw */ }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const server = http.createServer(app);

async function run() {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));

  // Case 1: cart with one inactive product -> 400 with inactiveProducts info.
  carts.set('cart-inactive', {
    id: 'cart-inactive',
    customerId: 42,
    customer: { id: 42, name: 'Test', phone: '1', address: 'a', city: 'c', province: 'p', postalCode: '1' },
    paymentMethod: 'CASH',
    items: [{ productId: 10, quantity: 2, product: { id: 10, title: 'Caramelo', priceCents: 100, active: false } }],
  });
  await test('rejects confirm when a cart product is inactive (active=false)', async () => {
    const r = await postJson('cart-inactive');
    assert.equal(r.status, 400, `expected 400 got ${r.status}`);
    assert.ok(r.body && r.body.inactiveProducts, 'MUST include inactiveProducts');
    assert.equal(r.body.inactiveProducts[0].productId, 10);
    assert.equal(r.body.inactiveProducts[0].title, 'Caramelo');
  });

  // Case 2: all active -> proceeds (order.create stub returns full order).
  carts.set('cart-active', {
    id: 'cart-active',
    customerId: 42,
    customer: { id: 42, name: 'Test', phone: '1', address: 'a', city: 'c', province: 'p', postalCode: '1' },
    paymentMethod: 'CASH',
    items: [{ productId: 11, quantity: 1, product: { id: 11, title: 'Activo', priceCents: 50, active: true } }],
  });
  await test('allows confirm when all cart products are active', async () => {
    const r = await postJson('cart-active');
    assert.equal(r.status, 200, `expected 200 got ${r.status} body=${JSON.stringify(r.body)}`);
    assert.equal(r.body.orderNumber, 'CL-123456');
  });

  server.close();

  if (process.exitCode) {
    console.error('\norder-confirm-inactive tests FAILED');
  } else {
    console.log('\nOK: order-confirm-inactive asserts passed.');
  }
}

run();