// Cliente de API del frontend.
// Default en Vite: mock (demo sin backend). Modo API: VITE_DATA_MODE=api + VITE_API_URL.

import { isMockMode } from './dataMode.js';
import {
  mockFetchProducts,
  mockFetchCategories,
  mockGetCart,
  mockAddItemToCart,
  mockUpdateCartItem,
  mockDeleteCartItem,
  mockPostCheckout,
  mockGetPaymentMethods,
  mockPostPaymentMethod,
  mockPostConfirmOrder,
  mockPostPublicForm,
} from '../mocks/publicApi.js';

const ENV = (import.meta as any).env || {};
const ENV_API = ENV.VITE_API_URL;
const IS_DEV = !!ENV.DEV;
export const API_URL = ENV_API ?? '';

async function fetchWithFallback(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err: any) {
    const isNetworkErr = err && (err.name === 'TypeError' || /fetch|network|failed/i.test(String(err.message || '')));
    const isDevRelativeApi = IS_DEV && API_URL === '' && input.startsWith('/api');
    if (isNetworkErr && isDevRelativeApi) {
      const fallback = `http://127.0.0.1:5050${input}`;
      return await fetch(fallback, init);
    }
    throw err;
  }
}

export interface ApiProduct {
  id: number;
  title: string;
  description?: string | null;
  priceCents: number;
  image?: string | null;
  category?: string | null;
  categoryId?: number;
}

export async function fetchProducts(): Promise<ApiProduct[]> {
  if (isMockMode()) return mockFetchProducts();
  try {
    const res = await fetchWithFallback(`${API_URL}/api/productos`);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error al obtener productos: ${res.status} ${text}`);
    }
    return res.json();
  } catch (err) {
    throw { error: `No se pudo conectar al backend (${API_URL}). Verificá que el servidor esté corriendo.` };
  }
}

export interface ApiCartItem {
  id: number;
  productId: number;
  title: string;
  description?: string | null;
  priceCents: number;
  image?: string | null;
  quantity: number;
  subtotalCents: number;
}

export interface ApiCart {
  cartId: string;
  items: ApiCartItem[];
  totalItems: number;
  totalCents: number;
}

function rethrowMockCartError(err: unknown): never {
  if (err && typeof err === 'object' && 'status' in err && 'body' in err) {
    const body = (err as { body?: { error?: string } }).body;
    throw { error: body?.error || 'Error en el carrito' };
  }
  throw err;
}

export async function getCart(cartId?: string | null): Promise<ApiCart> {
  if (isMockMode()) {
    try { return await mockGetCart(cartId); }
    catch (err) { rethrowMockCartError(err); }
  }
  try {
    const q = cartId ? `?cartId=${encodeURIComponent(cartId)}` : '';
    const res = await fetchWithFallback(`${API_URL}/api/carrito${q}`);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error al obtener carrito: ${res.status} ${text}`);
    }
    return res.json();
  } catch (err) {
    throw { error: `No se pudo conectar al backend (${API_URL}). Verificá que el servidor esté corriendo.` };
  }
}

export async function addItemToCart(
  productId: number,
  quantity = 1,
  cartId?: string | null,
): Promise<ApiCart> {
  if (isMockMode()) {
    try { return await mockAddItemToCart(productId, quantity, cartId); }
    catch (err) { rethrowMockCartError(err); }
  }
  try {
    const q = cartId ? `?cartId=${encodeURIComponent(cartId)}` : '';
    const res = await fetchWithFallback(`${API_URL}/api/carrito${q}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error al agregar al carrito: ${res.status} ${text}`);
    }
    return res.json();
  } catch (err) {
    throw { error: `No se pudo conectar al backend (${API_URL}). Verificá que el servidor esté corriendo.` };
  }
}

