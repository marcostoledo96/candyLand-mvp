# Archive — Frontend Admin (product form)

**Change**: `2026-06-candyland-v2`
**Slice / branch**: `7g. Frontend admin — product form` / `frontend/admin-product-form`
**Archive date**: 2026-07-12
**Mode**: per-slice archive (project convention; same as 7d, 7e, 7f)
**Verdict**: PASS WITH WARNINGS — closed for this slice

## Intent (recap)

Native `<dialog>` create/edit modal; list-DTO edit ownership; pure `adminValidation.js`; three new `adminApi` methods (`createAdminProduct`, `updateAdminProduct`, `listAdminCategories`); category four states (loading / error+retry / empty / success); backend 400 field mapping; focus / Escape / restore; narrow-viewport light-only; no upload; no detail endpoint; no new dependencies.

## Spec merge / file move policy

Per-slice convention (same as 7d, 7e, 7f): **no spec merge** (delta spec preserved as authored, `requirements 4/4`, `scenarios 11/11` per `verify-admin-product-form.md`), **no change-folder move** (active change stays open), **no new top-level doc**. This file is the slice closure artifact.

## Shipped scope (slice 7g)

- **Validation** — `src/lib/adminValidation.js` (72): `productFormFields`, `parsePriceInput` (whole-peso only; unchanged edit display `"12.5"` is accepted only when `originalPriceCents=1250` and round-trips to 1250; changed `"12.6"` and new `"12.5"` are rejected), `isSafeAdminImageUrl` (`http:` / `https:` / `data:image/(png|jpeg|webp|gif);base64,...`), `validateProductPayload`, `extractApiError` (prefix match on 8 field names, plus `categoryId does not exist` → `categoryId`).
- **API** — `src/lib/adminApi.js` (+18/-5 = 98): `createAdminProduct`, `updateAdminProduct`, `listAdminCategories` via central `adminRequest` (preserves 401 expiry + 400 mapping + network fallback).
- **Form** — `src/pages/Admin/AdminProductForm.tsx` (94) + `AdminProductForm.module.css` (15): native `<dialog>`, child of `AdminProductsList`, `showModal()` + first-focus via `requestAnimationFrame`, four category states with save block, save block while `saving`, field + summary errors, 401 leaves inputs, Escape closes without mutation, focus restored to invoker. **R4-001** — success path awaits `onSaved()` (list refetch) before `close()`; mutation errors are caught and re-thrown so refresh failure cannot silently re-open the dialog; list refresh failure stays in the list (error/retry) and never repeats the mutation POST.
- **List integration** — `src/pages/Admin/AdminProductsList.tsx` (+12/-13 = 180): enables create/edit, passes list DTO, refetches on `onSaved()` via `load(true)` which owns refresh failure (R4 separation); "Próximamente" stub removed.
- **Tests** — `test/admin-product-form.test.mjs` (107, NEW): `parsePriceInput` (integer paths green; unchanged legacy `12.5` round-trip accepted, changed/new fractional rejected), `validateProductPayload` (create + partial), `isSafeAdminImageUrl`, `extractApiError` (all 8 prefix paths + `categoryId does not exist` + 401/500/0), API method/path/body/401/400.
- **Playwright runtime** — `test/admin-auth-products.playwright.mjs` (+194/-14 = 363): APF-02..11 (DTO seed, PATCH `1500`, category four states, success refresh-close, 400/401 preserved errors + redirect, no duplicate save, focus/Escape/restore, 390px light UI, zero unexpected console errors). **R4-001 focused** — `successPostCount:1, dialogClosed:true, focusRestored:true, listError:true, retryDidNotPost:true, mutation400StayedOpen:true`; durable file is now 36 scenarios.
- **Static contract** — `scripts/assert-admin-auth-products.mjs` (+16/-4 = 142): zero `<input type="file">`, calls the four form helpers, `<select>` for `categoryId`, "Próximamente" stub removed, form lives in `AdminProductsList` tree.
- **Wiring** — `package.json` (+3/-1): `test:admin-product-form` (appended to root `test`), `assert:admin-product-form` alias for the shared assertion file. `dependencies` 9 / `devDependencies` 11 unchanged.
- **Legacy correction** — edit DTO `priceCents:1250` renders `12.5`; PATCH re-submits unchanged `1250`; `12.6` and any new fractional value are rejected without mutation.

## Deferred (out of slice 7g)

**Categories CRUD UI / Orders UI / User mgmt / MFA / password reset / uploads / permanent deletion / bulk actions / search / pagination / analytics / dark mode / payments / WhatsApp / `/producto/:id` / cookie auth / refresh tokens** — admin scope is still partial; backend endpoints already exist per `tasks.md` 4.4/4.5 and slice 7f's `archive-admin-auth-products.md`. **42 broader tasks** across the active change stay open.

## Test layer (kept in the candidate)

