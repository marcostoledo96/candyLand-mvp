import { test } from 'node:test';
import { deepStrictEqual, ok, rejects, strictEqual } from 'node:assert';
import {
  extractApiError,
  isSafeAdminImageUrl,
  parsePriceInput,
  validateProductPayload,
  productFormFields,
} from '../src/lib/adminValidation.js';
import {
  createAdminProduct,
  updateAdminProduct,
  listAdminCategories,
  AdminApiError,
} from '../src/lib/adminApi.js';
import { AdminAuthError, getAdminToken, setAdminToken } from '../src/lib/adminAuth.js';

function installSessionStorage() {
  const values = new Map();
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
  });
}

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

test('parsePriceInput converts whole pesos and rejects fractions', () => {
  for (const [input, cents] of [['12', 1200], [12, 1200], ['0', 0]]) {
    const result = parsePriceInput(input);
    strictEqual(result.ok, true);
    strictEqual(result.cents, cents);
  }
  for (const input of ['12.5', '12,50', '-1', 'abc', null, ' ', '1,234']) {
    strictEqual(parsePriceInput(input).ok, false);
  }
});

test('validateProductPayload creates normalized payload and reports invalid fields', () => {
  const valid = validateProductPayload({ title: ' Gomitas ', price: '12', stock: '0', categoryId: '2', active: true, description: '', imageUrl: '', hoverImageUrl: '' });
  strictEqual(valid.ok, true);
  deepStrictEqual(valid.value, { title: 'Gomitas', priceCents: 1200, stock: 0, categoryId: 2, active: true, description: null, imageUrl: null, hoverImageUrl: null });
  const invalid = validateProductPayload({ title: '', price: '12.5', stock: '-1', categoryId: '0', active: true, imageUrl: 'javascript:alert(1)' });
  strictEqual(invalid.ok, false);
  ok(invalid.fields.title && invalid.fields.price && invalid.fields.stock && invalid.fields.categoryId && invalid.fields.imageUrl);
});

test('validateProductPayload preserves an unchanged fractional existing price only', () => {
  const fields = { title: 'Gomitas', stock: '0', categoryId: '2', active: true, description: '', imageUrl: '', hoverImageUrl: '' };
  const unchanged = validateProductPayload({ ...fields, price: '12.5' }, 1250);
  strictEqual(unchanged.ok, true);
  strictEqual(unchanged.value.priceCents, 1250);
  strictEqual(validateProductPayload({ ...fields, price: '12.6' }, 1250).ok, false);
  strictEqual(validateProductPayload({ ...fields, price: '12.5' }).ok, false);
});

test('isSafeAdminImageUrl allows only empty http(s) and image data URLs', () => {
  for (const value of ['', null, undefined, 'http://cdn.example/x.png', 'https://cdn.example/x.webp', 'data:image/png;base64,AA==']) strictEqual(isSafeAdminImageUrl(value), true);
  for (const value of [' javascript:alert(1)', 'vbscript:x', 'file:///tmp/x', 'data:text/html;base64,AA==']) strictEqual(isSafeAdminImageUrl(value), false);
});

test('extractApiError preserves backend strings and maps exact field prefixes', () => {
  const mapped = extractApiError({ error: 'Validation failed', errors: ['stock: must be >= 0', 'priceCents: invalid', 'another error'] }, 400);
  strictEqual(mapped.message, 'Validation failed');
  strictEqual(mapped.fields.stock, 'stock: must be >= 0');
  strictEqual(mapped.fields.priceCents, 'priceCents: invalid');
  strictEqual(mapped.summary.length, 3);
  strictEqual(extractApiError({ error: 'categoryId does not exist' }, 400).fields.categoryId, 'categoryId does not exist');
  strictEqual(extractApiError({}, 401).message, 'Credenciales inválidas');
});

test('productFormFields snapshots list DTOs and defaults a new active product', () => {
  deepStrictEqual(productFormFields(), { title: '', description: '', price: '', stock: '0', categoryId: '', imageUrl: '', hoverImageUrl: '', active: true });
  const product = productFormFields({ id: 7, title: ' Gomitas ', description: null, priceCents: 1250, stock: 4, categoryId: 2, imageUrl: null, hoverImageUrl: 'https://cdn/x.png', active: false });
  deepStrictEqual(product, { title: ' Gomitas ', description: '', price: '12.5', stock: '4', categoryId: '2', imageUrl: '', hoverImageUrl: 'https://cdn/x.png', active: false });
});

test('product form API methods use the backend contracts and central 401 expiry', async () => {
  installSessionStorage();
  setAdminToken('stale');
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith('/categories')) return response([{ id: 2, name: 'Gomitas', slug: 'gomitas', active: true }]);
    if (init.method === 'POST') return response({ id: 8 }, 201);
    return response({ id: 8 });
  };
  const payload = { title: 'Gomitas', priceCents: 1200, stock: 1, categoryId: 2, active: true, description: null, imageUrl: null, hoverImageUrl: null };
  await createAdminProduct('token', payload);
  await updateAdminProduct('token', 8, payload);
  const categories = await listAdminCategories('token');
  strictEqual(categories[0].name, 'Gomitas');
  strictEqual(calls[0].init.method, 'POST');
  strictEqual(calls[1].init.method, 'PATCH');
  ok(calls[1].url.endsWith('/api/admin/products/8'));
  globalThis.fetch = async () => response({ error: 'expired' }, 401);
  await rejects(() => createAdminProduct('stale', payload), AdminAuthError);
  strictEqual(getAdminToken(), null);
  globalThis.fetch = async () => response({ error: 'Validation failed', errors: ['stock: invalid'] }, 400);
  await rejects(() => createAdminProduct('token', payload), (error) => error instanceof AdminApiError && error.fields.includes('stock: invalid'));
});
