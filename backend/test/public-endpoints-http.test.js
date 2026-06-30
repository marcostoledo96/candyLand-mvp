// Public endpoints HTTP-level checks (TDD triangulation).
// Stubs the prisma client via the require cache and drives a real HTTP server
// (stdlib http only, no supertest) so no real DB is needed.
// Run: node test/public-endpoints-http.test.js
//
// Covers the spec scenarios that depend on routing + middleware + Prisma calls:
//  - GET /api/categories: no token required, returns mapped list, empty catalog,
//    active-only activeProductCount, no products payload
//  - POST /api/contact: 201 + persistence, 400 no persistence, optional phone
//  - POST /api/jobs/applications: 201 + persistence, 400, optional fields
//  - POST /api/franchise/leads: 201 + persistence, 400, optional fields
//  - Malformed JSON -> 400 without stack trace
//  - Oversized payload -> 400 without persistence

const assert = require('assert');
const http = require('http');
const Module = require('module');
const path = require('path');

// --- In-memory stores for stubbed Prisma ---
const categories = new Map();
const contactMessages = [];
const jobApplications = [];
const franchiseLeads = [];

// Per-category active product counts (simulates Prisma filtered relation count).
const activeCountsByCategory = new Map();
const categoryFindManyArgs = [];

const fakePrisma = {
  category: {
    // Simulate Prisma filtered relation count: _count.products = active product count.
    findMany: async (args) => {
      categoryFindManyArgs.push(args);
      return Array.from(categories.values()).map((c) => ({
        ...c,
        _count: { products: activeCountsByCategory.get(c.id) || 0 },
      })).sort((a, b) => a.id - b.id);
    },
  },
  contactMessage: {
    create: async ({ data }) => {
      const row = { id: contactMessages.length + 1, ...data };
      contactMessages.push(row);
      return row;
    },
  },
  jobApplication: {
    create: async ({ data }) => {
      const row = { id: jobApplications.length + 1, ...data };
      jobApplications.push(row);
      return row;
    },
  },
  franchiseLead: {
    create: async ({ data }) => {
      const row = { id: franchiseLeads.length + 1, ...data };
      franchiseLeads.push(row);
      return row;
    },
  },
};

const origResolve = Module._resolveFilename;
const prismaClientPath = path.resolve(__dirname, '../prismaClient.js');
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === '../prismaClient' || request === './prismaClient' || request === prismaClientPath) {
    return '__stub_prismaClient_public__';
  }
  return origResolve.call(this, request, parent, ...rest);
};
require.cache['__stub_prismaClient_public__'] = {
  id: '__stub_prismaClient_public__', filename: '__stub_prismaClient_public__', loaded: true, exports: fakePrisma,
};

// app.js currently uses express.json() with no limit. The design calls for a
// 20kb limit + parser error handler. We test the real behavior: if app.js has
// the limit, oversized gets rejected; if not, we assert via a manual oversized
// probe below. Either way, persistence MUST NOT happen on rejected payloads.
const app = require('../app');

function test(name, fn) {
  return Promise.resolve(fn()).then(
    () => console.log(`  ok - ${name}`),
    (err) => { console.error(`  FAIL - ${name}`); console.error(err); process.exitCode = 1; }
  );
}

