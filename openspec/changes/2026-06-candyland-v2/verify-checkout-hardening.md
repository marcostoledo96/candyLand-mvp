```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:04b9fbd47648c91ab1f20050840a50c682f0c21fcf21dd45a01892d95628dc33
verdict: pass
blockers: 0
critical_findings: 0
requirements: 8/8
scenarios: 14/14
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:6e5712982c104fec120b356e88678cca12ec317fe5560626ae717ccf1b94b978
build_command: rtk npm run build
build_exit_code: 0
build_output_hash: sha256:dac7418c7ef39822011a0418cf97c971cbef359d380766669a4a2a8ce5390331
```

# Verification Report — Checkout Hardening Idempotency Refresh

**Change**: `2026-06-candyland-v2` / slice `7j frontend/checkout-hardening`  
**Mode**: Strict TDD, hybrid OpenSpec + Engram, single PR, hard cap 3,000  
**Authority**: approved terminal receipt `checkout-hardening-idempotency-architecture`; resolved `R4-001`  
**Verdict**: **PASS WITH WARNINGS** — no blocker or critical finding.

## Completeness

| Metric | Result |
|---|---:|
| Requirements | 8/8 |
| Spec scenarios | 14/14 |
| Advisory-lock acceptance cases | 5/5 |
| Current remediation task checkboxes | 7/8 complete |
| Remaining checkbox | Archive refresh only |

## Runtime and command evidence

