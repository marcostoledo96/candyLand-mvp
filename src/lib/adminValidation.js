/** @typedef {{ ok: true, cents: number } | { ok: false, error: string }} PriceResult */

const FIELD_NAMES = new Set(['title', 'priceCents', 'stock', 'categoryId', 'imageUrl', 'hoverImageUrl', 'description', 'active']);
const IMAGE_DATA_URL = /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i;

function formatPriceCents(priceCents) {
  const cents = String(priceCents);
  const decimals = cents.padStart(3, '0').slice(-2).replace(/0$/, '');
  return decimals ? `${cents.length > 2 ? cents.slice(0, -2) : '0'}.${decimals}` : cents.slice(0, -2) || '0';
}

/** @param {{title:string,description?:string|null,priceCents:number,stock:number,categoryId:number,imageUrl?:string|null,hoverImageUrl?:string|null,active:boolean}|undefined} product */
export function productFormFields(product) {
  if (!product) return { title: '', description: '', price: '', stock: '0', categoryId: '', imageUrl: '', hoverImageUrl: '', active: true };
  return { title: product.title, description: product.description ?? '', price: formatPriceCents(product.priceCents), stock: String(product.stock), categoryId: String(product.categoryId), imageUrl: product.imageUrl ?? '', hoverImageUrl: product.hoverImageUrl ?? '', active: product.active };
}

/** @param {unknown} input @param {number|undefined} originalPriceCents @returns {PriceResult} */
export function parsePriceInput(input, originalPriceCents) {
  if ((typeof input !== 'string' && typeof input !== 'number') || String(input).trim() === '') return { ok: false, error: 'Ingresá un precio entero en pesos.' };
  const value = String(input).trim();
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) return { ok: false, error: 'El precio debe ser un número entero en pesos.' };
  const cents = BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) return { ok: false, error: 'El precio no es válido.' };
  if (match[2] && cents !== BigInt(originalPriceCents ?? -1)) return { ok: false, error: 'El precio debe ser un número entero en pesos.' };
  return { ok: true, cents: Number(cents) };
}

/** @param {unknown} value */
export function isSafeAdminImageUrl(value) {
  if (value == null || value === '') return true;
  if (typeof value !== 'string' || value !== value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' || IMAGE_DATA_URL.test(value);
  } catch {
    return IMAGE_DATA_URL.test(value);
  }
}

/** @param {Record<string, unknown>} input */
export function validateProductPayload(input, originalPriceCents) {
  const fields = {};
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) fields.title = 'El título es obligatorio.';
  const price = parsePriceInput(input.price, originalPriceCents);
  if (!price.ok) fields.price = price.error;
  const stock = Number(input.stock);
  if (String(input.stock ?? '').trim() === '' || !Number.isInteger(stock) || stock < 0) fields.stock = 'El stock debe ser un entero igual o mayor a cero.';
  const categoryId = Number(input.categoryId);
  if (!Number.isInteger(categoryId) || categoryId <= 0) fields.categoryId = 'Elegí una categoría válida.';
  if (typeof input.active !== 'boolean') fields.active = 'El estado debe ser válido.';
  for (const key of ['imageUrl', 'hoverImageUrl']) if (!isSafeAdminImageUrl(input[key])) fields[key] = 'Ingresá una URL de imagen segura.';
  if (Object.keys(fields).length) return { ok: false, fields };
  const optional = (value) => typeof value === 'string' && value.trim() ? value.trim() : null;
  return { ok: true, value: { title, priceCents: price.cents, stock, categoryId, active: input.active, description: optional(input.description), imageUrl: optional(input.imageUrl), hoverImageUrl: optional(input.hoverImageUrl) } };
}

/** @param {unknown} body @param {number} status */
export function extractApiError(body, status) {
  const value = body && typeof body === 'object' ? body : {};
  const summary = Array.isArray(value.errors) ? value.errors.filter((item) => typeof item === 'string') : [];
  const message = status === 401 ? 'Credenciales inválidas' : status >= 500 ? 'Error del servidor' : typeof value.error === 'string' ? value.error : status === 0 ? 'No se pudo conectar al backend' : 'No se pudo guardar el producto';
  const fields = {};
  for (const item of summary) {
    const prefix = item.split(':', 1)[0];
    if (FIELD_NAMES.has(prefix)) fields[prefix] = item;
  }
  if (message === 'categoryId does not exist') fields.categoryId = message;
  return { message, fields, summary };
}
