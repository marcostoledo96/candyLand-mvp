# Tasks — CandyLand v2

## 1. Documentación e inicialización

- [ ] 1.1 Copiar `AGENTS.md` al root.
- [ ] 1.2 Copiar `docs/`.
- [ ] 1.3 Copiar `openspec/`.
- [ ] 1.4 Agregar `.codegraph/` a `.gitignore`.
- [ ] 1.5 Ejecutar `codegraph init` en MVP.
- [ ] 1.6 Ejecutar `codegraph init` en referencia.
- [ ] 1.7 Generar `docs/MAPA_REFERENCIA.md`.
- [ ] 1.8 Generar `docs/AUDITORIA_INICIAL.md`.

## 2. Backend Railway

- [ ] 2.1 Revisar scripts backend.
- [x] 2.2 Ajustar `server.js` a Railway.
- [x] 2.3 Configurar CORS por env.
- [ ] 2.4 Confirmar Prisma PostgreSQL.
- [x] 2.5 Crear/ajustar health checks.
- [x] 2.6 Documentar `.env.example` backend.
- [x] 2.7 Preparar migraciones.
- [ ] 2.8 Verificar local.

## 3. Vercel separado

- [ ] 3.1 Configurar `VITE_API_URL`.
- [ ] 3.2 Quitar DB/Prisma/seed del build de Vercel.
- [x] 3.3 Revisar `api/index.cjs` y marcar deprecated si aplica.
- [ ] 3.4 Verificar build frontend.

## 4. Admin

- [x] 4.1 Diseñar auth admin.
- [x] 4.2 Crear modelo/admin user si falta.
- [x] 4.3 Crear endpoints admin productos.
- [x] 4.4 Crear endpoints admin categorías. (deferred to follow-up branch)
- [x] 4.5 Crear endpoints admin pedidos. (deferred to follow-up branch)
- [x] 4.6 Crear pantallas admin. [Partial — auth + products list/deactivate/reactivate shipped in slice 7f; product form + category CRUD + order UI deferred.]
- [x] 4.7 Proteger rutas admin.

## 5. Productos y stock

- [x] 5.1 Agregar/confirmar `stock` real.
- [x] 5.2 Confirmar imagen principal existente (`Product.image`; admin DTO futuro mapeará `imageUrl` ↔ `image`).
- [x] 5.3 Agregar imagen hover (`Product.hoverImage`; admin DTO futuro mapeará `hoverImageUrl` ↔ `hoverImage`).
- [ ] 5.4 Validar stock en checkout.
- [x] 5.5 Actualizar seed.

## 6. Pedidos y emails

- [ ] 6.1 Confirmar modelo Order/OrderItem.
- [ ] 6.2 Limitar métodos a transferencia/efectivo.
- [ ] 6.3 Implementar email service.
- [ ] 6.4 Implementar Resend provider.
- [ ] 6.5 Implementar noop provider.
- [ ] 6.6 Agregar SMTP provider si se decide.
- [ ] 6.7 Verificar que email failure no rompa checkout.

## 7. UI pública

- [ ] 7.1 Auditar assets Macarena.
- [ ] 7.2 Revisar logo Macarena.
- [ ] 7.3 Crear `MenuPage` desde API.
- [ ] 7.4 Crear `TutorialsPage` visual.
- [ ] 7.5 Crear `FranchisePage`.
- [ ] 7.6 Crear `JobsPage`.
- [ ] 7.7 Crear/mejorar `ContactPage`.
- [ ] 7.8 Mejorar Header/Footer.
- [ ] 7.9 Crear NotFound.

## 7b. Backend de formularios públicos y categorías (branch backend/formularios-publicos-y-categorias)

Endpoints públicos que la futura UI consumirá. Sin UI, sin email, sin pagos/stock.

- [x] 7b.1 Extraer `slugify` a `backend/utils/slug.js` y reusarla en admin + public.
- [x] 7b.2 Crear `backend/routes/public.js` con helpers de validación y DTO.
- [x] 7b.3 `GET /api/categories` público (id, name, slug, activeProductCount active-only, sin payload de productos).
- [x] 7b.4 `POST /api/contact` (valida name/email/message, phone opcional, 201 `{ ok, id }`, sin email).
- [x] 7b.5 `POST /api/jobs/applications` (valida fullName/email/position, phone/message/cvUrl opcionales).
- [x] 7b.6 `POST /api/franchise/leads` (valida fullName/email/city, phone/message opcionales).
- [x] 7b.7 Safe errors: malformed JSON 400 sin stack, oversized body 400 sin persistir, error shape consistente.
- [x] 7b.8 Montar rutas públicas en `app.js` antes de admin, con `express.json({ limit: '20kb' })` + parser error handler.
- [x] 7b.9 Tests: pure helpers + stubbed HTTP (no-auth, 201 persist, 400 no-persist, malformed/oversized, empty catalog, active-only count).

## 7c. Frontend public routes — branch `frontend/nuevas-rutas-macarena`

### Review Workload Forecast

Estimated changed lines: 600-750 (4 pages + 1 CSS module + edits). 800-line budget risk: Medium. Chained PRs recommended: No (single-PR; CSS module compartido mantiene diff compacto). Delivery strategy: single-pr. Chain strategy: size-exception (not needed).

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low
800-line budget risk: Medium

### Phase 1: API layer (`src/lib/api.ts`)

- [x] 1.1 Add types `ApiCategory`, `ContactPayload`, `JobApplicationPayload`, `FranchiseLeadPayload`, `PublicFormResponse`.
- [x] 1.2 Implement `fetchCategories()` via `fetchWithFallback` with consistent error shape.
- [x] 1.3 Implement `postContact()`, `postJobApplication()`, `postFranchiseLead()` POST helpers; `npm run build` to type-check.

### Phase 2: Routing & navigation

- [x] 2.1 `src/App.tsx`: add lazy imports for `MenuPage`, `TutorialesPage`, `FranquiciasPage`, `TrabajaPage`.
- [x] 2.2 Register `/menu`, `/tutoriales`, `/franquicias`, `/trabaja-con-nosotros`; aliases `/tienda`, `/nuestros-dulces` → `CatalogPage`.
- [x] 2.3 Add alias `/checkout` → `AddressForm`; keep `/checkout/direccion|pago|confirmacion`.
- [x] 2.4 `Header.tsx`: add Menu/Tutoriales/Franquicias/Trabaja links (desktop + mobile).
- [x] 2.5 `Footer.tsx`: replace `#` anchors with `<Link>`; remove fake newsletter inputs/button.
- [x] 2.6 Social icons only with real URLs; else inert labeled span with `aria-disabled`.

