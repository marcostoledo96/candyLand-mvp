// Static contract assertions for the public-routes frontend slice.
//
// No frontend test runner exists in this project; this script is the smallest
// practical build-time check (RED-GREEN) for scenario-level contracts:
//   - every public route declared in App.tsx
//   - Header exposes every nav link
//   - Footer has zero '#' placeholder anchors
//   - Trabaja page has zero file inputs
//   - Menu page has no '/producto/:id' links
//
// Run: npm run assert:public-routes
// Fatal static contract check — exits 0 on success and 1 on failure.
// When a real runner (Vitest/Jest) is available, port these to that runner.

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

console.log('assert-public-routes: start');

// --- App.tsx: routes ---
const appPath = src('App.tsx');
check('App.tsx exists', existsSync(appPath));
if (existsSync(appPath)) {
  const app = read(appPath);
  const requiredRoutes = [
    { path: '/menu', name: 'MenuPage' },
    { path: '/tutoriales', name: 'TutorialesPage' },
    { path: '/franquicias', name: 'FranquiciasPage' },
    { path: '/trabaja-con-nosotros', name: 'TrabajaPage' },
    { path: '/catalogo', name: 'CatalogPage' },
    { path: '/contacto', name: 'Contacto' },
  ];
  for (const r of requiredRoutes) {
    check(`App.tsx declares route ${r.path}`, app.includes(`"${r.path}"`), `missing path "${r.path}"`);
  }
  // aliases /tienda and /nuestros-dulces -> CatalogPage
  check('App.tsx has /tienda alias to CatalogPage', app.includes('"/tienda"') && app.includes('CatalogPage'));
  check('App.tsx has /nuestros-dulces alias to CatalogPage', app.includes('"/nuestros-dulces"') && app.includes('CatalogPage'));
  // /checkout alias -> AddressForm
  check('App.tsx has /checkout alias to AddressForm', app.includes('"/checkout"') && app.includes('AddressForm'));
  // Forbidden: no /producto/:id route
  check('App.tsx has NO /producto/:id route', !app.includes('/producto/:id'));
  // Lazy imports for new pages
  for (const name of ['MenuPage', 'TutorialesPage', 'FranquiciasPage', 'TrabajaPage']) {
    check(`App.tsx lazy-imports ${name}`, app.includes(name) && app.includes('lazy'), `missing ${name}`);
  }
}

// --- src/lib/api.ts: public helpers ---
const apiPath = src('lib/api.ts');
check('src/lib/api.ts exists', existsSync(apiPath));
if (existsSync(apiPath)) {
  const api = read(apiPath);
  check('api.ts exports ApiCategory type', /export\s+interface\s+ApiCategory\b/.test(api));
  check('api.ts exports PublicFormResponse type', /export\s+interface\s+PublicFormResponse\b/.test(api));
  check('api.ts exports ContactPayload type', /export\s+interface\s+ContactPayload\b/.test(api));
  check('api.ts exports JobApplicationPayload type', /export\s+interface\s+JobApplicationPayload\b/.test(api));
  check('api.ts exports FranchiseLeadPayload type', /export\s+interface\s+FranchiseLeadPayload\b/.test(api));
  check('api.ts exports fetchCategories()', /export\s+async\s+function\s+fetchCategories\b/.test(api));
  check('api.ts exports postContact()', /export\s+(async\s+)?function\s+postContact\b/.test(api));
  check('api.ts exports postJobApplication()', /export\s+(async\s+)?function\s+postJobApplication\b/.test(api));
  check('api.ts exports postFranchiseLead()', /export\s+(async\s+)?function\s+postFranchiseLead\b/.test(api));
  check('api.ts hits /api/categories', api.includes('/api/categories'));
  check('api.ts hits /api/contact', api.includes('/api/contact'));
  check('api.ts hits /api/jobs/applications', api.includes('/api/jobs/applications'));
  check('api.ts hits /api/franchise/leads', api.includes('/api/franchise/leads'));
}

// --- Header.tsx: nav parity ---
const headerPath = src('components/Header/Header.tsx');
check('Header.tsx exists', existsSync(headerPath));
if (existsSync(headerPath)) {
  const header = read(headerPath);
  const navLinks = [
    ['/', 'Home'],
    ['/catalogo', 'Tienda'],
    ['/menu', 'Menu'],
    ['/tutoriales', 'Tutoriales'],
    ['/franquicias', 'Franquicias'],
    ['/trabaja-con-nosotros', 'Trabaja'],
    ['/contacto', 'Contacto'],
    ['/carrito', 'Carrito'],
  ];
  for (const [path] of navLinks) {
    check(`Header links to ${path}`, header.includes(`to="${path}"`), `missing to="${path}"`);
  }
  check('Header has no "#" anchors', !/\shref="#"/.test(header) && !/to="#"/.test(header));
}

