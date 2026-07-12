```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:e4e2c2576b1899d87ace8e1894cddc8427f6974e4374fbe294414098f6c775c9
verdict: pass
blockers: 0
critical_findings: 0
requirements: 0/0
scenarios: 0/0
test_command: npm run lint && npm test && npm run assert:home-redesign && npm run assert:public-routes && Playwright browser runtime against vite preview with safe API mocks
test_exit_code: 0
test_output_hash: sha256:4e2d1c4893afd9e913b380f212f74f6371a0dba41937f54a3699ec402c9c5dba
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:f8814a631851c06bdceaf3f98e33ebd912e617666c58a149315bed678eb9a41e
```

## Verification Report

**Change**: `2026-06-candyland-v2`  
**Slice / branch**: `7e. Frontend home redesign` / `frontend/home-redesign`  
**Mode**: Strict TDD (corrective retry; no Standard Mode fallback)  
**Artifact store**: hybrid (OpenSpec + Engram)  
**Delivery**: single PR, 2,000-line review budget  
**Verdict**: **PASS WITH WARNINGS**

### Executive Summary

The prior Strict TDD blocker is resolved. `test/home-redesign.test.mjs` is a durable Node `node:test` suite with 17 passing tests that directly imports and executes `carouselNav.js` and `productStatus.js`; current production components import and use those same helpers. Independent browser verification also passed the full rendered behavior contract.

Control clipping is fixed at runtime, and API image behavior is correct: API/data URLs are kept unchanged without a synthesized WebP source, while known local `/img/*.jpg` assets advertise the corresponding local WebP source.

No dedicated OpenSpec requirement/scenario exists for the home redesign. Formal totals therefore remain `0/0`; task 7e acceptance criteria are reported separately without inventing formal scenarios.

### Completeness

| Metric | Value |
|---|---:|
| Slice 7e tasks | 21/21 checked |
| Remediation tasks reported by apply | 7/7 complete |
| Durable behavioral tests | 17/17 passing |
| Formal slice requirements/scenarios | 0/0 (no dedicated delta spec) |

### Build & Tests Execution

| Command | Exit | Result | Output SHA-256 |
|---|---:|---|---|
| `npm run lint` | 0 | PASS; no ESLint findings | `0eb52fc629fd2d9532951a4fd644e6a0e532f50f80f1b837c5220779df2ea15d` |
| `npm run build` | 0 | PASS; 92 modules, built in 1.79s | `f8814a631851c06bdceaf3f98e33ebd912e617666c58a149315bed678eb9a41e` |
| `npm test` | 0 | PASS; 17 passed, 0 failed/skipped | `30011371d65956df7499e729196e5c4c52059f43cbcbba7136d631a6b1378f92` |
| `npm run assert:home-redesign` | 0 | PASS; 66 source-contract checks | `35cd5b5c8e631f989e16c898005e607473424b194dd54f3e5d4362e7fcd7863b` |
| `npm run assert:public-routes` | 0 | PASS; 91 regression checks | `90ac31dcfe32327037ac94cc2532e8088674f508379dbdafcdf08bce487628bf` |
| Playwright `/` runtime | 0 | PASS; requested scenarios executed against local preview with safe mocks | Canonical evidence below |

Coverage analysis skipped — no frontend coverage tool is configured.

### Runtime Browser Evidence (`/`)

