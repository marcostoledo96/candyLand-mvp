// Pure product-status decision logic used by Nuestros Productos on the home page.
// Extracted so the loading/error/empty/success decision is unit-testable.
// No dependencies — stdlib only.

export const SLIDES = [
  {
    src: '/img/slide1.webp',
    alt: 'Caramelos y golosinas surtidos de CandyLand',
    caption: 'Sabores que enamoran',
  },
  {
    src: '/img/slide2.webp',
    alt: 'Gomitas y chocolates destacados de CandyLand',
    caption: 'Novedades cada semana',
  },
  {
    src: '/img/slide3.webp',
    alt: 'Combos de golosinas para compartir en CandyLand',
    caption: 'Para compartir',
  },
];

// Home page shows at most 6 product cards (per 7e.5.5 contract).
export const MAX_SHOWN = 6;

/**
 * Decide which render state Nuestros Productos should show.
 * @param {{products: unknown[], error: string|null|''|undefined, loaded?: boolean}} input
 * @returns {'loading'|'error'|'empty'|'success'}
 */
export function decideProductStatus({ products, error, loaded }) {
  if (error) return 'error';
  // Before the first successful/failed load completes, show loading.
  if (!loaded) return 'loading';
  return Array.isArray(products) && products.length > 0 ? 'success' : 'empty';
}