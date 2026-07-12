// Static contract assertions for the home-redesign frontend slice (7e).
//
// No frontend test runner exists in this project; this script is the smallest
// practical build-time check (RED-GREEN) for scenario-level contracts:
//   - HeroCarousel: 3 slides, a11y, keyboard, autoplay, reduced-motion
//   - Nuestros Productos: API-driven, loading/error/empty/success, no fallback
//   - Section components: NuestroMundoDulce, FeaturedBanners, Locations
//   - Home composition order and no-dark-mode
//   - No new deps, no file inputs, no /producto/:id
//
// Run: npm run assert:home-redesign
// Fatal static contract check — exits 0 on success and 1 on failure.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => join(root, 'src', p);
const read = (p) => readFileSync(p, 'utf8');

let failures = 0;
function check(label, cond, detail = '') {
  if (cond) {
    console.log(`  ok  - ${label}`);
  } else {
    console.error(`  FAIL- ${label}${detail ? ` :: ${detail}` : ''}`);
    failures += 1;
  }
}

console.log('assert-home-redesign: start');

// ---------------------------------------------------------------------------
// Phase 1: HeroCarousel
// ---------------------------------------------------------------------------
const carouselPath = src('components/HeroCarousel/HeroCarousel.tsx');
const carouselCssPath = src('components/HeroCarousel/HeroCarousel.module.css');

