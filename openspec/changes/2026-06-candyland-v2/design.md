# Design: CandyLand v2 — Admin Categories

## Technical Approach

Implement AC-01..13 as one dependency-free page in the protected admin shell. Replace the redirect with a lazy nested route, enable navigation, reuse `adminRequest`/`listAdminCategories`, and add only missing mutations. `AdminCategoriesPage` owns list, form, and deletion state; backend/schema/auth remain unchanged.

## Architecture Decisions

| Decision | Choice / rationale | Rejected |
|---|---|---|
| Page ownership | One page owns explicit list/form/delete states; no store is justified. | Context/global store |
| Forms | Native `<dialog>` create/edit reuses proven focus, Escape, pending-close, and restore behavior. | Inline form; modal dependency |
| Delete confirmation | A second native `<dialog>` requires explicit confirmation; pending blocks close and retains errors. | `window.confirm`; custom overlay |
| API/auth | Thin `adminRequest` methods; handle `204` before JSON. Exact transient verification 401 stays retryable; other 401s expire centrally. | Per-page fetch/auth |
| Mutation contract | Trim and submit `{ name }`; native required/100-char limit; `active` stays response-only. | Validator framework |

## Data Flow and Failure States

```text
/admin/categorias -> RequireAdminAuth -> AdminLayout -> AdminCategoriesPage
  -> listAdminCategories -> loading | error+retry | empty+create | success
  -> create/update {name} -> 201/200 -> close+restore -> server list refresh
  -> delete confirm -> 204 -> remove exact id+close+restore
  -> adminRequest -> transient 401 local | genuine 401 expire+login redirect
```

Refresh failure after successful create/update is a list error, never a retryable mutation. Form `400 errors[]`, duplicate `409`, and edit `404` preserve input. Delete `409`/`404` keeps the row and dialog visible. Network/5xx stays local/retryable. Pending states use `aria-live` and synchronous duplicate guards.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/App.tsx` | Modify | Lazy import and protected nested categories route |
| `src/pages/Admin/AdminLayout.tsx` | Modify | Use enabled route-aware Products/Categories links |
| `src/pages/Admin/AdminLayout.module.css` | Modify | Dynamic active/focus styles; retain Orders disabled |
| `src/pages/Admin/AdminCategoriesPage.tsx` | Create | List and create/edit/delete dialogs |
| `src/pages/Admin/AdminCategoriesPage.module.css` | Create | Light responsive styles/focus |
| `src/lib/adminApi.js` | Modify | 204-safe `adminRequest`; create/update/delete methods |
| `test/admin-categories.test.mjs` | Create | RED API/204/401/error contracts |
| `test/admin-auth-products.playwright.mjs` | Modify | AC-01..13 route-mocked runtime scenarios |
| `scripts/assert-admin-auth-products.mjs` | Modify | Route/nav/no-active/no-confirm/no-dependency boundaries |
| `package.json` | Modify | Wire category Node test into existing commands |
| `openspec/changes/2026-06-candyland-v2/tasks.md` | Modify | AC task/scenario traceability and budget gates |
| `openspec/changes/2026-06-candyland-v2/verify-admin-categories.md` | Create | Slice verification evidence |
| `openspec/changes/2026-06-candyland-v2/archive-admin-categories.md` | Create | Per-slice closure/history |

## Interfaces / Contracts

`AdminCategory = { id:number; name:string; slug:string; active:boolean; createdAt?:string; updatedAt?:string }`. Add `createAdminCategory(token,{name})`, `updateAdminCategory(token,id,{name})`, and `deleteAdminCategory(token,id): Promise<void>`. POST `/api/admin/categories` returns 201; PATCH `/:id` returns 200; DELETE `/:id` returns 204. No `active` request field.

## Testing Strategy

| Layer | Coverage |
|---|---|
| Node RED | Methods/paths, `{name}` only, 204, errors, both 401 classes |
| Static/build | Lazy protected nesting, enabled nav, no Header/Footer, `window.confirm`, active control, dark CSS, or dependency; lint/build/public/admin assertions |
| Chromium runtime | AC-01..13: list states, mutations/errors, single pending request, delete confirmation, both 401s, focus/Escape/restore, live feedback, 390×844, clean console |
| Backend regression | Existing `backend/test/admin-categories-orders-http.test.js`; no DB/secrets |

## Threat Matrix

Routing changes are applicable; the reference matrix rows are not: documentation-like paths, Git repository selection, commit state, push state, and PR commands are each **N/A** because this browser route performs no classification, Git, shell, subprocess, or PR operation. Route protection and shell placement have RED runtime/static tests above.

## Rollout, Rollback, and PR Forecast

No migration or flag. Roll back the frontend commit; existing endpoints/data remain compatible. Forecast: planning/spec/design/tasks **~380**, implementation/CSS **~520**, Node/static/runtime tests **~420**, verify/archive/docs **~190**, reserve **~190** = **~1,700 changed lines**. Single PR; 400-line risk High, 3,000-line risk Low. Checkpoint/reforecast at 2,400; prepare split at 2,600; if projected final exceeds 2,800, hard-split edit/PATCH into a follow-up. Never exceed 3,000, and never remove runtime tests, accessibility, error mapping, verification, or per-slice archive from either slice.

Decision needed before apply: No  
Chained PRs recommended: No  
400-line budget risk: High

## History

This active design supersedes the completed product-form design only as the next slice plan. Product-form decisions and evidence remain preserved in `archive-admin-product-form.md` and `verify-admin-product-form.md`.

## Result Contract

- **status**: success
- **executive_summary**: AC-01..13 are designed as a native protected category page with central auth, explicit list/form/delete states, accessible dialogs, and no backend or dependency change.
- **artifacts**: `openspec/changes/2026-06-candyland-v2/design.md`; Engram `sdd/2026-06-candyland-v2/design`
- **next_recommended**: sdd-tasks
- **risks**: Native-dialog Chromium runtime sensitivity; shared `adminRequest` 204 handling needs regression coverage; budget drift.
- **skill_resolution**: paths-injected — sdd-design, frontend-design, playwright-best-practices, typescript-advanced-types, karpathy-guidelines, ponytail; shared SDD/OpenSpec conventions.
