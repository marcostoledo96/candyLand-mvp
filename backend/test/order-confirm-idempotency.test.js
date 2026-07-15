// RED-first idempotency contract tests. No .env reads, no real database.
const assert = require('assert');
const http = require('http');
const Module = require('module');
const path = require('path');

const carts = new Map();
const products = new Map();
const ordersByKey = new Map();
const calls = { orderCreate: 0, updateMany: 0, email: 0, lockAcquire: 0, lockWait: 0, lockRelease: 0, blockFirstLock: false, releaseFirstLock: null };

const clone = (value) => JSON.parse(JSON.stringify(value));
const makeOrder = (data) => ({
  id: ordersByKey.size + 1,
  orderNumber: `CL-${ordersByKey.size + 1}`,
  confirmationKey: data.confirmationKey,
  confirmationCartId: data.confirmationCartId,
  totalCents: data.totalCents,
  items: data.items.create.map((item) => ({ ...item })),
  payment: { method: data.payment.create.method, status: 'PENDING' },
  customer: { id: data.customerId, name: 'Ana', phone: '11', address: 'Calle', city: 'CABA', province: 'BA', postalCode: '1000' },
});

const tx = {
  cart: { findUnique: async ({ where: { id } }) => carts.has(id) ? clone(carts.get(id)) : null },
  product: {
    updateMany: async ({ where: { id, stock }, data }) => {
      calls.updateMany += 1;
      const product = products.get(id);
      if (!product || product.active !== true || product.stock < stock.gte) return { count: 0 };
      product.stock -= data.stock.decrement;
      return { count: 1 };
    },
    findUnique: async ({ where: { id } }) => products.has(id) ? clone(products.get(id)) : null,
  },
  order: {
    findUnique: async ({ where: { confirmationKey } }) => ordersByKey.has(confirmationKey) ? clone(ordersByKey.get(confirmationKey)) : null,
    create: async ({ data }) => {
      if (ordersByKey.has(data.confirmationKey)) {
        const error = new Error('unique confirmation key');
        error.code = 'P2002';
        throw error;
      }
      calls.orderCreate += 1;
      const order = makeOrder(data);
      ordersByKey.set(data.confirmationKey, order);
      return clone(order);
    },
  },
  cartItem: { deleteMany: async () => ({ count: 1 }) },
};
const lockHolders = new Map();
const lockQueues = new Map();
const fakePrisma = {
  order: { findUnique: tx.order.findUnique },
  $transaction: async (fn) => {
    let key;
    const release = () => {
      if (!key) return;
      calls.lockRelease += 1;
      lockHolders.delete(key);
      const next = lockQueues.get(key)?.shift();
      if (next) next();
    };
    const transaction = {
      ...tx,
      $executeRaw: async (strings, confirmationKey) => {
        assert.match(strings[0], /pg_advisory_xact_lock\(hashtextextended\(/, 'uses the transaction advisory lock SQL');
        key = confirmationKey;
        if (lockHolders.has(key)) {
          calls.lockWait += 1;
          await new Promise((resolve) => {
            const queue = lockQueues.get(key) || [];
            queue.push(resolve);
            lockQueues.set(key, queue);
          });
        }
        lockHolders.set(key, true);
        calls.lockAcquire += 1;
        if (calls.blockFirstLock) {
          calls.blockFirstLock = false;
          await new Promise((resolve) => { calls.releaseFirstLock = resolve; });
        }
      },
    };
    try { return await fn(transaction); }
    finally { release(); }
  },
};

const originalResolve = Module._resolveFilename;
const prismaClientPath = path.resolve(__dirname, '../prismaClient.js');
const emailPath = path.resolve(__dirname, '../services/email.js');
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === '../prismaClient' || request === './prismaClient' || request === prismaClientPath) return '__idempotency_prisma__';
  if (request === '../services/email' || request === './services/email' || request === emailPath) return '__idempotency_email__';
  return originalResolve.call(this, request, parent, ...rest);
};
require.cache.__idempotency_prisma__ = { id: '__idempotency_prisma__', filename: '__idempotency_prisma__', loaded: true, exports: fakePrisma };
require.cache.__idempotency_email__ = { id: '__idempotency_email__', filename: '__idempotency_email__', loaded: true, exports: { sendOrderConfirmationEmail: async () => { calls.email += 1; } } };
process.env.JWT_SECRET = 'test-secret';
const app = require('../app');
const server = http.createServer(app);

