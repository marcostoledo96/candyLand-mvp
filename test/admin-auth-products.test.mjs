// Durable behavioral tests for admin auth + products (slice 7f, narrowed).
// Covers: token decode/expiry, sessionStorage management, admin API client
// (login, /me, list, deactivate, reactivate), 401 central clear.
// Form-only helpers (parsePriceInput, validateProductPayload, isSafeAdminImageUrl,
// extractApiError) are deferred to follow-up branch frontend/admin-product-form.
// Run: npm test | node --test test/admin-auth-products.test.mjs

import { test } from 'node:test';
import { strictEqual, throws, rejects, ok } from 'node:assert';
import {
  decodeAdminTokenPayload, isAdminTokenExpired, getAdminToken, setAdminToken,
  clearAdminToken, AdminAuthError, ADMIN_TOKEN_KEY,
} from '../src/lib/adminAuth.js';
import {
  loginAdmin, getAdminMe, listAdminProducts, deactivateAdminProduct,
  reactivateAdminProduct, AdminApiError,
} from '../src/lib/adminApi.js';

// --- sessionStorage stub ---
function makeSessionStorageStub() {
  let store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
    _snapshot: () => ({ ...store }),
  };
}
function installSessionStorage(stub) {
  Object.defineProperty(globalThis, 'sessionStorage', { value: stub, configurable: true, writable: true });
}