| Check | Result | Evidence |
|---|---|---|
| Loading | PASS | Pending products request rendered `Cargando productos…`. |
| Error and retry | PASS | Mocked 500 rendered alert + Retry; retry recovered after switching mock to success. |
| Empty | PASS | Mocked `[]` rendered explicit empty state, catalog CTA, and zero product cards. |
| Success | PASS | Mocked 8 products rendered the configured maximum of 6; zero `/producto/` links. |
| API image URL | PASS | API/data URL remained unchanged and emitted zero synthetic WebP `<source>` elements. |
| Local image WebP | PASS | `/img/golosina2.jpg` emitted `/img/golosina2.webp` as its local WebP source. |
| Carousel semantics | PASS | Named carousel region, 3 slides, 3 dots, `aria-hidden` state, and polite live region. |
| Controls/dots/keyboard | PASS | Next, dot selection, ArrowLeft/Right wrap, Home, and End all changed the active index correctly. |
| Autoplay/pause | PASS | Autoplay advanced after 4.7s; hover and focus each paused advancement. |
| Reduced motion | PASS | No advancement after 4.8s; computed transition duration `0s`. |
| Tab order | PASS | Previous → Next → dots 1–3 → catalog CTA. |
| Control clipping | PASS | Previous `98/98×44/44`; Next `107/107×44/44` client/scroll dimensions — no overflow. |
| Responsive | PASS | At 390×844: no horizontal overflow; featured banners use one column. |
| Console | PASS | Clean success run: zero warnings/errors/page errors. Error scenario emitted expected mocked 500 network errors only. |

### Formal Spec Compliance Matrix

| Requirement | Scenario | Result |
|---|---|---|
| No dedicated home-redesign requirement exists in retrieved delta specs | No formal 7e scenario exists | UNAVAILABLE — task acceptance used without inventing totals |

### Slice Acceptance Matrix (Task-Derived)

| Task requirement | Runtime/test evidence | Result |
|---|---|---|
| Three-slide accessible carousel | Node production-helper tests + browser semantics | COMPLIANT |
| Prev/next/dots/keyboard navigation | 9 navigation unit cases + browser interaction | COMPLIANT |
| Autoplay, focus/hover pause, reduced motion | Browser timed checks | COMPLIANT |
| API loading/error/empty/success | 5 status unit cases + browser route mocks | COMPLIANT |
| Maximum 6 cards | `MAX_SHOWN` production constant test + browser 8→6 check | COMPLIANT |
| API/local image behavior | Source guard + browser DOM inspection | COMPLIANT |
| Mobile-first/light-only/accessibility | Assertions + 390px browser and semantic checks | COMPLIANT |
| No forbidden product-detail/file-input/dark-mode/dependency scope | Assertions, package inspection, and browser links | COMPLIANT |

### TDD Compliance

| Check | Result | Details |
|---|---|---|
| TDD evidence reported | PASS | Apply-progress includes remediation RED/GREEN/triangulation evidence. |
| Durable test exists | PASS | `test/home-redesign.test.mjs`; Node stdlib, no new dependency. |
| Production code executed | PASS | Tests import helpers that `HeroCarousel.tsx` and `Home.tsx` import and invoke. |
| GREEN independently confirmed | PASS | `npm test` passed 17/17 now. |
| Triangulation | PASS | 9 carousel cases, 5 status variants, constants, and clipping regression guard. |
| Browser integration | PASS | Rendered component behavior independently exercised through Chromium. |
| Safety net | PASS | Lint, build, home assertions, and public-route regression assertions all pass. |

**TDD compliance**: 7/7 checks pass.

### Test Layer Distribution

| Layer | Tests/checks | Files/tool |
|---|---:|---|
| Behavioral unit | 16 | `test/home-redesign.test.mjs`, `node:test` |
| Static regression | 1 test + 157 assertion-script checks | CSS guard + two project scripts |
| Browser runtime | 14 scenario groups | Playwright against local Vite preview |
| **Total durable Node tests** | **17** | **1 test file** |

### Assertion Quality

No tautologies, orphan empty assertions, ghost loops, production-free behavioral assertions, or mock-heavy tests were found in `test/home-redesign.test.mjs`. The slide loop is guarded by an explicit `SLIDES.length === 3` assertion, so it cannot pass vacuously.

The CSS clipping case is intentionally static and is corroborated by runtime client/scroll dimension checks.

### Correctness and Design Coherence

| Decision | Status | Notes |
|---|---|---|
| React/TypeScript and CSS modules | PASS | Preserved. |
| API through `src/lib/api.ts` | PASS | `Home.tsx` still uses `fetchProducts()`. |
| No new dependencies | PASS | 9 dependencies and 11 devDependencies unchanged. |
| Production helpers are shared with tests | PASS | No test-only duplicate behavior. |
| Corrective HomeProductCard image change | WARNING | Behavior passes and approved receipt covers the candidate, but task 7e.4.3 still says not to edit `HomeProductCard`; task text was not updated to document the corrective exception. |

