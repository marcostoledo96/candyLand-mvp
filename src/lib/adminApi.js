// Admin API client — auth + read + deactivate/reactivate only.
// Form-related methods (create/update/getProduct/listCategories) are deferred
// to follow-up branch frontend/admin-product-form.
//
// Exported as .js so node:test can import directly (matching carouselNav.js).

import { expireAdminSession, AdminAuthError } from './adminAuth.js';
import { extractApiError } from './adminValidation.js';

const ENV = (import.meta || {}).env || {};
const API_URL = ENV.VITE_API_URL ?? '';
const IS_DEV = !!ENV.DEV;

async function fetchAdmin(input, init) {
  try {
    return await fetch(input, init);
  } catch (err) {
    const isNetworkErr = err && (err.name === 'TypeError' || /fetch|network|failed/i.test(String(err.message || '')));
    const isDevRelativeApi = IS_DEV && API_URL === '' && input.startsWith('/api');
    if (isNetworkErr && isDevRelativeApi) {
      try { return await fetch(`http://127.0.0.1:5050${input}`, init); } catch { /* fall through */ }
    }
    if (isNetworkErr) throw new AdminApiError('No se pudo conectar al backend', [], 0);
    throw err;
  }
}

export class AdminApiError extends Error {
  constructor(message, fields = [], status = 0) {
    super(message);
    this.name = 'AdminApiError';
    this.fields = fields;
    this.status = status;
  }
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function isAccountStatusVerificationFailure(body) {
  return body?.error === 'Unable to verify account status';
}

async function adminRequest(token, path, init = {}) {
  const res = await fetchAdmin(`${API_URL}${path}`, { ...init, headers: authHeader(token) });
  if (res.status === 204) return undefined;
  if (res.ok) return res.json();
  const body = await res.json().catch(async () => ({ error: await res.text().catch(() => '') }));
  if (res.status === 401 && !isAccountStatusVerificationFailure(body)) {
    expireAdminSession();
    throw new AdminAuthError('Sesión expirada');
  }
  const error = extractApiError(body, res.status);
  throw new AdminApiError(error.message, error.summary, res.status);
}

export async function loginAdmin({ email, password }) {
  const res = await fetchAdmin(`${API_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) return res.json();
  if (res.status === 401) throw new AdminAuthError('Credenciales inválidas');
  const body = await res.json().catch(async () => ({ error: await res.text().catch(() => '') }));
  throw new AdminApiError(body.error || 'Error en el login', Array.isArray(body.errors) ? body.errors : [], res.status);
}

export async function getAdminMe(token) {
  return adminRequest(token, '/api/admin/me');
}

export async function listAdminProducts(token) {
  return adminRequest(token, '/api/admin/products');
}

export async function deactivateAdminProduct(token, id) {
  return adminRequest(token, `/api/admin/products/${id}`, { method: 'DELETE' });
}

export async function reactivateAdminProduct(token, id) {
  return adminRequest(token, `/api/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify({ active: true }) });
}

/** @typedef {{ id:number, title:string, description?:string|null, priceCents:number, imageUrl?:string|null, hoverImageUrl?:string|null, stock:number, active:boolean, categoryId:number, category?:string|null }} AdminProduct */
/** @typedef {{ id:number, name:string, slug:string, active:boolean }} AdminCategory */
/** @typedef {'PENDING'|'SHIPPED'|'DELIVERED'|'CANCELLED'} AdminOrderStatus */
/** @typedef {{ productId:number, productTitle:string|null, quantity:number, priceCents:number, subtotalCents:number }} AdminOrderItem */
/** @typedef {{ id:number, name:string, phone:string, address:string, city:string, province:string, postalCode:string }} AdminOrderContact */
/** @typedef {{ id:number, orderNumber:string, status:AdminOrderStatus, totalCents:number, paymentMethod:'CASH'|'TRANSFER'|null, paymentStatus:string|null, contact:AdminOrderContact|null, items:AdminOrderItem[], createdAt:string, updatedAt:string }} AdminOrder */

export const ADMIN_ORDER_STATUSES = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export function formatAdminOrderStatus(status) {
  return { PENDING: 'Pendiente', SHIPPED: 'Enviado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado' }[status] ?? 'No disponible';
}

export function formatAdminOrderPayment(method) {
  return { CASH: 'Efectivo', TRANSFER: 'Transferencia' }[method] ?? 'No disponible';
}

function assertAdminOrderStatus(status) {
  if (!ADMIN_ORDER_STATUSES.includes(status)) throw new RangeError('Estado de pedido inválido');
}

export async function createAdminProduct(token, payload) {
  return adminRequest(token, '/api/admin/products', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateAdminProduct(token, id, payload) {
  return adminRequest(token, `/api/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function listAdminCategories(token) {
  return adminRequest(token, '/api/admin/categories');
}

export async function createAdminCategory(token, payload) {
  return adminRequest(token, '/api/admin/categories', { method: 'POST', body: JSON.stringify({ name: payload.name }) });
}

export async function updateAdminCategory(token, id, payload) {
  return adminRequest(token, `/api/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify({ name: payload.name }) });
}

export async function deleteAdminCategory(token, id) {
  return adminRequest(token, `/api/admin/categories/${id}`, { method: 'DELETE' });
}

export async function listAdminOrders(token, status) {
  if (status !== undefined) assertAdminOrderStatus(status);
  return adminRequest(token, `/api/admin/orders${status ? `?status=${encodeURIComponent(status)}` : ''}`);
}

export async function getAdminOrder(token, id) {
  return adminRequest(token, `/api/admin/orders/${id}`);
}

export async function updateAdminOrderStatus(token, id, status) {
  assertAdminOrderStatus(status);
  return adminRequest(token, `/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
}
