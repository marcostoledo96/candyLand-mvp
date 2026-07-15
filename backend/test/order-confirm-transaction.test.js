// RED-first transaction contract tests for POST /api/orders/confirm.
// No .env reads; only a dummy DATABASE_URL is needed for `prisma generate`.
// Stdlib only: assert + http + stubbed Prisma via require cache.
// Covers: success decrement + order/payment/items/cart cleanup, insufficient
// stock rollback, concurrent race, inactive product, invalid payment method,
// non-positive quantity, email provider throw (non-blocking), no email on
// failed confirmation, noop provider, Resend provider, deterministic
// productId ordering of updateMany calls.
// Run: node test/order-confirm-transaction.test.js

const assert = require('assert');
const http = require('http');
const Module = require('module');
const path = require('path');
const { makeTxStub } = require('./_record');

// Require the REAL email service BEFORE installing the stub, so 2.9/2.10 can
// test its provider selection directly with a fetch mock.
const realEmailService = require(path.resolve(__dirname, '../services/email.js'));

// --- Stub wiring: replace prismaClient with a recording tx stub ---
const carts = new Map();
const products = new Map();
let orderFactory = null;
const { prisma: fakePrisma, calls } = makeTxStub({ products, carts, get orderFactory() { return orderFactory; } });
// Re-bind orderFactory so the stub reads the latest value per test.
Object.defineProperty(fakePrisma, '__orderFactory', { get: () => orderFactory, configurable: true });
// Patch the stub's order.create to consult the live orderFactory.
fakePrisma.__tx.order.create = async (args) => {
  calls.orderCreate.push(args);
  const items = (args.data.items && args.data.items.create) || [];
  const base = {
    id: 1,
    orderNumber: args.data.orderNumber || 'CL-000001',
    totalCents: args.data.totalCents,
    items: items.map((i, idx) => ({ id: idx + 1, ...i })),
    payment: { method: args.data.payment.create.method, status: 'PENDING' },
    customer: { id: args.data.customerId, name: 'Test', phone: '1', address: 'a', city: 'c', province: 'p', postalCode: '1' },
  };
  return orderFactory ? orderFactory(args, base) : base;
};

// --- Stub email service BEFORE app.js is required ---
let emailCalls = { sendOrderConfirmationEmail: 0, lastOrder: null };
let emailImpl = null; // (order) => Promise<{status}>
const emailServiceStub = {
  sendOrderConfirmationEmail: async (order) => {
    emailCalls.sendOrderConfirmationEmail += 1;
    emailCalls.lastOrder = order;
    if (emailImpl) return emailImpl(order);
    return { status: 'disabled' };
  },
};

// Capture fetch calls (Resend provider test). Default: unset so noop path is used.
let fetchCalls = [];
let fetchImpl = null;
if (!globalThis.fetch) globalThis.fetch = () => { throw new Error('fetch not configured'); };
const origFetch = globalThis.fetch;
globalThis.fetch = async (...args) => {
  fetchCalls.push(args);
  if (fetchImpl) return fetchImpl(...args);
  return { ok: true, status: 200, json: async () => ({ id: 'rs_1' }) };
};

const origResolve = Module._resolveFilename;
const prismaClientPath = path.resolve(__dirname, '../prismaClient.js');
const emailPath = path.resolve(__dirname, '../services/email.js');
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === '../prismaClient' || request === './prismaClient' || request === prismaClientPath) {
    return '__stub_prismaClient__';
  }
  if (request === '../services/email' || request === './services/email' || request === emailPath) {
    return '__stub_email__';
  }
  return origResolve.call(this, request, parent, ...rest);
};
require.cache['__stub_prismaClient__'] = {
  id: '__stub_prismaClient__', filename: '__stub_prismaClient__', loaded: true, exports: fakePrisma,
};
require.cache['__stub_email__'] = {
  id: '__stub_email__', filename: '__stub_email__', loaded: true, exports: emailServiceStub,
};

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'noop';
const savedBankEnv = Object.fromEntries(['BANK_ALIAS', 'BANK_CBU', 'BANK_TITULAR'].map((key) => [key, process.env[key]]));
Object.assign(process.env, { BANK_ALIAS: 'test.alias', BANK_CBU: '1234567890123456789012', BANK_TITULAR: 'Test Holder' });
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
      { method: 'POST', host: '127.0.0.1', port: server.address().port, path: `/api/orders/confirm?cartId=${encodeURIComponent(cartId)}`, headers: { 'Idempotency-Key': idempotencyKey(cartId), 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } },
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