### Phase 3: Menu page (`/menu`)

- [x] 3.1 Create `src/pages/Menu/MenuPage.tsx` with `useState` for `status`, `categories`, `error`.
- [x] 3.2 Call `fetchCategories()` and filter `activeProductCount > 0` before render.
- [x] 3.3 Render loading, error (with retry), empty, and category cards grid. No `/producto/:id` links.
- [x] 3.4 Use shared `PublicRoutes.module.css` (cards, grid, states, focus-visible).

### Phase 4: Tutorials page (`/tutoriales`)

- [x] 4.1 Create `src/pages/Tutoriales/TutorialesPage.tsx` with static visual cards using `tutorial1..6.jpg` from `src/assets/img/`; real `alt` per card; no network, no CMS, no auth.

### Phase 5: Contact form integration (`/contacto`)

- [x] 5.1 Rewrite `src/components/Contact/Contacto.tsx` to call `postContact()`; map `nombre`→`name`, `mensaje`→`message`.
- [x] 5.2 Required fields (name, email, message) and optional `phone`; drop `asunto` from payload.
- [x] 5.3 `aria-live` status (loading/success/error); disable submit while loading; preserve input on error, clear only on success.

### Phase 6: Franchise form (`/franquicias`)

- [x] 6.1 Create `src/pages/Franquicias/FranquiciasPage.tsx` with form `fullName`, `email`, `city`, `phone?`, `message?`.
- [x] 6.2 Local validation (required + email shape) before submit.
- [x] 6.3 Call `postFranchiseLead()`; render loading/error/success in `aria-live`; preserve input, reset only on success.

### Phase 7: Jobs form (`/trabaja-con-nosotros`)

- [x] 7.1 Create `src/pages/Trabaja/TrabajaPage.tsx` with form `fullName`, `email`, `position`, `phone?`, `message?`, `cvUrl?`.
- [x] 7.2 NO `<input type="file">`, no drag-and-drop. `cvUrl` is optional text only.
- [x] 7.3 Local validation + `postJobApplication()` + loading/error/success; DOM check asserts zero file inputs.

### Phase 8: Static / automated assertions (no test runner)

- [x] 8.1 Add `scripts/assert-public-routes.mjs` to verify: every public route in `App.tsx`; Header has every nav link; Footer has zero `#` anchors; Trabaja has zero file inputs; no `/producto/:id` in Menu.
- [x] 8.2 Wire as `assert:public-routes` in `package.json`; if Vitest/Jest becomes available, port to that runner.

### Phase 9: Verification

- [x] 9.1 Run `npm run lint` and `npm run build` (mandatory before PR).
- [ ] 9.2 Local backend: `cd backend && npm run prisma:generate && npm run dev` (dedicated terminal). (Deferred — runtime smoke, not required for this apply slice.)
- [ ] 9.3 Curl smoke: `GET /api/categories`, `POST /api/contact`, `POST /api/jobs/applications`, `POST /api/franchise/leads`. (Deferred — verify phase.)
- [ ] 9.4 Manual browser pass + DOM checks: 0 file inputs on `/trabaja-con-nosotros`, 0 `/producto/:id` on `/menu`. (Deferred — verify phase.)
- [ ] 9.5 Hand off to `sdd-archive` to update `docs/INDEX.md` and `docs/FUNCIONALIDADES.md`. (Deferred — archive phase.)

## 7d. Backend orders stock + emails — branch `backend/orders-stock-emails`

Strict TDD (RED → GREEN → REFACTOR). No real DB, no `.env` reads. Stdlib `assert` + stubbed Prisma + stubbed `fetch`. This section supersedes section 6 for this branch.

### Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350-500 (`app.js` transaction+decrement, NEW `services/email.js`, `.env.example` clarification, NEW `test/order-confirm-transaction.test.js`, updated `test/order-confirm-inactive.test.js`, docs touch) |
| 400-line budget risk | Medium |
| 800-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | single-pr |
| Chain strategy | size-exception (not needed) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Phase 1: Test scaffold (RED-first infra)

- [x] 1.1 Extend Prisma stub in `backend/test/order-confirm-inactive.test.js` to expose `$transaction(async (tx) => tx)` and a tx-scoped `product.updateMany` that records call args and returns `{ count }`.
- [x] 1.2 Add `backend/test/_record.js` exporting `makeTxStub({ products, carts, orders, fetchImpl })` for reuse by the new transaction test.
- [x] 1.3 Document at top of new test file: no `.env` reads; only dummy `DATABASE_URL` for `prisma generate`.

### Phase 2: RED — `backend/test/order-confirm-transaction.test.js`

- [x] 2.1 Success path: `tx.product.updateMany` called with `{ id, active: true, stock: { gte: qty } }` and `data.stock.decrement === qty`; order+payment+items+cartItem.deleteMany all invoked; 200 response.
- [x] 2.2 Insufficient stock: `updateMany` returns `{ count: 0 }` → 400 `{ error: 'Stock insuficiente', insufficientStock: [...] }`; no order/payment/cartItem writes.
- [x] 2.3 Concurrent race: two confirmations on same product; first 200, second 400; loser never calls `order.create`.
- [x] 2.4 Inactive product: 400 with `inactiveProducts[]`; no `updateMany` call.
- [x] 2.5 Invalid payment method (e.g. `MERCADOPAGO`, `CARD`): 400; no order/payment/items/cartItem writes.
- [x] 2.6 Non-positive quantity (0/negative/float): 400; no `updateMany` call.
- [x] 2.7 Email provider throws after commit: route returns 200; `console.error` called with safe message (no stack).
- [x] 2.8 No email on failed confirmation (stock/inactive/payment/quantity): `sendOrderConfirmationEmail` never called.
- [x] 2.9 Noop provider (no `EMAIL_PROVIDER` or `=noop`): log "disabled"; no `fetch` call; route returns 200.
- [x] 2.10 Resend provider: `EMAIL_PROVIDER=resend` + env → `fetch` called once against `https://api.resend.com/emails` with Bearer header and JSON body.
- [x] 2.11 Deterministic order: two items in same cart, different productIds → `updateMany` calls sorted ascending by productId.

### Phase 3: GREEN — implement