// --- JWT decode + expiry ---
function makeJwt(payload) {
  const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.fakeSig`;
}

test('decodeAdminTokenPayload: valid token returns payload', () => {
  const p = { id: 1, email: 'admin@candy', role: 'ADMIN', iat: 1000, exp: 9999999999 };
  const d = decodeAdminTokenPayload(makeJwt(p));
  strictEqual(d.email, 'admin@candy');
  strictEqual(d.role, 'ADMIN');
});

test('decodeAdminTokenPayload: browser-native decode handles URL-safe UTF-8 without Buffer', () => {
  const token = makeJwt({ email: 'ÿ@candy', role: 'ADMIN' });
  const originalBuffer = globalThis.Buffer;
  try {
    globalThis.Buffer = undefined;
    strictEqual(decodeAdminTokenPayload(token)?.email, 'ÿ@candy');
  } finally {
    globalThis.Buffer = originalBuffer;
  }
});

test('decodeAdminTokenPayload: malformed returns null', () => {
  strictEqual(decodeAdminTokenPayload('not.a.jwt'), null);
  strictEqual(decodeAdminTokenPayload(''), null);
  strictEqual(decodeAdminTokenPayload(null), null);
});

test('isAdminTokenExpired: future exp false', () => {
  ok(!isAdminTokenExpired({ exp: Math.floor(Date.now() / 1000) + 3600 }));
});

test('isAdminTokenExpired: past exp true', () => {
  ok(isAdminTokenExpired({ exp: 100 }));
});

test('isAdminTokenExpired: null payload true', () => {
  ok(isAdminTokenExpired(null));
});

// --- sessionStorage token management ---
test('setAdminToken / getAdminToken round-trip', () => {
  installSessionStorage(makeSessionStorageStub());
  setAdminToken('my-token');
  strictEqual(getAdminToken(), 'my-token');
});

test('clearAdminToken removes the token', () => {
  const stub = makeSessionStorageStub();
  installSessionStorage(stub);
  setAdminToken('my-token');
  clearAdminToken();
  strictEqual(getAdminToken(), null);
});

test('getAdminToken returns null when empty', () => {
  installSessionStorage(makeSessionStorageStub());
  strictEqual(getAdminToken(), null);
});

test('setAdminToken throws AdminAuthError on QuotaExceededError', () => {
  installSessionStorage({
    getItem: () => null,
    setItem: () => { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; },
    removeItem: () => {}, clear: () => {},
  });
  throws(() => setAdminToken('x'), AdminAuthError);
});

test('setAdminToken throws AdminAuthError on SecurityError', () => {
  installSessionStorage({
    getItem: () => null,
    setItem: () => { const e = new Error('security'); e.name = 'SecurityError'; throw e; },
    removeItem: () => {}, clear: () => {},
  });
  throws(() => setAdminToken('x'), AdminAuthError);
});

// --- admin API client (global.fetch stubbed) ---
function makeJsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300, status,
    json: async () => body, text: async () => JSON.stringify(body),
  };
}

test('loginAdmin: posts to /api/admin/login and returns {token, user}', async () => {
  let capturedUrl = null, capturedBody = null;
  globalThis.fetch = async (url, init) => {
    capturedUrl = url;
    capturedBody = init ? JSON.parse(init.body) : null;
    return makeJsonResponse({ token: 'fake.jwt.token', user: { id: 1, email: 'admin@candy', role: 'ADMIN' } });
  };
  const r = await loginAdmin({ email: 'admin@candy', password: 'secret' });
  ok(capturedUrl.includes('/api/admin/login'));
  strictEqual(capturedBody.email, 'admin@candy');
  strictEqual(r.token, 'fake.jwt.token');
  strictEqual(r.user.email, 'admin@candy');
});

test('getAdminMe: 200 returns user', async () => {
  globalThis.fetch = async () => makeJsonResponse({ id: 1, email: 'admin@candy', role: 'ADMIN' });
  const u = await getAdminMe('fake-token');
  strictEqual(u.email, 'admin@candy');
});

test('getAdminMe: 401 throws AdminAuthError + clears token', async () => {
  installSessionStorage(makeSessionStorageStub());
  setAdminToken('stale-token');
  globalThis.fetch = async () => makeJsonResponse({ error: 'Invalid' }, 401);
  await rejects(() => getAdminMe('stale-token'), AdminAuthError);
  strictEqual(getAdminToken(), null);
});

test('getAdminMe: account-status lookup 401 is retryable and retains token', async () => {
  installSessionStorage(makeSessionStorageStub());
  setAdminToken('valid-token');
  globalThis.fetch = async () => makeJsonResponse({ error: 'Unable to verify account status' }, 401);
  await rejects(() => getAdminMe('valid-token'), AdminApiError);
  strictEqual(getAdminToken(), 'valid-token');
});

test('listAdminProducts: 200 returns array', async () => {
  globalThis.fetch = async () => makeJsonResponse([
    { id: 1, title: 'Gomitas', priceCents: 1000, stock: 5, active: true, categoryId: 1 },
    { id: 2, title: 'Caramelos', priceCents: 500, stock: 0, active: false, categoryId: 2 },
  ]);
  const products = await listAdminProducts('fake-token');
  strictEqual(products.length, 2);
  strictEqual(products[0].title, 'Gomitas');
});

test('listAdminProducts: 401 throws AdminAuthError + clears token', async () => {
  installSessionStorage(makeSessionStorageStub());
  setAdminToken('stale');
  globalThis.fetch = async () => makeJsonResponse({ error: 'Invalid' }, 401);
  await rejects(() => listAdminProducts('stale'), AdminAuthError);
  strictEqual(getAdminToken(), null);
});

test('deactivateAdminProduct: DELETE returns {id, active:false}', async () => {
  let capturedMethod = null;
  globalThis.fetch = async (url, init) => {
    capturedMethod = init ? init.method : 'GET';
    return makeJsonResponse({ id: 1, active: false, deleted: true });
  };
  const r = await deactivateAdminProduct('tok', 1);
  strictEqual(capturedMethod, 'DELETE');
  strictEqual(r.active, false);
});

test('reactivateAdminProduct: PATCH {active:true} returns product', async () => {
  let capturedMethod = null, capturedBody = null;
  globalThis.fetch = async (url, init) => {
    capturedMethod = init ? init.method : 'GET';
    capturedBody = init ? JSON.parse(init.body) : null;
    return makeJsonResponse({ id: 1, title: 'X', active: true });
  };
  const r = await reactivateAdminProduct('tok', 1);
  strictEqual(capturedMethod, 'PATCH');
  strictEqual(capturedBody.active, true);
  strictEqual(r.active, true);
});

test('admin API calls include Authorization: Bearer header', async () => {
  let capturedHeaders = null;
  globalThis.fetch = async (url, init) => {
    capturedHeaders = init ? init.headers : null;
    return makeJsonResponse([]);
  };
  await listAdminProducts('my-token');
  ok(capturedHeaders);
  strictEqual(capturedHeaders.Authorization, 'Bearer my-token');
});

test('admin API network error returns "No se pudo conectar al backend"', async () => {
  globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
  await rejects(
    () => listAdminProducts('tok'),
    (e) => e instanceof Error && /No se pudo conectar/.test(e.message),
  );
});