function idempotencyKey(cartId) {
  return `4e2e0f2e-8e28-4e42-bf42-${Buffer.from(cartId).toString('hex').slice(0, 12).padEnd(12, '0')}`;
}

function postJsonDeferred(cartId) {
  let done = false;
  const response = postJson(cartId).then((result) => {
    done = true;
    return result;
  });
  return { response, isDone: () => done };
}

function nextImmediate() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function waitImmediateUntil(check, maxTurns = 50) {
  for (let i = 0; i < maxTurns; i += 1) {
    if (check()) return true;
    await nextImmediate();
  }
  return check();
}

function reset() {
  carts.clear();
  products.clear();
  calls.updateMany.length = 0;
  calls.orderCreate.length = 0;
  calls.cartItemDeleteMany.length = 0;
  calls.productFindUnique.length = 0;
  emailCalls = { sendOrderConfirmationEmail: 0, lastOrder: null };
  emailImpl = null;
  fetchCalls.length = 0;
  fetchImpl = null;
}

function seedActiveCart(id, items, paymentMethod = 'CASH') {
  carts.set(id, {
    id,
    customerId: 42,
    customer: { id: 42, name: 'Test', phone: '1', address: 'a', city: 'c', province: 'p', postalCode: '1' },
    paymentMethod,
    items: items.map((it) => ({ productId: it.id, quantity: it.qty, product: { id: it.id, title: it.title, priceCents: it.price, active: true, stock: it.stock } })),
  });
  items.forEach((it) => products.set(it.id, { id: it.id, title: it.title, priceCents: it.price, active: true, stock: it.stock }));
}

const server = http.createServer(app);

