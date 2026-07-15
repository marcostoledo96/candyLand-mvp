# Design: CandyLand v2 — Checkout Hardening

## Technical Approach

Implement CH-01..07 in the existing React Router checkout. Keep its routes, `CartContext`, backend, and dependencies. Add one JSDoc-typed module for normalization, validation, payloads, guards, errors, and confirmation transitions; Node tests import it directly.

## Architecture Decisions

| Decision | Choice / rationale | Alternatives rejected |
|---|---|---|
| Locality | Normalize stored `localidad || ciudad`, discard `ciudad`, and rewrite the six canonical fields; invalid JSON safely becomes empty. | Dual fields; eager clear |
| State | Route components retain UI state through existing storage. `clearCart` resets cart identity and the persisted confirmation key only after verified success. | New store/context |
| Pure core | JSDoc unions/functions in `src/lib/checkout.js` give TS inference and direct `node --test` coverage. | Dependency/transpile setup |
| Confirmation | Explicit `ready → pending → preDispatch | succeeded | rejected`; one UUID-strength key is retained per cart attempt and sent in `Idempotency-Key`. Every transport failure is retryable with that key; only verified success clears it. | Permanent ambiguous lock; automatic retries; optimistic success |
| Idempotency/concurrency | Nullable unique `Order.confirmationKey` plus `confirmationCartId` binds a replay to its originating cart. A stable `Idempotency-Key` is reused for every retry. Before replay/cart/stock work, a parameterized PostgreSQL advisory lock derived from the validated key serializes exact-stock concurrent requests; rollback releases it. The transaction returns one public DTO and sends one email for the winner. | Process-local locks; payload hash without cart binding |
| Payment/UI | Only manual methods, endpoint-provided bank data, native controls, live messages, and focused errors. | Cards, hardcoding, WhatsApp, alerts |

## Data Flow

```text
checkoutData(old/new) -> normalize/validate -> POST /api/checkout -> payment
paymentMethod -> POST /api/payment-method -> checkoutBank -> confirmation
Confirm action -> pending -> preDispatch -> retryable rejected (preserve; no POST/lock)
                         -> transport rejection -> retryable (same persisted key)
                         -> HTTP reject (preserve) | invalid-2xx retryable (same key)
                       -> valid success DTO -> summary -> clear cart + checkout storage
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/lib/checkout.js` | Create | Pure typed contracts and reducer |
| `src/lib/api.ts` | Modify | Preserve HTTP status/body versus transport failure |
| `src/pages/Checkout/{AddressForm,PaymentMethod,Confirmation}.tsx` | Modify | Canonical forms, instructions, safe confirmation |
| `src/pages/Checkout/Checkout.module.css` | Modify | Scoped mobile/a11y/error styles; remove WhatsApp |
| `src/context/CartContext.tsx` | Modify | Success-only identity/key reset |
| `backend/app.js` | Modify | Validate/bind/replay idempotency key around the existing confirmation transaction |
| `backend/prisma/schema.prisma` | Modify | Unique nullable confirmation key and originating cart binding on `Order` |
| `backend/prisma/migrations/*_confirmation_idempotency/migration.sql` | Create | Forward-only nullable-column + unique-index PostgreSQL migration |
| `backend/test/order-confirm-idempotency.test.js` | Create | Stubbed sequential/concurrent replay and email/stock regression coverage |
| `test/checkout-hardening.test.mjs` | Create | Node RED contracts/transitions |
| `scripts/assert-checkout-hardening.mjs` | Create | Forbidden strings/actions and dependency checks |
| `test/checkout-hardening.playwright.mjs` | Create | Mocked CH-01..07 runtime matrix |
| `package.json` | Modify | Wire checks; no dependencies |
| `openspec/changes/2026-06-candyland-v2/{tasks.md,verify-checkout-hardening.md,archive-checkout-hardening.md}` | Modify/Create | Planning and evidence |
| `docs/INDEX.md` | Conditional | Archive link only |

