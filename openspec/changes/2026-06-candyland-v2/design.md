# Design: CandyLand v2 — Admin Orders

## Technical Approach

Implement AO-01..10 as one dependency-free React/TypeScript page in the protected admin shell. Replace the redirect with a lazy route, enable its `NavLink`, extend JSDoc-typed `adminApi.js`, and keep state local. Backend, schema, auth, stock, email, and payment remain unchanged.

## Architecture Decisions

| Decision | Choice and rationale | Rejected |
|---|---|---|
| Detail | Native `<details>/<summary>` per order loads `GET /api/admin/orders/:id` once; keyboard/focus behavior is native and needs no modal lifecycle. | Dialog; custom accordion |
| State | One page owns list, filter, detail cache/errors, drafts, and pending order ID. Apply data only after PATCH success. | Store/context; optimistic updates |
| Status contract | One exported `ADMIN_ORDER_STATUSES` tuple (`PENDING`, `SHIPPED`, `DELIVERED`, `CANCELLED`) drives filters, selectors, runtime request guards, and types. | Backend aliases; free text |
| Auth/errors | All three methods use `adminRequest`: exact `Unable to verify account status` 401 remains local/retryable; every other 401 calls `expireAdminSession`. | Page-level auth branches |
| Presentation | Reuse shell/shared states; add only page CSS. `CASH` → `Efectivo`, `TRANSFER` → `Transferencia`; missing/unknown fields → `No disponible`. | New component library |

## Data Flow and Failure States

```text
/admin/pedidos -> RequireAdminAuth -> AdminLayout -> AdminOrdersPage
  -> listAdminOrders(token, filter?) -> initial loading/error/empty/success
  -> <details> toggle -> getAdminOrder(token,id) -> inline loading/error+retry/detail
  -> updateAdminOrderStatus(token,id,{status}) -> pending -> replace exact list/cache item
  -> adminRequest -> transient 401 local | genuine 401 expire+login redirect
```

Filter retry retains its canonical value. Initial failure shows full retry; later list/detail/update failures preserve orders, expanded detail, and draft. PATCH `400`, `404`, network/5xx, or transient `401` leaves server status unchanged and shows `role="alert"`; pending disables submit and blocks duplicates. Genuine `401` follows shared expiry. Success replaces only the matching list/cache DTO—never retrying the mutation as refresh.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/App.tsx` | Modify | Lazy protected orders page instead of redirect |
| `src/pages/Admin/AdminLayout.tsx` | Modify | Enable route-aware Orders `NavLink` |
| `src/pages/Admin/AdminOrdersPage.tsx` | Create | List/filter, detail, update, safe fallbacks |
| `src/pages/Admin/AdminOrdersPage.module.css` | Create | Light, responsive rows/details, visible focus |
| `src/lib/adminApi.js` | Modify | Types, allowlist, list/detail/update methods |
| `test/admin-orders.test.mjs` | Create | RED API/type-guard/error contracts |
| `test/admin-auth-products.playwright.mjs` | Modify | AO-01..10 mocked runtime matrix |
| `scripts/assert-admin-auth-products.mjs` | Modify | Route/nav/scope/static contracts |
| `package.json` | Modify | Wire Node/static checks; no dependencies |
| `openspec/changes/2026-06-candyland-v2/tasks.md` | Modify | Scenario traceability and budget gates |
| `verify-admin-orders.md`, `archive-admin-orders.md` | Create | Per-slice evidence and history |
| `docs/INDEX.md` | Conditional | Remove stale “orders deferred” wording during archive |

## Interfaces / Contracts

`AdminOrderStatus` is the exact four-value union. `AdminOrderItem = { productId:number; productTitle:string|null; quantity:number; priceCents:number; subtotalCents:number }`. `AdminOrderContact = { id:number; name:string; phone:string; address:string; city:string; province:string; postalCode:string }`. `AdminOrder = { id:number; orderNumber:string; status:AdminOrderStatus; totalCents:number; paymentMethod:'CASH'|'TRANSFER'|null; paymentStatus:string|null; contact:AdminOrderContact|null; items:AdminOrderItem[]; createdAt:string; updatedAt:string }`.

Add `listAdminOrders(token,status?)`, `getAdminOrder(token,id)`, and `updateAdminOrderStatus(token,id,status)`. List uses `?status=${encodeURIComponent(status)}` only for allowed values; PATCH sends exactly `{ status }`. Backend mapping: `customer` → `contact`, `items[].product.title` → `productTitle`, quantity × price → `subtotalCents`, payment → top-level fields.

## Testing Strategy

| Layer | Coverage |
|---|---|
| Node RED | Paths/query/body, exact allowlist rejection, 400/404/network, both 401 classes, no data mutation |
| Static/build | Protected route/nav, no public chrome/dark/deps/payment actions; lint/build/assertions |
| Chromium runtime | AO-01..10: four list states, retained filter/retry, labels/fallbacks, detail keyboard/focus, single PATCH, delayed success, all failures, 390×844, clean console |
| Backend regression | Existing pure + HTTP orders, auth, and middleware tests with stubs; no DB, `.env`, or secrets |

## Threat Matrix

Routing is applicable and gets protected-route/nav RED tests. Reference rows: Documentation-like paths — **N/A**, no classification/execution; Git repository selection — **N/A**, no Git; Commit state — **N/A**, no commits; Push state — **N/A**, no push; PR commands — **N/A**, no PR automation.

## Rollout, Rollback, and PR Forecast

No migration or flag. Roll back the frontend commit; existing APIs/data remain compatible. Forecast: planning **~300**, React/API/CSS **~520**, Node/static/runtime tests **~430**, verify/archive/docs **~150**, reserve **~250** = **~1,650 changed lines**. Single PR; 400-line risk High, 3,000-line risk Low. Checkpoint/reforecast at 2,400; at 2,600 stop and prepare a split; if projected final exceeds 2,800, defer detail polish only while retaining list, functional detail, status updates, runtime/a11y/errors, verify, and archive. Never exceed 3,000.

Decision needed before apply: No  
Chained PRs recommended: No  
400-line budget risk: High

## History

This design advances the next slice; completed admin and backend-orders verify/archive artifacts remain authoritative.

## Result Contract

- **status**: success
- **executive_summary**: AO-01..10 define protected, resilient admin order management.
- **artifacts**: `openspec/changes/2026-06-candyland-v2/design.md`; Engram `sdd/2026-06-candyland-v2/design`
- **next_recommended**: sdd-tasks
- **risks**: DTO drift in string fields; runtime-test growth; budget drift
- **skill_resolution**: paths-injected — sdd-design, frontend-design, playwright-best-practices, typescript-advanced-types, karpathy-guidelines, ponytail; cognitive-doc-design; shared conventions
