import { test } from 'node:test';
import { deepStrictEqual, rejects, strictEqual } from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  AdminApiError,
  createAdminCategory,
  deleteAdminCategory,
  updateAdminCategory,
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
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

test('category mutations use name-only POST/PATCH contracts and DELETE accepts 204 without JSON', async () => {
  installSessionStorage();
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    if (init.method === 'DELETE') {
      return { ok: true, status: 204, json: async () => { throw new Error('204 must not parse JSON'); }, text: async () => '' };
    }
    return response({ id: 3, name: 'Gomitas', slug: 'gomitas', active: true }, init.method === 'POST' ? 201 : 200);
  };

  const payload = { name: 'Gomitas' };
  await createAdminCategory('token', payload);
  await updateAdminCategory('token', 3, payload);
  strictEqual(await deleteAdminCategory('token', 3), undefined);

  deepStrictEqual(calls.map(({ url, init }) => [url, init.method, init.body]), [
    ['/api/admin/categories', 'POST', '{"name":"Gomitas"}'],
    ['/api/admin/categories/3', 'PATCH', '{"name":"Gomitas"}'],
    ['/api/admin/categories/3', 'DELETE', undefined],
  ]);
});

test('category errors preserve retryable failures but expire a genuine 401 session', async () => {
  installSessionStorage();
  setAdminToken('stale');
  globalThis.fetch = async () => response({ error: 'Unable to verify account status' }, 401);
  await rejects(() => createAdminCategory('stale', { name: 'Gomitas' }), (error) => error instanceof AdminApiError && error.status === 401);
  strictEqual(getAdminToken(), 'stale');

  globalThis.fetch = async () => response({ error: 'expired' }, 401);
  await rejects(() => updateAdminCategory('stale', 3, { name: 'Gomitas' }), AdminAuthError);
  strictEqual(getAdminToken(), null);
});

test('category API maps validation, duplicate, missing edit target, and blocked deletion errors', async () => {
  installSessionStorage();
  const cases = [
    [400, { error: 'Validation failed', errors: ['name: is required'] }, () => createAdminCategory('token', { name: '' })],
    [409, { error: 'Ya existe una categoría con ese nombre' }, () => createAdminCategory('token', { name: 'Gomitas' })],
    [404, { error: 'Categoría no encontrada' }, () => updateAdminCategory('token', 99, { name: 'Gomitas' })],
    [409, { error: 'No se puede eliminar una categoría con productos' }, () => deleteAdminCategory('token', 3)],
  ];
  for (const [status, body, operation] of cases) {
    globalThis.fetch = async () => response(body, status);
    await rejects(operation, (error) => error instanceof AdminApiError && error.status === status && error.message === body.error);
  }
});

test('category page keeps loading announced and restores successful-delete focus to its heading', () => {
  const page = readFileSync(new URL('../src/pages/Admin/AdminCategoriesPage.tsx', import.meta.url), 'utf8');
  strictEqual(/role="status"\s+aria-live="polite"\s+aria-busy="true"/.test(page), true);
  strictEqual(/headingRef\.current\?\.focus\(\)/.test(page), true);
});
