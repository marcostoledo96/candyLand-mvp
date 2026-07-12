// Static contract assertions for admin auth + products (slice 7f, narrowed).
// Verifies: admin routes, no Header/Footer, logout, 401 handling, no token
// logging, no dangerouslySetInnerHTML, no dark mode, no new deps.
// Run: npm run assert:admin-auth-products

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => join(root, 'src', p);
const read = (p) => readFileSync(p, 'utf8');
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

let failures = 0;
function check(label, cond, detail = '') {
  if (cond) { console.log(`  ok  - ${label}`); }
  else { console.error(`  FAIL- ${label}${detail ? ` :: ${detail}` : ''}`); failures += 1; }
}

console.log('assert-admin-auth-products: start');

// --- App.tsx routing ---
const app = read(src('App.tsx'));
check('App.tsx has /admin/login route', /path=["'`]\/admin\/login["'`]/.test(app));
check('App.tsx has /admin/productos route', /path=["'`]\/admin\/productos["'`]/.test(app));
check('App.tsx has protected /admin/categorias redirect', /path=["'`]\/admin\/categorias["'`][\s\S]*?<RequireAdminAuth>[\s\S]*?<Navigate to=["'`]\/admin\/productos["'`] replace \/>[\s\S]*?<\/RequireAdminAuth>/.test(app));
check('App.tsx has protected /admin/pedidos redirect', /path=["'`]\/admin\/pedidos["'`][\s\S]*?<RequireAdminAuth>[\s\S]*?<Navigate to=["'`]\/admin\/productos["'`] replace \/>[\s\S]*?<\/RequireAdminAuth>/.test(app));
check('App.tsx redirects /admin to /admin/productos', /\/admin["'`].*Navigate.*\/admin\/productos/.test(app.replace(/\s+/g, ' ')));
check('App.tsx imports RequireAdminAuth', /RequireAdminAuth/.test(app));
check('App.tsx imports AdminLayout', /import.*AdminLayout/.test(app));
check('App.tsx imports AdminLogin', /import.*AdminLogin/.test(app));
check('App.tsx has an accessible lazy-route fallback', /<Suspense fallback=\{<p role="status">Cargando…<\/p>\}>/.test(app));

const publicLayout = read(src('layout/Layout.tsx'));
check('Public Layout imports Outlet', /import\s*\{\s*Outlet\s*\}\s*from\s*["'`]react-router-dom["'`]/.test(publicLayout));
check('Public Layout renders nested route content between Header and Footer', /<Header\s*\/>[\s\S]*?<main><Outlet\s*\/><\/main>[\s\S]*?<Footer\s*\/>/.test(publicLayout));
check('Public Layout does not require children', !/children/.test(publicLayout));

// --- AdminLayout ---
const layoutPath = src('pages/Admin/AdminLayout.tsx');
if (existsSync(layoutPath)) {
  const l = read(layoutPath);
  check('AdminLayout does NOT import Header', !/import.*Header/.test(l));
  check('AdminLayout does NOT import Footer', !/import.*Footer/.test(l));
  check('AdminLayout has "Cerrar sesión" button', /Cerrar sesión/.test(l));
  check('AdminLayout calls clearAdminToken on logout', /clearAdminToken/.test(l));
  check('AdminLayout uses Outlet', /Outlet/.test(l));
  check('AdminLayout has aria-disabled nav', /aria-disabled/.test(l));
}
const layoutCssPath = src('pages/Admin/AdminLayout.module.css');
if (existsSync(layoutCssPath)) {
  const css = stripComments(read(layoutCssPath));
  check('AdminLayout.module.css NO prefers-color-scheme: dark', !/prefers-color-scheme:\s*dark/.test(css));
  check('AdminLayout.module.css has focus-visible', /focus-visible/.test(css));
}

// --- AdminLogin ---
const loginPath = src('pages/Admin/AdminLogin.tsx');
if (existsSync(loginPath)) {
  const lg = read(loginPath);
  check('AdminLogin uses PublicRoutes.module.css', /PublicRoutes\.module\.css/.test(lg));
  check('AdminLogin has autoComplete="current-password"', /current-password/.test(lg));
  check('AdminLogin has no alert()', !/alert\s*\(/.test(lg));
  check('AdminLogin calls loginAdmin', /loginAdmin/.test(lg));
  check('AdminLogin calls setAdminToken', /setAdminToken/.test(lg));
  check('AdminLogin does NOT import Header', !/import.*Header/.test(lg));
  check('AdminLogin does NOT import Footer', !/import.*Footer/.test(lg));
}

// --- RequireAdminAuth ---
const requirePath = src('components/Admin/RequireAdminAuth.tsx');
if (existsSync(requirePath)) {
  const r = read(requirePath);
  check('RequireAdminAuth calls getAdminMe', /getAdminMe/.test(r));
  check('RequireAdminAuth calls clearAdminToken on 401', /clearAdminToken/.test(r));
  check('RequireAdminAuth uses Navigate for redirect', /Navigate/.test(r));
  check('RequireAdminAuth does NOT import Header', !/import.*Header/.test(r));
  check('RequireAdminAuth does NOT import Footer', !/import.*Footer/.test(r));
}

// --- AdminProductsList ---
const listPath = src('pages/Admin/AdminProductsList.tsx');
if (existsSync(listPath)) {
  const lp = read(listPath);
  check('AdminProductsList calls listAdminProducts', /listAdminProducts/.test(lp));
  check('AdminProductsList calls deactivateAdminProduct', /deactivateAdminProduct/.test(lp));
  check('AdminProductsList calls reactivateAdminProduct', /reactivateAdminProduct/.test(lp));
  check('AdminProductsList has loading state', /loading/.test(lp));
  check('AdminProductsList has error state with role=alert', /role=["'`]alert["'`]/.test(lp));
  check('AdminProductsList has empty state', /empty/.test(lp) || /No hay productos/.test(lp));
  check('AdminProductsList never uses dangerouslySetInnerHTML', !/dangerouslySetInnerHTML/.test(lp));
  check('AdminProductsList does NOT import Header', !/import.*Header/.test(lp));
  check('AdminProductsList does NOT import Footer', !/import.*Footer/.test(lp));
  check('AdminProductsList has aria-live for mutations', /aria-live/.test(lp));
  check('AdminProductsList mounts AdminProductForm', /AdminProductForm/.test(lp));
  check('AdminProductsList has no "Próximamente" form stub', !/Crear producto — Próximamente|creación de productos estará disponible próximamente/i.test(lp));
}
const listCssPath = src('pages/Admin/AdminProductsList.module.css');
if (existsSync(listCssPath)) {
  const css = stripComments(read(listCssPath));
  check('AdminProductsList.module.css NO prefers-color-scheme: dark', !/prefers-color-scheme:\s*dark/.test(css));
  check('AdminProductsList.module.css has .badge styles', /badge/i.test(css));
  check('AdminProductsList.module.css has focus-visible', /focus-visible/.test(css));
}

// --- Pure helper modules exist (narrowed) ---
check('adminAuth.js exists', existsSync(src('lib/adminAuth.js')));
check('adminApi.js exists', existsSync(src('lib/adminApi.js')));
check('Playwright-MCP runtime smoke exists', existsSync(join(root, 'test', 'admin-auth-products.playwright.mjs')));
const formPath = src('pages/Admin/AdminProductForm.tsx');
const formCssPath = src('pages/Admin/AdminProductForm.module.css');
check('AdminProductForm exists', existsSync(formPath));
if (existsSync(formPath)) {
  const form = read(formPath);
  check('AdminProductForm uses native dialog', /<dialog/.test(form) && /showModal/.test(form));
  check('AdminProductForm has no file input', !/type="file"/.test(form));
  check('AdminProductForm has category select', /<select/.test(form) && /categoryId/.test(form));
  check('AdminProductForm validates and maps backend errors', /validateProductPayload/.test(form) && /extractApiError/.test(form));
  check('AdminProductForm has no detail endpoint', !/getAdminProduct|\/api\/admin\/products\//.test(form));
}
if (existsSync(formCssPath)) check('AdminProductForm CSS is light-only and has focus-visible', !/prefers-color-scheme:\s*dark/.test(stripComments(read(formCssPath))) && /focus-visible/.test(read(formCssPath)));

// --- Security: no console.log of token/sessionStorage ---
const adminFiles = [layoutPath, loginPath, requirePath, listPath, formPath, src('lib/adminApi.js'), src('lib/adminAuth.js')];
let hasTokenLog = false;
for (const f of adminFiles) {
  if (!existsSync(f)) continue;
  const content = read(f);
  if (/console\.(log|error|warn)\s*\([^)]*(adminToken|token|sessionStorage|getItem)/i.test(content)) hasTokenLog = true;
}
check('No console.log/error of token/sessionStorage values', !hasTokenLog);

// --- package.json: no new deps, assert script wired ---
const pkg = JSON.parse(read(join(root, 'package.json')));
check('package.json has assert:admin-auth-products script', /assert:admin-auth-products/.test(JSON.stringify(pkg.scripts || {})));
check('package.json has product form test/assert scripts', /test:admin-product-form/.test(JSON.stringify(pkg.scripts || {})) && /assert:admin-product-form/.test(JSON.stringify(pkg.scripts || {})));
check('package.json dependencies count unchanged (9)', Object.keys(pkg.dependencies || {}).length === 9);
check('package.json devDependencies count unchanged (11)', Object.keys(pkg.devDependencies || {}).length === 11);

console.log(`\nassert-admin-auth-products: ${failures === 0 ? 'PASS' : `${failures} FAIL`}`);
process.exit(failures === 0 ? 0 : 1);