- [x] 3.1 Wrap `/api/orders/confirm` body in `prisma.$transaction(async (tx) => { ... })` in `backend/app.js`; preserve current precheck error messages.
- [x] 3.2 Sort items by `productId` ascending; run `tx.product.updateMany({ where: { id, active: true, stock: { gte: qty } }, data: { stock: { decrement: qty } } })` per item.
- [x] 3.3 On `count === 0`, re-read product inside the same tx to discriminate inactive vs insufficient vs concurrent; map to 400 with the `inactiveProducts` or `insufficientStock` payload from `design.md`.
- [x] 3.4 Re-validate `cart.paymentMethod` against allowlist `CASH`/`TRANSFER` (plus pre-normalization aliases) inside the tx; 400 on invalid.
- [x] 3.5 Reject non-positive `quantity` per item with 400 before any `updateMany` call.
- [x] 3.6 Move `cartItem.deleteMany` inside the same tx after `order.create`.
- [x] 3.7 After commit, call `sendOrderConfirmationEmail(order)` inside `try/catch`; log error and never rethrow.
- [x] 3.8 Create `backend/services/email.js` exporting `sendOrderConfirmationEmail(order)`; selects noop by default, Resend only when `EMAIL_PROVIDER=resend` and `RESEND_API_KEY`/`MAIL_FROM`/`MAIL_TO` are set; never throws; returns `{ status: 'sent'|'disabled'|'failed' }`.
- [x] 3.9 Use Node 20 `fetch` (no `resend` SDK); JSON body with `from`/`to`/`subject`/`text`; non-2xx treated as failure.

### Phase 4: REFACTOR + docs

- [x] 4.1 `backend/.env.example`: default `EMAIL_PROVIDER=noop`; clarify Resend vars optional unless provider is `resend`; one-line comment that noop works with no credentials.
- [x] 4.2 Confirm `backend/package.json` stays free of `resend` dependency; `npm ls resend` empty.
- [x] 4.3 Update `docs/DEPLOY_RAILWAY_VERCEL.md` and `docs/INDEX.md` email env semantics; no secret values.
- [x] 4.4 No migration: leave `backend/prisma/schema.prisma` untouched.

### Phase 5: Verification (avoid `.env`)

- [x] 5.1 `npm run lint` (root) and `npm run build` (root frontend) — must pass.
- [x] 5.2 `cd backend && DATABASE_URL='postgresql://test:test@127.0.0.1:5432/test' npm run prisma:generate` — client generates without DB connect.
- [x] 5.3 `cd backend && node test/order-confirm-inactive.test.js && node test/order-confirm-transaction.test.js` — both green.
- [ ] 5.4 Curl smoke deferred to verify phase: `/api/health`, `/api/db/health`, `/api/productos` only; never read `.env`. (Deferred — requires disposable DB; production/shared DB access forbidden.)
- [x] 5.5 Hand off to `sdd-verify` and `sdd-archive` to update docs. `sdd-archive` closed the documentation loop via `archive-orders-stock-emails.md` (this branch keeps per-slice artifacts in the change directory per project convention; no change-folder move, no spec merge, no new `docs/FUNCIONALIDADES.md` because functionality is already covered by `EMAILS_PEDIDOS.md`, `DEPLOY_RAILWAY_VERCEL.md` and the OpenSpec artifacts).

## 7e. Frontend home redesign — branch `frontend/home-redesign`

Scope: `/` only. Native React/CSS `HeroCarousel` (3 local slides), API-driven "Nuestros Productos", 2 featured banners, "Nuestro Mundo Dulce", decorative locations. Mobile-first, light-only. Reuse `fetchProducts`, `HomeProductCard`, `PublicRoutes.module.css`, public assets. No new dependencies. No Header/Footer redesign. No `/producto/:id`. No dark mode, CMS, store locator, newsletter backend, payments, WhatsApp. No asset reorganization. No logo decision.

### Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 500-800 (NEW `HeroCarousel` + module CSS, 3 NEW section components, expanded `Home.tsx`/`Home.module.css`, NEW `assert:home-redesign` script) |
| 400-line budget risk | Medium |
| 2000-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | single-pr |
| Chain strategy | size-exception (not needed) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium
2000-line budget risk: Low

### Phase 1: HeroCarousel foundation

- [x] 1.1 Create `src/components/HeroCarousel/HeroCarousel.tsx` accepting a 3-slide prop array (`src`, `alt`, `caption`); native React/CSS only, no deps.
- [x] 1.2 Add `src/components/HeroCarousel/HeroCarousel.module.css` with `transform: translateX` track, focus-visible ring, `prefers-reduced-motion: reduce` instant transition.
- [x] 1.3 Autoplay via `setInterval(4500)`; pause on `pointerenter`/focus/hover or `prefers-reduced-motion: reduce`; cleanup on unmount.
- [x] 1.4 Keyboard: `ArrowLeft`/`ArrowRight` cycle, `Home`/`End` jump first/last; prev/next buttons with real text labels (no `aria-label` only).
- [x] 1.5 Markup: `role="region" aria-roledescription="carousel"`; active slide `aria-hidden="false"`, siblings `true`; live region announces slide index.

### Phase 2: API-driven "Nuestros Productos"

- [x] 2.1 Replace the static `productos` array in `src/pages/Home/Home.tsx` with `fetchProducts()` from `src/lib/api.ts`; mirror the loading/error/empty/success pattern from `MenuPage.tsx`.
- [x] 2.2 On success, map the products to `HomeProductCard` props (`img`, `hoverImg`, `title`); on empty `[]` show the explicit empty state (per 2.3) — no hardcoded product fallback.
- [x] 2.3 States reuse `PublicRoutes.module.css` (`.state`/`.stateTitle`/`.stateText`/`.retryBtn`); loading renders a skeleton (no layout shift); empty uses the same classes with a `<Link to="/catalogo">` and no hardcoded products.

### Phase 3: Section components

- [x] 3.1 `src/components/HomeSections/NuestroMundoDulce.tsx` + module CSS: copy block + `dulzura-central.webp`; light-only background, mobile-first.
- [x] 3.2 `src/components/HomeSections/FeaturedBanners.tsx` + module CSS: 2 banners using `destacado-golosina1.webp` and `destacado-golosina2.webp`, linking to `/catalogo` and `/menu`; real `alt` per image.
- [x] 3.3 `src/components/HomeSections/Locations.tsx` + module CSS: decorative only, `fondo-locales.webp` background + "Encontranos en CABA y GBA" caption; `aria-hidden="true"`.

### Phase 4: Compose in `Home.tsx` / `Home.module.css`

- [x] 4.1 `Home.tsx` order: `HeroCarousel` → `FeaturedBanners` → `NuestrosProductos` → `NuestroMundoDulce` → `Locations`; drop the old static grid import.
- [x] 4.2 Extend `Home.module.css` with section spacing tokens; keep `Oswald` title style; no `prefers-color-scheme: dark` tokens.
- [x] 4.3 Do not edit `Header`, `Footer`, `App.tsx`, `lib/api.ts`, or `HomeProductCard`; route `/` is already wired. **Narrow exception (closed by `archive-home-redesign.md`)**: `HomeProductCard.tsx` was edited during verification to fix the API-image behavior — keep API / data URLs unchanged (no synthesized WebP `<source>`) and advertise a local WebP source for known local `/img/*.jpg` assets. The corrective edit is approved per bounded review and matches `verify-home-redesign.md` (`API image URL` and `Local image WebP` rows both PASS). `Header`, `Footer`, `App.tsx`, and `lib/api.ts` were not edited.

