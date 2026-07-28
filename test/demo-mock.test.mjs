import test from 'node:test';
import assert from 'node:assert/strict';
import { resetMockState, ensureCart, getMockState, STORAGE_KEY, __setMockStateForTests, buildCartDto, assertMockAdminToken } from '../src/mocks/store.js';
import {
  mockAddItemToCart,
  mockPostCheckout,
  mockPostPaymentMethod,
  mockPostConfirmOrder,
  mockFetchProducts,
} from '../src/mocks/publicApi.js';
import { mockLoginAdmin, mockUpdateAdminProduct, mockListAdminOrders, mockUpdateAdminOrderStatus } from '../src/mocks/adminApiMock.js';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); },
  };
}

test('ensureCart preserves a client-provided cartId after store reset', async () => {
  globalThis.localStorage = memoryStorage();
  resetMockState();
  const cartId = 'client-cart-123';
  const first = ensureCart(cartId);
  assert.equal(first, cartId);
  await mockAddItemToCart(1, 1, cartId);
  resetMockState();
  const again = ensureCart(cartId);
  assert.equal(again, cartId);
  assert.equal(getMockState().carts[cartId].items.length, 0);
});

test('corrupt localStorage is discarded and fixtures reload', () => {
  globalThis.localStorage = memoryStorage();
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify({ broken: true }));
  __setMockStateForTests(null);
  const products = getMockState().products;
  assert.ok(Array.isArray(products));
  assert.ok(products.length >= 20);
  assert.ok(getMockState().nextIds.product > 1);
});

test('cart and confirm use live product prices after admin edit', async () => {
  globalThis.localStorage = memoryStorage();
  resetMockState();
  const { token } = await mockLoginAdmin({ email: 'admin@candyland.demo', password: 'demo' });
  const products = await mockFetchProducts();
  const productId = products[0].id;
  const cart = await mockAddItemToCart(productId, 2, null);
  await mockUpdateAdminProduct(token, productId, { priceCents: 99900 });
  const dto = buildCartDto(cart.cartId);
  assert.equal(dto.items[0].priceCents, 99900);
  assert.equal(dto.totalCents, 199800);
  await mockPostCheckout({
    nombre: 'Demo', telefono: '111', direccion: 'Calle 1', localidad: 'CABA', provincia: 'BA', codigoPostal: '1000',
  }, cart.cartId);
  await mockPostPaymentMethod('efectivo', cart.cartId);
  const order = await mockPostConfirmOrder(cart.cartId, '11111111-1111-4111-8111-111111111111');
  assert.equal(order.totalCents, 199800);
  assert.equal(order.items[0].priceCents, 99900);
});

test('idempotent confirm returns the same order and forged tokens are rejected', async () => {
  globalThis.localStorage = memoryStorage();
  resetMockState();
  const products = await mockFetchProducts();
  const cart = await mockAddItemToCart(products[0].id, 1, null);
  await mockPostCheckout({
    nombre: 'Demo', telefono: '111', direccion: 'Calle 1', localidad: 'CABA', provincia: 'BA', codigoPostal: '1000',
  }, cart.cartId);
  await mockPostPaymentMethod('efectivo', cart.cartId);
  const key = '22222222-2222-4222-8222-222222222222';
  const first = await mockPostConfirmOrder(cart.cartId, key);
  const second = await mockPostConfirmOrder(cart.cartId, key);
  assert.equal(first.orderId, second.orderId);
  assert.equal(getMockState().orders.length, 1);
  assert.equal(assertMockAdminToken('a.b.mock'), false);
  const { token } = await mockLoginAdmin({ email: 'admin@candyland.demo', password: 'demo' });
  assert.equal(assertMockAdminToken(token), true);
  const orders = await mockListAdminOrders(token);
  const before = getMockState().products.find((p) => p.id === products[0].id).stock;
  await mockUpdateAdminOrderStatus(token, orders[0].id, 'CANCELLED');
  const after = getMockState().products.find((p) => p.id === products[0].id).stock;
  assert.equal(after, before + 1);
});
