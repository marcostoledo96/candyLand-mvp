import { MOCK_CATEGORIES, MOCK_PRODUCTS } from './fixtures.js';

export const STORAGE_KEY = 'candyland.mock.v1';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function categoryNameById(categories, categoryId) {
  return categories.find((category) => category.id === categoryId)?.name ?? null;
}

function withCategoryLabel(product, categories) {
  return { ...product, category: categoryNameById(categories, product.categoryId) };
}

function createInitialState() {
  const categories = clone(MOCK_CATEGORIES);
  const products = MOCK_PRODUCTS.map((product) => withCategoryLabel(clone(product), categories));
  return {
    products,
    categories,
    carts: {},
    orders: [],
    confirmations: {},
    adminTokens: [],
    nextIds: {
      product: products.reduce((max, product) => Math.max(max, product.id), 0) + 1,
      category: categories.reduce((max, category) => Math.max(max, category.id), 0) + 1,
      order: 1,
      cartItem: 1,
      form: 1,
      customer: 1,
    },
  };
}

function isValidState(state) {
  if (!state || typeof state !== 'object') return false;
  if (!Array.isArray(state.products) || !Array.isArray(state.categories)) return false;
  if (!state.carts || typeof state.carts !== 'object' || Array.isArray(state.carts)) return false;
  if (!Array.isArray(state.orders)) return false;
  if (!state.confirmations || typeof state.confirmations !== 'object' || Array.isArray(state.confirmations)) return false;
  if (!state.nextIds || typeof state.nextIds !== 'object') return false;
  const required = ['product', 'category', 'order', 'cartItem', 'form', 'customer'];
  if (!required.every((key) => Number.isFinite(state.nextIds[key]))) return false;
  return true;
}

function normalizeState(state) {
  const next = clone(state);
  if (!Array.isArray(next.adminTokens)) next.adminTokens = [];
  for (const product of next.products) {
    product.category = categoryNameById(next.categories, product.categoryId);
    if (product.imageUrl == null && product.image) product.imageUrl = product.image;
  }
  return next;
}

function readStorage() {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidState(parsed)) return null;
    return normalizeState(parsed);
  } catch {
    return null;
  }
}

function writeStorage(state) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* best effort for private mode / quota */
  }
}

/** @type {ReturnType<typeof createInitialState> | null} */
let memoryState = null;

export function getMockState() {
  if (!memoryState) {
    memoryState = readStorage() || createInitialState();
  }
  return memoryState;
}

export function saveMockState() {
  if (memoryState) writeStorage(memoryState);
}

export function resetMockState() {
  memoryState = createInitialState();
  saveMockState();
  return memoryState;
}

/** @internal test helper */
export function __setMockStateForTests(state) {
  memoryState = state;
}

export function slugify(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'categoria';
}

export function newCartId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `mock-cart-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ensureCart(cartId) {
  const state = getMockState();
  const trimmed = typeof cartId === 'string' ? cartId.trim() : '';
  const id = trimmed || newCartId();
  if (!state.carts[id]) {
    state.carts[id] = {
      items: [],
      checkout: null,
      paymentMethod: null,
    };
    saveMockState();
  }
  return id;
}

export function buildCartDto(cartId) {
  const state = getMockState();
  const cart = state.carts[cartId];
  if (!cart) {
    return { cartId, items: [], totalItems: 0, totalCents: 0 };
  }
  const items = cart.items.map((item) => {
    const product = state.products.find((entry) => entry.id === item.productId);
    const priceCents = product ? product.priceCents : item.priceCents;
    const title = product?.title ?? item.title;
    const description = product?.description ?? item.description;
    const image = product ? (product.imageUrl || product.image || null) : item.image;
    return {
      id: item.id,
      productId: item.productId,
      title,
      description,
      priceCents,
      image,
      quantity: item.quantity,
      subtotalCents: priceCents * item.quantity,
    };
  });
  return {
    cartId,
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalCents: items.reduce((sum, item) => sum + item.subtotalCents, 0),
  };
}

export function toPublicProduct(product) {
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    priceCents: product.priceCents,
    image: product.imageUrl || product.image || null,
    category: product.category ?? null,
    categoryId: product.categoryId,
  };
}

export function toAdminProduct(product, categories = getMockState().categories) {
  return withCategoryLabel({
    id: product.id,
    title: product.title,
    description: product.description ?? null,
    priceCents: product.priceCents,
    imageUrl: product.imageUrl ?? product.image ?? null,
    hoverImageUrl: product.hoverImageUrl ?? null,
    stock: product.stock,
    active: product.active,
    categoryId: product.categoryId,
  }, categories);
}

export function registerMockAdminToken(token) {
  const state = getMockState();
  if (!state.adminTokens.includes(token)) {
    state.adminTokens.push(token);
    saveMockState();
  }
}

export function assertMockAdminToken(token) {
  if (typeof token !== 'string' || token.split('.').length !== 3 || !token.endsWith('.mock')) return false;
  const state = getMockState();
  if (!state.adminTokens.includes(token)) return false;
  try {
    const payloadPart = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadPart.padEnd(payloadPart.length + ((4 - (payloadPart.length % 4)) % 4), '=');
    const json = typeof globalThis.atob === 'function'
      ? globalThis.atob(padded)
      : Buffer.from(padded, 'base64').toString('utf8');
    const payload = JSON.parse(json);
    if (!payload || typeof payload.exp !== 'number') return false;
    return Math.floor(Date.now() / 1000) < payload.exp;
  } catch {
    return false;
  }
}
