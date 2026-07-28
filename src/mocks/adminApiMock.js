import { AdminAuthError } from '../lib/adminAuth.js';
import { AdminApiError } from '../lib/adminApiError.js';
import { MOCK_ADMIN } from './fixtures.js';
import {
  assertMockAdminToken,
  getMockState,
  saveMockState,
  slugify,
  toAdminProduct,
} from './store.js';

function delay(result) {
  return Promise.resolve(result);
}

function requireToken(token) {
  if (!assertMockAdminToken(token)) {
    throw new AdminAuthError('Sesión expirada');
  }
}

function toBase64Url(value) {
  const json = typeof value === 'string' ? value : JSON.stringify(value);
  const base64 = typeof globalThis.btoa === 'function'
    ? globalThis.btoa(json)
    : Buffer.from(json, 'utf8').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function createMockAdminToken(email = MOCK_ADMIN.email) {
  const header = toBase64Url({ alg: 'none', typ: 'JWT' });
  const payload = toBase64Url({
    sub: String(MOCK_ADMIN.user.id),
    email,
    name: MOCK_ADMIN.user.name,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  });
  return `${header}.${payload}.mock`;
}

export function mockLoginAdmin({ email, password }) {
  if (email?.trim() === MOCK_ADMIN.email && password === MOCK_ADMIN.password) {
    return delay({ token: createMockAdminToken(email.trim()), user: { ...MOCK_ADMIN.user } });
  }
  throw new AdminAuthError('Credenciales inválidas');
}

export function mockGetAdminMe(token) {
  requireToken(token);
  return delay({ ...MOCK_ADMIN.user });
}

export function mockListAdminProducts(token) {
  requireToken(token);
  const { products, categories } = getMockState();
  return delay(products.map((product) => toAdminProduct(product, categories)));
}

export function mockDeactivateAdminProduct(token, id) {
  requireToken(token);
  const state = getMockState();
  const product = state.products.find((entry) => entry.id === id);
  if (!product) throw new AdminApiError('Producto no encontrado', [], 404);
  product.active = false;
  saveMockState();
  return delay(toAdminProduct(product));
}

export function mockReactivateAdminProduct(token, id) {
  requireToken(token);
  const state = getMockState();
  const product = state.products.find((entry) => entry.id === id);
  if (!product) throw new AdminApiError('Producto no encontrado', [], 404);
  product.active = true;
  saveMockState();
  return delay(toAdminProduct(product));
}

export function mockCreateAdminProduct(token, payload) {
  requireToken(token);
  const state = getMockState();
  const category = state.categories.find((entry) => entry.id === payload.categoryId);
  if (!category) throw new AdminApiError('Categoría inválida', ['categoryId'], 400);
  const product = {
    id: state.nextIds.product++,
    title: String(payload.title || '').trim(),
    description: payload.description ?? null,
    priceCents: Number(payload.priceCents),
    imageUrl: payload.imageUrl ?? null,
    hoverImageUrl: payload.hoverImageUrl ?? null,
    stock: Number(payload.stock ?? 0),
    active: payload.active !== false,
    categoryId: category.id,
    category: category.name,
  };
  if (!product.title) throw new AdminApiError('Título requerido', ['title'], 400);
  if (!Number.isFinite(product.priceCents) || product.priceCents < 0) {
    throw new AdminApiError('Precio inválido', ['priceCents'], 400);
  }
  state.products.unshift(product);
  saveMockState();
  return delay(toAdminProduct(product));
}

export function mockUpdateAdminProduct(token, id, payload) {
  requireToken(token);
  const state = getMockState();
  const product = state.products.find((entry) => entry.id === id);
  if (!product) throw new AdminApiError('Producto no encontrado', [], 404);
  if (payload.title !== undefined) product.title = String(payload.title).trim();
  if (payload.description !== undefined) product.description = payload.description;
  if (payload.priceCents !== undefined) product.priceCents = Number(payload.priceCents);
  if (payload.imageUrl !== undefined) product.imageUrl = payload.imageUrl;
  if (payload.hoverImageUrl !== undefined) product.hoverImageUrl = payload.hoverImageUrl;
  if (payload.stock !== undefined) product.stock = Number(payload.stock);
  if (payload.active !== undefined) product.active = Boolean(payload.active);
  if (payload.categoryId !== undefined) {
    const category = state.categories.find((entry) => entry.id === payload.categoryId);
    if (!category) throw new AdminApiError('Categoría inválida', ['categoryId'], 400);
    product.categoryId = category.id;
    product.category = category.name;
  }
  saveMockState();
  return delay(toAdminProduct(product));
}

export function mockListAdminCategories(token) {
  requireToken(token);
  return delay(getMockState().categories.map((category) => ({ ...category })));
}

export function mockCreateAdminCategory(token, payload) {
  requireToken(token);
  const state = getMockState();
  const name = String(payload?.name || '').trim();
  if (!name) throw new AdminApiError('Nombre requerido', ['name'], 400);
  if (state.categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
    throw new AdminApiError('Ya existe una categoría con ese nombre', ['name'], 400);
  }
  const category = {
    id: state.nextIds.category++,
    name,
    slug: slugify(name),
    active: true,
  };
  state.categories.push(category);
  saveMockState();
  return delay({ ...category });
}

export function mockUpdateAdminCategory(token, id, payload) {
  requireToken(token);
  const state = getMockState();
  const category = state.categories.find((entry) => entry.id === id);
  if (!category) throw new AdminApiError('Categoría no encontrada', [], 404);
  const name = String(payload?.name || '').trim();
  if (!name) throw new AdminApiError('Nombre requerido', ['name'], 400);
  category.name = name;
  category.slug = slugify(name);
  for (const product of state.products) {
    if (product.categoryId === id) product.category = name;
  }
  saveMockState();
  return delay({ ...category });
}

export function mockDeleteAdminCategory(token, id) {
  requireToken(token);
  const state = getMockState();
  const index = state.categories.findIndex((entry) => entry.id === id);
  if (index < 0) throw new AdminApiError('Categoría no encontrada', [], 404);
  if (state.products.some((product) => product.categoryId === id && product.active)) {
    throw new AdminApiError('No se puede eliminar una categoría con productos activos', [], 400);
  }
  state.categories.splice(index, 1);
  saveMockState();
  return delay(undefined);
}

export function mockListAdminOrders(token, status) {
  requireToken(token);
  const orders = getMockState().orders;
  const filtered = status ? orders.filter((order) => order.status === status) : orders;
  return delay(filtered.map((order) => JSON.parse(JSON.stringify(order))));
}

export function mockGetAdminOrder(token, id) {
  requireToken(token);
  const order = getMockState().orders.find((entry) => entry.id === id);
  if (!order) throw new AdminApiError('Pedido no encontrado', [], 404);
  return delay(JSON.parse(JSON.stringify(order)));
}

export function mockUpdateAdminOrderStatus(token, id, status) {
  requireToken(token);
  const state = getMockState();
  const order = state.orders.find((entry) => entry.id === id);
  if (!order) throw new AdminApiError('Pedido no encontrado', [], 404);
  if (order.status === 'CANCELLED' && status !== 'CANCELLED') {
    throw new AdminApiError('Un pedido cancelado no puede cambiar de estado', [], 400);
  }
  if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
    for (const item of order.items) {
      const product = state.products.find((entry) => entry.id === item.productId);
      if (product) product.stock += item.quantity;
    }
  }
  order.status = status;
  order.updatedAt = new Date().toISOString();
  saveMockState();
  return delay(JSON.parse(JSON.stringify(order)));
}
