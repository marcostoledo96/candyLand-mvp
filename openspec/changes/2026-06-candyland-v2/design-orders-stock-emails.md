# Design: Backend Orders Stock and Emails

## Technical Approach

Keep the existing Express/CommonJS backend shape and make `/api/orders/confirm` the single consistency boundary. The handler will run cart reload, stock decrement, order/payment/items creation, and cart cleanup inside one Prisma interactive transaction. Email is explicitly post-commit and non-blocking. Prisma `5.22.0` supports `updateMany` with normal filters, atomic number operations, and `BatchPayload.count`, so conditional `updateMany` is the stock gate.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Stock decrement | `tx.product.updateMany({ where: { id, active: true, stock: { gte: qty } }, data: { stock: { decrement: qty } } })` inside `$transaction` | app-only precheck; raw SQL lock; reservation table | One DB conditional update prevents oversell without migration or new tables. |
| Error distinction | Precheck active products from transaction cart load; if decrement count is `0`, re-read that product inside the transaction to return inactive vs insufficient/concurrent stock | generic 400 | Keeps current inactive-product contract while preserving atomic decrement. |
| Payment allowlist | Re-validate stored cart payment method during confirmation: only `CASH` / `TRANSFER` (and existing aliases if stored before normalization) are accepted. | rely only on `/api/payment-method` | Confirmation is a trust boundary too; schema stores a plain string, so invalid values must not create `Payment`. |
| Email provider | `backend/services/email.js` with noop default and Resend via Node `fetch` only when `EMAIL_PROVIDER=resend` and key/from/to exist | Resend SDK; SMTP/Nodemailer; email status column | Node 20 has `fetch`; no dependency or migration is needed. SMTP/status tracking is out of scope. |
| Test shape | Extend stdlib `assert` HTTP/stub tests with `$transaction` stubs | add Jest/Supertest | Matches existing tests and avoids DB/shared env access. |

## Data Flow

```text
POST /api/orders/confirm?cartId
  -> prisma.$transaction(tx)
      -> tx.cart.findUnique(include items.product + customer)
      -> validate cart/customer/items/payment allowlist/positive qty/active
      -> sort items by productId for deterministic stock updates
      -> tx.product.updateMany(stock >= qty, decrement qty) per item
      -> tx.order.create(payment + items)
      -> tx.cartItem.deleteMany(cartId)
      -> build ConfirmOrderResponse
  -> sendOrderConfirmationEmail(response) in try/catch
  -> return response
```

## File Changes

| File | Action | Description |
|---|---|---|
| `backend/app.js` | Modify | Wrap confirmation in `$transaction`; add conditional stock decrement, domain error mapping, cart cleanup in transaction, post-commit email call. |
| `backend/services/email.js` | Create | `sendOrderConfirmationEmail(order, options?)`; selects noop/resend, builds safe text payload, uses Node `fetch`. |
| `backend/.env.example` | Modify | Clarify `EMAIL_PROVIDER=noop|resend`; Resend vars optional unless provider is `resend`. |
| `backend/test/order-confirm-inactive.test.js` | Modify | Update Prisma stub for `$transaction`; keep inactive regression. |
| `backend/test/order-confirm-transaction.test.js` | Create | Success decrement + order/payment/items/cart cleanup, insufficient stock rollback, email failure non-blocking/no email on failed confirmation. |
| `backend/package.json` | No change | No Resend SDK dependency. |
| `backend/prisma/schema.prisma` | No change | No migration for this slice. |

## Interfaces / Contracts

`/api/orders/confirm` keeps the successful response shape. Error payloads:

```js
404 { error: 'Carrito no encontrado' }
400 { error: 'Faltan datos de checkout del cliente' }
400 { error: 'El carrito está vacío' }
400 { error: 'Falta seleccionar método de pago' }
400 { error: 'Método de pago inválido' }
400 { error: 'El carrito contiene productos no disponibles', inactiveProducts: [{ productId, title }] }
400 { error: 'Stock insuficiente', insufficientStock: [{ productId, title, requested, available }] }
```

`sendOrderConfirmationEmail(order)` resolves `{ status: 'sent'|'disabled'|'failed' }`; it never throws to the route. Resend is used only with `EMAIL_PROVIDER=resend` plus `RESEND_API_KEY`, `MAIL_FROM`, and `MAIL_TO`; otherwise noop logs disabled.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Email provider selection and failure handling | Stub `fetch`, env object; stdlib `assert`. |
| Integration-lite | Order confirmation transaction | Stub Prisma client including `$transaction(tx => tx)`, `updateMany.count`, invalid payment rejection, positive quantity checks, and rollback-by-throw assertions. Assert `updateMany` includes `active: true`, `stock.gte`, and decrement. |
| E2E/manual | Local API health only when disposable DB is configured | Do not read `.env`; do not hit shared Railway DB. Prefer `npm run lint`, `npm run build`, `cd backend && npm run prisma:generate`, and stub tests. |

## Migration / Rollout

No migration required. Deploy behind existing `/api/orders/confirm`; configure Railway email vars only when real Resend sending is wanted. Rollback is code-only.

## Open Questions

None.
