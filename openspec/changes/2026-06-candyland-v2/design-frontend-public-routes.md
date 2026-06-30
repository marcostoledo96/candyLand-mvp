# Design: Frontend Public Routes for Macarena Parity

## Technical Approach

Implement this branch as a frontend-only React Router slice. Reuse the existing lazy route pattern in `src/App.tsx`, the existing `src/lib/api.ts` fetch wrapper, CSS modules/global form CSS, and current CandyLand light palette. Keep `/catalogo` as the product grid, make `/menu` category-led from `GET /api/categories`, and keep tutorials static.

## Architecture Decisions

| Decision | Choice | Tradeoff / Rationale |
|---|---|---|
| Routes | Add lazy pages `MenuPage`, `TutorialesPage`, `FranquiciasPage`, `TrabajaPage`; alias `/tienda` and `/nuestros-dulces` to `CatalogPage`. | Matches `src/AGENTS.md`; no `/producto/:id`; avoids extra redirect component. |
| API layer | Add typed helpers only in `src/lib/api.ts`. | Preserves “all backend calls through api.ts”; no new client abstraction. |
| Forms | Local `useState` per page: `values`, `errors`, `status`, `message`. | Smallest pattern that preserves input on validation/API errors and supports success reset. |
| CSS | One shared compact page CSS module for new public pages plus existing `Contacto.css` edits. | Keeps changed lines under 800; avoids a design-system detour. |

## Route Map

```text
/                       -> Home
/catalogo               -> CatalogPage
/tienda                 -> CatalogPage alias
/nuestros-dulces        -> CatalogPage alias
/menu                   -> MenuPage
/tutoriales             -> TutorialesPage
/franquicias            -> FranquiciasPage
/trabaja-con-nosotros   -> TrabajaPage
/contacto               -> Contacto
/carrito                -> CartPage
/checkout/direccion     -> AddressForm
/checkout               -> AddressForm alias
/checkout/pago          -> PaymentMethod
/checkout/confirmacion  -> Confirmation
```

## Data Flow

```text
MenuPage -> fetchCategories() -> GET /api/categories -> filter activeProductCount > 0 -> category cards or empty state
Contacto -> postContact() -> POST /api/contact -> success/error feedback
FranquiciasPage -> postFranchiseLead() -> POST /api/franchise/leads
TrabajaPage -> postJobApplication() -> POST /api/jobs/applications
TutorialesPage -> static imports from src/assets/img/tutorial*.jpg
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/App.tsx` | Modify | Add lazy imports and route map above. |
| `src/lib/api.ts` | Modify | Add `ApiCategory`, `PublicFormResponse`, payload types, `fetchCategories`, `postContact`, `postJobApplication`, `postFranchiseLead`. |
| `src/components/Header/Header.tsx` | Modify | Desktop/mobile nav parity for Home, Catalog, Menu, Tutorials, Franchise, Jobs, Contact, Cart. |
| `src/components/Footer/Footer.tsx` | Modify | Replace `#` placeholders with `Link`; keep social anchors only if real/external or inert with labels. |
| `src/components/Contact/Contacto.tsx` + `.css` | Modify | Map `nombre`→`name`, `mensaje`→`message`; add validation/status UI. |
| `src/pages/PublicRoutes/PublicRoutes.module.css` | Create | Shared layout, cards, form, states, focus-visible. |
| `src/pages/Menu/MenuPage.tsx` | Create | Category-led cards with counts, loading/error/empty/success, retry, no product-detail links. |
| `src/pages/Tutoriales/TutorialesPage.tsx` | Create | Static visual cards using existing `src/assets/img/tutorial1.jpg`…`tutorial6.jpg`. |
| `src/pages/Franquicias/FranquiciasPage.tsx` | Create | API-backed lead form. |
| `src/pages/Trabaja/TrabajaPage.tsx` | Create | API-backed jobs form; optional `cvUrl` text; no file input. |

## Interfaces / Contracts

```ts
export interface ApiCategory { id: number; name: string; slug: string; activeProductCount: number; }
export interface PublicFormResponse { ok: true; id: number; }
export interface ContactPayload { name: string; email: string; message: string; phone?: string; }
export interface JobApplicationPayload { fullName: string; email: string; position: string; phone?: string; message?: string; cvUrl?: string; }
export interface FranchiseLeadPayload { fullName: string; email: string; city: string; phone?: string; message?: string; }
```

`MenuPage` MUST render only categories with `activeProductCount > 0`. If the API returns an empty array or all categories have `activeProductCount === 0`, it renders the empty state instead of showing unavailable categories as menu options.

Footer newsletter MUST NOT remain as a fake form. Either remove it from this slice or render it as documented static copy without a submit action. Social links may stay only if they are real external URLs or clearly inert labeled links with no fake submission behavior.

## UI / Accessibility Strategy

Use CandyLand’s current light palette (`#fffafc`, `#ec6cac`, `#4a2c2a`) and existing Oswald/Raleway typography. Inputs require visible `<label>`, `aria-live` feedback for form status, disabled submit while loading, semantic `<button>`, real image `alt`, and `:focus-visible` styles. Preserve valid input on validation/API errors; clear only after success.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Static/type | Imports, route components, typed API helpers | `npm run build` |
| Lint | React/TS hygiene | `npm run lint` |
| Runtime smoke | Routes, mobile nav, forms, menu states | Manual browser pass with backend running; inspect no file input and no `/producto/:id` links. |
| Backend contract | Public endpoints reachable | `cd backend && npm run prisma:generate`; optional local `npm run dev` + curl public endpoints. |

Strict TDD runtime evidence should include the smallest available automated checks for scenario-level behavior. If no frontend test runner exists, add focused build-time/static Node assertions for route/nav/API contracts where practical, then use `npm run lint` and `npm run build` as the executable frontend safety net.

## Migration / Rollout

No migration required. Frontend consumes already-merged public endpoints and static assets.

## Open Questions

None. `public/img/candyland/` is absent, so this design intentionally uses existing `src/assets/img/tutorial*.jpg` imports for this branch.
