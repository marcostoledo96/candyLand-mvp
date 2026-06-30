# Design: Public Endpoints — Categories + Forms

## Technical Approach

Implement the branch `backend/formularios-publicos-y-categorias` as a small backend-only slice: public routes for categories and three form submissions, mounted from the existing Express app. Keep Express + Prisma + PostgreSQL, no new runtime dependency, no schema migration unless Prisma field names differ from `backend/prisma/schema.prisma`.

## Architecture Decisions

| Topic | Choice | Rejected | Rationale |
|---|---|---|---|
| Route location | Add `backend/routes/public.js`, mount with `app.use('/api', publicRoutes.router)` before admin routes | Keep all new handlers in `backend/app.js` | `app.js` already holds legacy public/cart/product routes and admin is already extracted. One public route file is the smallest structure that stays testable without adding controllers/services. |
| Validation | Hand-written helpers in `routes/public.js`; export them for tests | Zod/Joi/new middleware package | `backend/package.json` has no validation lib; existing admin routes use local helpers and `{ error, errors }`. |
| Slug | Reuse the existing slug behavior by moving `slugify` to `backend/utils/slug.js` and importing it in admin + public routes | Import `routes/admin.js` from public, or duplicate logic | Avoid public→admin coupling while keeping one implementation for accents/punctuation behavior already covered by tests. |
| Categories count | Include `activeProductCount` using Prisma filtered relation count or equivalent active-only count query | Return products or count inactive products | Spec requires category-only payload and inactive products must not be surfaced as available. |
| Error shape | Public validation errors return `400 { error: 'Validation failed', errors: [...] }`; internal errors return `500 { error: 'Internal Server Error' }` | New global response wrapper | Matches current public/admin API patterns and avoids changing existing clients. |

## Data Flow

```text
Browser form/menu
  -> Express app.js /api mount
  -> routes/public.js validation + DTO mapping
  -> Prisma Client
  -> Railway PostgreSQL
```

Malformed JSON and oversized bodies are handled at the Express boundary with JSON parser error middleware; no stack traces are returned.

## File Changes

| File | Action | Description |
|---|---|---|
| `backend/routes/public.js` | Create | Public router, validation helpers, DTO mappers, Prisma persistence. |
| `backend/utils/slug.js` | Create | Shared `slugify(name)` used by admin and public category DTOs. |
| `backend/app.js` | Modify | Use `express.json({ limit: '20kb' })`, add parser error handler, mount public routes before admin routes. |
| `backend/routes/admin.js` | Modify | Import shared `slugify`; keep admin behavior unchanged. |
| `backend/test/public-endpoints.test.js` | Create | Pure assert tests for validation, slug/category mapping, persistence input normalization. |
| `backend/test/public-endpoints-http.test.js` | Create | Stdlib HTTP tests with stubbed Prisma for route status/body/persistence behavior. |

## Interfaces / Contracts

`GET /api/categories -> 200`:

```js
[{ id: 1, name: 'Gomitas', slug: 'gomitas', activeProductCount: 3 }]
```

No product payload. Counts include only `Product.active === true`; categories with zero active products may return `activeProductCount: 0`.

`POST /api/contact -> 201 { ok: true, id }` maps to `ContactMessage`: `name`, `email`, `phone?`, `message`.

`POST /api/jobs/applications -> 201 { ok: true, id }` maps to `JobApplication`: `fullName`, `email`, `phone?`, `position`, `message?`, `cvUrl?`.

`POST /api/franchise/leads -> 201 { ok: true, id }` maps to `FranchiseLead`: `fullName`, `email`, `phone?`, `city`, `message?`.

Validation: trim strings, require non-empty required fields, basic email check (`something@something.suffix`), max lengths: names/position/city/phone 100, email 254, cvUrl 500, messages 2000.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Validators, slug/category DTO, Prisma create data mapping | Node `assert`, no DB. |
| HTTP integration | Public routes, no auth required, 400 no persistence, 201 persists, categories count active only | Stdlib `http` server + stubbed `prismaClient` via require cache. |
| Regression | Existing admin slug tests still pass after extracting helper | Update imports only; run existing admin tests. |

## Migration / Rollout

No migration required. PR-3 already added `ContactMessage`, `JobApplication`, and `FranchiseLead` with matching fields.

Rollback: remove `app.js` public-route mount and the new public route/tests; keep shared slug util only if admin still imports it, or inline it back into `routes/admin.js`.

## Out of Scope

- Frontend forms/pages.
- Email sending.
- Admin UI.
- Payments, stock, checkout changes.
- Product detail `/producto/:id`, WhatsApp, Mercado Pago, cards.

## Open Questions

- None.
