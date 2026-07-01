# Exploration — backend/orders-stock-emails

## status
ready-for-proposal

## executive_summary
The backend checkout flow already persists carts, customers, payments, orders and items, but it does **not** validate or decrement stock and has **no email service**. The schema already supports real stock (`Product.stock`) and soft-delete (`Product.active`). Adding atomic stock validation + a decoupled noop/Resend email service fits inside the existing `backend/app.js` structure without a major refactor. Risk is concentrated in the order-confirmation transaction; the rest is additive.

## docs_read
- `AGENTS.md` (project + backend + src) — stack, constraints, env vars, endpoint inventory.
- `docs/DECISIONES_CERRADAS.md` — stock real, pagos manuales, emails desacoplados, no WhatsApp/MercadoPago/tarjetas.
- `docs/DEPLOY_RAILWAY_VERCEL.md` — env vars expected in Railway (`EMAIL_PROVIDER`, `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO`).
- `docs/EMAILS_PEDIDOS.md` — Resend preferred, SMTP/noop fallback, order must not fail if email fails.
- `docs/PLAN_DE_IMPLEMENTACION_DETALLADO.md` — PR-6 scope and manual testing checklist.
- `openspec/config.yaml` — strict_tdd, build/lint/prisma verify rules.
- `openspec/specs/orders-emails/spec.md` — public acceptance scenarios.
- Engram #4334 — PR-3 schema state (User, Product.stock/active, forms tables).

## current_flow_map
```
Frontend                     Backend (app.js)
--------                     ----------------
CartContext ──POST /api/carrito────> getOrCreateCart -> CartItem (no stock check)
AddressForm ──POST /api/checkout──-> create Customer -> link to Cart
PaymentMethod ─POST /api/payment-method-> store CASH/TRANSFER in Cart, return bank data
Confirmation ──POST /api/orders/confirm?cartId=xxx
                                     1. load Cart + items + product + customer
                                     2. reject if product.active === false
                                     3. compute total, generate orderNumber
                                     4. prisma.order.create (Order + OrderItem + Payment)
                                     5. delete CartItem
                                     6. return ConfirmOrderResponse
```

Observations:
- Stock is read but never checked (`Product.stock` exists).
- No transaction wraps steps 4–5; a crash after order creation leaves orphan data / cart not cleaned.
- No email is sent.
- `orderNumber` is random 6-digit (`CL-######`) with collision risk (not checked).
- Payment method is restricted to `efectivo`/`transferencia` only at `/api/payment-method`.

## schema_findings
Relevant models already present (post PR-3):

```prisma
model Product {
  id          Int       @id @default(autoincrement())
  title       String
  priceCents  Int
  image       String?
  hoverImage  String?
  stock       Int       @default(0)   // real stock, currently unused
  active      Boolean   @default(true)
  categoryId  Int
  orderItems  OrderItem[]
  cartItems   CartItem[]
}

model Order {
  id          Int       @id @default(autoincrement())
  orderNumber String    @unique
  customerId  Int
  totalCents  Int       @default(0)
  status      String    @default("PENDING")
  payment     Payment?
  items       OrderItem[]
}

model OrderItem {
  id         Int
  orderId    Int
  productId  Int
  quantity   Int
  priceCents Int        // snapshot price
}

model Payment {
  id        Int     @id @default(autoincrement())
  orderId   Int     @unique
  method    String
  status    String  @default("PENDING")
  reference String?
}
```

- No `emailStatus` column exists. The docs list it as optional; adding it would require a migration.
- `OrderItem` does not snapshot product title; admin DTO currently resolves via `it.product.title`.

## test_findings
- `backend/test/order-confirm-inactive.test.js` — regression check for `active=false` rejection (stubbed Prisma, HTTP server). **This test must still pass after changes.**
- `backend/test/public-endpoints.test.js` — helper validators, not order-related.
- `backend/test/admin-categories-orders.test.js` — admin order DTO/status helpers.
- No tests exist for stock validation, concurrent stock, or email failure.
- Existing test style: stdlib `assert` + tiny runner, no framework. New tests should follow the same pattern.

## implementation_options

