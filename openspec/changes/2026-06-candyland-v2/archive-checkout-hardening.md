# Archive Refresh: Checkout Hardening

**Change**: `2026-06-candyland-v2` / slice `7j frontend/checkout-hardening`  
**Mode**: hybrid, per-slice archive; parent remains open  
**Authority**: `checkout-hardening-idempotency-architecture`, approved R4-001  
**Status**: success with warnings; no blocker or critical finding

## Result Contract

- **requirements**: **8/8**; **scenarios**: **13/13**; **lock cases**: **5/5**
- **tests**: **69**; **backend**: **12**; **Playwright**: **15**
- **surface**: exact **1,469 additions + 489 deletions = 1,958 / 3,000**; headroom **1,042**; **18 modified + 10 untracked = 28 paths**; archive remains **44 lines**
- **task state**: Engram tasks **#5408** and OpenSpec **RCH-8** mark archive refresh complete

## Approved Architecture

- Every confirmation retry/replay reuses the stable UUID-strength `Idempotency-Key` persisted per cart attempt.
- Backend cart binding plus the unique PostgreSQL key returns the original public DTO; winner-only stock decrement and email prevent duplicate effects.
- A parameterized key-derived PostgreSQL transaction advisory lock runs before replay/cart/stock work. Exact-stock concurrent requests serialize; rollback releases the lock.
- Forward migration is required before deployment: run `prisma migrate deploy` before serving the idempotent confirmation backend.

## Reconciled Sources

- `design.md`: idempotency-key retry/replay, advisory-lock ordering/rollback, and migration prerequisite.
- `specs/checkout-hardening/spec.md`: CH-08 lock, exact replay, concurrency, and deployment contract.
- `tasks.md`: RCH-8 complete.
- No spec merge, parent folder move, product edit, Git action, secret inspection, or unrelated documentation change.

## Evidence / Warnings

- Fresh approved evidence covers 8/8 requirements, 13/13 scenarios, 5/5 lock cases, 69 tests, 12 backend checks, and 15 Playwright scenarios.
- Warnings preserved: migration must precede deploy; localStorage PII, duplicate customer rows, volatile receipt after refresh, and broader pending/direct-client operational limits remain documented risks.
- Parent change stays open for unrelated backlog and deferred deployment/runtime work.

## Source of Truth

- `openspec/changes/2026-06-candyland-v2/design.md`
- `openspec/changes/2026-06-candyland-v2/specs/checkout-hardening/spec.md`
- `openspec/changes/2026-06-candyland-v2/tasks.md`
- `openspec/changes/2026-06-candyland-v2/verify-checkout-hardening.md`

## Next

No folder move or spec merge. Apply the forward migration as a deployment prerequisite; keep the parent change open.