async function run() {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));

  // 2.1 Success path: updateMany shape + order/payment/items/cartItem.deleteMany + 200
  reset();
  seedActiveCart('ok', [{ id: 1, title: 'A', price: 100, qty: 2, stock: 5 }]);
  await test('2.1 success: updateMany has { id, active:true, stock.gte:qty } + decrement; order/payment/items/cartItem.deleteMany invoked; 200', async () => {
    const r = await postJson('ok');
    assert.equal(r.status, 200, `expected 200 got ${r.status} body=${JSON.stringify(r.body)}`);
    assert.equal(calls.updateMany.length, 1);
    const u = calls.updateMany[0];
    assert.equal(u.where.id, 1);
    assert.equal(u.where.active, true);
    assert.ok(u.where.stock && u.where.stock.gte === 2, 'stock.gte === qty');
    assert.equal(u.data.stock.decrement, 2);
    assert.equal(calls.orderCreate.length, 1);
    assert.equal(calls.cartItemDeleteMany.length, 1);
    assert.equal(emailCalls.sendOrderConfirmationEmail, 1);
  });

  // 2.2 Insufficient stock: updateMany count 0 -> 400 Stock insuficiente; no order/payment/cartItem writes
  reset();
  seedActiveCart('low', [{ id: 2, title: 'B', price: 100, qty: 10, stock: 3 }]);
  await test('2.2 insufficient stock: 400 with insufficientStock; no order/payment/cartItem writes', async () => {
    const r = await postJson('low');
    assert.equal(r.status, 400);
    assert.equal(r.body.error, 'Stock insuficiente');
    assert.ok(Array.isArray(r.body.insufficientStock));
    assert.equal(r.body.insufficientStock[0].productId, 2);
    assert.equal(r.body.insufficientStock[0].requested, 10);
    assert.equal(r.body.insufficientStock[0].available, 3);
    assert.equal(calls.orderCreate.length, 0);
    assert.equal(calls.cartItemDeleteMany.length, 0);
    assert.equal(emailCalls.sendOrderConfirmationEmail, 0);
  });

  // 2.2b Mixed cart rollback: first item decrements, second fails; transaction must roll back first decrement.
  reset();
  seedActiveCart('mixed-low', [
    { id: 12, title: 'First', price: 100, qty: 2, stock: 5 },
    { id: 13, title: 'Second', price: 100, qty: 5, stock: 1 },
  ]);
  await test('2.2b mixed cart: later insufficient stock rolls back earlier decrement; no order/no cleanup/no email', async () => {
    const r = await postJson('mixed-low');
    assert.equal(r.status, 400);
    assert.equal(r.body.error, 'Stock insuficiente');
    assert.equal(products.get(12).stock, 5, 'first product stock restored by transaction rollback');
    assert.equal(products.get(13).stock, 1, 'failed product stock unchanged');
    assert.equal(calls.orderCreate.length, 0);
    assert.equal(calls.cartItemDeleteMany.length, 0);
    assert.equal(emailCalls.sendOrderConfirmationEmail, 0);
  });

  // 2.3 Concurrent race: first 200, second 400; loser never calls order.create
  reset();
  seedActiveCart('race-a', [{ id: 3, title: 'C', price: 100, qty: 5, stock: 5 }]);
  seedActiveCart('race-b', [{ id: 3, title: 'C', price: 100, qty: 5, stock: 5 }]); // same product, stock shared
  // Both carts reference product 3 via the shared products map.
  // Simulate concurrency: run sequentially — the first decrements stock to 0,
  // the second sees stock 0 < qty 5 and gets count 0.
  await test('2.3 concurrent race: first 200, second 400; loser never calls order.create', async () => {
    const r1 = await postJson('race-a');
    assert.equal(r1.status, 200, `first expected 200 got ${r1.status}`);
    const r2 = await postJson('race-b');
    assert.equal(r2.status, 400, `second expected 400 got ${r2.status}`);
    assert.equal(r2.body.error, 'Stock insuficiente');
    // product stock must not be negative
    assert.ok(products.get(3).stock >= 0, 'stock never negative');
    // Only one order.create (the winner's). Loser never reached order.create.
    // Note: winner increments orderCreate to 1; loser must not add another.
    // We reset calls before this test via reset(), so count reflects this test only.
    assert.equal(calls.orderCreate.length, 1);
  });

  // 2.4 Inactive product: 400 with inactiveProducts[]; no updateMany call
  reset();
  carts.set('inact', {
    id: 'inact',
    customerId: 42,
    customer: { id: 42, name: 'Test', phone: '1', address: 'a', city: 'c', province: 'p', postalCode: '1' },
    paymentMethod: 'CASH',
    items: [{ productId: 4, quantity: 1, product: { id: 4, title: 'Inact', priceCents: 100, active: false, stock: 5 } }],
  });
  products.set(4, { id: 4, title: 'Inact', priceCents: 100, active: false, stock: 5 });
  await test('2.4 inactive product: 400 with inactiveProducts[]; no updateMany call', async () => {
    const r = await postJson('inact');
    assert.equal(r.status, 400);
    assert.equal(r.body.error, 'El carrito contiene productos no disponibles');
    assert.ok(Array.isArray(r.body.inactiveProducts));
    assert.equal(r.body.inactiveProducts[0].productId, 4);
    assert.equal(calls.updateMany.length, 0);
    assert.equal(calls.orderCreate.length, 0);
    assert.equal(emailCalls.sendOrderConfirmationEmail, 0);
  });

  // 2.5 Invalid payment method (MERCADOPAGO, CARD): 400; no writes
  reset();
  carts.set('badpay', {
    id: 'badpay',
    customerId: 42,
    customer: { id: 42, name: 'Test', phone: '1', address: 'a', city: 'c', province: 'p', postalCode: '1' },
    paymentMethod: 'MERCADOPAGO',
    items: [{ productId: 5, quantity: 1, product: { id: 5, title: 'X', priceCents: 100, active: true, stock: 5 } }],
  });
  products.set(5, { id: 5, title: 'X', priceCents: 100, active: true, stock: 5 });
  await test('2.5 invalid payment method: 400; no order/payment/items/cartItem writes', async () => {
    const r = await postJson('badpay');
    assert.equal(r.status, 400);
    assert.equal(r.body.error, 'Método de pago inválido');
    assert.equal(calls.updateMany.length, 0);
    assert.equal(calls.orderCreate.length, 0);
    assert.equal(calls.cartItemDeleteMany.length, 0);
    assert.equal(emailCalls.sendOrderConfirmationEmail, 0);
  });

  // 2.5b CARD also rejected
  reset();
  carts.set('cardpay', {
    id: 'cardpay',
    customerId: 42,
    customer: { id: 42, name: 'Test', phone: '1', address: 'a', city: 'c', province: 'p', postalCode: '1' },
    paymentMethod: 'CARD',
    items: [{ productId: 5, quantity: 1, product: { id: 5, title: 'X', priceCents: 100, active: true, stock: 5 } }],
  });
  products.set(5, { id: 5, title: 'X', priceCents: 100, active: true, stock: 5 });
  await test('2.5b CARD payment rejected: 400; no writes', async () => {
    const r = await postJson('cardpay');
    assert.equal(r.status, 400);
    assert.equal(r.body.error, 'Método de pago inválido');
    assert.equal(calls.orderCreate.length, 0);
    assert.equal(emailCalls.sendOrderConfirmationEmail, 0);
  });

  // 2.5c Allowlist accepts CASH, TRANSFER, efectivo, transferencia (pre-normalization aliases)
  reset();
  seedActiveCart('alias-efectivo', [{ id: 6, title: 'Y', price: 100, qty: 1, stock: 5 }], 'efectivo');
  await test('2.5c "efectivo" alias accepted (normalized to CASH)', async () => {
    const r = await postJson('alias-efectivo');
    assert.equal(r.status, 200, `expected 200 got ${r.status} body=${JSON.stringify(r.body)}`);
    assert.equal(calls.orderCreate.length, 1);
    assert.equal(calls.orderCreate[0].data.payment.create.method, 'CASH');
  });

  reset();
  seedActiveCart('alias-transfer', [{ id: 7, title: 'Z', price: 100, qty: 1, stock: 5 }], 'transferencia');
  await test('2.5c "transferencia" alias accepted (normalized to TRANSFER)', async () => {
    const r = await postJson('alias-transfer');
    assert.equal(r.status, 200, `expected 200 got ${r.status} body=${JSON.stringify(r.body)}`);
    assert.equal(calls.orderCreate[0].data.payment.create.method, 'TRANSFER');
  });

  reset();
  seedActiveCart('stale-transfer', [{ id: 71, title: 'Stale', price: 100, qty: 1, stock: 5 }], 'transferencia');
  await test('2.5d stale transfer rejected when bank settings no longer enable it; no side effects', async () => {
    delete process.env.BANK_ALIAS;
    delete process.env.BANK_CBU;
    delete process.env.BANK_TITULAR;
    const r = await postJson('stale-transfer');
    assert.equal(r.status, 400);
    assert.equal(r.body.error, 'Método de pago no disponible');
    assert.equal(calls.updateMany.length, 0);
    assert.equal(calls.orderCreate.length, 0);
    assert.equal(calls.cartItemDeleteMany.length, 0);
    assert.equal(emailCalls.sendOrderConfirmationEmail, 0);
    Object.assign(process.env, { BANK_ALIAS: 'test.alias', BANK_CBU: '1234567890123456789012', BANK_TITULAR: 'Test Holder' });
  });

  // 2.6 Non-positive quantity (0/negative/float): 400; no updateMany call
  reset();
  carts.set('zeroqty', {
    id: 'zeroqty',
    customerId: 42,
    customer: { id: 42, name: 'Test', phone: '1', address: 'a', city: 'c', province: 'p', postalCode: '1' },
    paymentMethod: 'CASH',
    items: [{ productId: 8, quantity: 0, product: { id: 8, title: 'Q0', priceCents: 100, active: true, stock: 5 } }],
  });
  products.set(8, { id: 8, title: 'Q0', priceCents: 100, active: true, stock: 5 });
  await test('2.6 zero quantity: 400; no updateMany call', async () => {
    const r = await postJson('zeroqty');
    assert.equal(r.status, 400);
    assert.ok(/cantidad|quantity/i.test(r.body.error));
    assert.equal(calls.updateMany.length, 0);
    assert.equal(calls.orderCreate.length, 0);
    assert.equal(emailCalls.sendOrderConfirmationEmail, 0);
  });

  reset();
  carts.set('negqty', {
    id: 'negqty',
    customerId: 42,
    customer: { id: 42, name: 'Test', phone: '1', address: 'a', city: 'c', province: 'p', postalCode: '1' },
    paymentMethod: 'CASH',
    items: [{ productId: 8, quantity: -2, product: { id: 8, title: 'QN', priceCents: 100, active: true, stock: 5 } }],
  });
  products.set(8, { id: 8, title: 'QN', priceCents: 100, active: true, stock: 5 });
  await test('2.6b negative quantity: 400; no updateMany call', async () => {
    const r = await postJson('negqty');
    assert.equal(r.status, 400);
    assert.equal(calls.updateMany.length, 0);
    assert.equal(emailCalls.sendOrderConfirmationEmail, 0);
  });

  reset();
  carts.set('floatqty', {
    id: 'floatqty',
    customerId: 42,
    customer: { id: 42, name: 'Test', phone: '1', address: 'a', city: 'c', province: 'p', postalCode: '1' },
    paymentMethod: 'CASH',
    items: [{ productId: 8, quantity: 1.5, product: { id: 8, title: 'QF', priceCents: 100, active: true, stock: 5 } }],
  });
  products.set(8, { id: 8, title: 'QF', priceCents: 100, active: true, stock: 5 });
  await test('2.6c float quantity: 400; no updateMany call', async () => {
    const r = await postJson('floatqty');
    assert.equal(r.status, 400);
    assert.equal(calls.updateMany.length, 0);
    assert.equal(emailCalls.sendOrderConfirmationEmail, 0);
  });

  // 2.7 Email provider throws after commit: route returns 200; console.error called (safe, no stack)
  reset();
  seedActiveCart('emailthrow', [{ id: 9, title: 'E', price: 100, qty: 1, stock: 5 }]);
  emailImpl = () => { throw new Error('resend down'); };
  const errLogs = [];
  const origErr = console.error;
  console.error = (...a) => { errLogs.push(a.join(' ')); };
  await test('2.7 email provider throws: route returns 200; console.error called with safe message (no stack)', async () => {
    const r = await postJson('emailthrow');
    console.error = origErr;
    assert.equal(r.status, 200, `expected 200 got ${r.status} body=${JSON.stringify(r.body)}`);
    assert.ok(errLogs.some((l) => /email|correo/i.test(l)), 'email failure logged');
    assert.ok(errLogs.every((l) => !/resend down/.test(l)), 'no raw error message/stack leaked');
  });
  console.error = origErr;

  // Critical regression: email promise must be fire-and-forget after commit.
  reset();
  seedActiveCart('emaildelay', [{ id: 91, title: 'Slow email', price: 100, qty: 1, stock: 5 }]);
  let releaseEmail;
  let emailStarted;
  const emailStartedPromise = new Promise((resolve) => { emailStarted = resolve; });
  emailImpl = () => {
    emailStarted();
    return new Promise((resolve) => { releaseEmail = () => resolve({ status: 'sent' }); });
  };
  await test('2.7b slow email promise: route returns 200 before email resolves', async () => {
    const pending = postJsonDeferred('emaildelay');
    await emailStartedPromise;
    const completedBeforeEmailResolved = await waitImmediateUntil(pending.isDone);
    let assertionError;
    try {
      assert.equal(calls.orderCreate.length, 1);
      assert.equal(emailCalls.sendOrderConfirmationEmail, 1);
      assert.equal(completedBeforeEmailResolved, true, 'response completed before resolving email promise');
      const r = await pending.response;
      assert.equal(r.status, 200, `expected 200 got ${r.status} body=${JSON.stringify(r.body)}`);
    } catch (err) {
      assertionError = err;
    } finally {
      releaseEmail();
      await pending.response.catch(() => {});
    }
    if (assertionError) throw assertionError;
  });

  // 2.8 No email on failed confirmation (stock/inactive/payment/quantity)
  reset();
  seedActiveCart('noemail-stock', [{ id: 10, title: 'S', price: 100, qty: 99, stock: 1 }]);
  await test('2.8 no email on failed confirmation (insufficient stock)', async () => {
    await postJson('noemail-stock');
    assert.equal(emailCalls.sendOrderConfirmationEmail, 0);
  });

  // 2.9 Noop provider: log "disabled"; no fetch call (direct service test)
  reset();
  process.env.EMAIL_PROVIDER = 'noop';
  delete process.env.RESEND_API_KEY;
  const noopLogs = [];
  const origLog = console.log;
  console.log = (...a) => { noopLogs.push(a.join(' ')); };
  await test('2.9 noop provider: log "disabled"; no fetch call; returns {status:"disabled"}', async () => {
    fetchCalls.length = 0;
    const order = { orderNumber: 'CL-NOOP', totalCents: 100, items: [], customer: {}, paymentMethod: 'CASH' };
    const res = await realEmailService.sendOrderConfirmationEmail(order);
    console.log = origLog;
    assert.equal(res.status, 'disabled');
    assert.equal(fetchCalls.length, 0);
    assert.ok(noopLogs.some((l) => /disabled|noop/i.test(l)), 'noop logged disabled');
  });
  console.log = origLog;

  // 2.10 Resend provider: fetch called once against https://api.resend.com/emails with Bearer + JSON
  reset();
  process.env.EMAIL_PROVIDER = 'resend';
  process.env.RESEND_API_KEY = 're_test';
  process.env.MAIL_FROM = 'CandyLand <pedidos@example.com>';
  process.env.MAIL_TO = 'owner@example.com';
  fetchImpl = async () => ({ ok: true, status: 200, json: async () => ({ id: 'rs_1' }) });
  await test('2.10 Resend provider: fetch called once against https://api.resend.com/emails with Bearer + JSON', async () => {
    fetchCalls.length = 0;
    const order = { orderNumber: 'CL-TEST', totalCents: 200, items: [{ productId: 1, quantity: 2, priceCents: 100 }], customer: { name: 'T', phone: '1' }, paymentMethod: 'CASH' };
    const res = await realEmailService.sendOrderConfirmationEmail(order);
    assert.equal(res.status, 'sent');
    assert.equal(fetchCalls.length, 1);
    const [url, opts] = fetchCalls[0];
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(opts.method, 'POST');
    assert.ok(opts.headers.Authorization && opts.headers.Authorization.startsWith('Bearer re_test'));
    assert.equal(opts.headers['Content-Type'], 'application/json');
    const body = JSON.parse(opts.body);
    assert.ok(body.from && body.to && body.subject && body.text);
  });

  await test('2.10b email text accepts ConfirmOrderResponse customer fields (nombre/teléfono)', async () => {
    const text = realEmailService.buildOrderEmailText({
      orderNumber: 'CL-RESP',
      totalCents: 300,
      items: [{ productId: 1, quantity: 3, priceCents: 100 }],
      customer: { nombre: 'Ana', telefono: '123' },
      paymentMethod: 'efectivo',
    });
    assert.ok(text.includes('Nombre: Ana'));
    assert.ok(text.includes('Teléfono: 123'));
  });
  // Restore noop env for subsequent tests
  process.env.EMAIL_PROVIDER = 'noop';
  delete process.env.RESEND_API_KEY;
  delete process.env.MAIL_FROM;
  delete process.env.MAIL_TO;

  // 2.11 Deterministic order: two items, different productIds -> updateMany sorted ascending
  reset();
  carts.set('det', {
    id: 'det',
    customerId: 42,
    customer: { id: 42, name: 'Test', phone: '1', address: 'a', city: 'c', province: 'p', postalCode: '1' },
    paymentMethod: 'CASH',
    items: [
      { productId: 30, quantity: 1, product: { id: 30, title: 'Late', priceCents: 100, active: true, stock: 5 } },
      { productId: 20, quantity: 1, product: { id: 20, title: 'Early', priceCents: 100, active: true, stock: 5 } },
    ],
  });
  products.set(30, { id: 30, title: 'Late', priceCents: 100, active: true, stock: 5 });
  products.set(20, { id: 20, title: 'Early', priceCents: 100, active: true, stock: 5 });
  await test('2.11 deterministic order: updateMany calls sorted ascending by productId', async () => {
    const r = await postJson('det');
    assert.equal(r.status, 200, `expected 200 got ${r.status} body=${JSON.stringify(r.body)}`);
    assert.equal(calls.updateMany.length, 2);
    assert.equal(calls.updateMany[0].where.id, 20, 'first updateMany is lower productId');
    assert.equal(calls.updateMany[1].where.id, 30, 'second updateMany is higher productId');
  });

  server.close();
  globalThis.fetch = origFetch;

  if (process.exitCode) {
    console.error('\norder-confirm-transaction tests FAILED');
  } else {
    console.log('\nOK: order-confirm-transaction asserts passed.');
  }
}

run().finally(() => {
  for (const [key, value] of Object.entries(savedBankEnv)) value === undefined ? delete process.env[key] : process.env[key] = value;
});
