# Verification Report: Backend Orders Stock and Emails

**Change**: `backend/orders-stock-emails`  
**Branch**: `backend/orders-stock-emails`  
**Mode**: Strict TDD  
**Artifact store**: OpenSpec + Engram  
**Verdict**: PASS WITH WARNINGS

## Executive Summary

Rollback verification passed after the fix. Source inspection confirms `/api/orders/confirm` now throws `OrderConfirmDomainError` from inside the Prisma interactive transaction for domain failures, including insufficient stock after a prior item decrement. The route maps the HTTP status/body outside the transaction, so Prisma rollback semantics are preserved.

The mixed-cart rollback regression is now a committed runtime test (`backend/test/order-confirm-transaction.test.js`, case `2.2b`) and it passed. It asserts that when the first product is decremented and a later product has insufficient stock, the first product stock is restored, the failed product remains unchanged, no order/cart cleanup runs, and no email is sent.

All requested safe commands passed. No production/shared DB was used, no secrets were read, and app-loading tests were run from `/tmp/opencode` to avoid `backend/.env` autoload through `dotenv.config()`.

## Completeness

| Area | Status | Notes |
|---|---:|---|
| Proposal/spec/design/tasks read | ✅ | Required OpenSpec artifacts read. |
| Apply progress read from Engram | ✅ | `sdd/2026-06-candyland-v2/apply-progress` read. |
| Source rollback fix inspected | ✅ | `backend/app.js` defines `OrderConfirmDomainError`, throws inside `$transaction`, and maps outside. No `__error` pattern remains in backend JS. |
| Mixed-cart rollback test inspected | ✅ | Committed case `2.2b` covers the previous partial-commit failure. |
| Runtime verification | ✅ | Mandatory and affected regression commands passed. |
| Spec compliance | ✅/⚠️ | Required stub/runtime scenarios pass; true DB-concurrency smoke remains skipped because no disposable DB was provided and shared/prod DB access is forbidden. |

## Build, Tests, and Command Evidence

| Command | Result | Evidence |
|---|---:|---|
| `/usr/bin/npm run lint` | ✅ PASS | ESLint completed with no reported errors. |
| `/usr/bin/npm run build` | ✅ PASS | Vite built 82 modules successfully. |
| Safe Prisma generate from `/tmp/opencode/candyland-prisma` with dummy `DATABASE_URL` and explicit schema path | ✅ PASS | Prisma Client v5.22.0 generated without DB connection or backend `.env` load. |
| `node /.../backend/test/order-confirm-inactive.test.js` from `/tmp/opencode` | ✅ PASS | Inactive + active confirmation assertions passed. |
| `node /.../backend/test/order-confirm-transaction.test.js` from `/tmp/opencode` | ✅ PASS | 18 order/email/stock assertions passed, including `2.2b` mixed-cart rollback. |
| `/usr/bin/npm ls resend` at repo root | ✅ PASS | `(empty)`; no Resend SDK dependency installed. |
| `/usr/bin/npm ls resend` in `backend/` | ✅ PASS | `(empty)`; no Resend SDK dependency installed. Node emitted a `url.parse()` deprecation warning from npm internals. |
| `node /.../backend/test/public-endpoints-http.test.js` from `/tmp/opencode` | ✅ PASS | Public endpoint HTTP assertions passed. |
| `node /.../backend/test/admin-categories-orders-http.test.js` from `/tmp/opencode` | ✅ PASS | Admin categories/orders HTTP assertions passed. |
| `node /.../backend/test/schema-pr3.test.js` from `/tmp/opencode` | ✅ PASS | Schema assertions passed. |
| `node /.../backend/test/schema-pr3-triangulate.test.js` from `/tmp/opencode` | ✅ PASS | Schema triangulation assertions passed. |
| `/usr/bin/git diff --check` | ✅ PASS | No whitespace errors. |

Note: `rtk lint` wrapper still cannot parse empty ESLint output, but the exact required `npm run lint` command passes.

## Spec Compliance Matrix