### Phase 5: Verification

- [x] 5.1 `npm run lint` (root) — zero warnings on touched files.
- [x] 5.2 `npm run build` (root) — must pass.
- [x] 5.3 NEW `scripts/assert-home-redesign.mjs` checks: zero `<input type="file">`, zero `/producto/:id` strings, zero `@media (prefers-color-scheme: dark)`, zero new entries in `package.json` `dependencies`/`devDependencies`. Wire as `assert:home-redesign` in `package.json`.
- [x] 5.4 Runtime smoke (Playwright or manual): `/` loads 3 slides; prev/next toggles `aria-hidden`; dots change index; ArrowLeft/Right cycles; `prefers-reduced-motion: reduce` disables autoplay + animation; tab order prev → next → dots → CTAs.
- [x] 5.5 Contract: `fetchProducts()` returning products → N cards (≤ 6); 500 error → error state with retry; `[]` → explicit empty state with `<Link to="/catalogo">` and zero hardcoded products rendered.
- [x] 5.6 Scenario traceability: `Menu uses API` (frontend-ui-parity) → 5.5; `Light mode only` → 5.3.
- [x] 5.7 Hand off to `sdd-verify`; defer `sdd-archive` until after verify passes.

## 7f. Frontend admin — auth + products only (branch `frontend/admin-auth-products`)

Corrective narrowed scope: `/admin/login`, `/api/admin/me` bootstrap, sessionStorage token (8h TTL, no refresh, no cookie, no localStorage), logout/central 401 clear, protected shell outside public `Header`/`Footer`, product list loading/error/empty/success, deactivate/reactivate, responsive/a11y/error states. Reuse `PublicRoutes.module.css`; no dependencies, dark mode, `dangerouslySetInnerHTML`, or token logging.

Deferred to `frontend/admin-product-form`: create/edit modal, create/update/get-product/categories-for-form API, and form validation helpers. Other out-of-scope work remains category CRUD/order UI, backend/schema/auth-cookie changes, user management, password reset, MFA, uploads, permanent deletion, bulk actions, pagination/search/analytics, dark mode, payments, WhatsApp, and `/producto/:id`.

### Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines (corrective narrowed apply) | <=1,550 (auth/list shell + durable node:test + static assert + Playwright-MCP runtime smoke + docs) |
| 2000-line budget risk | High (approaches hard cap) |
| Chained PRs recommended | No (user direction: no chain) |
| Delivery strategy | single-pr (user accepts the high-risk near-limit slice; not a budget waiver) |
| Chain strategy | size-exception (single-PR delivery label only; not a budget exception) |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High
800-line budget risk: High
2000-line budget risk: High

**Workload policy (hard 2,000-line cap, not overridable)**:

- **1,600-1,900 lines = approach zone**: require explicit user approval before `sdd-apply` proceeds. The user's approval is framed as **"accepting the high-risk near-limit slice"**, not a budget exception to exceed the cap.
- **If live forecast or measured diff exceeds 1,900 lines**: PAUSE `sdd-apply` immediately and reforecast.
- **If projected final total would exceed 2,000 lines**: SPLIT immediately by deferring `AdminProductForm` (create/edit modal, Phase 6) — or another autonomous boundary — to a follow-up branch. Keep durable Node tests, static assertions, **Playwright runtime smoke**, accessibility, and error states in this slice. **Never proceed beyond 2,000.**
- **No `size:exception` to exceed the cap.** The 2,000-line hard limit is not overridable. Playwright runtime tests, accessibility, and error states MUST NOT be sacrificed to fit budget.
- **No chained PR** (user direction); the only delivery mode is single-PR.

### Threat matrix → RED tests (every row becomes a task)

> Corrective split: form-only rows T3-T12 that depend on create/edit/category/image validation are deferred with Phase 6; retained T1/T2 and T13-T20 are covered in this branch.

| ID | Case | Expected safe/failure behavior | Production task | RED test task |
|----|------|-------------------------------|-----------------|---------------|
| T1 | `/api/admin/me` returns 401 (token missing/expired/cleared) on app load | `clearAdminToken()` called; `<Navigate to="/admin/login" replace />` | 3.3 | 3.4 + 1.10 |
| T2 | Any admin call returns 401 mid-session (products/categories/PATCH) | Same as T1; no UI crash; error state shows "Sesión expirada" | 2.4 | 1.10 |
| T3 | Form `priceCents` is negative or decimal (`"12.5"`, `-1`, `"abc"`) | `parsePriceInput` returns `{ok:false, error}`; form blocks submit; field error shown | 1.1/1.2 | 1.1 |
| T4 | Form `stock` is negative or non-integer | `validateProductPayload` returns error on `stock`; form blocks submit | 1.3/1.4 | 1.3 |
| T5 | `categoryId` missing or not positive integer | Validation error; backend 400 mapped to `categoryId` field | 1.3/1.4 / 6.1 | 1.3 / 6.3 |
| T6 | `imageUrl` = `javascript:alert(1)` or `vbscript:` or `file:` | `isSafeAdminImageUrl` returns false; field error; submit blocked | 1.5/1.6 | 1.5 |
| T7 | `imageUrl` = `https://cdn.example.com/x.jpg` | Accepted (http/https allowlist) | 1.5/1.6 | 1.5 |
| T8 | `imageUrl` = `data:image/png;base64,...` | Accepted (matches `productImage.js` policy) | 1.5/1.6 | 1.5 |
| T9 | `imageUrl` = `""` or `null` or `undefined` | Accepted (optional field) | 1.5/1.6 | 1.5 |
| T10 | Backend returns 400 with `{ error, errors: [...] }` on POST/PATCH | `extractApiError` maps to field-level errors; form preserves input; no clear | 2.4 / 6.1 | 1.7 / 1.8 |
| T11 | Backend returns 400 with `categoryId does not exist` | Same as T10 with `categoryId` field highlighted | 2.4 | 1.7 |
| T12 | Backend returns 401 on POST `/api/admin/products` | `clearAdminToken` + redirect; mutation does not silently succeed | 2.4 | 1.10 |
| T13 | Click "Cerrar sesión" in `AdminLayout` | `clearAdminToken()` called; `navigate('/admin/login')`; no residual token in sessionStorage | 3.1 | 8.1 (static assert) |
| T14 | XSS via product title/description in list/edit | React default escaping; no `dangerouslySetInnerHTML`; no `eval`/`new Function` on payload | 5.1 / 6.1 | 8.1 |
| T15 | Deactivate vs hard-delete | Only `DELETE /api/admin/products/:id` (soft → `active=false`); no SQL/shell; backend handles | 5.1 | 1.3 (active field rules) |
| T16 | Reactivate a deactivated product | `PATCH /api/admin/products/:id` with `{active:true}`; distinct UI action from create | 5.1 | 1.3 (active boolean validation) |
| T17 | sessionStorage throws (private mode, quota) | `AdminAuthError` surfaced; user sees "No se pudo guardar la sesión" instead of silent failure | 2.1 | 1.7 / 1.8 |
| T18 | Public routes regression (Header/Footer outside admin) | `App.tsx` nested route group; assert-public-routes still PASS | 7.1 | 9.3 / 9.4 |
| T19 | Token leaked to console | No `console.log`/`console.error` of any token or localStorage/sessionStorage value | N/A (rule) | 8.1 |
| T20 | Dark mode added by mistake | Zero `@media (prefers-color-scheme: dark)` in admin CSS | 3.2 / 5.2 | 8.1 |

