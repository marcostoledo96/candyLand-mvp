/** @typedef {'efectivo' | 'transferencia'} PaymentMethod */
/** @typedef {{nombre:string, telefono:string, direccion:string, localidad:string, provincia:string, codigoPostal:string}} CheckoutData */

export const CHECKOUT_FIELDS = ["nombre", "telefono", "direccion", "localidad", "provincia", "codigoPostal"];
const CONFIRMATION_KEY_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const emptyCheckoutData = () => ({ nombre: "", telefono: "", direccion: "", localidad: "", provincia: "", codigoPostal: "" });
const fieldLabels = { nombre: "nombre", telefono: "teléfono", direccion: "dirección", localidad: "localidad", provincia: "provincia", codigoPostal: "código postal" };

/** @param {unknown} raw @returns {CheckoutData} */
export function normalizeCheckoutData(raw) {
  let value = raw;
  if (typeof raw === "string") {
    try { value = JSON.parse(raw); } catch { return emptyCheckoutData(); }
  }
  if (!value || typeof value !== "object") return emptyCheckoutData();
  const data = /** @type {Record<string, unknown>} */ (value);
  return {
    nombre: String(data.nombre || "").trim(),
    telefono: String(data.telefono || "").trim(),
    direccion: String(data.direccion || "").trim(),
    localidad: String(data.localidad || data.ciudad || "").trim(),
    provincia: String(data.provincia || "").trim(),
    codigoPostal: String(data.codigoPostal || "").trim(),
  };
}

/** @param {unknown} input @returns {CheckoutData} */
export function buildCheckoutPayload(input) {
  return normalizeCheckoutData(input);
}

/** @param {CheckoutData} data */
export function validateCheckout(data) {
  /** @type {Record<string, string>} */
  const errors = {};
  for (const field of CHECKOUT_FIELDS) {
    if (!data[field]) errors[field] = `Ingresá tu ${fieldLabels[field]}.`;
  }
  return errors;
}

/** @param {unknown} method @returns {{method: PaymentMethod} | null} */
export function buildPaymentPayload(method) {
  return method === "efectivo" || method === "transferencia" ? { method } : null;
}

/** @param {'checkout'|'payment'|'confirm'} step @param {string | null | undefined} cartId */
export function checkoutUrl(step, cartId) {
  const path = { checkout: "/api/checkout", payment: "/api/payment-method", confirm: "/api/orders/confirm" }[step];
  return cartId ? `${path}?cartId=${encodeURIComponent(cartId)}` : path;
}

/** @param {{randomUUID?: () => string, getRandomValues?: (bytes: Uint8Array) => Uint8Array} | undefined} cryptoApi */
export function createConfirmationKey(cryptoApi = globalThis.crypto) {
  if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();
  if (typeof cryptoApi?.getRandomValues !== "function") throw new Error("Secure crypto is unavailable");
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** @param {unknown} value */
export function isConfirmationKey(value) {
  return typeof value === "string" && value.length === 36 && CONFIRMATION_KEY_RE.test(value);
}

/** @param {unknown} raw @param {string} cartId @param {Parameters<typeof createConfirmationKey>[0]} cryptoApi */
export function getConfirmationAttempt(raw, cartId, cryptoApi) {
  let saved = null;
  try { saved = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { saved = null; }
  if (saved && typeof saved === "object" && saved.cartId === cartId && isConfirmationKey(saved.key)) return { cartId, key: saved.key };
  return { cartId, key: createConfirmationKey(cryptoApi) };
}

/** @param {{kind:string, status?:number, body?:any}} failure */
export function classifyCheckoutFailure(failure) {
  if (failure.kind === "pre-dispatch") return { kind: "preDispatch", message: "No se pudo iniciar la confirmación. Revisá tu conexión e intentá nuevamente.", fields: {}, action: "retry" };
  if (failure.kind === "transport") return { kind: "transport", message: "No se pudo conectar al backend. Revisá tu conexión e intentá nuevamente.", fields: {}, action: "retry" };
  if (failure.kind === "invalid-success") return { kind: "rejected", message: "No pudimos verificar el resultado de tu pedido. Conservamos tu carrito para que puedas reintentar.", fields: {}, action: "retry" };
  const { status, body = {} } = failure;
  if (status === 400 && Array.isArray(body.missing)) {
    const fields = Object.fromEntries(body.missing.filter((field) => CHECKOUT_FIELDS.includes(field)).map((field) => [field, `Ingresá tu ${fieldLabels[field]}.`]));
    return { kind: "rejected", message: "Completá los campos requeridos.", fields, action: "address" };
  }
  if (status === 400 && (Array.isArray(body.inactiveProducts) || Array.isArray(body.insufficientStock))) {
    return { kind: "rejected", message: body.error || "Hay productos que ya no están disponibles.", fields: {}, action: "cart" };
  }
  if (status === 404 || status === 409) return { kind: "rejected", message: body.error || "Tu carrito cambió o ya no está disponible. Revisalo antes de continuar.", fields: {}, action: "cart" };
  return { kind: "rejected", message: body.error || "No se pudo procesar tu solicitud. Conservamos tus datos para que puedas intentarlo nuevamente.", fields: {}, action: "retry" };
}

/** @param {unknown} value */
export function isCompleteConfirmResponse(value) {
  if (!value || typeof value !== "object") return false;
  const order = /** @type {any} */ (value);
  const customer = order.customer;
  return Number.isFinite(order.orderId) && typeof order.orderNumber === "string" && Number.isFinite(order.totalCents)
    && (order.paymentMethod === "efectivo" || order.paymentMethod === "transferencia") && Array.isArray(order.items)
    && customer && Number.isFinite(customer.id) && CHECKOUT_FIELDS.every((field) => typeof customer[field] === "string");
}

/** @param {{state:'ready'|'pending'|'preDispatch'|'rejected'|'succeeded', order?:any}} current @param {{type:'submit'|'reject'|'preDispatch'|'ambiguous'|'succeed', order?:any}} event */
export function confirmationTransition(current, event) {
  if (event.type === "submit") return current.state === "ready" || current.state === "preDispatch" || current.state === "rejected" ? { state: "pending" } : current;
  if (current.state !== "pending") return current;
  if (event.type === "reject") return { state: "rejected" };
  if (event.type === "preDispatch") return { state: "preDispatch" };
  if (event.type === "ambiguous") return { state: "rejected" };
  return event.type === "succeed" && isCompleteConfirmResponse(event.order) ? { state: "succeeded", order: event.order } : { state: "rejected" };
}

/** @param {{state:string, order?:unknown}} confirmation */
export function shouldClearCheckout(confirmation) {
  return confirmation.state === "succeeded" && isCompleteConfirmResponse(confirmation.order);
}
