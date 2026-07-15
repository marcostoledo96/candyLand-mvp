// Cliente de API del frontend
// Nota para el equipo: en dev intentamos pegarle al proxy de Vite (base relativa),
// y si falla por algún motivo (proxy caído, puerto raro), reintentamos directo al backend local.
const ENV = (import.meta as any).env || {};
const ENV_API = ENV.VITE_API_URL;
const IS_DEV = !!ENV.DEV; // true cuando corre con Vite en desarrollo (cualquier puerto)
// En producción (Vercel) queremos base relativa para usar las serverless functions /api
export const API_URL = ENV_API ?? '';

// Fetch con fallback: si estamos en DEV y el proxy /api falla por conexión,
// intenta directo contra http://127.0.0.1:5050 (nuestro backend local por defecto)
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
  try {
  const res = await fetchWithFallback(`${API_URL}/api/productos`);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Error al obtener productos: ${res.status} ${text}`);
    }
    return res.json();
  } catch (err) {
    throw { error: `No se pudo conectar al backend (${API_URL}). Verificá que el servidor esté corriendo.` };
  }
}

// Carrito API
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

export async function getCart(cartId?: string | null): Promise<ApiCart> {
  try {
    const q = cartId ? `?cartId=${encodeURIComponent(cartId)}` : "";
  const res = await fetchWithFallback(`${API_URL}/api/carrito${q}`);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
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
  cartId?: string | null
): Promise<ApiCart> {
  try {
    const q = cartId ? `?cartId=${encodeURIComponent(cartId)}` : "";
    const res = await fetchWithFallback(`${API_URL}/api/carrito${q}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
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
  cartId?: string | null
): Promise<ApiCart> {
  try {
    const q = cartId ? `?cartId=${encodeURIComponent(cartId)}` : "";
    const res = await fetchWithFallback(`${API_URL}/api/carrito/${cartItemId}${q}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Error al modificar item: ${res.status} ${text}`);
    }
    return res.json();
  } catch (err) {
    throw { error: `No se pudo conectar al backend (${API_URL}). Verificá que el servidor esté corriendo.` };
  }
}

// Checkout API
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
  cartId?: string | null
) {
  const q = cartId ? `?cartId=${encodeURIComponent(cartId)}` : "";
  return checkoutRequest<{ cartId?: string }>(`/api/checkout${q}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
}

// Método de pago
export type PaymentMethodChoice = 'efectivo' | 'transferencia';

export async function postPaymentMethod(
  method: PaymentMethodChoice,
  cartId?: string | null
) {
  const q = cartId ? `?cartId=${encodeURIComponent(cartId)}` : "";
  return checkoutRequest<{ cartId?: string; method: PaymentMethodChoice; bank?: { alias: string; cbu: string; titular: string } | null }>(`/api/payment-method${q}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method }),
  });
}

// Confirmar orden
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
  const q = cartId ? `?cartId=${encodeURIComponent(cartId)}` : "";
  if (!confirmationKey) return Promise.reject(new CheckoutApiError({ kind: "pre-dispatch" }));
  if (typeof navigator !== "undefined" && navigator.onLine === false) return Promise.reject(new CheckoutApiError({ kind: "pre-dispatch" }));
  let request: Promise<Response>;
  try { request = fetch(`${API_URL}/api/orders/confirm${q}`, { method: "POST", headers: { "Idempotency-Key": confirmationKey } }); }
  catch { return Promise.reject(new CheckoutApiError({ kind: "pre-dispatch" })); }
  return request.then(async (res) => {
    if (!res.ok) throw new CheckoutApiError({ kind: "http", status: res.status, body: await res.json().catch(async () => ({ error: await res.text().catch(() => "") })) });
    try { return await res.json(); }
    catch { throw new CheckoutApiError({ kind: "invalid-success" }); }
  }, () => { throw new CheckoutApiError({ kind: "transport" }); });
}

export async function deleteCartItem(
  cartItemId: number,
  cartId?: string | null
): Promise<ApiCart> {
  try {
    const q = cartId ? `?cartId=${encodeURIComponent(cartId)}` : "";
    const res = await fetchWithFallback(`${API_URL}/api/carrito/${cartItemId}${q}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Error al eliminar item: ${res.status} ${text}`);
    }
    return res.json();
  } catch (err) {
    throw { error: `No se pudo conectar al backend (${API_URL}). Verificá que el servidor esté corriendo.` };
  }
}

// --- Public routes API (categories + public forms) ---
// Contracts match backend/routes/public.js (merged slice 7b).

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

// Shared normalized error shape for public endpoints.
export interface PublicApiError {
  error: string;
  errors?: string[];
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await fetchWithFallback(`${API_URL}/api/categories`);
  if (!res.ok) {
    const data: PublicApiError = await res.json().catch(async () => ({ error: await res.text().catch(() => "") }));
    throw data;
  }
  return res.json();
}

async function postPublicForm(
  path: string,
  payload: Record<string, unknown>,
): Promise<PublicFormResponse> {
  const res = await fetchWithFallback(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data: PublicApiError = await res.json().catch(async () => ({ error: await res.text().catch(() => "") }));
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
