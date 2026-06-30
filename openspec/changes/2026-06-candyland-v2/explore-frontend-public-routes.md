# Exploration: Frontend public routes from Macarena reference

## Exploration: frontend/nuevas-rutas-macarena

### Current State

The React frontend on branch `frontend/nuevas-rutas-macarena` currently exposes only `/`, `/catalogo`, `/contacto`, `/carrito`, and the `/checkout/*` flow. `src/AGENTS.md` already mandates the missing public routes: `/menu`, `/tutoriales`, `/franquicias`, `/trabaja-con-nosotros`, plus optional aliases `/tienda` and `/nuestros-dulces` for `/catalogo`.

Backend public endpoints needed for this phase were already implemented in the merged `backend/formularios-publicos-y-categorias` slice and are live in `backend/routes/public.js`:

- `GET /api/categories`
- `POST /api/contact`
- `POST /api/jobs/applications`
- `POST /api/franchise/leads`

The existing contact form (`src/components/Contact/Contacto.tsx`) is wired to `console.log` + `alert`; it must be connected to `POST /api/contact`.

`src/lib/api.ts` already centralizes all backend calls via `VITE_API_URL` and a fallback for local dev, so new page helpers should live there.

### Affected Areas

- `src/App.tsx` — add lazy-loaded routes for `/menu`, `/tutoriales`, `/franquicias`, `/trabaja-con-nosotros`; keep `/contacto`; optionally alias `/tienda` and `/nuestros-dulces` to `/catalogo`.
- `src/components/Header/Header.tsx` — update nav items to the canonical public route set.
- `src/components/Footer/Footer.tsx` — replace anchor placeholders (`#tutoriales`, `#franquicias`, etc.) with `Link`/`a` to real routes.
- `src/lib/api.ts` — add typed helpers: `fetchCategories`, `postContact`, `postJobApplication`, `postFranchiseLead`.
- `src/components/Contact/Contacto.tsx` — connect submit to `postContact`; add loading/error/success states.
- `src/pages/Menu/MenuPage.tsx` — new page consuming `/api/categories` with loading/error/empty/success states.
- `src/pages/Tutoriales/TutorialesPage.tsx` — new visual-cards-only page using static assets from `src/assets/img/tutorial*.jpg`.
- `src/pages/Franquicias/FranquiciasPage.tsx` — new form posting to `/api/franchise/leads`.
- `src/pages/Trabaja/TrabajaPage.tsx` — new form posting to `/api/jobs/applications`.
- `src/assets/img/` — reuse existing tutorial/product images; note that `public/img/candyland/` (mentioned in `src/AGENTS.md`) does not exist.

### Approaches

1. **Single incremental PR — new pages + header/footer + API helpers + contact wiring**
   - Pros: one coherent user-facing deliverable; all new routes appear together; easy to verify end-to-end.
   - Cons: touches ~8 files plus CSS modules; could approach the 800-line review budget if each page gets a full module.
   - Effort: Medium

2. **Split into two PRs — (a) routing/nav/API helpers + contact wiring, (b) new page content/styles**
   - Pros: smaller diffs; first slice is mostly plumbing and can be verified quickly.
   - Cons: the pages are not usable until PR (b) merges; adds coordination overhead for a small feature set.
   - Effort: Medium (higher coordination)

3. **Minimal viable slice — add routes and navigation first, placeholder pages second**
   - Pros: smallest initial diff; navigation works immediately.
   - Cons: placeholder pages deliver no real value and would need a follow-up slice anyway.
   - Effort: Low (but incomplete)

### Recommendation

Use **Approach 1 (single incremental PR)**, but keep each new page component and its styles minimal and consistent with the existing CSS-modules pattern. The work is cohesive and the review budget of 800 changed lines is achievable if we avoid over-building the visual pages. The contact form wiring and Menu API consumption are the highest-value parts; tutorial/franchise/job pages can reuse the reference layout vocabulary without copying the old HTML/CSS verbatim.

### Risks

- **Asset path mismatch**: `src/AGENTS.md` points to `public/img/candyland/`, but the Macarena assets currently live under `src/assets/img/`. Using `src/assets/img/` keeps the Vite import path, but any future move to `public/` will require updating these pages.
- **Trabaja form CV upload**: the reference HTML has a file input, but the backend `/api/jobs/applications` schema only stores `cvUrl` (text). We must either use a URL field or deliberately skip the file upload (consistent with the project decision "no upload de archivos"). Decision needed before implementation.
- **Menu vs Catalog overlap**: `/menu` and `/catalogo` may end up looking similar if both consume products/categories. We should keep `/menu` as a simpler category-driven presentation (e.g., category cards with counts) and leave the product grid in `/catalogo`.
- **No existing tests**: there are no frontend unit/component tests; verification will rely on `npm run build` and manual endpoint smoke tests.
- **CSS modules proliferation**: adding four new pages with individual `.module.css` files increases fragmentation. Consider a shared page-level CSS module or consistent token usage to keep the diff small.

### Ready for Proposal

Yes. The scope is clear, the backend endpoints exist, and the route requirements are documented in `src/AGENTS.md` and `openspec/specs/frontend-ui-parity/spec.md`. The open decision is whether the Trabaja form asks for a CV URL or omits the file/URL field entirely.
