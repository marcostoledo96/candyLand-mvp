import { test } from 'node:test';
import { deepStrictEqual, rejects, strictEqual } from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  ADMIN_ORDER_STATUSES,
  AdminApiError,
  formatAdminOrderPayment,
  formatAdminOrderStatus,
  getAdminOrder,
  listAdminOrders,
  updateAdminOrderStatus,
} from '../src/lib/adminApi.js';
import { AdminAuthError, getAdminToken, setAdminToken } from '../src/lib/adminAuth.js';
import { finishOrderUpdate, isOrderPending, reconcileOrderUpdate } from '../src/lib/adminOrdersState.js';

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

test('order status tuple and formatters expose only the canonical manual-order contract', () => {
  deepStrictEqual(ADMIN_ORDER_STATUSES, ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED']);
  strictEqual(formatAdminOrderStatus('SHIPPED'), 'Enviado');
  strictEqual(formatAdminOrderStatus('UNKNOWN'), 'No disponible');
  strictEqual(formatAdminOrderPayment('CASH'), 'Efectivo');
  strictEqual(formatAdminOrderPayment('TRANSFER'), 'Transferencia');
  strictEqual(formatAdminOrderPayment(null), 'No disponible');
});

test('orders API sends canonical list, detail, and exact status PATCH contracts', async () => {
  installSessionStorage();
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return response({ id: 7, status: 'SHIPPED', items: [] });
  };

  await listAdminOrders('token', 'PENDING');
  await listAdminOrders('token');
  await getAdminOrder('token', 7);
  await updateAdminOrderStatus('token', 7, 'SHIPPED');

  deepStrictEqual(calls.map(({ url, init }) => [url, init?.method, init?.body]), [
    ['/api/admin/orders?status=PENDING', undefined, undefined],
    ['/api/admin/orders', undefined, undefined],
    ['/api/admin/orders/7', undefined, undefined],
    ['/api/admin/orders/7', 'PATCH', '{"status":"SHIPPED"}'],
  ]);
  await rejects(() => listAdminOrders('token', 'UNKNOWN'), RangeError);
  await rejects(() => updateAdminOrderStatus('token', 7, 'UNKNOWN'), RangeError);
  strictEqual(calls.length, 4);
});

test('order API retains transient 401 but expires genuine 401 and maps update failures', async () => {
  installSessionStorage();
  setAdminToken('stale');
  globalThis.fetch = async () => response({ error: 'Unable to verify account status' }, 401);
  await rejects(() => updateAdminOrderStatus('stale', 7, 'PENDING'), (error) => error instanceof AdminApiError && error.status === 401);
  strictEqual(getAdminToken(), 'stale');

  globalThis.fetch = async () => response({ error: 'Order not found' }, 404);
  await rejects(() => updateAdminOrderStatus('stale', 7, 'PENDING'), (error) => error instanceof AdminApiError && error.status === 404);
  strictEqual(getAdminToken(), 'stale');

  globalThis.fetch = async () => response({ error: 'expired' }, 401);
  await rejects(() => updateAdminOrderStatus('stale', 7, 'PENDING'), AdminAuthError);
  strictEqual(getAdminToken(), null);
});

test('orders route is protected and its page uses native accessible details without public chrome', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const layout = readFileSync(new URL('../src/pages/Admin/AdminLayout.tsx', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../src/pages/Admin/AdminOrdersPage.tsx', import.meta.url), 'utf8');
  strictEqual(/path="\/admin\/pedidos"[\s\S]*?<RequireAdminAuth>[\s\S]*?<AdminLayout \/>[\s\S]*?<Route index element=\{<AdminOrdersPage \/>\}/.test(app), true);
  strictEqual(/NavLink[\s\S]*?to="\/admin\/pedidos"/.test(layout), true);
  strictEqual(!/import.*(?:Header|Footer)/.test(page) && /<details/.test(page) && /<summary/.test(page), true);
});

test('per-order pending locks keep unrelated orders disabled and ignore stale completions', () => {
  const pending = { 11: 1, 12: 1 };
  strictEqual(isOrderPending(pending, 11), true);
  strictEqual(isOrderPending(pending, 12), true);
  strictEqual(isOrderPending(pending, 13), false);
  deepStrictEqual(finishOrderUpdate(pending, 11, 1), { 12: 1 });
  deepStrictEqual(finishOrderUpdate({ 11: 2, 12: 1 }, 11, 1), { 11: 2, 12: 1 });
});

test('successful updates reconcile the active filter without changing unrelated rows', () => {
  const orders = [{ id: 11, status: 'PENDING' }, { id: 12, status: 'PENDING' }];
  deepStrictEqual(
    reconcileOrderUpdate(orders, { id: 11, status: 'DELIVERED' }, 'PENDING'),
    [{ id: 12, status: 'PENDING' }],
  );
  deepStrictEqual(
    reconcileOrderUpdate(orders, { id: 11, status: 'DELIVERED' }, ''),
    [{ id: 11, status: 'DELIVERED' }, { id: 12, status: 'PENDING' }],
  );
});

test('successful updates retain or upsert orders that match the authoritative filter', () => {
  const orders = [{ id: 11, status: 'PENDING' }];
  deepStrictEqual(
    reconcileOrderUpdate(orders, { id: 11, status: 'DELIVERED' }, 'DELIVERED'),
    [{ id: 11, status: 'DELIVERED' }],
  );
  deepStrictEqual(
    reconcileOrderUpdate([], { id: 11, status: 'DELIVERED' }, 'DELIVERED'),
    [{ id: 11, status: 'DELIVERED' }],
  );
});
