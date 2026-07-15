# Archive Refresh: Checkout Hardening

**Change**: `2026-06-candyland-v2` / slice `7j frontend/checkout-hardening`  
**Mode**: hybrid, per-slice archive; parent remains open  
**Authority**: `checkout-hardening-idempotency-architecture`, approved R4-001  
**Status**: success with warnings; no blocker or critical finding

## Result Contract

- **requirements**: **8/8**; **scenarios**: **14/14**; **lock cases**: **5/5**
- **tests**: **73**; **backend**: **12**; **Playwright**: **16**
- **surface**: exact **1,625 additions + 489 deletions = 2,114 / 3,000**; headroom **886**; **29 paths**
- **task state**: Engram tasks **#5408** and OpenSpec **RCH-8** mark archive refresh complete

## Approved Architecture

- Every confirmation retry/replay reuses the stable UUID-strength `Idempotency-Key` persisted per cart attempt.
- An ambiguous dispatched confirmation persists a cart/key mutation lock enforced by every shared `CartContext` mutation boundary; definitive and pre-dispatch outcomes clear only the current cart's lock, so another cart's valid lock remains independent.
- Backend cart binding plus the unique PostgreSQL key returns the original public DTO; winner-only stock decrement and email prevent duplicate effects.
- A parameterized key-derived PostgreSQL transaction advisory lock runs before replay/cart/stock work. Exact-stock concurrent requests serialize; rollback releases the lock.
- Forward migration is required before deployment: run `prisma migrate deploy` before serving the idempotent confirmation backend.

## Reconciled Sources

- `design.md`: idempotency-key retry/replay, advisory-lock ordering/rollback, and migration prerequisite.
- `specs/checkout-hardening/spec.md`: CH-08 lock, exact replay, concurrency, and deployment contract.
- `tasks.md`: RCH-8 complete.
- No spec merge, parent folder move, product edit, Git action, secret inspection, or unrelated documentation change.

## Evidence / Warnings

- Fresh approved evidence covers 8/8 requirements, 14/14 scenarios, 5/5 backend lock cases, 73 tests, 12 backend checks, and 16 Playwright scenarios.
- Warnings preserved: migration must precede deploy; localStorage PII, duplicate customer rows, volatile receipt after refresh, and broader pending/direct-client operational limits remain documented risks.
- Parent change stays open for unrelated backlog and deferred deployment/runtime work.

## Source of Truth

- `openspec/changes/2026-06-candyland-v2/design.md`
- `openspec/changes/2026-06-candyland-v2/specs/checkout-hardening/spec.md`
- `openspec/changes/2026-06-candyland-v2/tasks.md`
- `openspec/changes/2026-06-candyland-v2/verify-checkout-hardening.md`

## Next

No folder move or spec merge. Apply the forward migration as a deployment prerequisite; keep the parent change open.