export async function updateCartItem(
  cartItemId: number,
  quantity: number,
  cartId?: string | null,
): Promise<ApiCart> {
  if (isMockMode()) {
    try { return await mockUpdateCartItem(cartItemId, quantity, cartId); }
    catch (err) { rethrowMockCartError(err); }
  }
  try {
    const q = cartId ? `?cartId=${encodeURIComponent(cartId)}` : '';
    const res = await fetchWithFallback(`${API_URL}/api/carrito/${cartItemId}${q}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error al modificar item: ${res.status} ${text}`);
    }
    return res.json();
  } catch (err) {
    throw { error: `No se pudo conectar al backend (${API_URL}). Verificá que el servidor esté corriendo.` };
  }
}

export interface CheckoutPayload {
  nombre: string;
  telefono: string;
  direccion: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
}

export type CheckoutFailure =
  | { kind: 'http'; status: number; body: Record<string, unknown> }
  | { kind: 'pre-dispatch' }
  | { kind: 'transport' }
  | { kind: 'invalid-success' };

export class CheckoutApiError extends Error {
  failure: CheckoutFailure;

  constructor(failure: CheckoutFailure) {
    super(failure.kind === 'transport' ? 'Checkout transport failed' : 'Checkout request failed');
    this.failure = failure;
  }
}

function rethrowMockCheckout(err: unknown): never {
  if (err && typeof err === 'object' && 'status' in err && 'body' in err) {
    const mockErr = err as { status: number; body: Record<string, unknown> };
    throw new CheckoutApiError({ kind: 'http', status: mockErr.status, body: mockErr.body || {} });
  }
  throw new CheckoutApiError({ kind: 'transport' });
}

async function checkoutRequest<T>(path: string, init: RequestInit, retryTransport = true, invalidSuccessIsAmbiguous = false): Promise<T> {
  try {
    const res = retryTransport
      ? await fetchWithFallback(`${API_URL}${path}`, init)
      : await fetch(`${API_URL}${path}`, init);
    if (!res.ok) {
      const body = await res.json().catch(async () => ({ error: await res.text().catch(() => '') }));
      throw new CheckoutApiError({ kind: 'http', status: res.status, body });
    }
    try {
      return await res.json();
    } catch {
      if (invalidSuccessIsAmbiguous) throw new CheckoutApiError({ kind: 'invalid-success' });
      throw new CheckoutApiError({ kind: 'transport' });
    }
  } catch (error) {
    if (error instanceof CheckoutApiError) throw error;
    throw new CheckoutApiError({ kind: 'transport' });
  }
}

export async function postCheckout(
  payload: CheckoutPayload,
  cartId?: string | null,
) {
  if (isMockMode()) {
    try { return await mockPostCheckout(payload, cartId); }
    catch (err) { rethrowMockCheckout(err); }
  }
  const q = cartId ? `?cartId=${encodeURIComponent(cartId)}` : '';
  return checkoutRequest<{ cartId?: string }>(`/api/checkout${q}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
}

export type PaymentMethodChoice = 'efectivo' | 'transferencia';
export type PaymentMethodCode = 'CASH' | 'TRANSFER';
export interface BankDetails { alias: string; cbu: string; titular: string; }
export interface PaymentMethodOptions { methods: PaymentMethodCode[]; bank: BankDetails | null; }

export function getPaymentMethods(): Promise<PaymentMethodOptions> {
  if (isMockMode()) return mockGetPaymentMethods();
  return checkoutRequest('/api/payment-method', { method: 'GET' });
}

export async function postPaymentMethod(
  method: PaymentMethodChoice,
  cartId?: string | null,
) {
  if (isMockMode()) {
    try { return await mockPostPaymentMethod(method, cartId); }
    catch (err) { rethrowMockCheckout(err); }
  }
  const q = cartId ? `?cartId=${encodeURIComponent(cartId)}` : '';
  return checkoutRequest<{ cartId?: string; method: PaymentMethodChoice; bank?: BankDetails | null }>(`/api/payment-method${q}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method }),
  });
}

export interface ConfirmOrderResponseItem {
  productId: number;
  quantity: number;
  priceCents: number;
  subtotalCents: number;
}