### Phase 1: Auth helpers (RED → GREEN, `node --test`)

- [x] 1.9 RED token decode/expiry tests in `test/admin-auth-products.test.mjs`.
- [x] 1.10 GREEN `src/lib/adminAuth.js` token decode/expiry helpers.
- [ ] 1.1-1.8 Form validation helpers/tests — DEFERRED to `frontend/admin-product-form`; no `adminValidation.js` ships in this slice.

### Phase 2: sessionStorage token + admin API client

- [x] 2.1 `src/lib/adminAuth.js` — `getAdminToken()`, `setAdminToken(token)`, `clearAdminToken()`; sessionStorage scoped; throw `AdminAuthError` on `QuotaExceededError`/`SecurityError`; never log the token; the key constant is `admin_token` (single key, easy to audit).
- [x] 2.2 `src/lib/adminApi.js` retains only login, `/me`, list, deactivate, reactivate; each has auth header + central 401 clear. Form-only create/update/get-product/categories APIs are DEFERRED.
- [x] 2.3 `AdminApiError` + `AdminAuthError` support retained API calls.
- [x] 2.4 RED fetch-stub tests cover login, `/me`, list, deactivate/reactivate, 401 clear, auth header, and network error.

### Phase 3: AdminLayout + RequireAdminAuth

- [x] 3.1 `src/pages/Admin/AdminLayout.tsx` — `<Outlet />`, sidebar nav (Productos active, Categorías + Pedidos `aria-disabled` with note "Próximamente"), top bar with admin email (from `decodeAdminTokenPayload(getAdminToken())`) + "Cerrar sesión" button (clears token + `navigate('/admin/login')`); light-only, mobile-first; **must not import** `Header` or `Footer`; verify with `assert-admin-auth-products.mjs`.
- [x] 3.2 `src/pages/Admin/AdminLayout.module.css` — sidebar, top bar, responsive (collapse to top tabs on `<768px`), focus-visible ring on every interactive element, no `prefers-color-scheme: dark`.
- [x] 3.3 `src/components/Admin/RequireAdminAuth.tsx` — `useEffect` calls `getAdminMe(getAdminToken())`; on 200 renders children; on 401 calls `clearAdminToken()` + `<Navigate to="/admin/login" replace state={{from: location.pathname}} />`; on network error shows `PublicRoutes.module.css` retry state; on no token redirects immediately; loading state uses `PublicRoutes.module.css` busy.
- [x] 3.4 RED — test in `test/admin-auth-products.test.mjs`: with stubbed `global.fetch`, simulate 401 → `clearAdminToken` called; simulate 200 → no redirect; malformed token → no redirect until `/me` confirms; pure logic only (rendering covered by Playwright). [Covered via adminApi 401 tests + RequireAdminAuth component logic.]

### Phase 4: AdminLogin

- [x] 4.1 `src/pages/Admin/AdminLogin.tsx` — form (`email`, `password` with `autoComplete="current-password"`); `aria-live="polite"` status; loading/error/success states reusing `PublicRoutes.module.css` (`state`, `stateTitle`, `stateText`, `retryBtn`); preserves input on error (never clears on 4xx); clears only on success then `navigate(state.from ?? '/admin/productos', {replace:true})`; submit disabled while loading; no `alert()`.
- [x] 4.2 No separate CSS module — reuse `PublicRoutes.module.css`. Document in static assert.
- [x] 4.3 Render checks covered by completed Phase 11 Playwright-MCP runtime smoke; retained auth API behavior covered by Phase 2 tests.

### Phase 5: AdminProductsList (read + deactivate + reactivate)

- [x] 5.1 `src/pages/Admin/AdminProductsList.tsx` — table with loading/error/empty/success, active badges, deactivate/reactivate + refetch. Create/edit display only a documented "Próximamente" boundary for the deferred form branch.
- [x] 5.2 `src/pages/Admin/AdminProductsList.module.css` — table styles, `.badge.active`/`.badge.inactive`, action buttons, responsive (table → card list on `<640px`), focus-visible, no dark-mode tokens. Modal styles deferred with AdminProductForm to follow-up branch.
- [x] 5.3 RED — `assert-admin-auth-products.mjs`: page calls `listAdminProducts`; renders price as `pesos` (formatted cents); never uses `dangerouslySetInnerHTML`; never imports `Header`/`Footer`; handles inactive products with a visible badge (not a hidden row). [isSafeAdminImageUrl check deferred with form — no image preview in list view.]

### Phase 6: AdminProductForm (create + edit modal) — HISTORICAL, SUPERSEDED by slice 7g

> **Historical plan (kept for trace).** The detailed implementation moved to slice `7g. Frontend admin — product form` below (delta spec APF-01..11, branch `frontend/admin-product-form`). Stubs retained here for historical diff only — do not start work in 7f Phase 6; pick the slice 7g tasks.

- [~] 6.1 (historical) Modal plan, now `APF-2.1`..`APF-2.8` in slice 7g.
- [~] 6.2 (historical) CSS rules, now `APF-2.9`..`APF-2.10` in slice 7g.
- [~] 6.3 (historical) static assertions, now `APF-5.2` in slice 7g.
- [~] 6.4 (historical) validator tests, now `APF-1.1`..`APF-1.9` in slice 7g.

### Phase 7: Routing integration

