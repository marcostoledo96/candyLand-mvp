// Admin categories + orders HTTP-level checks (TDD triangulation).
// Stubs the prisma client via the require cache and drives a real HTTP
// server (stdlib http only, no supertest) so no real DB is needed.
// Run: node test/admin-categories-orders-http.test.js
//
// Covers the spec scenarios that depend on routing + middleware + Prisma calls:
//  - 401 when no admin token on each admin category/order mutation endpoint
//  - GET /api/admin/categories returns mapped categories
//  - POST /api/admin/categories 201 + duplicate -> 409
//  - PATCH /api/admin/categories/:id 200 + duplicate -> 409 + 404
//  - DELETE /api/admin/categories/:id blocked (products) -> 409, empty -> 204
//  - GET /api/admin/orders list + ?status filter (alias + invalid)
//  - GET /api/admin/orders/:id detail shape
//  - PATCH /api/admin/orders/:id status allowlist (alias accepted, invalid 400)

const assert = require('assert');
const http = require('http');
const Module = require('module');
const path = require('path');

// --- Stub prismaClient BEFORE app.js is required (it captures it at import) ---
const categories = new Map();
const orders = new Map();
const products = new Map();
let nextCategoryId = 1;

function cloneOrder(order) {
  return { ...order, payment: { ...order.payment }, customer: { ...order.customer }, items: order.items.map((item) => ({ ...item, product: { ...item.product } })) };
}

function restore(map, snapshot, clone) {
  map.clear();
  snapshot.forEach((value, id) => map.set(id, clone(value)));
}

const orderLocks = new Map();
async function lockOrder(id) {
  const previous = orderLocks.get(id);
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  orderLocks.set(id, current);
  await previous;
  return () => { if (orderLocks.get(id) === current) orderLocks.delete(id); release(); };
}

const fakePrisma = {
  // Categories
  category: {
    findMany: async () => Array.from(categories.values()).sort((a, b) => a.id - b.id),
    findUnique: async ({ where: { id } }) => categories.get(id) || null,
    create: async ({ data }) => {
      // Simulate unique constraint on name.
      for (const c of categories.values()) {
        if (c.name === data.name) {
          const e = new Error('Unique constraint failed');
          e.code = 'P2002';
          throw e;
        }
      }
      const row = { id: nextCategoryId++, name: data.name, createdAt: new Date(), updatedAt: new Date() };
      categories.set(row.id, row);
      return row;
    },
    update: async ({ where: { id }, data }) => {
      const row = categories.get(id);
      if (!row) {
        const e = new Error('Record not found'); e.code = 'P2025'; throw e;
      }
      if (data.name !== undefined) {
        for (const c of categories.values()) {
          if (c.id !== id && c.name === data.name) {
            const e = new Error('Unique constraint failed'); e.code = 'P2002'; throw e;
          }
        }
      }
      Object.assign(row, data, { updatedAt: new Date() });
      return row;
    },
    delete: async ({ where: { id } }) => {
      if (!categories.has(id)) { const e = new Error('not found'); e.code = 'P2025'; throw e; }
      categories.delete(id);
      return { id };
    },
  },
  // Products (used only for category-delete product count)
  product: {
    count: async ({ where: { categoryId } } = {}) => {
      // Return a configurable count keyed by categoryId via orders map hack:
      // we use a separate map for product counts.
      return productCountsByCategory.get(categoryId) || 0;
    },
    findUnique: async ({ where: { id } }) => products.get(id) || null,
    updateMany: async ({ where, data }) => {
      const product = products.get(where.id);
      if (!product || (where.active !== undefined && product.active !== where.active) || (where.stock?.gte !== undefined && product.stock < where.stock.gte)) return { count: 0 };
      product.stock += data.stock.increment || -(data.stock.decrement || 0);
      return { count: 1 };
    },
  },
  // Orders
  order: {
    findMany: async ({ where } = {}) => {
      let list = Array.from(orders.values()).sort((a, b) => a.id - b.id);
      if (where && where.status) list = list.filter((o) => o.status === where.status);
      return list;
    },
    findUnique: async ({ where: { id } }) => orders.get(id) || null,
    update: async ({ where: { id }, data }) => {
      const o = orders.get(id);
      if (!o) { const e = new Error('not found'); e.code = 'P2025'; throw e; }
      Object.assign(o, data, { updatedAt: new Date() });
      return o;
    },
  },
  // User lookup used by requireAdmin re-check (active admin).
  user: { findUnique: async () => ({ id: 1, email: 'admin@candy.com', role: 'ADMIN', active: true }) },
  $transaction: async (callback) => {
    const orderSnapshot = new Map(Array.from(orders, ([id, order]) => [id, cloneOrder(order)]));
    const productSnapshot = new Map(Array.from(products, ([id, product]) => [id, { ...product }]));
    let unlock;
    const tx = {
      ...fakePrisma,
      $queryRaw: async (query) => {
        const [id] = query.values;
        unlock = await lockOrder(id);
        await new Promise(setImmediate);
        return orders.has(id) ? [{ id }] : [];
      },
    };
    try { return await callback(tx); } catch (error) {
      restore(orders, orderSnapshot, cloneOrder);
      restore(products, productSnapshot, (product) => ({ ...product }));
      throw error;
    } finally { if (unlock) unlock(); }
  },
};