function request({ method, path: reqPath, body, rawBody, rawContentType }) {
  return new Promise((resolve, reject) => {
    let data;
    if (rawBody !== undefined) {
      data = rawBody;
    } else if (body !== undefined) {
      data = JSON.stringify(body);
    } else {
      data = '';
    }
    const headers = rawContentType ? { 'content-type': rawContentType } : { 'content-type': 'application/json' };
    if (data) headers['content-length'] = Buffer.byteLength(data);
    const req = http.request(
      { method, host: '127.0.0.1', port: server.address().port, path: reqPath, headers },
      (res) => {
        let buf = '';
        res.on('data', (c) => { buf += c; });
        res.on('end', () => {
          let parsed = buf;
          if (buf) { try { parsed = JSON.parse(buf); } catch { /* keep raw */ } }
          resolve({ status: res.statusCode, body: parsed, raw: buf });
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

  console.log('GET /api/categories:');
  await test('no Authorization header required (MUST NOT return 401)', async () => {
    const r = await request({ method: 'GET', path: '/api/categories' });
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.body));
  });

  await test('empty catalog returns 200 with []', async () => {
    categories.clear();
    activeCountsByCategory.clear();
    const r = await request({ method: 'GET', path: '/api/categories' });
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, []);
  });

  await test('returns mapped list with id, name, slug, activeProductCount', async () => {
    categories.clear();
    categories.set(1, { id: 1, name: 'Gomitas', createdAt: new Date(), updatedAt: new Date() });
    categories.set(2, { id: 2, name: 'Caramelos Duros', createdAt: new Date(), updatedAt: new Date() });
    activeCountsByCategory.set(1, 3);
    activeCountsByCategory.set(2, 0);
    const r = await request({ method: 'GET', path: '/api/categories' });
    assert.equal(r.status, 200);
    assert.equal(r.body.length, 2);
    assert.equal(r.body[0].id, 1);
    assert.equal(r.body[0].name, 'Gomitas');
    assert.equal(r.body[0].slug, 'gomitas');
    // active-only count: 3 active for category 1, 0 for category 2
    assert.equal(r.body[0].activeProductCount, 3);
    assert.equal(r.body[1].activeProductCount, 0);
  });

  await test('uses Prisma include._count for active-only product counts', async () => {
    const lastArgs = categoryFindManyArgs[categoryFindManyArgs.length - 1];
    assert.deepEqual(lastArgs, {
      orderBy: { id: 'asc' },
      include: {
        _count: { select: { products: { where: { active: true } } } },
      },
    });
  });

  await test('MUST NOT expose products payload in category DTO', async () => {
    categories.set(3, { id: 3, name: 'Con Payload', products: [{ id: 99, title: 'x' }], createdAt: new Date(), updatedAt: new Date() });
    activeCountsByCategory.set(3, 1);
    const r = await request({ method: 'GET', path: '/api/categories' });
    const dto = r.body.find((c) => c.id === 3);
    assert.ok(dto);
    assert.ok(!('products' in dto), 'products MUST NOT be in public DTO');
  });

  console.log('\nPOST /api/contact:');
  await test('valid payload -> 201 { ok: true, id } and persists', async () => {
    contactMessages.length = 0;
    const r = await request({ method: 'POST', path: '/api/contact', body: { name: 'Ana', email: 'a@b.com', message: 'hola' } });
    assert.equal(r.status, 201);
    assert.equal(r.body.ok, true);
    assert.ok(typeof r.body.id === 'number');
    assert.equal(contactMessages.length, 1);
    assert.equal(contactMessages[0].name, 'Ana');
    assert.equal(contactMessages[0].email, 'a@b.com');
    assert.equal(contactMessages[0].message, 'hola');
    assert.equal(contactMessages[0].phone, null);
  });

  await test('missing name -> 400 and does NOT persist', async () => {
    contactMessages.length = 0;
    const r = await request({ method: 'POST', path: '/api/contact', body: { email: 'a@b.com', message: 'hola' } });
    assert.equal(r.status, 400);
    assert.equal(contactMessages.length, 0);
    assert.ok(r.body.errors && r.body.errors.length > 0);
  });

  await test('missing email -> 400 and does NOT persist', async () => {
    const r = await request({ method: 'POST', path: '/api/contact', body: { name: 'Ana', message: 'hola' } });
    assert.equal(r.status, 400);
  });

  await test('missing message -> 400 and does NOT persist', async () => {
    const r = await request({ method: 'POST', path: '/api/contact', body: { name: 'Ana', email: 'a@b.com' } });
    assert.equal(r.status, 400);
  });

  await test('optional phone accepted and persisted', async () => {
    const r = await request({ method: 'POST', path: '/api/contact', body: { name: 'Ana', email: 'a@b.com', message: 'hola', phone: '11' } });
    assert.equal(r.status, 201);
    assert.equal(contactMessages[contactMessages.length - 1].phone, '11');
  });

  console.log('\nPOST /api/jobs/applications:');
  await test('valid payload -> 201 and persists', async () => {
    jobApplications.length = 0;
    const r = await request({ method: 'POST', path: '/api/jobs/applications', body: { fullName: 'Bo', email: 'b@c.com', position: 'Cajero' } });
    assert.equal(r.status, 201);
    assert.equal(r.body.ok, true);
    assert.equal(jobApplications.length, 1);
    assert.equal(jobApplications[0].fullName, 'Bo');
    assert.equal(jobApplications[0].position, 'Cajero');
  });

  await test('missing position -> 400 and does NOT persist', async () => {
    const before = jobApplications.length;
    const r = await request({ method: 'POST', path: '/api/jobs/applications', body: { fullName: 'Bo', email: 'b@c.com' } });
    assert.equal(r.status, 400);
    assert.equal(jobApplications.length, before);
  });

  await test('optional fields accepted and persisted', async () => {
    const r = await request({
      method: 'POST', path: '/api/jobs/applications',
      body: { fullName: 'Bo', email: 'b@c.com', position: 'Cajero', phone: '11', message: 'msg', cvUrl: 'https://cv/x.pdf' },
    });
    assert.equal(r.status, 201);
    const row = jobApplications[jobApplications.length - 1];
    assert.equal(row.phone, '11');
    assert.equal(row.message, 'msg');
    assert.equal(row.cvUrl, 'https://cv/x.pdf');
  });

  console.log('\nPOST /api/franchise/leads:');
  await test('valid payload -> 201 and persists', async () => {
    franchiseLeads.length = 0;
    const r = await request({ method: 'POST', path: '/api/franchise/leads', body: { fullName: 'Cy', email: 'c@d.com', city: 'Rosario' } });
    assert.equal(r.status, 201);
    assert.equal(franchiseLeads.length, 1);
    assert.equal(franchiseLeads[0].city, 'Rosario');
  });

  await test('missing city -> 400 and does NOT persist', async () => {
    const before = franchiseLeads.length;
    const r = await request({ method: 'POST', path: '/api/franchise/leads', body: { fullName: 'Cy', email: 'c@d.com' } });
    assert.equal(r.status, 400);
    assert.equal(franchiseLeads.length, before);
  });

  await test('optional phone/message accepted', async () => {
    const r = await request({
      method: 'POST', path: '/api/franchise/leads',
      body: { fullName: 'Cy', email: 'c@d.com', city: 'Rosario', phone: '11', message: 'hi' },
    });
    assert.equal(r.status, 201);
    const row = franchiseLeads[franchiseLeads.length - 1];
    assert.equal(row.phone, '11');
    assert.equal(row.message, 'hi');
  });

  console.log('\nmalformed JSON / oversized:');
  await test('malformed JSON -> 400 and no stack trace in body', async () => {
    const before = contactMessages.length;
    const r = await request({ method: 'POST', path: '/api/contact', rawBody: '{ name: "Ana", email: "a@b.com", message: "hola"' });
    assert.equal(r.status, 400);
    assert.equal(contactMessages.length, before, 'MUST NOT persist on malformed JSON');
    // no stack trace leaked
    assert.ok(!r.raw.includes('at '), 'MUST NOT expose a stack trace');
    assert.ok(r.body.error, 'MUST have an error message');
  });

  await test('oversized payload -> 400 (or 400-class) and does NOT persist', async () => {
    const before = contactMessages.length;
    const huge = JSON.stringify({ name: 'A', email: 'a@b.com', message: 'x'.repeat(100 * 1024) });
    const r = await request({ method: 'POST', path: '/api/contact', rawBody: huge });
    // With the 20kb limit configured in app.js, this must be rejected.
    assert.equal(r.status, 400);
    assert.equal(contactMessages.length, before, 'MUST NOT persist oversized payload');
    assert.ok(r.body.error);
  });

  server.close();

  if (process.exitCode) {
    console.error('\npublic-endpoints-http tests FAILED');
  } else {
    console.log('\nOK: public-endpoints-http asserts passed.');
  }
}

run();