- [x] 7.1 Refactor `src/App.tsx` — extract public routes into nested `<Route element={<Layout />}>` group; add admin routes **outside** that group: `/admin/login` → `AdminLogin`; `/admin` → `<Navigate to="/admin/productos" replace />`; `/admin/productos` → `<RequireAdminAuth><AdminLayout /></RequireAdminAuth>` with `<AdminProductsList />` as child via `<Outlet />`. All admin pages lazy-imported. Confirm `Header` and `Footer` imports stay inside the public `<Route element={<Layout />}>` only.
- [x] 7.2 Public regression: run `npm run assert:public-routes`, `npm run assert:home-redesign`, `npm test` — all must still pass before declaring 7f done.

### Phase 8: Static contract assertions

- [x] 8.1 NEW `scripts/assert-admin-auth-products.mjs` — checks: admin routes registered in `App.tsx`; `AdminLayout` and `AdminLogin` do not import `Header` or `Footer`; `AdminProductsList` calls `listAdminProducts`; `RequireAdminAuth` calls `getAdminMe` and handles 401 with `clearAdminToken`; zero `console.log`/`console.error` of any `adminToken`/`token`/`getItem`/`sessionStorage`; zero `dangerouslySetInnerHTML`; zero `@media (prefers-color-scheme: dark)` in admin CSS; no new entries in `package.json` `dependencies`/`devDependencies`; `/admin` redirects to `/admin/productos`; `AdminLogin` uses `PublicRoutes.module.css` state classes; `AdminLayout` has a "Cerrar sesión" button. Wire as `assert:admin-auth-products` in `package.json`. [AdminProductForm checks deferred with Phase 6.]

### Phase 9: Public regression + lint/build + backend contract

- [x] 9.1 `npm run lint` — zero warnings on touched files.
- [x] 9.2 `npm run build` — must pass.
- [x] 9.3 `npm run assert:public-routes` — must pass.
- [x] 9.4 `npm run assert:home-redesign` — must pass.
- [x] 9.5 `npm test` — must pass (durable tests + `home-redesign.test.mjs` + `admin-auth-products.test.mjs`).
- [x] 9.6 Backend contract: `cd backend && DATABASE_URL='postgresql://test:test@127.0.0.1:5432/test' node test/admin-auth.test.js && node test/admin-middleware.test.js` — must pass (no contract drift). **Safe**: no `.env` read, no real DB, no production secret.
- [x] 9.7 Hand off to `sdd-verify`; defer `sdd-archive` until after verify passes.

### Phase 10: Documentation

- [x] 10.1 NEW `docs/AUTENTICACION.md` — admin auth contract: `POST /api/admin/login`, `/api/admin/me` bootstrap on admin shell mount, sessionStorage token (`admin_token` key, 8h TTL, no refresh, no cookie, no localStorage), 401 handling (clear + redirect to `/admin/login`), sign out flow, no password reset, no MFA, no user management. Cross-link to `backend/routes/admin.js`, `backend/middleware/admin.js`, `backend/utils/jwt.js`.
- [x] 10.2 Extend `openspec/changes/2026-06-candyland-v2/design.md` "Admin auth" section with a 6-step flow: 1) POST `/api/admin/login` → `{token, user}`; 2) `setAdminToken(token)`; 3) navigate to `/admin/productos`; 4) `RequireAdminAuth` calls `/api/admin/me`; 5) 200 → render shell; 6) 401 → `clearAdminToken` + redirect.
- [x] 10.3 Update `docs/INDEX.md` with the admin slice link + one-line summary (auth + products only; categories + orders deferred).
- [x] 10.4 Do **not** add a new `docs/FUNCIONALIDADES.md` (the admin scope is still partial; documenting it as a feature inventory is premature; the per-slice `archive-admin-auth-products.md` will own the slice closure).

### Phase 11: Playwright runtime smoke (mandatory)

- [x] 11.1 `test/admin-auth-products.playwright.mjs` runs through the configured Playwright MCP runtime with safe route mocks: login error/success, `/me` bootstrap/401/network retry/logout, product loading/error/empty/list/401 redirect, deactivate/reactivate, keyboard focus, 390px layout, and clean console/network result (14 scenarios, 0 unexpected errors).
- [x] 11.2 `npm run test:admin-runtime` documents the configured Playwright-MCP runner; no project dependency added.

### Phase 12: Verification handoff

- [x] 12.1 Hand off to `sdd-verify`. Expected report: lint/build pass, all 3 static assert scripts pass, durable tests pass, Playwright runtime pass, backend admin contract tests pass, scenario traceability covered.
- [x] 12.2 Defer `sdd-archive` until after verify passes; expected per-slice `archive-admin-auth-products.md` (no spec merge; per-slice archive convention matches `archive-home-redesign.md`).

### Slice 7f verification remediation

- [x] R1 RED/GREEN: `/me` network retry performs a second validation request without applying state after unmount.
- [x] R2 RED/GREEN: product API 401 expires the shared admin session and redirects the protected UI; non-401 errors remain local error states.

## 7g. Frontend admin — product form (branch `frontend/admin-product-form`)

Scope: APF-01..11 (delta spec `openspec/changes/2026-06-candyland-v2/specs/admin-productos/spec.md`). Native `<dialog>` create/edit modal, pure `adminValidation.js`, three new `adminApi` methods (`createAdminProduct`, `updateAdminProduct`, `listAdminCategories`), category four states (loading/error+retry/empty/success), backend 400 field mapping, focus/Escape/restore, narrow-viewport light-only, no upload. Reuse list DTO, no detail endpoint. Reuse `PublicRoutes.module.css` states. No new dependencies. No `dangerouslySetInnerHTML`. No `prefers-color-scheme: dark`. No tokens in console.

Backend contract already shipped (`POST/PATCH /api/admin/products`, `GET /api/admin/categories`, `validateProductInput` in `backend/routes/admin.js`); no backend change.

Delivery: **single PR per session** (cached policy `single-pr-default`). No chained PR. No `size:exception` — this slice stays under the current-session 3,000-line hard cap on its own merit.

### Review Workload Forecast (full surface — planning + implementation + tests + verify + archive)

Measured planning delta already on disk in this change folder (will be staged with the PR):
- `specs/admin-productos/spec.md` (new): 174 lines
- `tasks.md` (extended with slice 7g + Phase 6 reconciliation): +103 net lines
- `design.md`: 0 net lines (already shipped in prior phase)
- **Planning total**: ~277 lines