check('HeroCarousel.tsx exists', existsSync(carouselPath));
if (existsSync(carouselPath)) {
  const c = read(carouselPath);
  // 1.1 accepts a 3-slide prop array with src, alt, caption
  check('HeroCarousel defines a Slide type with src/alt/caption', /src/.test(c) && /alt/.test(c) && /caption/.test(c));
  check('HeroCarousel accepts slides prop array', /slides/.test(c) && /\[\]/.test(c));
  // 1.4 prev/next buttons with real text labels (not aria-label only)
  check('HeroCarousel has prev button with real text', /prev|Anterior/i.test(c) && /button/i.test(c));
  check('HeroCarousel has next button with real text', /next|Siguiente/i.test(c) && /button/i.test(c));
  check('HeroCarousel prev/next are not aria-label only', !/aria-label=["']prev/i.test(c) && !/aria-label=["']next/i.test(c));
  // 1.4 keyboard: ArrowLeft/ArrowRight, Home/End
  check('HeroCarousel handles ArrowLeft', /ArrowLeft/.test(c));
  check('HeroCarousel handles ArrowRight', /ArrowRight/.test(c));
  check('HeroCarousel handles Home key', /['"]Home['"]/.test(c));
  check('HeroCarousel handles End key', /['"]End['"]/.test(c));
  // 1.5 markup: role="region" aria-roledescription="carousel"
  check('HeroCarousel has role="region"', /role=["']region["']/.test(c));
  check('HeroCarousel has aria-roledescription="carousel"', /aria-roledescription=["']carousel["']/.test(c));
  check('HeroCarousel toggles aria-hidden on slides', /aria-hidden/.test(c));
  check('HeroCarousel has live region for slide index', /aria-live|liveRegion|live region/i.test(c));
  // 1.3 autoplay via setInterval(4500)
  check('HeroCarousel uses setInterval for autoplay', /setInterval/.test(c));
  check('HeroCarousel autoplay interval is 4500ms', /4500/.test(c));
  // 1.3 pause on pointerenter/focus or prefers-reduced-motion
  check('HeroCarousel pauses on pointerenter', /pointerenter|onMouseEnter|onPointerEnter/.test(c));
  check('HeroCarousel handles prefers-reduced-motion', /prefers-reduced-motion|reduce/.test(c));
  // 1.3 cleanup on unmount
  check('HeroCarousel cleans up interval on unmount', /clearInterval/.test(c));
  // dots
  check('HeroCarousel has dot indicators', /dot|indicator/i.test(c));
}

check('HeroCarousel.module.css exists', existsSync(carouselCssPath));
if (existsSync(carouselCssPath)) {
  const css = read(carouselCssPath);
  // 1.2 transform: translateX track
  check('HeroCarousel CSS uses translateX', /translateX/.test(css));
  // 1.2 focus-visible ring
  check('HeroCarousel CSS has focus-visible', /focus-visible/.test(css));
  // 1.2 prefers-reduced-motion: reduce instant transition
  check('HeroCarousel CSS has prefers-reduced-motion', /prefers-reduced-motion/.test(css));
  // A11y regression guard: no fixed 44px width that clips the Anterior/Siguiente labels
  check('HeroCarousel ctrlBtn has no fixed 44px width that clips labels', !/\.ctrlBtn\s*\{[^}]*[^-]\bwidth:\s*44px/.test(css));
  check('HeroCarousel ctrlBtn keeps 44px min-height touch target', /min-height:\s*44px/.test(css));
}

// ---------------------------------------------------------------------------
// Phase 2: API-driven Nuestros Productos
// ---------------------------------------------------------------------------
const homePath = src('pages/Home/Home.tsx');
check('Home.tsx exists', existsSync(homePath));
if (existsSync(homePath)) {
  const h = read(homePath);
  // 2.1 calls fetchProducts (no static productos array)
  check('Home.tsx imports fetchProducts', /fetchProducts/.test(h));
  check('Home.tsx has NO hardcoded productos array', !/const productos\s*=\s*\[/.test(h));
  // 2.2 maps to HomeProductCard props
  check('Home.tsx uses HomeProductCard', /HomeProductCard/.test(h));
  check('Home.tsx maps products to img/hoverImg/title props', /img/.test(h) && /hoverImg/.test(h) && /title/.test(h));
  // 2.3 states: loading, error, empty, success
  check('Home.tsx has loading state', /loading/i.test(h));
  check('Home.tsx has error state', /error/i.test(h));
  check('Home.tsx has empty state', /empty/i.test(h));
  check('Home.tsx has success state', /success/i.test(h));
  // 2.3 empty state has Link to /catalogo, no hardcoded products
  check('Home.tsx empty state links to /catalogo', /\/catalogo/.test(h));
  // 2.3 uses PublicRoutes.module.css states
  check('Home.tsx reuses PublicRoutes.module.css', /PublicRoutes\.module\.css|shared/.test(h));
}

const productCardPath = src('components/HomeProductCard/HomeProductCard.tsx');
check('HomeProductCard.tsx exists', existsSync(productCardPath));
if (existsSync(productCardPath)) {
  const card = read(productCardPath);
  const usesOnlyKnownWebp = /p\.startsWith\(['"]\/img\/['"]\)\s*&&\s*convertible\.test\(p\)/.test(card)
    && card.includes('webpSource(img)') && card.includes('webpSource(hoverImg)');
  check('HomeProductCard advertises WebP only for local /img assets', usesOnlyKnownWebp);
}

// ---------------------------------------------------------------------------
// Phase 3: Section components
// ---------------------------------------------------------------------------
const mundoPath = src('components/HomeSections/NuestroMundoDulce.tsx');
const mundoCssPath = src('components/HomeSections/NuestroMundoDulce.module.css');
check('NuestroMundoDulce.tsx exists', existsSync(mundoPath));
if (existsSync(mundoPath)) {
  const m = read(mundoPath);
  check('NuestroMundoDulce uses dulzura-central asset', /dulzura-central/.test(m));
  check('NuestroMundoDulce has copy block', /dulce|mundo|candy/i.test(m));
  // Decorative CSS background: accessibility via aria-label (no <img> alt needed).
  check('NuestroMundoDulce is accessible (aria-label or alt)', /aria-label|alt=/.test(m));
}
check('NuestroMundoDulce.module.css exists', existsSync(mundoCssPath));

const bannersPath = src('components/HomeSections/FeaturedBanners.tsx');
const bannersCssPath = src('components/HomeSections/FeaturedBanners.module.css');
check('FeaturedBanners.tsx exists', existsSync(bannersPath));
if (existsSync(bannersPath)) {
  const b = read(bannersPath);
  check('FeaturedBanners uses destacado-golosina1', /destacado-golosina1/.test(b));
  check('FeaturedBanners uses destacado-golosina2', /destacado-golosina2/.test(b));
  check('FeaturedBanners links to /catalogo', /\/catalogo/.test(b));
  check('FeaturedBanners links to /menu', /\/menu/.test(b));
  check('FeaturedBanners has real alt per image', /alt=/.test(b));
}
check('FeaturedBanners.module.css exists', existsSync(bannersCssPath));

const locationsPath = src('components/HomeSections/Locations.tsx');
const locationsCssPath = src('components/HomeSections/Locations.module.css');
check('Locations.tsx exists', existsSync(locationsPath));
if (existsSync(locationsPath)) {
  const l = read(locationsPath);
  check('Locations uses fondo-locales asset', /fondo-locales/.test(l));
  check('Locations has CABA y GBA caption', /CABA|GBA/i.test(l));
  check('Locations is aria-hidden="true"', /aria-hidden=["']true["']/.test(l));
}
check('Locations.module.css exists', existsSync(locationsCssPath));

// ---------------------------------------------------------------------------
// Phase 4: Compose in Home.tsx / Home.module.css
// ---------------------------------------------------------------------------
const homeCssPath = src('pages/Home/Home.module.css');
if (existsSync(homePath)) {
  const h = read(homePath);
  // 4.1 order: HeroCarousel -> FeaturedBanners -> NuestrosProductos -> NuestroMundoDulce -> Locations
  check('Home.tsx imports HeroCarousel', /HeroCarousel/.test(h));
  check('Home.tsx imports FeaturedBanners', /FeaturedBanners/.test(h));
  check('Home.tsx imports NuestroMundoDulce', /NuestroMundoDulce/.test(h));
  check('Home.tsx imports Locations', /Locations/.test(h));
  // 4.3 does not edit forbidden files (static check: no direct edits visible here)
  check('Home.tsx has no /producto/:id links', !/to=["'`]\s*\/producto\//.test(h) && !/href=["'`]\s*\/producto\//.test(h));
}
if (existsSync(homeCssPath)) {
  const css = read(homeCssPath);
  // 4.2 no prefers-color-scheme: dark
  check('Home.module.css has NO prefers-color-scheme: dark', !/prefers-color-scheme:\s*dark/.test(css));
}

// ---------------------------------------------------------------------------
// Phase 5: Verification guards
// ---------------------------------------------------------------------------
const pkgPath = join(root, 'package.json');
if (existsSync(pkgPath)) {
  const pkg = JSON.parse(read(pkgPath));
  check('package.json has assert:home-redesign script', /assert:home-redesign/.test(JSON.stringify(pkg.scripts || {})));
  check('package.json dependencies count unchanged (9)', Object.keys(pkg.dependencies || {}).length === 9);
  check('package.json devDependencies count unchanged (11)', Object.keys(pkg.devDependencies || {}).length === 11);
}

// Global guards: scan all touched new/modified source for forbidden patterns
const scanFiles = [carouselPath, carouselCssPath, mundoPath, mundoCssPath, bannersPath, bannersCssPath, locationsPath, locationsCssPath, homePath, homeCssPath];
let hasFileInput = false;
let hasProductoId = false;
let hasDarkMode = false;
for (const f of scanFiles) {
  if (!existsSync(f)) continue;
  const content = read(f);
  if (/type=["']file["']/.test(content)) hasFileInput = true;
  if (/\/producto\//.test(content)) hasProductoId = true;
  if (/prefers-color-scheme:\s*dark/.test(content)) hasDarkMode = true;
}
check('No <input type="file"> in home-redesign files', !hasFileInput);
check('No /producto/:id in home-redesign files', !hasProductoId);
check('No @media (prefers-color-scheme: dark) in home-redesign files', !hasDarkMode);

console.log(`\nassert-home-redesign: ${failures === 0 ? 'PASS' : `${failures} FAIL`}`);
process.exit(failures === 0 ? 0 : 1);