| Requirement | Scenario | Runtime Evidence | Result |
|---|---|---|---:|
| Atomic stock validation | Sufficient stock happy path | `order-confirm-transaction.test.js` 2.1 | ✅ COMPLIANT |
| Atomic stock validation | Insufficient stock rejection leaves stock/order/cart consistent | `order-confirm-transaction.test.js` 2.2 and committed mixed-cart rollback case 2.2b | ✅ COMPLIANT |
| Atomic stock validation | Concurrent overselling prevention | `order-confirm-transaction.test.js` 2.3 plus source conditional `updateMany({ stock: { gte: qty } })` | ⚠️ PARTIAL: stubbed race, not real DB concurrency |
| Atomic stock validation | Inactive product still rejected | `order-confirm-inactive.test.js`; `order-confirm-transaction.test.js` 2.4 | ✅ COMPLIANT |
| Manual payment methods | Allowed methods | `order-confirm-transaction.test.js` 2.5c | ✅ COMPLIANT |
| Manual payment methods | Rejected methods | `order-confirm-transaction.test.js` 2.5 and 2.5b | ✅ COMPLIANT |
| Email notification after success | Email attempted after commit | Source calls email after `await prisma.$transaction`; success test observes one email call | ✅ COMPLIANT |
| Email notification after success | Provider failure non-blocking | `order-confirm-transaction.test.js` 2.7 | ✅ COMPLIANT |
| Email notification after success | No email on failed confirmation | `order-confirm-transaction.test.js` 2.2, 2.2b, 2.4, 2.5, 2.6, 2.8 | ✅ COMPLIANT |
| Email notification after success | Noop provider when unconfigured | `order-confirm-transaction.test.js` 2.9 | ✅ COMPLIANT |
| No WhatsApp notifications | WhatsApp excluded | `backend/services/email.js` source says no WhatsApp and no WhatsApp path was found in this slice | ⚠️ PARTIAL: static inspection only |

## Correctness and Design Coherence

| Design decision | Followed? | Notes |
|---|---:|---|
| Use existing Express/CommonJS backend shape | ✅ | `backend/app.js` and `backend/services/email.js` stay CommonJS. |
| Conditional stock decrement inside `$transaction` | ✅ | `tx.product.updateMany` uses `active: true`, `stock.gte`, and atomic decrement. |
| Roll back domain failures inside transaction | ✅ | Domain failures are thrown as `OrderConfirmDomainError`; mapping happens in the outer catch. |
| Mixed-cart insufficient stock does not commit earlier decrements | ✅ | Committed regression 2.2b passed and the tx stub restores snapshots on throw. |
| Re-read product on decrement miss | ✅/⚠️ | Source re-reads inside tx; a product becoming inactive mid-race is still returned as `Stock insuficiente`, matching current implementation but not a dedicated inactive-race payload. |
| Payment method allowlist at confirmation boundary | ✅ | `CASH`, `TRANSFER`, `EFECTIVO`, `TRANSFERENCIA`; invalid values return 400 before writes. |
| Email outside transaction and non-blocking | ✅ | Email call happens after transaction and is caught; service itself never throws to caller. |
| No Resend SDK/dependency | ✅ | Uses Node 20 `fetch`; `npm ls resend` is empty in root and backend. |
| No schema migration | ✅ | No schema change required for this slice. |

## Critical Findings

None.

## Warnings

1. **No disposable DB smoke** — `/api/db/health` and true DB-concurrency checks were not run because the instructions forbid production/shared DB access and no disposable local DB was provided.
2. **Concurrency proof is stub-level** — the race regression validates the conditional decrement behavior with a shared in-memory product map, but it is not a real concurrent PostgreSQL transaction test.
3. **WhatsApp exclusion has static evidence only** — source inspection found no WhatsApp path, but there is no dedicated runtime assertion.
4. **CodeGraph unavailable** — `.codegraph/` is absent, so verification used targeted reads and grep fallback.

## Suggestions

1. If a disposable local PostgreSQL is available later, add one smoke test for two concurrent confirmations against the same product.
2. Add a tiny static assertion for “no WhatsApp notification path” if this requirement keeps recurring in review.
3. Add `assert.equal(calls.orderCreate.length, 1)` to the race test to make its “loser never creates order” claim explicit.

## Final Verdict

**PASS WITH WARNINGS** — the rollback fix is verified and the previous critical mixed-cart atomicity failure is now covered by a committed passing regression.
