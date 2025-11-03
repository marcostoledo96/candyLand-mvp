// Detecta URL base para la API
// Prioridad:
// 1) VITE_API_URL si está definido
// 2) En modo DEV de Vite, usar base relativa ('') para aprovechar el proxy /api
// 3) Caso contrario, usar http://localhost:3000
const ENV = (import.meta as any).env || {};
const ENV_API = ENV.VITE_API_URL;
const IS_DEV = !!ENV.DEV; // true cuando corre con Vite en desarrollo (cualquier puerto)
export const API_URL = ENV_API ?? (IS_DEV ? '' : 'http://localhost:3000');

// Fetch con fallback: si estamos en DEV y el proxy /api falla por conexión,
// intenta directo contra http://127.0.0.1:3000
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

export async function postCheckout(
  payload: CheckoutPayload,
  cartId?: string | null
) {
  try {
    const q = cartId ? `?cartId=${encodeURIComponent(cartId)}` : "";
    const res = await fetchWithFallback(`${API_URL}/api/checkout${q}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(async () => ({ error: await res.text().catch(() => "") }));
      throw data;
    }
    return res.json();
  } catch (err) {
    throw { error: `No se pudo conectar al backend (${API_URL}). Verificá que el servidor esté corriendo.` };
  }
}

// Método de pago
export type PaymentMethodChoice = 'efectivo' | 'transferencia';

export async function postPaymentMethod(
  method: PaymentMethodChoice,
  cartId?: string | null
) {
  try {
    const q = cartId ? `?cartId=${encodeURIComponent(cartId)}` : "";
    const res = await fetchWithFallback(`${API_URL}/api/payment-method${q}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
    });
    if (!res.ok) {
      const data = await res.json().catch(async () => ({ error: await res.text().catch(() => "") }));
      throw data;
    }
    return res.json();
  } catch (err) {
    throw { error: `No se pudo conectar al backend (${API_URL}). Verificá que el servidor esté corriendo.` };
  }
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

export async function postConfirmOrder(cartId?: string | null): Promise<ConfirmOrderResponse> {
  try {
    const q = cartId ? `?cartId=${encodeURIComponent(cartId)}` : "";
  const res = await fetchWithFallback(`${API_URL}/api/orders/confirm${q}`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(async () => ({ error: await res.text().catch(() => "") }));
      throw data;
    }
    return res.json();
  } catch (err) {
    throw { error: `No se pudo conectar al backend (${API_URL}). Verificá que el servidor esté corriendo.` };
  }
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