| Check | Result | Output hash |
|---|---|---|
| `npm test` | PASS — 73/73 | Follow-up refresh; historical hash below is superseded |
| `npm run test:checkout-hardening` | PASS — 7/7 | Follow-up refresh; historical hash below is superseded |
| `npm run assert:checkout-hardening` | PASS | `sha256:259ba2cb86268c1248e416b9aa6c1b1cab4f4a55b99ceb645a5ae9a26e8bc29e` |
| `npm run test:checkout-differential` | PASS — baseline fails 10 changed contracts; missing ref skips RED only; candidate passes 11/11 in both runs | P2 refresh |
| `./node_modules/.bin/eslint .` | PASS — no diagnostics | `sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `rtk npm run build` | PASS — 110 modules | `sha256:dac7418c7ef39822011a0418cf97c971cbef359d380766669a4a2a8ce5390331` |
| Focused backend idempotency | PASS | `sha256:fc49dbe64bd19b0d9a780e8d69065e9b0fc148874b1bc17ab3194ad648b6fac2` |
| All 12 backend test files | PASS | `sha256:dfc2b1ac3c2a2d27715f0768d91f0e248f9d47d1eabe915791f6dfb503160762` |
| Prisma validate | PASS | `sha256:919c26cbd154c540c8a110d57d3f91dc02c8c73f4e8edb56cddc7bb0b4beea22` |
| Prisma generate | PASS | `sha256:5045ef403e78ab6f82da83f7d83c115ad2f8ed4b09672778af76d7f7cba7562b` |
| Clean checkout Playwright | PASS — 16 scenarios, 12 observed requests, 0 unexpected errors | MCP runtime |
| Focus/390px supplement | PASS — semantic keyboard target, solid 3px outline, no overflow | MCP runtime |

Prisma reported its normal `.env` load, but an explicit loopback dummy `DATABASE_URL` prevented a real database connection; no secret value was inspected or printed.

## Spec compliance matrix

| Requirement | Scenario | Passing runtime evidence | Result |
|---|---|---|---|
| CH-01 | Address continues to payment | Playwright locality migration and exact request | ✅ COMPLIANT |
| CH-01 | Step revisit | Playwright retained address/payment state | ✅ COMPLIANT |
| CH-02 | Transfer selection | Playwright endpoint bank data and transfer copy | ✅ COMPLIANT |
| CH-02 | Cash selection | Playwright cash-at-delivery copy | ✅ COMPLIANT |
| CH-03 | Client validation | Zero request, inline alert, focused summary | ✅ COMPLIANT |
| CH-03 | Rejected/unavailable | 400/404/409/500 and stock/inactive backend regressions | ✅ COMPLIANT |
| CH-04 | Contract submission | Exact paths/bodies/URI encoding/header capture | ✅ COMPLIANT |
| CH-05 | Successful confirmation | One POST, stable summary, success-only clear | ✅ COMPLIANT |
| CH-05 | Retryable confirmation | Promise rejection + refresh reuse the same persisted key | ✅ COMPLIANT |
| CH-05 | Ambiguous cart mutation lock | Foreign-cart lock survives; current-cart definitive/pre-dispatch outcome clears; malformed storage is safe; navigation cannot bypass same-cart guard | ✅ COMPLIANT |
| CH-08 | Replay after response loss | Frontend stable-key retry + backend original DTO replay | ✅ COMPLIANT |
| CH-08 | Key isolation | Backend foreign-cart replay returns 409 | ✅ COMPLIANT |
| CH-06 | Checkout inspection | Static and Playwright no-WhatsApp checks | ✅ COMPLIANT |
| CH-07 | Keyboard narrow viewport | 390×844 semantic focus, visible outline, no overflow | ✅ COMPLIANT |

## Advisory-lock correction proof

| Acceptance case | Independent evidence | Result |
|---|---|---|
| Exact-stock concurrent same key | Two concurrent requests with stock exactly equal to quantity both return HTTP 200 and identical DTOs; no 400 | ✅ |
| Single side effects | `orderCreate=1`, stock update/decrement once to zero, `email=1` | ✅ |
| Transaction rollback releases lock | Failed stock attempt releases lock; same key succeeds after stock recovery | ✅ |
| Key-derived serialization | Parameterized tagged SQL calls `pg_advisory_xact_lock(hashtextextended(confirmationKey, 0))` before replay/cart/stock work | ✅ |
| Frontend retry stability | Offline/sync/rejected-promise and refresh preserve/reuse one key until verified success | ✅ |

## Architecture and correctness

| Decision | Status | Evidence |
|---|---|---|
| Approved backend/schema exception | ✅ Reconciled | Scope explicitly includes confirmation-only Express/Prisma idempotency and migration; no dependency/payment/WhatsApp change |
| Lock ordering | ✅ | Advisory transaction lock precedes replay lookup and every cart/stock mutation |
| Lock lifetime | ✅ | PostgreSQL transaction-scoped lock; deterministic test releases on commit and rollback |
| Replay binding | ✅ | Unique key plus `confirmationCartId`; unrelated cart receives 409 |
| Winner-only side effects | ✅ | Replay exits before stock/order/cart cleanup/email; email runs only when `replay=false` |
| Migration safety | ✅ | Nullable columns and unique index preserve multiple historical NULL rows |
| Frontend key lifecycle | ✅ | UUID-strength key per cart attempt, retained through retry, cleared only on verified success |
| Design wording | ⚠️ Archive refresh | Current design describes idempotency but does not yet name the approved advisory-lock serialization step |

## Strict TDD and assertion quality

| Check | Result |
|---|---|
| Apply RED/GREEN evidence | ✅ Frontend missing helpers and backend replay/concurrency failed before implementation; terminal R4-001 reproduction confirmed the race |
| Current GREEN | ✅ 73 frontend tests, 12 backend files, Prisma/static/differential/build/lint and Playwright pass |
| Assertion quality | ✅ Production HTTP route exercised; no tautologies, ghost loops, smoke-only assertions, or empty-loop passes |
| Coverage | ➖ No coverage tool configured; skipped without failure |

**Test layers**: 7 frontend unit cases, 4 differential cases, 16 browser scenarios, and 12 backend test files including stubbed HTTP/transaction concurrency. Real PostgreSQL was intentionally not used.

## Non-blocking warnings

| Classification | Disposition | Warning |
|---|---|---|
| Privacy — PII storage | Existing, deterministic | Abandoned checkout retains address/phone in `localStorage`. |
| Data integrity — customer duplicate | Existing, deterministic | Address resubmission can create another Customer row. |
| UX — volatile receipt | Existing, deterministic | A later refresh loses the in-memory success receipt. |
| Replay semantics — changed cart | Resolved by P2 refresh | Ambiguous same-cart mutations are blocked across navigation until a definitive outcome; another cart is unaffected. |
| Email delivery | Introduced with idempotency, deterministic | A winner's provider failure is swallowed and replay does not retry email. |
| Backend inactive race | Existing, deterministic | A product becoming inactive between precheck and decrement is reported as insufficient stock. |
| Deployment ordering | Operational | Railway must apply the forward migration before starting the idempotency-aware backend. |
| Documentation coherence | Process | Archive refresh must add the advisory-lock step to design/archive history. |

Resolved by this correction: the exact-stock same-key 400 race, pending reload/direct-client duplicate order risk for cooperating keyed clients, and concurrent same-key foreign-cart 500 path.

## Surface and archive projection

| Metric | Value |
|---|---:|
| Exact post-verify additions | 1,625 |
| Exact post-verify deletions | 489 |
| Exact post-verify total | 2,114 / 3,000 |
| Archive refresh allowance | ≤80 lines |
| Tracked/untracked paths | 29 total |
| Headroom | 886 lines |
| Projected archive ceiling | ≤2,038 / 3,000; ≥962 lines headroom |

## Historical pre-P2 canonical verification evidence bytes

The immutable receipt below records the prior verification run and its hashes. The P2 refresh results and current surface are recorded in the tables above; its changed bytes intentionally do not reuse these historical hashes.

```json
{"authority":"checkout-hardening-idempotency-architecture","authority_revision":"sha256:9a8e1f93489104b7513061bfef4d68d42f146adbad62e9be80a339f9b6169d7b","requirements":"8/8","scenarios":"13/13","advisory_cases":"5/5","test":{"command":"npm test","exit":0,"sha256":"6e5712982c104fec120b356e88678cca12ec317fe5560626ae717ccf1b94b978"},"build":{"command":"rtk npm run build","exit":0,"sha256":"dac7418c7ef39822011a0418cf97c971cbef359d380766669a4a2a8ce5390331"},"checks":{"frontend_focused":"de8fcd9babe6089b71ca8f10e534b0b5b9516c0fcbe1446c3a058905f83f7aab","static":"259ba2cb86268c1248e416b9aa6c1b1cab4f4a55b99ceb645a5ae9a26e8bc29e","differential":"40bf489b5546443864cf86efe800517a6eab1fa54710a0a7a645264ac2fff466","eslint":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","backend_idempotency":"fc49dbe64bd19b0d9a780e8d69065e9b0fc148874b1bc17ab3194ad648b6fac2","backend_all":"dfc2b1ac3c2a2d27715f0768d91f0e248f9d47d1eabe915791f6dfb503160762","prisma_validate":"919c26cbd154c540c8a110d57d3f91dc02c8c73f4e8edb56cddc7bb0b4beea22","prisma_generate":"5045ef403e78ab6f82da83f7d83c115ad2f8ed4b09672778af76d7f7cba7562b"},"playwright":{"scenarios":15,"requests":8,"unexpected_errors":0,"focus":"solid-3px-no-overflow"},"advisory":{"same_dto":true,"http_400":false,"orders":1,"stock_decrements":1,"emails":1,"rollback_releases":true,"key_derived":true,"frontend_stable_key":true},"surface":{"additions":1469,"deletions":489,"total":1958,"headroom":1042,"modified_paths":18,"untracked_paths":10,"path_total":28,"archive_ceiling":2038}}
```

## Next

Run an `sdd-archive` refresh only: record the approved advisory-lock architecture, replace the superseded archive authority/evidence/totals, preserve warnings, and keep the parent rolling change open. No product correction is authorized by this verification.
