import { MOCK_BANK } from './fixtures.js';
import {
  buildCartDto,
  ensureCart,
  getMockState,
  saveMockState,
  toPublicProduct,
} from './store.js';

function delay(result) {
  return Promise.resolve(result);
}

function httpError(status, body) {
  const error = new Error(body?.error || 'Mock HTTP error');
  error.status = status;
  error.body = body;
  throw error;
}

export function mockFetchProducts() {
  const { products } = getMockState();
  return delay(products.filter((product) => product.active).map(toPublicProduct));
}

export function mockFetchCategories() {
  const { categories, products } = getMockState();
  return delay(
    categories
      .filter((category) => category.active !== false)
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        activeProductCount: products.filter((product) => product.active && product.categoryId === category.id).length,
      })),
  );
}

export function mockGetCart(cartId) {
  const id = ensureCart(cartId);
  return delay(buildCartDto(id));
}

export function mockAddItemToCart(productId, quantity = 1, cartId) {
  const state = getMockState();
  const product = state.products.find((entry) => entry.id === productId && entry.active);
  if (!product) httpError(404, { error: 'Producto no encontrado' });
  if (!Number.isFinite(quantity) || quantity < 1) httpError(400, { error: 'Cantidad inválida' });
  if (product.stock < quantity) httpError(400, { error: 'Stock insuficiente', insufficientStock: [productId] });

  const id = ensureCart(cartId);
  const cart = state.carts[id];
  const existing = cart.items.find((item) => item.productId === productId);
  if (existing) {
    const nextQty = existing.quantity + quantity;
    if (product.stock < nextQty) httpError(400, { error: 'Stock insuficiente', insufficientStock: [productId] });
    existing.quantity = nextQty;
  } else {
    cart.items.push({
      id: state.nextIds.cartItem++,
      productId: product.id,
      title: product.title,
      description: product.description,
      priceCents: product.priceCents,
      image: product.imageUrl,
      quantity,
    });
  }
  saveMockState();
  return delay(buildCartDto(id));
}

export function mockUpdateCartItem(cartItemId, quantity, cartId) {
  const state = getMockState();
  const id = ensureCart(cartId);
  const cart = state.carts[id];
  const item = cart.items.find((entry) => entry.id === cartItemId);
  if (!item) httpError(404, { error: 'Ítem no encontrado' });
  if (!Number.isFinite(quantity) || quantity < 1) httpError(400, { error: 'Cantidad inválida' });
  const product = state.products.find((entry) => entry.id === item.productId);
  if (!product || !product.active) httpError(400, { error: 'Producto no disponible', inactiveProducts: [item.productId] });
  if (product.stock < quantity) httpError(400, { error: 'Stock insuficiente', insufficientStock: [item.productId] });
  item.quantity = quantity;
  saveMockState();
  return delay(buildCartDto(id));
}

export function mockDeleteCartItem(cartItemId, cartId) {
  const state = getMockState();
  const id = ensureCart(cartId);
  const cart = state.carts[id];
  const index = cart.items.findIndex((entry) => entry.id === cartItemId);
  if (index < 0) httpError(404, { error: 'Ítem no encontrado' });
  cart.items.splice(index, 1);
  saveMockState();
  return delay(buildCartDto(id));
}

export function mockPostCheckout(payload, cartId) {
  const required = ['nombre', 'telefono', 'direccion', 'localidad', 'provincia', 'codigoPostal'];
  const missing = required.filter((field) => !String(payload?.[field] || '').trim());
  if (missing.length) {
    httpError(400, { error: 'Completá los campos requeridos.', missing });
  }
  const id = ensureCart(cartId);
  const cart = getMockState().carts[id];
  cart.checkout = {
    nombre: String(payload.nombre).trim(),
    telefono: String(payload.telefono).trim(),
    direccion: String(payload.direccion).trim(),
    localidad: String(payload.localidad).trim(),
    provincia: String(payload.provincia).trim(),
    codigoPostal: String(payload.codigoPostal).trim(),
  };
  saveMockState();
  return delay({ cartId: id });
}

export function mockGetPaymentMethods() {
  return delay({
    methods: ['CASH', 'TRANSFER'],
    bank: { ...MOCK_BANK },
  });
}

