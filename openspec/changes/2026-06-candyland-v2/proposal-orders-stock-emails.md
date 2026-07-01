# Proposal: Backend Orders Stock and Emails

## Intent

Make order confirmation safe for real inventory while keeping checkout resilient. Today orders are persisted, but stock is not validated/decremented atomically, cart cleanup is not transactional, and no decoupled email service exists.

## Scope

### In Scope
- Atomic stock validation/decrement when confirming `/api/orders/confirm`.
- Transactional order, items, payment, and cart cleanup where applicable.
- Decoupled email service with noop/default provider and Resend when configured.
- Email attempts after DB commit; failures logged and never blocking confirmation.

### Out of Scope
- MercadoPago, cards, WhatsApp, online payment flows.
- New schema migration or `Order.emailStatus` for this slice.
- SMTP provider unless implementation shows it is already trivial/reused.
- Frontend UX redesign or `/producto/:id`.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `orders-emails`: order confirmation MUST validate/decrement stock atomically, persist order/payment/items consistently, and attempt email notification without making provider failure fail the order.

## Approach

Use the existing Express/Prisma flow. Wrap confirmation persistence in `prisma.$transaction`; use a conditional stock decrement (`stock >= quantity`) per item inside the transaction to prevent overselling. Create order, items, payment, and delete cart items in the same unit. After commit, call `backend/services/email.js`, which chooses noop/disabled by default and Resend only when configured. Keep email outside the transaction and inside `try/catch`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/app.js` | Modified | Confirm order transaction, stock decrement, post-commit email call. |
| `backend/services/email.js` | New | Provider selection and stable send interface. |
| `backend/services/emailProviders/*` | New | Noop/default and Resend provider modules. |
| `backend/package.json` | Modified | Add `resend` only if provider implementation needs SDK. |
| `backend/.env.example` | Modified | Document email provider variables, no secrets. |
| `backend/test/*` | Modified/New | Stock, transaction, and email-failure regression checks. |
| `docs/*` | Modified | PR-6 docs updated after implementation. |
| Frontend / DB / deploy | No schema/UI change | Existing checkout contract remains; Railway env may add email vars. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Overselling under concurrency | Med | Conditional DB decrement inside transaction; assert stock never negative. |
| Email latency/failure blocks checkout | Low | Send after commit and catch/log failures. |
| Order number collision | Low | Preserve unique constraint; retry only if collision appears during implementation. |
| Stub tests break after `$transaction` | Med | Update minimal stdlib tests around the real confirmation boundary. |

## Rollback Plan

Revert the backend transaction/email changes and any Resend dependency/env-example edits. No DB rollback is expected because this slice avoids schema migration.

## Dependencies

- Existing `Product.stock`, `Product.active`, `Order`, `OrderItem`, and `Payment` schema.
- Railway email env vars only for live Resend sending; noop must work without credentials.

## Success Criteria

- [ ] Transfer/cash order confirmation persists order, items, and payment.
- [ ] Successful confirmation decrements stock and clears cart items.
- [ ] Insufficient stock returns 400 and leaves stock/order/cart consistent.
- [ ] Concurrent low-stock confirmations cannot make stock negative.
- [ ] Email failure is logged but API still returns successful order creation.