`src/App.tsx` is unchanged: `/checkout`, `/checkout/direccion`, `/checkout/pago`, and `/checkout/confirmacion` already use the required components.

## Interfaces / Contracts

Storage: `cartId`; `checkoutData` (six strings; legacy `ciudad` read-only); `paymentMethod`; transfer-only `checkoutBank`; `checkoutConfirmation = {cartId,key}`; legacy `orderNumber` is no longer written. Confirmed success removes all six keys; otherwise preserve them. A different cart replaces the stored key with a new attempt key.

Requests remain exact: checkout six-field JSON; payment `{method}`; confirmation bodyless with `Idempotency-Key`; present `cartId` URI-encoded. The backend accepts a UUID-format key within its documented length bound and requires any replay to match the stored `confirmationCartId`. Success requires all `ConfirmOrderResponse` fields before clearing.

| Input | Classification / UI |
|---|---|
| Client invalid; checkout `400 missing[]` | Field errors, ARIA linkage, focus first invalid field |
| `400` missing checkout/payment, empty cart, invalid quantity/method | Definite rejection; targeted prior-step/cart action |
| `400 inactiveProducts[]` / `insufficientStock[]` | Definite item-specific cart message |
| `404` / `409` | Missing or changed cart; preserve state and guide to cart |
| Other HTTP, including `5xx` | Definite backend rejection; preserve state, no automatic retry |
| Offline or synchronous `fetch` invocation failure before dispatch | Retryable `preDispatch`; no confirmation POST, no ambiguity lock, preserve checkout state |
| Confirmation promise rejection after invocation or invalid `2xx` DTO | Retryable; retain key/cart, focus alert, no clear/success |

Address/payment transport failures remain retryable because they cannot create an order.

## Testing Strategy

| Layer | Coverage |
|---|---|
| Node RED | Key lifecycle, exact header, validation, DTO guard, transitions |
| Static/build | Routes, forbidden actions, lint/build, dependency counts |
| Playwright | Retention; exact reused header across promise/DNS-like failures and refresh; duplicate block; success-only clear; both instructions; live/focus/keyboard; 390×844; clean console |
| Backend | Stubbed sequential and concurrent replays prove one order, one stock decrement, and one email; migration/schema checks remain offline |

## Threat Matrix

N/A — no routing change, shell, subprocess, VCS/PR automation, executable-file classification, or product process-integration boundary.

## Migration / Rollout / PR Forecast

Forward-only PostgreSQL migration: add nullable columns first, then the unique index; existing orders remain valid with `NULL` keys. Deploy prerequisite: run `prisma migrate deploy` before serving the idempotent confirmation backend. Forecast starts from the approved **1,958 / 3,000** surface; checkpoint at **2,400**, split/reforecast at **2,600**, and **3,000 is forbidden**. Safety, runtime, a11y, errors, migration/schema checks, verify, and archive stay.

Decision needed before apply: No  
Chained PRs recommended: No  
400-line budget risk: High

## History

Supersedes the admin-orders content of this rolling design artifact for the next slice only; prior specs, verify/archive reports, and Engram revisions remain authoritative. No implementation, Git operation, or secret access occurred.

## Open Questions

None.

## Result Contract

- **status**: success
- **executive_summary**: CH-01..08 use a minimal typed frontend core and cart-bound backend idempotency so an unverified confirmation can be retried safely.
- **artifacts**: `openspec/changes/2026-06-candyland-v2/design.md`; Engram `sdd/2026-06-candyland-v2/design`
- **next_recommended**: sdd-tasks
- **risks**: localStorage may be unavailable; a deployment must apply the forward migration before the new backend; runtime surface may approach gates
- **skill_resolution**: paths-injected — sdd-design, frontend-design, playwright-best-practices, typescript-advanced-types, karpathy-guidelines, ponytail; shared conventions