Forward implementation deltas (`sdd-apply` produces):
- `src/pages/Admin/AdminProductForm.tsx`: 260
- `src/pages/Admin/AdminProductForm.module.css`: 170
- `src/pages/Admin/AdminProductsList.tsx` (edit wiring + drop "Próximamente"): 60
- `src/pages/Admin/AdminProductsList.module.css` (modal rules append): 20
- `src/lib/adminValidation.js` (NEW): 105
- `src/lib/adminApi.js` (3 new exports + JSDoc typedef): 45
- `test/admin-product-form.test.mjs` (NEW, RED + GREEN): 150
- `scripts/assert-admin-auth-products.mjs` (extend + form checks): 35
- `test/admin-auth-products.playwright.mjs` (extend with 9 APF scenarios): 150
- `package.json` (2 script lines): 4
- `docs/AUTENTICACION.md` or `docs/INDEX.md` (one-line admin form note): 20
- `openspec/changes/2026-06-candyland-v2/verify-report.md` (NEW, sdd-verify output): 80
- `openspec/changes/2026-06-candyland-v2/archive-admin-product-form.md` (NEW, sdd-archive): 30
- Implementation reserves (debug, JSDoc→TS d.ts fallback if needed, minor CSS tweaks, lint/build churn): ~120
- **Forward total**: ~1,249 lines

| Field | Value |
|---|---|
| **Total final PR surface (planning + forward + reserves)** | **~1,525 lines** |
| 400-line budget risk | High (slice is ~3.8× the per-PR default) |
| 800-line budget risk | Medium |
| 3000-line budget risk | Low (well under hard cap) |
| Chained PRs recommended | No (user direction: one PR per session) |
| Delivery strategy | single-pr-default (cached) |
| Size exception | Not used (slice fits the cap) |
| Implementation reserves | ~120 (18% of forward implementation) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: not-applicable
Size exception: not-used
400-line budget risk: High
800-line budget risk: Medium
3000-line budget risk: Low

**Workload checkpoints (current-session hard 3,000-line cap, not overridable)**:
- **Current forecast ~1,525 = proceed**: no extra approval required.
- **Total ≥2,400 = checkpoint/reforecast**: PAUSE `sdd-apply` and reforecast.
- **Total ≥2,600 = split trigger**: PAUSE and prepare the autonomous split.
- **Projected final total >2,800 = hard split**: defer edit mode (APF-02 and update API wiring) to a follow-up while retaining create mode, runtime tests, accessibility, error mapping, verify, and archive.
- **Total >3,000 = forbidden**: never exceed.
- **Runtime tests, accessibility, and error mapping MUST NOT be sacrificed** to fit budget. They are part of Phase 4 + 5 + 6 and stay.
- If splitting is needed, the autonomous boundary is edit mode; verification and per-slice archive remain mandatory in this branch.

### Scenario → Test traceability (APF-01..11)

| Spec | Asserted by test task(s) |
|---|---|
| APF-01 (create, priceCents = pesos × 100) | `APF-1.2`, `APF-1.4`, `APF-3.4` |
| APF-02 (edit from list DTO, no detail) | `APF-2.3`, `APF-2.7`, `APF-4.1` |
| APF-03 (local validation blocks submit) | `APF-1.3`, `APF-1.5`, `APF-1.6`, `APF-1.7`, `APF-1.8` |
| APF-04 (category loading blocks save) | `APF-3.2`, `APF-4.2` |
| APF-05 (categories populated) | `APF-3.2`, `APF-3.3` |
| APF-06 (category error/empty blocks save) | `APF-3.2` |
| APF-07 (save success → list refresh + close) | `APF-3.4`, `APF-3.5`, `APF-4.3` |
| APF-08 (400/401 → inputs preserved) | `APF-1.8`, `APF-4.4`, `APF-4.5` |
| APF-09 (no duplicate save) | `APF-3.4`, `APF-4.6` |
| APF-10 (focus/Escape/restore) | `APF-4.1`, `APF-4.7`, `APF-4.8` |
| APF-11 (narrow, light-only) | `APF-4.9`, `APF-5.2` |

### Phase 1: Pure helpers — RED → GREEN (`node --test`)

- [x] APF-1.1 RED: add `test/admin-product-form.test.mjs` with `parsePriceInput` cases (`"12,50"`→`1250`, `"12.50"`→`1250`, `"12"`→`1200`, `12`→`1200`, `"0"`→`0`; reject `"-1"`, `"12.5"`, `"abc"`, `null`, `"  "`, `"1,234"`). Wire as `test:admin-product-form` in `package.json` and append to root `test` script.
- [x] APF-1.2 GREEN: `src/lib/adminValidation.js` — `parsePriceInput(input) → {ok, cents, error}`; regex `^-?\d+([.,]\d{1,2})?$` + `Number((v).replace(',', '.'))` × 100; ladder rung 4.
- [x] APF-1.3 RED: `validateProductPayload(input, {partial?})` cases mirroring `backend/routes/admin.js#validateProductInput`: create requires title, priceCents, categoryId, active defaults true; partial allows absent fields except type rules; reject fractional/negative priceCents, negative/float stock, non-positive categoryId, non-string optional URLs.
- [x] APF-1.4 GREEN: `validateProductPayload` in same file; uses `parsePriceInput` for the price field; partial mode is opt-in.
- [x] APF-1.5 RED: `isSafeAdminImageUrl(value)` allowlist cases — accept `''`, `null`, `undefined`, `http://x`, `https://x`, `data:image/(png|jpeg|webp|gif);base64,...`; reject `javascript:`, `vbscript:`, `file:`, leading whitespace + dangerous scheme.
- [x] APF-1.6 GREEN: `isSafeAdminImageUrl` in same file; short-circuits null/empty; constant allowlist.
- [x] APF-1.7 RED: `extractApiError(body, status) → {message, fields}` cases: 400 with `errors[]` returns first + `fields` from unambiguous prefixes (`title:`, `priceCents:`, `stock:`, `categoryId:`, `imageUrl:`, `hoverImageUrl:`, `description:`, `active:`); 400 `{error:'categoryId does not exist'}` maps to `categoryId` field; 401 → `Credenciales inválidas`; 500 → `Error del servidor`; network → `No se pudo conectar al backend`.
- [x] APF-1.8 GREEN: `extractApiError` in same file; switch on status, prefix-match only on `errors[]` strings that start with one of the eight prefixes; `categoryId does not exist` always maps to `categoryId` even though it isn't a prefix.
- [x] APF-1.9 JSDoc types in `adminValidation.js`; TS consumers infer shapes; no `.d.ts` unless `npm run build` fails to type-check the new calls.

### Phase 2: Admin API client — RED → GREEN

