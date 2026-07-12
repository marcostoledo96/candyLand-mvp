# Archive — Frontend Admin (auth + products)

**Change**: `2026-06-candyland-v2`
**Slice / branch**: `7f. Frontend admin — auth + products only` / `frontend/admin-auth-products`
**Archive date**: 2026-07-12
**Mode**: per-slice archive (project convention, same as 7d, 7e)
**Verdict**: PASS WITH WARNINGS — closed for this slice

## Intent (recap)

Narrowed admin slice: `/admin/login`, `/api/admin/me` bootstrap, sessionStorage token
(`admin_token`, 8h TTL, no cookie, no localStorage, no refresh), logout + central 401
clear, protected shell outside public `Header`/`Footer`, product list
(loading/error/empty/success), deactivate/reactivate, responsive + a11y + error
states. Reuse `PublicRoutes.module.css`; no new deps, no dark mode, no
`dangerouslySetInnerHTML`, no token logging.

## Spec merge / file move policy

Per-slice convention (same as 7d, 7e): **no spec merge** (no dedicated delta
spec; verify report records `0/0` formal requirements and `0/0` scenarios),
**no change-folder move** (active change stays open), **no new
`docs/FUNCIONALIDADES.md`** (admin scope is still partial). This file is the
slice closure artifact.

## Shipped scope (slice 7f)

- **Auth helpers** — `src/lib/adminAuth.js` (token decode/expiry + `getAdminToken`/`setAdminToken`/`clearAdminToken`; `AdminAuthError`) and `src/lib/adminApi.js` (login, `/me`, list, deactivate, reactivate; central 401 clear; `AdminApiError`).
- **Shell + guard** — `src/pages/Admin/AdminLayout.tsx` + `.module.css` (sidebar nav with Categorías/Pedidos `aria-disabled` "Próximamente", top bar with admin email + "Cerrar sesión", light-only, mobile-first, responsive `<768px`) and `src/components/Admin/RequireAdminAuth.tsx` (`/me` bootstrap, 401 → clear + redirect, network error → retry state, no Header/Footer import).
- **Login** — `src/pages/Admin/AdminLogin.tsx` (email/password with `autoComplete="current-password"`, `aria-live`, preserves input on error, clears on success, submit disabled while loading, no `alert()`).
- **Product list + deactivate/reactivate** — `src/pages/Admin/AdminProductsList.tsx` + `.module.css` (table → card list `<640px`, active badges, deactivate/reactivate + refetch, loading/error/empty/success; create/edit display only "Próximamente").
- **Routing** — `src/App.tsx` nested `<Route element={<Layout />}>`; admin routes outside the public layout; lazy imports; `Header`/`Footer` not imported by admin pages.
- **Static contract** — `scripts/assert-admin-auth-products.mjs` (46 checks; wired as `assert:admin-auth-products`).
- **Lint/build/regression** — `npm run lint`, `npm run build`, `assert:public-routes`, `assert:home-redesign`, `npm test`, safe backend auth + middleware contract — all pass.
- **Docs** — `docs/AUTENTICACION.md` (new, 44 lines), `design.md` 7f section (+13 lines), `docs/INDEX.md` AUTENTICACION link (+1 line).
- **Playwright runtime smoke** — 15 scenarios, 0 console errors.
- **Remediation (R1-R2)** — guard retry issues a second `/api/admin/me`; product API 401 expires the shared admin session and redirects.

## Deferred (out of slice 7f)

**Phase 6 `AdminProductForm`** (modal, validations, form-only API) — DEFERRED
to `frontend/admin-product-form`. Required next: `adminValidation.js`
(`parsePriceInput`, `validateProductPayload`, `isSafeAdminImageUrl`,
`extractApiError`), form-only API (`createAdminProduct`, `updateAdminProduct`,
`getAdminProduct`, `listAdminCategories`), modal UI, RED tests, static
assert additions.