export interface ConfirmOrderResponse {
  orderId: number;
  orderNumber: string;
  totalCents: number;
  paymentMethod: PaymentMethodChoice;
  items: ConfirmOrderResponseItem[];
  customer: {
    id: number;
    nombre: string;
    telefono: string;
    direccion: string;
    localidad: string;
    provincia: string;
    codigoPostal: string;
  };
}

export function postConfirmOrder(cartId?: string | null, confirmationKey?: string): Promise<ConfirmOrderResponse> {
  if (!confirmationKey) return Promise.reject(new CheckoutApiError({ kind: 'pre-dispatch' }));
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return Promise.reject(new CheckoutApiError({ kind: 'pre-dispatch' }));
  }
  if (isMockMode()) {
    return mockPostConfirmOrder(cartId, confirmationKey).catch((err) => rethrowMockCheckout(err));
  }
  let request: Promise<Response>;
  try {
    request = fetch(`${API_URL}/api/orders/confirm${cartId ? `?cartId=${encodeURIComponent(cartId)}` : ''}`, {
      method: 'POST',
      headers: { 'Idempotency-Key': confirmationKey },
    });
  } catch {
    return Promise.reject(new CheckoutApiError({ kind: 'pre-dispatch' }));
  }
  return request.then(async (res) => {
    if (!res.ok) {
      throw new CheckoutApiError({
        kind: 'http',
        status: res.status,
        body: await res.json().catch(async () => ({ error: await res.text().catch(() => '') })),
      });
    }
    try { return await res.json(); }
    catch { throw new CheckoutApiError({ kind: 'invalid-success' }); }
  }, () => { throw new CheckoutApiError({ kind: 'transport' }); });
}

export async function deleteCartItem(
  cartItemId: number,
  cartId?: string | null,
): Promise<ApiCart> {
  if (isMockMode()) {
    try { return await mockDeleteCartItem(cartItemId, cartId); }
    catch (err) { rethrowMockCartError(err); }
  }
  try {
    const q = cartId ? `?cartId=${encodeURIComponent(cartId)}` : '';
    const res = await fetchWithFallback(`${API_URL}/api/carrito/${cartItemId}${q}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error al eliminar item: ${res.status} ${text}`);
    }
    return res.json();
  } catch (err) {
    throw { error: `No se pudo conectar al backend (${API_URL}). Verificá que el servidor esté corriendo.` };
  }
}

export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  activeProductCount: number;
}

export interface PublicFormResponse {
  ok: true;
  id: number;
}

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  phone?: string;
}

export interface JobApplicationPayload {
  fullName: string;
  email: string;
  position: string;
  phone?: string;
  message?: string;
  cvUrl?: string;
}

export interface FranchiseLeadPayload {
  fullName: string;
  email: string;
  city: string;
  phone?: string;
  message?: string;
}

export interface PublicApiError {
  error: string;
  errors?: string[];
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  if (isMockMode()) return mockFetchCategories();
  const res = await fetchWithFallback(`${API_URL}/api/categories`);
  if (!res.ok) {
    const data: PublicApiError = await res.json().catch(async () => ({ error: await res.text().catch(() => '') }));
    throw data;
  }
  return res.json();
}

async function postPublicForm(
  path: string,
  payload: Record<string, unknown>,
): Promise<PublicFormResponse> {
  if (isMockMode()) return mockPostPublicForm();
  const res = await fetchWithFallback(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data: PublicApiError = await res.json().catch(async () => ({ error: await res.text().catch(() => '') }));
    throw data;
  }
  return res.json();
}

export function postContact(payload: ContactPayload): Promise<PublicFormResponse> {
  return postPublicForm('/api/contact', payload as unknown as Record<string, unknown>);
}

export function postJobApplication(payload: JobApplicationPayload): Promise<PublicFormResponse> {
  return postPublicForm('/api/jobs/applications', payload as unknown as Record<string, unknown>);
}

export function postFranchiseLead(payload: FranchiseLeadPayload): Promise<PublicFormResponse> {
  return postPublicForm('/api/franchise/leads', payload as unknown as Record<string, unknown>);
}