// --- Footer.tsx: no fake newsletter, no # anchors ---
const footerPath = src('components/Footer/Footer.tsx');
check('Footer.tsx exists', existsSync(footerPath));
if (existsSync(footerPath)) {
  const footer = read(footerPath);
  check('Footer has no "#" anchors', !/href="#"/.test(footer) && !/to="#"/.test(footer));
  // Newsletter fake submit removed: no <input type="text/email"> inside footer with a subscribe button
  const hasNewsletterInputs = /type="email"/.test(footer) && /Suscribir/.test(footer);
  check('Footer has no fake newsletter submit', !hasNewsletterInputs, 'remove newsletter inputs+button or render as static copy');
  // Footer links should be Link or inert labeled spans
  const footerLinks = ['/', '/menu', '/tutoriales', '/franquicias', '/trabaja-con-nosotros', '/contacto'];
  for (const path of footerLinks) {
    check(`Footer references ${path}`, footer.includes(path), `missing ${path}`);
  }
}

// --- MenuPage: no /producto/:id, has states ---
const menuPath = src('pages/Menu/MenuPage.tsx');
check('MenuPage.tsx exists', existsSync(menuPath));
if (existsSync(menuPath)) {
  const menu = read(menuPath);
  check('MenuPage calls fetchCategories', menu.includes('fetchCategories'));
  check('MenuPage filters activeProductCount > 0', /activeProductCount\s*>\s*0/.test(menu));
  check('MenuPage has NO /producto/:id links', !/to=["'`]\s*\/producto\//.test(menu) && !/href=["'`]\s*\/producto\//.test(menu));
  check('MenuPage has loading state', /loading/i.test(menu) || /status/.test(menu));
  check('MenuPage has error state', /error/i.test(menu));
  check('MenuPage has retry', /reintent/i.test(menu) || /retry/i.test(menu) || /Recargar/.test(menu) || /Reintentar/.test(menu));
  check('MenuPage has empty state', /vac[ií]o|empty|sin categor/i.test(menu));
}

// --- TutorialesPage: static, no network ---
const tutPath = src('pages/Tutoriales/TutorialesPage.tsx');
check('TutorialesPage.tsx exists', existsSync(tutPath));
if (existsSync(tutPath)) {
  const tut = read(tutPath);
  check('TutorialesPage imports tutorial assets', /tutorial[1-6]/.test(tut));
  check('TutorialesPage makes NO fetch', !/fetch\(|fetchWithFallback|postContact|postJob|postFranchise/.test(tut));
  check('TutorialesPage has alt text on images', /alt=/.test(tut));
}

// --- Contacto: posts to /api/contact ---
const contactPath = src('components/Contact/Contacto.tsx');
check('Contacto.tsx exists', existsSync(contactPath));
if (existsSync(contactPath)) {
  const contact = read(contactPath);
  check('Contacto calls postContact', contact.includes('postContact'));
  check('Contacto maps nombre->name', /name\b/.test(contact));
  check('Contacto maps mensaje->message', /message\b/.test(contact));
  check('Contacto has aria-live status', /aria-live/.test(contact));
  check('Contacto disables submit while loading', /disabled/.test(contact));
  // No alert() success — real status UI
  check('Contacto does not use alert() for success', !/alert\(/.test(contact));
}

// --- FranquiciasPage ---
const franPath = src('pages/Franquicias/FranquiciasPage.tsx');
check('FranquiciasPage.tsx exists', existsSync(franPath));
if (existsSync(franPath)) {
  const fran = read(franPath);
  check('FranquiciasPage calls postFranchiseLead', fran.includes('postFranchiseLead'));
  check('FranquiciasPage has fullName field', /fullName/.test(fran));
  check('FranquiciasPage has city field (required)', /city/.test(fran));
  check('FranquiciasPage has aria-live status', /aria-live/.test(fran));
  check('FranquiciasPage disables submit while loading', /disabled/.test(fran));
}

// --- TrabajaPage: no file input ---
const trabajaPath = src('pages/Trabaja/TrabajaPage.tsx');
check('TrabajaPage.tsx exists', existsSync(trabajaPath));
if (existsSync(trabajaPath)) {
  const trabaja = read(trabajaPath);
  check('TrabajaPage calls postJobApplication', trabaja.includes('postJobApplication'));
  check('TrabajaPage has fullName field', /fullName/.test(trabaja));
  check('TrabajaPage has position field (required)', /position/.test(trabaja));
  check('TrabajaPage has optional cvUrl text field', /cvUrl/.test(trabaja));
  check('TrabajaPage has NO file input', !/type="file"/.test(trabaja) && !/type='file'/.test(trabaja));
  check('TrabajaPage has aria-live status', /aria-live/.test(trabaja));
  check('TrabajaPage disables submit while loading', /disabled/.test(trabaja));
}

console.log(`\nassert-public-routes: ${failures === 0 ? 'PASS' : `${failures} FAIL`}`);
process.exit(failures === 0 ? 0 : 1);