**Categories CRUD / Orders UI** — backend endpoints already exist per
`tasks.md` 4.4 / 4.5; UI follows in dedicated branches.

**42 broader tasks** across slices 1, 2.4, 2.8, 3.1, 3.2, 3.4, 4.6, 5.4, 6.x,
7.1–7.9, 8.4–8.7, 8.9 — active change `2026-06-candyland-v2` stays open;
this archive closes only slice 7f.

## Test layer (kept in the candidate)

| Layer | Checks | File / tool |
|---|---:|---|
| Durable Node `node:test` | 21 admin tests (+ 3 focused 401 classification) | `test/admin-auth-products.test.mjs` |
| Static contract (CI) | 46 checks | `scripts/assert-admin-auth-products.mjs` |
| Playwright-MCP runtime | 15 scenarios, 0 console errors | `test/admin-auth-products.playwright.mjs` |
| Public-route regression | unchanged | `npm run assert:public-routes` |
| Home-redesign regression | unchanged | `npm run assert:home-redesign` |
| Lint / build | pass / pass | `npm run lint` / `npm run build` |
| Safe backend contract | pass / pass | `node test/admin-auth.test.js && node test/admin-middleware.test.js` (no `.env`, no real DB) |

## Verification recap (from `verify-admin-auth-products.md`)

- `npm run lint`: PASS, `0eb52fc…ea15d`.
- `npm run build`: PASS (101 modules), `fdd3ae7c…4ff2`.
- `npm test`: PASS, 41/41, `7e2191e7…7f37` (Suspense correction included).
- `npm run assert:admin-auth-products`: PASS, 46 checks, `f81ca62b…5292`.
- Playwright-MCP durable smoke: 15 scenarios, 0 console errors; **Suspense correction runtime PASS** — cold lazy `/admin/login` shows accessible `role="status"` fallback (`Cargando…`) while chunk loads (AdminLogin asset delayed 300ms), then `Panel de administración` + fields render; error path preserves inputs; successful submit → `/admin/productos` + authenticated shell. Retained: transient 401 exact body `401 {error:"Unable to verify account status"}` → retryable + token retained; genuine 401 → token cleared + redirect `/admin/login`; build hash `c22e2a7f…606b`.
- TDD compliance: remediation + transient-401 + Suspense RED/GREEN captured; GREEN independently confirmed.
- Critical findings: 0. **Warnings: 4** — no formal OpenSpec requirement; cleanup/race and hostile return-state checks only in focused runtime; Chromium-only; deactivate without confirmation/undo.
- Prior 7f FAIL (retry + mutation 401) is superseded; history preserved in `verify-admin-auth-products.md` and Engram revision log.

## Scope (independent calculation, current)

Tracked diff vs `origin/main`: **202 insertions, 26 deletions = 228 lines**
across 5 files. Untracked new files: **1,607 lines** across 14 files
(including this 101-line archive; Suspense correction +10 lines vs the
1,825 prior total). **Current total surface = 228 + 1,607 = 1,835
lines** (1,835 / 2,000 = 91.75% of hard cap; 165-line headroom to hard cap;
above the 1,807 prior projected cap but under the 2,000 hard cap).

## Out of scope (deliberate)

Header / Footer redesign. `/producto/:id`. Dark mode. WhatsApp. Mercado Pago
/ cards. Backend, DB, deploy, schema migration. New dependencies, new
top-level docs (admin scope still partial). Permanent delete, bulk actions,
pagination / search / analytics, MFA, password reset, user management, cookie
auth, uploads.

## Skills loaded

`sdd-archive` (this skill), `cognitive-doc-design` (chunked,
lead-with-answer), `karpathy-guidelines` (surgical minimum-change),
`ponytail` (full: no spec merge, no folder move, no new top-level doc). No
secrets read, no `.env`, no DB, no commit / push / PR / merge.
Ready for the next slice on `2026-06-candyland-v2`.
