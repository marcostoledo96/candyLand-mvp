// Behavioral tests for the home-redesign slice (7e).
//
// Strict TDD durable runtime test. Uses only Node stdlib (node:test + node:assert)
// — no new dependencies. These tests IMPORT AND EXECUTE production code:
//   - carouselNav: the pure index-transition logic used by HeroCarousel
//   - productStatus: the pure status decision used by Nuestros Productos
// Rendering/integration is covered separately by the Playwright runtime smoke
// and the assert-home-redesign.mjs static contract; this file owns the
// behavioral unit layer that the verify gate flagged as missing.
//
// Run: npm test
// Run this file only: node --test test/home-redesign.test.mjs

import { test } from 'node:test';
import { strictEqual, throws } from 'node:assert';
import {
  nextIndex,
  prevIndex,
  goToIndex,
} from '../src/components/HeroCarousel/carouselNav.js';
import {
  beginProductLoad,
  decideProductStatus,
  SLIDES,
  MAX_SHOWN,
} from '../src/lib/productStatus.js';
import { normalizeProductImage } from '../src/lib/productImage.js';

// ---------------------------------------------------------------------------
// Carousel navigation (production logic shared by HeroCarousel buttons/keys)
// ---------------------------------------------------------------------------

test('nextIndex wraps from last to 0', () => {
  strictEqual(nextIndex(2, 3), 0);
});

test('nextIndex advances within bounds', () => {
  strictEqual(nextIndex(0, 3), 1);
  strictEqual(nextIndex(1, 3), 2);
});

test('nextIndex on single slide stays at 0', () => {
  strictEqual(nextIndex(0, 1), 0);
});

test('prevIndex wraps from 0 to last', () => {
  strictEqual(prevIndex(0, 3), 2);
});

test('prevIndex decrements within bounds', () => {
  strictEqual(prevIndex(2, 3), 1);
  strictEqual(prevIndex(1, 3), 0);
});

test('prevIndex on single slide stays at 0', () => {
  strictEqual(prevIndex(0, 1), 0);
});

test('goToIndex clamps above lastIndex', () => {
  strictEqual(goToIndex(5, 3), 2);
});

test('goToIndex clamps below 0', () => {
  strictEqual(goToIndex(-1, 3), 0);
});

test('goToIndex preserves in-bounds index', () => {
  strictEqual(goToIndex(1, 3), 1);
});

// ---------------------------------------------------------------------------
// Product status decision (production logic used by Nuestros Productos)
// ---------------------------------------------------------------------------

test('decideProductStatus returns loading when no products and no error', () => {
  strictEqual(decideProductStatus({ products: [], error: null }), 'loading');
});

test('decideProductStatus returns error when error is present', () => {
  strictEqual(
    decideProductStatus({ products: [], error: 'backend down' }),
    'error',
  );
});

test('decideProductStatus returns empty when products is [] and no error', () => {
  strictEqual(decideProductStatus({ products: [], error: '', loaded: true }), 'empty');
});

test('decideProductStatus returns success for a non-empty product list', () => {
  strictEqual(
    decideProductStatus({ products: [{ id: 1 }], error: null, loaded: true }),
    'success',
  );
});

test('decideProductStatus prefers error over empty/loaded', () => {
  strictEqual(
    decideProductStatus({ products: [], error: '500', loaded: true }),
    'error',
  );
});

test('beginProductLoad restores pending state for retries', () => {
  const pending = beginProductLoad({ error: 'backend down', loaded: true });
  strictEqual(pending.error, '');
  strictEqual(pending.loaded, false);
  strictEqual(decideProductStatus({ products: [], ...pending }), 'loading');
});

test('normalizeProductImage resolves public filenames and preserves valid URLs', () => {
  strictEqual(normalizeProductImage('golosina1.jpg'), '/img/golosina1.jpg');
  strictEqual(normalizeProductImage('/img/golosina1.jpg'), '/img/golosina1.jpg');
  strictEqual(normalizeProductImage('https://cdn.example.com/candy.jpg'), 'https://cdn.example.com/candy.jpg');
  strictEqual(normalizeProductImage('http://cdn.example.com/candy.jpg'), 'http://cdn.example.com/candy.jpg');
  strictEqual(normalizeProductImage('data:image/png;base64,abc'), 'data:image/png;base64,abc');
  strictEqual(normalizeProductImage(''), '');
  strictEqual(normalizeProductImage(null), '');
});

test('SLIDES constant exposes the 3 home slides', () => {
  strictEqual(SLIDES.length, 3);
  for (const s of SLIDES) {
    if (typeof s.src !== 'string' || typeof s.alt !== 'string' || typeof s.caption !== 'string') {
      throw new Error('each slide must have src/alt/caption strings');
    }
  }
});

test('MAX_SHOWN caps the rendered product cards', () => {
  strictEqual(MAX_SHOWN, 6);
});

// ---------------------------------------------------------------------------
// Guard: a visible label must fit within the carousel control (regression
// for the clipping WARNING — the fix must keep real text labels, not hide
// them). This imports the CSS and checks the relevant rule is present.
// ---------------------------------------------------------------------------

test('carousel control CSS no longer fixes a 44px width that clips text', async () => {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const { dirname, join } = await import('node:path');
  const here = dirname(fileURLToPath(import.meta.url));
  const css = readFileSync(join(here, '..', 'src', 'components', 'HeroCarousel', 'HeroCarousel.module.css'), 'utf8');
  // The fix must remove the fixed 44px width AND keep a real text label in the
  // component source (checked by assert-home-redesign). A fixed 44px width
  // that clips "Anterior"/"Siguiente" is the regression we prevent.
  // Match `width: 44px` but NOT `min-width: 44px` (the touch target we keep).
  if (/\.ctrlBtn\s*\{[^}]*[^-]\bwidth:\s*44px/.test(css)) {
    throw new Error('.ctrlBtn still uses a fixed 44px width that clips labels');
  }
  // min-height preserves the 44px touch target without clipping width.
  if (!/min-height:\s*44px/.test(css)) {
    throw new Error('.ctrlBtn must keep a 44px min-height touch target');
  }
});

test('carousel root has a visible focus indicator', async () => {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const { dirname, join } = await import('node:path');
  const here = dirname(fileURLToPath(import.meta.url));
  const css = readFileSync(join(here, '..', 'src', 'components', 'HeroCarousel', 'HeroCarousel.module.css'), 'utf8');
  if (!/\.carousel:focus-visible\s*\{[^}]*outline:/s.test(css)) {
    throw new Error('.carousel must expose a visible focus outline');
  }
});
