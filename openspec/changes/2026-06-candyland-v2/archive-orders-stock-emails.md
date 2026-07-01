# Archive — Backend Orders Stock and Emails

**Change**: `backend/orders-stock-emails` (slice 7d of `2026-06-candyland-v2`)
**Branch**: `backend/orders-stock-emails`
**Archive date**: 2026-06-30
**Mode**: per-slice archive (project convention)
**Verdict**: PASS WITH WARNINGS — closed for this slice

## Intent (recap)

Make `/api/orders/confirm` safe for real inventory and resilient checkout by:

1. Validating and decrementing stock atomically inside the Prisma interactive
   transaction that persists the order.
2. Persisting Order + OrderItem + Payment + cart cleanup in a single unit; throwing
   `OrderConfirmDomainError` from inside the transaction so Prisma rollback is
   preserved (no `__error` pattern leaks partial commits).
3. Decoupling order email from the transaction: noop by default, Resend via Node
   20 `fetch` only when `EMAIL_PROVIDER=resend` and the three required vars are
   set; provider failure is non-blocking and never throws to the route.

## Spec merge / file move policy

This branch follows the project's **per-slice archive convention**:

- Delta spec (`openspec/changes/2026-06-candyland-v2/specs/orders-emails/spec.md`)
  is **kept inside the change directory** as the canonical record for this
  slice. It is **not merged** into `openspec/specs/orders-emails/spec.md`; the
  main spec remains the flat scenario list that pre-dates this slice.
- The change folder is **not moved** to `openspec/changes/archive/`. Per-slice
  artifacts (proposal, design, spec, tasks, verify, this archive) live next to
  the rest of the active change so future slices can cross-reference them.
- This `archive-orders-stock-emails.md` is the closure artifact for the slice.

## Tasks status (slice 7d)

- [x] 7d.1 Test scaffold (RED-first infra, `$transaction` stub, `_record.js`).
- [x] 7d.2 RED tests in `backend/test/order-confirm-transaction.test.js`
  (18 scenarios covering success, insufficient stock, race, inactive product,
  invalid payment, non-positive quantity, email failure, noop, Resend,
  deterministic order).
- [x] 7d.3 GREEN — `backend/app.js` wraps `/api/orders/confirm` in
  `prisma.$transaction`, sorts items by `productId`, runs conditional
  `updateMany({ active: true, stock: { gte: qty } }, { decrement: qty })`,
  re-validates payment allowlist (`CASH` / `TRANSFER` plus pre-normalization
  aliases), rejects non-positive quantities, and calls
  `sendOrderConfirmationEmail(response)` post-commit inside `try/catch`.
- [x] 7d.4 REFACTOR + docs — `backend/.env.example` clarifies `EMAIL_PROVIDER`
  is noop by default and Resend vars are optional unless provider is `resend`;
  no `resend` SDK added; `docs/EMAILS_PEDIDOS.md` and
  `docs/DEPLOY_RAILWAY_VERCEL.md` already updated during the apply phase.
- [x] 7d.5.1 `npm run lint` and `npm run build` pass.
- [x] 7d.5.2 `prisma generate` works without DB connection.
- [x] 7d.5.3 Both backend test files pass; committed regression 2.2b covers
  mixed-cart rollback (first product decremented, second product insufficient
  stock → first product restored, no order/cartItem writes, no email).
- [ ] 7d.5.4 Real curl smoke against `/api/health`, `/api/db/health`,
  `/api/productos`. **Deferred** — disposable local DB not provided;
  production/shared DB access is forbidden by repo policy. Stays open for
  whoever has a disposable local PostgreSQL.
- [x] 7d.5.5 Documentation handoff closed by this archive (no new
  `docs/FUNCIONALIDADES.md` because the same content already lives in
  `docs/EMAILS_PEDIDOS.md`, `docs/DEPLOY_RAILWAY_VERCEL.md`, `backend/AGENTS.md`
  and the OpenSpec artifacts; per Ponytail principle, do not create a new
  file when existing ones already cover the topic).

## Source of truth after this slice

The behavior is captured in:

- `backend/app.js` — `/api/orders/confirm` transaction + `OrderConfirmDomainError`.
- `backend/services/email.js` — `sendOrderConfirmationEmail(order)` provider
  selection (noop default, Resend via Node 20 `fetch` only when configured).
- `backend/.env.example` — `EMAIL_PROVIDER`, `RESEND_API_KEY`, `MAIL_FROM`,
  `MAIL_TO` with clear placeholders and no real secrets.
- `backend/test/order-confirm-inactive.test.js` — updated to stub
  `$transaction` and `tx.product.updateMany`.
- `backend/test/order-confirm-transaction.test.js` — new, 18 scenarios.
- `backend/test/_record.js` — shared `makeTxStub` helper.
- `docs/EMAILS_PEDIDOS.md` — reflects the actual noop/Resend implementation.
- `docs/DEPLOY_RAILWAY_VERCEL.md` — Railway backend env example clarifies
  `EMAIL_PROVIDER=noop` is the default and Resend needs the three vars.
- `docs/INDEX.md` — already references `EMAILS_PEDIDOS.md` and
  `DEPLOY_RAILWAY_VERCEL.md` under "Backend y deploy".

No schema migration, no Resend SDK, no new top-level doc, no change-folder
move, no spec merge — minimal and accurate per archive constraints.

## Verification recap (from `verify-orders-stock-emails.md`)

- `npm run lint` and `npm run build`: pass.
- `prisma generate` with dummy `DATABASE_URL` from `/tmp/opencode`: pass.
- `node backend/test/order-confirm-inactive.test.js`: pass.
- `node backend/test/order-confirm-transaction.test.js`: 18 assertions pass
  (including committed mixed-cart rollback 2.2b).
- `npm ls resend` at root and `backend/`: empty (no SDK added).
- Spec compliance: 9/11 requirements fully compliant at runtime, 2/11
  partial with documented evidence (true DB-concurrency smoke and WhatsApp
  static-only).
- Critical findings: none. Warnings: 4 (no disposable DB smoke, stub-level
  concurrency proof, WhatsApp exclusion static-only, no `.codegraph/`).

## Risks / open follow-ups

| Risk | Owner | Mitigation / next step |
|---|---|---|
| Real DB-concurrency smoke never executed | Whoever has disposable PostgreSQL | Re-run `7d.5.4` against a local DB; add one concurrency regression there. |
| Curl smoke against Railway after deploy | Deploy flow | Use health endpoints only, never read `.env`. |
| WhatsApp exclusion is static only | Future work | Add a tiny source assertion if this requirement keeps recurring in review. |
| Resend vars omitted in Railway | Deploy | Set `EMAIL_PROVIDER=resend` and the three vars only when real sending is wanted; otherwise keep `noop`. |

## Skills loaded

- `sdd-archive` (this skill).
- `_shared` SDD references (Sections A, B, C, D).
- AGENTS.md (root + `backend/`) for archive scope and constraints.

## Out of scope (deliberate)

- MercadoPago, cards, WhatsApp, online payment flows.
- New `Order.emailStatus` column (deferred by proposal).
- SMTP/Nodemailer provider (deferred by proposal).
- Frontend UX redesign or `/producto/:id`.
- Schema migration for this slice.

Ready for the next slice on `2026-06-candyland-v2`.
