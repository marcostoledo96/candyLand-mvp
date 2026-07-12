// Pure carousel navigation logic shared by HeroCarousel.
// Extracted so behavior is unit-testable without a DOM/renderer.
// No dependencies — stdlib only.

export function nextIndex(current, count) {
  const last = Math.max(0, count - 1);
  if (count <= 1) return 0;
  return current >= last ? 0 : current + 1;
}

export function prevIndex(current, count) {
  const last = Math.max(0, count - 1);
  if (count <= 1) return 0;
  return current <= 0 ? last : current - 1;
}

export function goToIndex(target, count) {
  const last = Math.max(0, count - 1);
  return Math.max(0, Math.min(target, last));
}