import { MOCK_CATEGORIES, MOCK_PRODUCTS } from './fixtures.js';

const STORAGE_KEY = 'candyland.mock.v1';

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

function readStorage() {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
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
  const id = cartId && state.carts[cartId] ? cartId : newCartId();
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
  const items = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    title: item.title,
    description: item.description,
    priceCents: item.priceCents,
    image: item.image,
    quantity: item.quantity,
    subtotalCents: item.priceCents * item.quantity,
  }));
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

export function assertMockAdminToken(token) {
  return typeof token === 'string' && token.split('.').length === 3 && token.endsWith('.mock');
}