### Quality Metrics

**Linter**: PASS.  
**Type checker/build**: PASS.  
**Coverage**: Not available.

### Scope and Review Budget

| Scope | Changed lines |
|---|---:|
| Implementation candidate excluding this report | 1,119 |
| Verification artifact | 190 additions |
| **Total live changed lines after persistence** | **1,309 / 2,000** |

The current approved bounded-review receipt is `review-828c3f3f8ba7e841` with terminal state `approved`. It was treated only as scope context, not as requirements/runtime evidence.

### Issues Found

#### CRITICAL

None.

#### WARNING

1. No dedicated formal OpenSpec requirement/scenario defines home redesign slice 7e.
2. `HomeProductCard.tsx` is now modified for the corrective API-image behavior although task 7e.4.3 still marks it as a do-not-edit file; the corrective exception is not reflected in tasks.
3. Browser runtime was Chromium-only; cross-browser behavior remains unverified.

#### SUGGESTION

1. Add intrinsic image dimensions if CLS becomes measurable; current new images rely on CSS sizing.

### Uncovered Scenarios

- Formal home-redesign OpenSpec scenarios do not exist.
- Firefox/WebKit runtime was not available in this verification path.

### Canonical Verification Evidence Bytes

The following single-line JSON is the exact canonical preimage for `evidence_revision`:

```json
{"branch":"frontend/home-redesign","change":"2026-06-candyland-v2","commands":{"npm run assert:home-redesign":{"checks":66,"exit":0,"hash":"sha256:35cd5b5c8e631f989e16c898005e607473424b194dd54f3e5d4362e7fcd7863b"},"npm run assert:public-routes":{"checks":91,"exit":0,"hash":"sha256:90ac31dcfe32327037ac94cc2532e8088674f508379dbdafcdf08bce487628bf"},"npm run build":{"exit":0,"hash":"sha256:f8814a631851c06bdceaf3f98e33ebd912e617666c58a149315bed678eb9a41e"},"npm run lint":{"exit":0,"hash":"sha256:0eb52fc629fd2d9532951a4fd644e6a0e532f50f80f1b837c5220779df2ea15d"},"npm test":{"exit":0,"hash":"sha256:30011371d65956df7499e729196e5c4c52059f43cbcbba7136d631a6b1378f92","tests":17}},"runtime":{"api_images":"external API image retained with zero synthesized WebP sources; local /img jpg advertised local WebP","api_states":"loading,error+retry,empty,success<=6 passed","autoplay":"advance and hover/focus pause passed","carousel":"3 slides; controls,dots,ArrowLeft,ArrowRight,Home,End passed","console":"clean success zero warnings/errors; expected mocked 500 network errors only","controls":"prev 98/98x44/44; next 107/107x44/44 no clipping","reduced_motion":"autoplay disabled; transition 0s","responsive":"390px no horizontal overflow; banners one column"},"scope":{"budget":2000,"home_product_card_corrective_edit":true,"implementation_changed_lines":1119},"strict_tdd":{"assertion_quality_critical":0,"durable_runtime_test":true,"imports_production_helpers":true,"production_uses_helpers":true}}
```

### Prior Verification History Preserved

- Previous 7e verdict: FAIL due to missing durable production-behavior test.
- This retry supersedes that blocker after independent execution of the remediation.
- Earlier backend/public-route verification artifacts and Engram revision history remain preserved.

### Verdict

**PASS WITH WARNINGS** — runtime behavior and Strict TDD provenance now pass; remaining findings are documentation/scope-traceability and cross-browser warnings.

### skill_resolution

`paths-injected` — `sdd-verify`, `playwright-best-practices`, `web-design-guidelines`, and `karpathy-guidelines`, plus mandatory shared and Strict TDD modules.