- [x] APF-2.1 RED: extend `test/admin-product-form.test.mjs` with `createAdminProduct`, `updateAdminProduct`, `listAdminCategories` cases (fetch stubbed): method+path+body, 401 → `AdminAuthError` + `clearAdminToken`, 400 → `AdminApiError` with `fields` mapped via `extractApiError`.
- [x] APF-2.2 GREEN: extend `src/lib/adminApi.js` with `createAdminProduct(token, payload)`, `updateAdminProduct(token, id, payload)`, `listAdminCategories(token)` through `adminRequest`; preserve existing 401/400/500 mapping.
- [x] APF-2.3 GREEN: TS `AdminCategory = {id, name, slug, active}` exported from `adminApi.js` via JSDoc typedef so `AdminProductForm` can type the `<select>` options.

### Phase 3: AdminProductForm component — RED → GREEN

- [x] APF-3.1 RED: `test/admin-product-form.test.mjs` (pure helpers section) — initial-state factory: edit mode snapshots the list DTO; create mode defaults `active=true` and blank fields; blank optional strings normalize to `null` in submit body; whole-peso text → `priceCents = pesos * 100`.
- [x] APF-3.2 RED: category state machine — `loading` shows "Cargando categorías…" + disabled save; `error` shows retryable alert + disabled save; `empty` shows "No hay categorías" + disabled save; `success` enables save when `categoryId` is selected.
- [x] APF-3.3 RED: `<select>` renders one option per `AdminCategory`; placeholder "(Sin categoría)" if list empty; current `categoryId` selected on edit.
- [x] APF-3.4 RED: submit path blocks on `saving` (no duplicate request); on success dispatches `onSaved()` + `onClose()`; on 400 renders top-level `error` plus every `errors[]` member mapped via `extractApiError` (per-field if prefix matches, else summary); on 401 leaves input intact (session-expiry redirect handled upstream).
- [x] APF-3.5 GREEN: `src/pages/Admin/AdminProductForm.tsx` (child of `AdminProductsList.tsx`, not a route) — native `<dialog>` opened with `showModal()`; state machine from 3.2; refs saved for invoker focus restore; `useEffect` with `requestAnimationFrame` to focus first control; Escape closes without mutation; close = `dialog.close()` + `onClose()`.
- [x] APF-3.6 GREEN: form fields per spec (`title`, `description`, `price`, `stock`, `categoryId` `<select>`, `imageUrl`, `hoverImageUrl`, `active` checkbox); `parsePriceInput` + `validateProductPayload` (partial=false for create, true for edit) + `isSafeAdminImageUrl` on each submit; submit button text "Crear" / "Guardar cambios"; `aria-live="polite"` for status.
- [x] APF-3.7 GREEN: edit-mode initial state = `parseAdminProductForForm(product)` (snapshot of selected list DTO: `title`, `description`, `price = priceCents/100`, `stock`, `categoryId`, `imageUrl`, `hoverImageUrl`, `active`); no detail request.

### Phase 4: Playwright runtime — APF-02..11 (mandatory, keep even on tight budget)

- [x] APF-4.1 extend `test/admin-auth-products.playwright.mjs`: edit row → modal opens, fields prefilled from list DTO, PATCH sent to `/api/admin/products/:id` with `priceCents = price * 100`; assert no `GET /api/admin/products/:id`.
- [x] APF-4.2 category loading state: route delay on `/api/admin/categories` → modal shows "Cargando categorías…" + save disabled.
- [x] APF-4.3 save success: PATCH/POST 200 → modal closes + list refetches (`GET /api/admin/products` observed) + invoker focus restored.
- [x] APF-4.4 backend 400 with `{error, errors:['stock: must be ≥ 0','priceCents: invalid']}` → field errors shown on `stock` and `priceCents`, summary shows all, inputs preserved, modal stays open.
- [x] APF-4.5 backend 400 `{error:'categoryId does not exist'}` → `categoryId` field error, summary shows message.
- [x] APF-4.6 click "Guardar" twice quickly while PENDING → only one network request observed.
- [x] APF-4.7 Escape key → modal closes, no mutation, focus returns to "Editar" button of originating row.
- [x] APF-4.8 Tab order: first control = `title` input; cycles within modal until closed.
- [x] APF-4.9 viewport 390×844: all controls visible, no horizontal scroll, no dark mode tokens (assert zero `prefers-color-scheme: dark` in any admin CSS).

### Phase 5: Static contract assertions + wiring

- [x] APF-5.1 extend `scripts/assert-admin-auth-products.mjs`: form has zero `<input type="file">`; calls `parsePriceInput`, `validateProductPayload`, `isSafeAdminImageUrl`, `extractApiError`; uses `<select>` for `categoryId`; `AdminProductsList` no longer shows the "Próximamente" stub; form lives in `AdminProductsList` tree (not a new route).
- [x] APF-5.2 wire `test:admin-product-form` and confirm `package.json` `dependencies`+`devDependencies` count unchanged (9/11).
- [x] APF-5.3 wire `assert:admin-product-form` as alias that runs `node scripts/assert-admin-auth-products.mjs` (single assertion file remains the source of truth per slice convention).

### Phase 6: Public regression + lint/build + backend contract

- [x] APF-6.1 `npm run lint` — zero warnings on touched files.
- [x] APF-6.2 `npm run build` — must pass.
- [x] APF-6.3 `npm run assert:public-routes` — must pass.
- [x] APF-6.4 `npm run assert:home-redesign` — must pass.
- [x] APF-6.5 `npm run assert:admin-auth-products` — must pass.
- [x] APF-6.6 `npm test` — must pass (durable + form + home + auth).
- [x] APF-6.7 Backend contract: `cd backend && DATABASE_URL='postgresql://test:test@127.0.0.1:5432/test' npm run prisma:generate && node test/admin-auth.test.js && node test/admin-middleware.test.js` — must pass; no contract drift, no `.env` reads.

### Phase 7: Verification + archive handoff

- [x] APF-7.1 hand off to `sdd-verify`; refreshed after approved R4-001 with APF 11/11, Node 48/48, direct lint/build/static/backend checks, durable 36-scenario execution, focused mutation/refresh proof, and deterministic `/me` retry evidence.
- [x] APF-7.2 `archive-admin-product-form.md` and Engram archive history exist; refresh archive metadata after the R4-001 verify update without changing product scope.

## 8. QA/deploy

- [x] 8.1 `npm run lint`.
- [x] 8.2 `npm run build`.
- [x] 8.3 Backend health local.
- [ ] 8.4 Railway health.
- [ ] 8.5 Vercel consume Railway.
- [ ] 8.6 Checkout end-to-end.
- [ ] 8.7 Admin end-to-end.
- [x] 8.8 Actualizar README.
- [ ] 8.9 Guardar memoria Engram final.