const productCountsByCategory = new Map();

const origResolve = Module._resolveFilename;
const prismaClientPath = path.resolve(__dirname, '../prismaClient.js');
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === '../prismaClient' || request === './prismaClient' || request === prismaClientPath) {
    return '__stub_prismaClient_catord__';
  }
  return origResolve.call(this, request, parent, ...rest);
};
require.cache['__stub_prismaClient_catord__'] = {
  id: '__stub_prismaClient_catord__', filename: '__stub_prismaClient_catord__', loaded: true, exports: fakePrisma,
};

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const app = require('../app');
const { signAdminToken } = require('../utils/jwt');

const TOKEN = signAdminToken({ id: 1, email: 'admin@candy.com', role: 'ADMIN' }, process.env.JWT_SECRET);

function test(name, fn) {
  return Promise.resolve(fn()).then(
    () => console.log(`  ok - ${name}`),
    (err) => { console.error(`  FAIL - ${name}`); console.error(err); process.exitCode = 1; }
  );
}

function request({ method, path, body, token }) {
  return new Promise((resolve, reject) => {
    const data = body !== undefined ? JSON.stringify(body) : '';
    const headers = { 'content-type': 'application/json' };
    if (data) headers['content-length'] = Buffer.byteLength(data);
    if (token) headers.authorization = `Bearer ${token}`;
    const req = http.request(
      { method, host: '127.0.0.1', port: server.address().port, path, headers },
      (res) => {
        let buf = '';
        res.on('data', (c) => { buf += c; });
        res.on('end', () => {
          let parsed = buf;
          if (buf) { try { parsed = JSON.parse(buf); } catch { /* keep raw */ } }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const server = http.createServer(app);

async function run() {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));

  // --- 401 unauthenticated (spec: unauthenticated admin category/order mutation) ---
  console.log('auth guard:');
  await test('GET /api/admin/categories without token -> 401', async () => {
    const r = await request({ method: 'GET', path: '/api/admin/categories' });
    assert.equal(r.status, 401);
  });
  await test('POST /api/admin/categories without token -> 401', async () => {
    const r = await request({ method: 'POST', path: '/api/admin/categories', body: { name: 'X' } });
    assert.equal(r.status, 401);
  });
  await test('GET /api/admin/orders without token -> 401', async () => {
    const r = await request({ method: 'GET', path: '/api/admin/orders' });
    assert.equal(r.status, 401);
  });
  await test('PATCH /api/admin/orders/:id without token -> 401', async () => {
    const r = await request({ method: 'PATCH', path: '/api/admin/orders/1', body: { status: 'enviado' } });
    assert.equal(r.status, 401);
  });

  // --- Categories CRUD ---
  console.log('categories CRUD:');
  await test('POST /api/admin/categories 201 and returns mapped record (id,name,slug,active)', async () => {
    const r = await request({ method: 'POST', path: '/api/admin/categories', token: TOKEN, body: { name: 'Gomitas' } });
    assert.equal(r.status, 201);
    assert.equal(r.body.name, 'Gomitas');
    assert.equal(r.body.slug, 'gomitas');
    assert.equal(r.body.active, true);
    assert.ok(typeof r.body.id === 'number');
  });

  await test('POST duplicate name -> 409 and does not create a new row', async () => {
    const before = categories.size;
    const r = await request({ method: 'POST', path: '/api/admin/categories', token: TOKEN, body: { name: 'Gomitas' } });
    assert.equal(r.status, 409);
    assert.equal(categories.size, before, 'MUST NOT create a duplicate');
  });

  await test('POST empty name -> 400 validation error', async () => {
    const r = await request({ method: 'POST', path: '/api/admin/categories', token: TOKEN, body: { name: '   ' } });
    assert.equal(r.status, 400);
    assert.ok(r.body.errors && r.body.errors.length > 0);
  });

  await test('GET /api/admin/categories returns mapped list', async () => {
    const r = await request({ method: 'GET', path: '/api/admin/categories', token: TOKEN });
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.body));
    assert.ok(r.body.length > 0);
    assert.equal(r.body[0].slug, slugifyExpected(r.body[0].name));
    assert.equal(r.body[0].active, true);
  });

  await test('PATCH /api/admin/categories/:id updates name and returns mapped record', async () => {
    const created = await request({ method: 'POST', path: '/api/admin/categories', token: TOKEN, body: { name: 'Caramelos Duros' } });
    const r = await request({ method: 'PATCH', path: `/api/admin/categories/${created.body.id}`, token: TOKEN, body: { name: 'Caramelos Suaves' } });
    assert.equal(r.status, 200);
    assert.equal(r.body.name, 'Caramelos Suaves');
    assert.equal(r.body.slug, 'caramelos-suaves');
  });

  await test('PATCH duplicate name -> 409', async () => {
    await request({ method: 'POST', path: '/api/admin/categories', token: TOKEN, body: { name: 'Unica' } });
    const target = await request({ method: 'POST', path: '/api/admin/categories', token: TOKEN, body: { name: 'Otra' } });
    const r = await request({ method: 'PATCH', path: `/api/admin/categories/${target.body.id}`, token: TOKEN, body: { name: 'Unica' } });
    assert.equal(r.status, 409);
  });

  await test('PATCH unknown id -> 404', async () => {
    const r = await request({ method: 'PATCH', path: '/api/admin/categories/999999', token: TOKEN, body: { name: 'X' } });
    assert.equal(r.status, 404);
  });

  await test('DELETE category with products -> 409 and does not delete', async () => {
    const cat = await request({ method: 'POST', path: '/api/admin/categories', token: TOKEN, body: { name: 'ConProductos' } });
    productCountsByCategory.set(cat.body.id, 3);
    const r = await request({ method: 'DELETE', path: `/api/admin/categories/${cat.body.id}`, token: TOKEN });
    assert.equal(r.status, 409);
    assert.ok(r.body.productCount >= 3);
    assert.ok(categories.has(cat.body.id), 'category MUST still exist');
  });

  await test('DELETE category without products -> 204 and removes it', async () => {
    const cat = await request({ method: 'POST', path: '/api/admin/categories', token: TOKEN, body: { name: 'Vacia' } });
    productCountsByCategory.set(cat.body.id, 0);
    const r = await request({ method: 'DELETE', path: `/api/admin/categories/${cat.body.id}`, token: TOKEN });
    assert.equal(r.status, 204);
    assert.ok(!categories.has(cat.body.id), 'category MUST be removed');
  });

  await test('DELETE unknown id -> 404', async () => {
    const r = await request({ method: 'DELETE', path: '/api/admin/categories/999999', token: TOKEN });
    assert.equal(r.status, 404);
  });

  // --- Orders ---
  console.log('orders:');
  // Seed two orders with different statuses.
  orders.set(1, {
    id: 1, orderNumber: 'CL-1', status: 'PENDING', totalCents: 100, createdAt: new Date(), updatedAt: new Date(),
    payment: { method: 'CASH', status: 'PENDING' },
    customer: { id: 42, name: 'Ana', phone: '1', address: 'a', city: 'c', province: 'p', postalCode: '1' },
    items: [{ productId: 10, quantity: 2, priceCents: 50, product: { id: 10, title: 'Caramelo' } }],
  });
  products.set(10, { id: 10, title: 'Caramelo', active: true, stock: 8 });
  orders.set(2, {
    id: 2, orderNumber: 'CL-2', status: 'CANCELLED', totalCents: 200, createdAt: new Date(), updatedAt: new Date(),
    payment: { method: 'TRANSFER', status: 'PENDING' },
    customer: { id: 43, name: 'Bo', phone: '2', address: 'b', city: 'c', province: 'p', postalCode: '2' },
    items: [{ productId: 11, quantity: 1, priceCents: 50, product: { id: 11, title: 'Chicle' } }, { productId: 12, quantity: 4, priceCents: 50, product: { id: 12, title: 'Gomita' } }],
  });
  products.set(11, { id: 11, title: 'Chicle', active: true, stock: 5 });
  products.set(12, { id: 12, title: 'Gomita', active: true, stock: 3 });

  await test('GET /api/admin/orders returns list with id/status/total/payment/contact/items', async () => {
    const r = await request({ method: 'GET', path: '/api/admin/orders', token: TOKEN });
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.body));
    assert.ok(r.body.length >= 2);
    const o = r.body.find((x) => x.id === 1);
    assert.equal(o.status, 'PENDING');
    assert.equal(o.totalCents, 100);
    assert.equal(o.paymentMethod, 'CASH');
    assert.equal(o.contact.name, 'Ana');
    assert.equal(o.items[0].productTitle, 'Caramelo');
    assert.equal(o.items[0].subtotalCents, 100);
  });

  await test('GET /api/admin/orders?status=pendiente filters by alias (PENDING)', async () => {
    const r = await request({ method: 'GET', path: '/api/admin/orders?status=pendiente', token: TOKEN });
    assert.equal(r.status, 200);
    assert.ok(r.body.every((o) => o.status === 'PENDING'));
    assert.ok(r.body.some((o) => o.id === 1));
  });

  await test('GET /api/admin/orders?status=desconocido -> 400', async () => {
    const r = await request({ method: 'GET', path: '/api/admin/orders?status=desconocido', token: TOKEN });
    assert.equal(r.status, 400);
  });

  await test('GET /api/admin/orders/:id returns detail shape', async () => {
    const r = await request({ method: 'GET', path: '/api/admin/orders/1', token: TOKEN });
    assert.equal(r.status, 200);
    assert.equal(r.body.id, 1);
    assert.equal(r.body.items.length, 1);
    assert.equal(r.body.items[0].subtotalCents, 100);
    assert.equal(r.body.contact.name, 'Ana');
  });

  await test('GET /api/admin/orders/:id unknown -> 404', async () => {
    const r = await request({ method: 'GET', path: '/api/admin/orders/999999', token: TOKEN });
    assert.equal(r.status, 404);
  });

  await test('PATCH /api/admin/orders/:id with alias "enviado" -> 200 and stores SHIPPED', async () => {
    const r = await request({ method: 'PATCH', path: '/api/admin/orders/1', token: TOKEN, body: { status: 'enviado' } });
    assert.equal(r.status, 200);
    assert.equal(r.body.status, 'SHIPPED');
    assert.equal(orders.get(1).status, 'SHIPPED');
    assert.equal(products.get(10).stock, 8);
  });

  await test('PATCH non-CANCELLED -> CANCELLED restores stock exactly once', async () => {
    const r = await request({ method: 'PATCH', path: '/api/admin/orders/1', token: TOKEN, body: { status: 'cancelado' } });
    assert.equal(r.status, 200);
    assert.equal(products.get(10).stock, 10);
  });

  await test('PATCH CANCELLED -> CANCELLED does not restock again', async () => {
    const r = await request({ method: 'PATCH', path: '/api/admin/orders/1', token: TOKEN, body: { status: 'CANCELLED' } });
    assert.equal(r.status, 200);
    assert.equal(products.get(10).stock, 10);
  });

  await test('PATCH CANCELLED -> non-CANCELLED re-reserves stock', async () => {
    const r = await request({ method: 'PATCH', path: '/api/admin/orders/1', token: TOKEN, body: { status: 'PENDING' } });
    assert.equal(r.status, 200);
    assert.equal(products.get(10).stock, 8);
  });

  await test('concurrent CANCELLED/reactivation requests serialize stock adjustments', async () => {
    const cancelResults = await Promise.all([1, 2].map(() => request({ method: 'PATCH', path: '/api/admin/orders/1', token: TOKEN, body: { status: 'CANCELLED' } })));
    assert.deepEqual(cancelResults.map((result) => result.status), [200, 200]);
    assert.equal(products.get(10).stock, 10, 'one reservation is restored once');
    const reactivateResults = await Promise.all([1, 2].map(() => request({ method: 'PATCH', path: '/api/admin/orders/1', token: TOKEN, body: { status: 'PENDING' } })));
    assert.deepEqual(reactivateResults.map((result) => result.status), [200, 200]);
    assert.equal(products.get(10).stock, 8, 'one reservation is made once');
  });

  await test('PATCH re-reserve with insufficient stock rolls back status and prior decrements', async () => {
    const r = await request({ method: 'PATCH', path: '/api/admin/orders/2', token: TOKEN, body: { status: 'PENDING' } });
    assert.equal(r.status, 400);
    assert.equal(orders.get(2).status, 'CANCELLED');
    assert.equal(products.get(11).stock, 5);
    assert.equal(products.get(12).stock, 3);
  });

  await test('PATCH /api/admin/orders/:id with invalid status -> 400 and does not modify', async () => {
    const before = orders.get(2).status;
    const r = await request({ method: 'PATCH', path: '/api/admin/orders/2', token: TOKEN, body: { status: 'desconocido' } });
    assert.equal(r.status, 400);
    assert.equal(orders.get(2).status, before, 'MUST NOT modify order');
  });

  await test('PATCH /api/admin/orders/:id unknown -> 404', async () => {
    const r = await request({ method: 'PATCH', path: '/api/admin/orders/999999', token: TOKEN, body: { status: 'enviado' } });
    assert.equal(r.status, 404);
  });

  server.close();

  if (process.exitCode) {
    console.error('\nadmin-categories-orders-http tests FAILED');
  } else {
    console.log('\nOK: admin-categories-orders-http asserts passed.');
  }
}

function slugifyExpected(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').replace(/^-+|-+$/g, '');
}

run();
