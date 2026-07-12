export function normalizeProductImage(value) {
  const image = String(value || '').trim();
  if (!image || image.startsWith('/img/') || /^(https?:|data:)/i.test(image)) return image;
  return `/img/${image.replace(/^\/+/, '')}`;
}