function post(cartId, key) {
  return new Promise((resolve, reject) => {
    const request = http.request({ method: 'POST', host: '127.0.0.1', port: server.address().port, path: `/api/orders/confirm?cartId=${encodeURIComponent(cartId)}`, headers: { 'Idempotency-Key': key, 'content-type': 'application/json', 'content-length': 2 } }, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body: JSON.parse(body) }));
    });
    request.on('error', reject);
    request.end('{}');
  });
}

function reset() {
  carts.clear(); products.clear(); ordersByKey.clear(); lockHolders.clear(); lockQueues.clear();
  calls.orderCreate = 0; calls.updateMany = 0; calls.email = 0; calls.lockAcquire = 0; calls.lockWait = 0; calls.lockRelease = 0; calls.blockFirstLock = false; calls.releaseFirstLock = null;
  const cart = { id: 'cart-1', customerId: 1, customer: { id: 1, name: 'Ana', phone: '11', address: 'Calle', city: 'CABA', province: 'BA', postalCode: '1000' }, paymentMethod: 'CASH', items: [{ productId: 1, quantity: 2, product: { id: 1, title: 'Gomitas', priceCents: 100, active: true, stock: 5 } }] };
  carts.set('cart-1', cart);
  carts.set('cart-2', { ...clone(cart), id: 'cart-2' });
  products.set(1, { id: 1, title: 'Gomitas', priceCents: 100, active: true, stock: 5 });
}

async function waitFor(check) {
  for (let i = 0; i < 50; i += 1) {
    if (check()) return true;
    await new Promise((resolve) => setImmediate(resolve));
  }
  return check();
}

async function run() {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const key = '4e2e0f2e-8e28-4e42-bf42-0d3fd2c6b3e1';

  reset();
  const invalid = await post('cart-1', 'not-a-confirmation-key');
  assert.equal(invalid.status, 400, 'malformed or short keys are rejected before stock/order work');
  assert.equal(calls.orderCreate, 0);
  assert.equal(calls.updateMany, 0);

  reset();
  const first = await post('cart-1', key);
  const replay = await post('cart-1', key);
  assert.equal(first.status, 200);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, first.body, 'sequential replay returns the original public DTO');
  assert.equal(calls.orderCreate, 1, 'one order');
  assert.equal(calls.updateMany, 1, 'one stock decrement');
  assert.equal(products.get(1).stock, 3, 'stock decremented once');
  assert.equal(calls.email, 1, 'email sent once');

  reset();
  products.get(1).stock = 2;
  calls.blockFirstLock = true;
  const leftRequest = post('cart-1', key);
  const rightRequest = post('cart-1', key);
  assert.ok(await waitFor(() => calls.lockWait === 1), 'second same-key request waits on the advisory lock');
  calls.releaseFirstLock();
  const [left, right] = await Promise.all([leftRequest, rightRequest]);
  assert.equal(left.status, 200);
  assert.equal(right.status, 200);
  assert.deepEqual(left.body, right.body, 'concurrent replay returns one DTO');
  assert.equal(calls.orderCreate, 1, 'concurrent replay creates one order');
  assert.equal(products.get(1).stock, 0, 'one exactly-sized stock allocation is decremented once');
  assert.equal(calls.email, 1, 'concurrent replay emails once');
  assert.equal(calls.lockAcquire, 2, 'both transactions acquire the same key serially');
  assert.equal(calls.lockRelease, 2, 'transaction-scoped locks release at transaction end');

  reset();
  products.get(1).stock = 1;
  const rolledBack = await post('cart-1', key);
  assert.equal(rolledBack.status, 400, 'failed confirmation rolls back without retaining the lock');
  assert.equal(calls.lockRelease, 1, 'rollback releases its transaction-scoped lock');
  products.get(1).stock = 2;
  const retried = await post('cart-1', key);
  assert.equal(retried.status, 200, 'the same key can retry after rollback');
  assert.equal(calls.lockRelease, 2, 'retry releases its transaction-scoped lock too');

  const foreign = await post('cart-2', key);
  assert.equal(foreign.status, 409, 'a key cannot replay an unrelated cart order');

  server.close();
  console.log('OK: idempotency replay asserts passed.');
}
run().catch((error) => { console.error(error); server.close(); process.exitCode = 1; });