| Layer | Checks | File / tool |
|---|---:|---|
| Durable Node `node:test` | 48 total (7 APF + 21 admin + 3 focused 401 + 17 other) | `test/admin-product-form.test.mjs`, `test/admin-auth-products.test.mjs`, etc. |
| Static contract (CI) | 46 admin checks (single source of truth) | `scripts/assert-admin-auth-products.mjs` |
| Playwright-MCP runtime | 36 scenarios, 0 console errors; final response timed out (no failure) | `test/admin-auth-products.playwright.mjs` |
| Lint / build | pass / pass | `npm run lint` / `npm run build` (104 modules) |
| Safe backend contract | pass / pass | `node test/admin-auth.test.js && node test/admin-middleware.test.js` (no `.env`, no DB) |
| Public + home regression | unchanged | `npm run assert:public-routes`, `npm run assert:home-redesign` |

## Verification recap (from `verify-admin-product-form.md`)

- `requirements 4/4`, `scenarios 11/11`; `verdict: pass_with_warnings`; `blockers 0`, `critical 0`.
- `evidence_revision: sha256:800c5667aabfccaf907e0bd42f48987d61ec8fc14ae5e960e547cb2f8f8c022a`; `test_output_hash: sha256:5ed585f0a871ce363bd32bbb45e556d0438e66fd1b829edcd287de7f08eab549`; `build_output_hash: sha256:f1b0676519c31bfcaa777fd25046351f450c2868a1a3e9cc9f1f7a0a7a2cb874`.
- TDD: RED/GREEN captured for 3/3 work units (validation, API, form); GREEN independently confirmed; triangulation pure / contract / static / browser. **R4-001** (approved, receipt `review-ce8bc0efa50da610/review-receipt.json` terminal `approved`, candidate `d4c885770b65738541ed995309c35b442c2f35a0`): one POST closes the dialog and restores focus before the delayed refresh resolves; refresh 500 moves the list to its error/retry state; retry refetches the list and does not repeat the POST; a separate mutation 400 stays in the open dialog with its alert and preserved form state. Focused evidence `successPostCount:1, dialogClosed:true, focusRestored:true, listError:true, retryDidNotPost:true, mutation400StayedOpen:true`.
- APF-01..11 compliance matrix: all 11 ✅ (APF-07 specifically split success/refresh; APF-08 covers mutation 400 in-dialog + 401 redirect; APF-09 confirmed by `retryDidNotPost:true`).
- **Warnings (3, all from verify)**: (1) Playwright focus interactions timing-sensitive on a busy dev port; one unchanged rerun required on clean production preview; (2) final MCP call exceeded its response deadline while returning the 36-scenario durable file, but emitted no assertion failure (final sidebar assertion independently confirmed); (3) Web Interface Guidelines — product inputs omit `autocomplete`, invalid local submit does not focus the first invalid field, dialog CSS omits `overscroll-behavior: contain` and explicit hover states.
- Investigated `/me` retry failure: classified as test-harness environment/order, resolved (stale Vite dev server held port `4182`, activated React StrictMode effect replay; replaced with built production preview, focused evidence measured initial `/me=1`, retry delta `1`; full durable matrix 36/36 (final sidebar independently confirmed) with zero unexpected console/network errors).

## Scope (independent calculation, current)

Tracked diff vs `origin/main` (`git diff --numstat HEAD`):

| Bucket | Lines | Files |
|---|---:|---:|
| Tracked insertions (8 modified) | 534 | 8 |
| Tracked deletions (8 modified) | 109 | 8 |
| Untracked new (apply 4: `adminValidation.js` 72, `AdminProductForm.tsx` 94, `AdminProductForm.module.css` 15, `admin-product-form.test.mjs` 107; meta 2: `verify-admin-product-form.md` 119, this file) | 481 | 6 |
| **Total surface (tracked +/- + untracked)** | **1,124** | **14** |
| Hard cap | 3,000 | — |
| Headroom to hard cap | 1,876 (37.5% used) | — |

Per-file tracked: `design.md` +64/-64 (no net), `spec.md` +83/-2, `tasks.md` +144/-6, `package.json` +3/-1, `assert-admin-auth-products.mjs` +16/-4, `adminApi.js` +18/-5, `AdminProductsList.tsx` +12/-13, `playwright.mjs` +194/-14.

## Out of scope (deliberate)

Header / Footer redesign. `/producto/:id`. Dark mode. WhatsApp. Mercado Pago / cards. Backend, DB, deploy, schema migration. New dependencies, new top-level doc, spec merge, change-folder move. Permanent delete, bulk actions, pagination / search / analytics, MFA, password reset, user management, cookie auth, refresh tokens, uploads.

## Skills loaded

`sdd-archive` (this skill), `cognitive-doc-design` (chunked, lead-with-answer, ≤80 lines), `karpathy-guidelines` (surgical in-place R4-001 metadata refresh; no spec merge; no folder move; tasks.md already reconciled in prior pass), `ponytail` (full: no new top-level doc, no spec merge, no folder move, archive at 75 lines). No secrets, no `.env`, no DB, no commit / push / PR / merge. Ready for the next slice on `2026-06-candyland-v2`.