### Option A — Atomic Prisma transaction with inline stock check (recommended)
Wrap the confirmation in `prisma.$transaction`:
1. Re-fetch cart items locking products (or use conditional `UPDATE product SET stock = stock - qty WHERE stock >= qty`).
2. If any product lacks stock, return 400 with per-product details.
3. Create Order + OrderItem + Payment.
4. Delete CartItem.
5. After commit, call email service wrapped in `try/catch`; log failure, never throw.

- **Pros:** Single DB round-trip, no new schema migration, eliminates overselling under Prisma/Postgres isolation, keeps code in existing `app.js` structure.
- **Cons:** Transaction holds locks briefly; longer if email were inside (it must not be).
- **Effort:** Medium.

### Option B — Pessimistic reservation table
Add a `CartReservation` or `StockReservation` table and reserve stock at add-to-cart / payment-method time.

- **Pros:** Stock protected earlier in funnel.
- **Cons:** New table + migration + reservation expiry logic; overkill for current MVP scope.
- **Effort:** High.

### Option C — Email-only slice, defer stock
Add the email service now and leave stock for a follow-up.

- **Pros:** Smaller diff.
- **Cons:** Violates the phase goal and the closed decision that stock is real; overselling risk remains.
- **Effort:** Low.

## recommended_scope_slice
Implement **Option A** as PR-6, scoped to:
1. Atomic stock validation + decrement inside `/api/orders/confirm`.
2. Transaction wrapping order/item/payment creation + cart cleanup.
3. Decoupled email service (`backend/services/email.js`) with two providers:
   - `noop` / `disabled` — logs and returns success.
   - `resend` — uses `resend` SDK if `RESEND_API_KEY` configured.
4. Fire-and-forget email after transaction commit; failure is logged but never fails the order.
5. Add/update executable stdlib-assert tests:
   - stock insufficient → 400.
   - stock decremented after success.
   - email failure does not fail order (stub provider).
6. Update `backend/.env.example` and docs if `EMAIL_PROVIDER` semantics change.

Out of scope for this slice:
- Adding `Order.emailStatus` column (optional per docs; can be deferred).
- SMTP provider (can be added later without touching order logic).
- Frontend changes beyond already-existing checkout flow.
- Fixing the hardcoded WhatsApp button in `Confirmation.tsx` (different phase).

## files_likely_touched
- `backend/app.js` — refactor `/api/orders/confirm` to use transaction + atomic stock decrement + email call.
- `backend/services/email.js` (new) — provider factory + send interface.
- `backend/services/emailProviders/resendProvider.js` (new) — Resend SDK wrapper.
- `backend/services/emailProviders/noopProvider.js` (new) — dev/noop fallback.
- `backend/package.json` — add `resend` dependency.
- `backend/.env.example` — clarify `EMAIL_PROVIDER` values (`resend` | `noop`).
- `backend/test/order-confirm-inactive.test.js` — keep passing; may extend for stock cases or create new `test/order-confirm-stock.test.js`.
- `backend/test/order-confirm-email.test.js` (new) — email failure non-blocking.
- `docs/EMAILS_PEDIDOS.md` / `docs/PLAN_DE_IMPLEMENTACION_DETALLADO.md` — update after implementation.

## risks
- **Concurrent overselling** if stock check and decrement are not a single atomic operation. Must use conditional `UPDATE ... WHERE stock >= qty` or equivalent inside the transaction.
- **Order number collision** remains possible; consider unique-constraint retry loop.
- **Email inside transaction** would make order creation depend on email latency/failure. Email must run after commit.
- **Existing test `order-confirm-inactive.test.js`** stubs Prisma at the model level; if confirm starts using `prisma.$transaction` or raw queries, the stub may need updating.
- **Dependency addition** (`resend`) requires install + lockfile update and build verification.

## next_recommended
`sdd-propose` for PR-6, followed by `sdd-spec` to write delta specs for the order confirmation transaction, stock validation scenarios, and email failure handling.

## skill_resolution
paths-injected — read `sdd-explore`, `nodejs-backend-patterns`, `supabase-postgres-best-practices`, and `karpathy-guidelines` as specified by the orchestrator.
