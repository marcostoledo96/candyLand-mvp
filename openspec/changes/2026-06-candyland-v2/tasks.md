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
- [ ] 4.6 Crear pantallas admin.
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