export function mockPostPaymentMethod(method, cartId) {
  if (method !== 'efectivo' && method !== 'transferencia') {
    httpError(400, { error: 'Método de pago inválido' });
  }
  const id = ensureCart(cartId);
  const cart = getMockState().carts[id];
  cart.paymentMethod = method;
  saveMockState();
  return delay({
    cartId: id,
    method,
    bank: method === 'transferencia' ? { ...MOCK_BANK } : null,
  });
}

export function mockPostConfirmOrder(cartId, confirmationKey) {
  const state = getMockState();
  const replay = state.confirmations[confirmationKey];
  if (replay?.response) {
    if (cartId && replay.cartId !== cartId) {
      httpError(409, { error: 'Idempotency-Key no corresponde al carrito' });
    }
    return delay(cloneResponse(replay.response));
  }
  if (replay?.status === 'pending') {
    httpError(409, { error: 'Confirmación en curso. Reintentá en unos segundos.' });
  }

  if (!cartId || !state.carts[cartId]) httpError(404, { error: 'Carrito no encontrado' });
  const cart = state.carts[cartId];
  if (!cart.items.length) httpError(400, { error: 'El carrito está vacío' });
  if (!cart.checkout) httpError(400, { error: 'Completá los campos requeridos.', missing: ['nombre', 'telefono', 'direccion', 'localidad', 'provincia', 'codigoPostal'] });
  if (!cart.paymentMethod) httpError(400, { error: 'Seleccioná un método de pago' });

  const inactiveProducts = [];
  const insufficientStock = [];
  for (const item of cart.items) {
    const product = state.products.find((entry) => entry.id === item.productId);
    if (!product || !product.active) inactiveProducts.push(item.productId);
    else if (product.stock < item.quantity) insufficientStock.push(item.productId);
  }
  if (inactiveProducts.length || insufficientStock.length) {
    httpError(400, {
      error: 'Hay productos que ya no están disponibles.',
      inactiveProducts,
      insufficientStock,
    });
  }

  const orderId = state.nextIds.order++;
  const customerId = state.nextIds.customer++;
  const orderNumber = `DEMO-${String(orderId).padStart(5, '0')}`;
  const pricedItems = cart.items.map((item) => {
    const product = state.products.find((entry) => entry.id === item.productId);
    const priceCents = product.priceCents;
    return {
      productId: item.productId,
      productTitle: product.title,
      quantity: item.quantity,
      priceCents,
      subtotalCents: priceCents * item.quantity,
    };
  });
  const items = pricedItems.map(({ productId, quantity, priceCents, subtotalCents }) => ({
    productId,
    quantity,
    priceCents,
    subtotalCents,
  }));
  const totalCents = items.reduce((sum, item) => sum + item.subtotalCents, 0);
  const now = new Date().toISOString();

  // Claim the idempotency key before mutating durable demo state.
  state.confirmations[confirmationKey] = { cartId, status: 'pending' };

  for (const item of cart.items) {
    const product = state.products.find((entry) => entry.id === item.productId);
    product.stock -= item.quantity;
  }

  const contact = {
    id: customerId,
    name: cart.checkout.nombre,
    phone: cart.checkout.telefono,
    address: cart.checkout.direccion,
    city: cart.checkout.localidad,
    province: cart.checkout.provincia,
    postalCode: cart.checkout.codigoPostal,
  };

  state.orders.unshift({
    id: orderId,
    orderNumber,
    status: 'PENDING',
    totalCents,
    paymentMethod: cart.paymentMethod === 'transferencia' ? 'TRANSFER' : 'CASH',
    paymentStatus: 'PENDING',
    contact,
    items: pricedItems,
    createdAt: now,
    updatedAt: now,
  });

  const response = {
    orderId,
    orderNumber,
    totalCents,
    paymentMethod: cart.paymentMethod,
    items,
    customer: {
      id: customerId,
      nombre: cart.checkout.nombre,
      telefono: cart.checkout.telefono,
      direccion: cart.checkout.direccion,
      localidad: cart.checkout.localidad,
      provincia: cart.checkout.provincia,
      codigoPostal: cart.checkout.codigoPostal,
    },
  };

  state.confirmations[confirmationKey] = { cartId, response: cloneResponse(response) };
  cart.items = [];
  cart.checkout = null;
  cart.paymentMethod = null;
  saveMockState();
  return delay(response);
}

function cloneResponse(value) {
  return JSON.parse(JSON.stringify(value));
}

export function mockPostPublicForm() {
  const state = getMockState();
  const id = state.nextIds.form++;
  saveMockState();
  return delay({ ok: true, id });
}
