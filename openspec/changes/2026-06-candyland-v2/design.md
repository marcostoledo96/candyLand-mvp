# Design: CandyLand v2 — Admin Product Form

## Preserved Change Architecture

Preserve the existing boundary: React/Vite on Vercel calls Railway Express through `VITE_API_URL`; Express uses Prisma/PostgreSQL. Admin JWT remains in `sessionStorage`; protected requests use `adminApi.js`, whose genuine-401 path clears the token and raises `AdminAuthError`. Order email remains post-persistence and the menu API-driven. No cookie, refresh token, backend, schema, deploy, category CRUD, or order change is introduced.

## Technical Approach

Implement APF-01..11 as one native React/TypeScript/CSS create/edit dialog. Edit receives the `AdminProduct` list DTO; no detail request. Pure JavaScript validation stays importable by `node:test`. Add only create, update, and category-list API functions.

## Architecture Decisions

| Decision | Choice and rationale | Rejected |
|---|---|---|
| Dialog | Native `<dialog>` with `showModal()`, because the current Chromium runtime supports focus containment and Escape semantics without a dependency. Runtime verification is a gate; no polyfill is added. | Modal library/custom overlay |
| Edit source | Snapshot the selected list DTO when opening. This matches APF-02 and avoids a nonexistent detail contract and stale merge rules. | `getAdminProduct` |
| Validation | `adminValidation.js` exports small pure functions with JSDoc shapes. TS consumes inferred JSDoc; add one narrow `.d.ts` only if build inference is insufficient. | Form framework/advanced generic types |
| Ownership | `AdminProductsList` owns selected product, open/close, and post-save `load()`. `AdminProductForm` owns fields, categories, validation, and mutation state. | Global store/context |

## Component and Data Flow

```text
Create button / row Edit button
  -> AdminProductsList stores {mode, product?, invoker}
  -> AdminProductForm.showModal() -> focus first control
  -> listAdminCategories(token) -> loading | error+retry | empty | success
  -> validateProductPayload(fields) --invalid--> field/summary feedback
  -> createAdminProduct | updateAdminProduct(id, payload)
       -> adminRequest -> central 401 expiry OR AdminApiError
       -> success -> await list.load() -> close -> restore invoker focus
```

The submit guard checks `saving` and disables pending controls. Escape closes without mutation. A post-mount effect uses `requestAnimationFrame` to focus the first control; `onClose` restores the connected invoker.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/pages/Admin/AdminProductForm.tsx` | Create | Controlled create/edit dialog and category/submission states |
| `src/pages/Admin/AdminProductForm.module.css` | Create | Mobile-first, light-only dialog/form styles and visible focus |
| `src/lib/adminValidation.js` | Create | Price parsing, payload/URL validation, backend string mapping |
| `src/lib/adminApi.js` | Modify | Add `createAdminProduct`, `updateAdminProduct`, `listAdminCategories` through `adminRequest` |
| `src/pages/Admin/AdminProductsList.tsx` | Modify | Enable create/edit, pass list DTO, refresh then close |
| `test/admin-product-form.test.mjs` | Create | Node validator/API contract tests |
| `scripts/assert-admin-auth-products.mjs` | Modify | Static boundary assertions |
| `test/admin-auth-products.playwright.mjs` | Modify | Runtime APF scenarios |
| `package.json` | Modify | Include the new Node test in existing test commands |

## Interfaces / Contracts

`AdminProduct`: `{id,title,description,priceCents,imageUrl,hoverImageUrl,stock,active,categoryId,category}`. `AdminCategory`: `{id,name,slug,active}`. Submit body: `{title,description,imageUrl,hoverImageUrl,priceCents,stock,active,categoryId}`; blank optional strings become `null`, matching backend normalization. Whole-peso text must parse to a nonnegative integer and convert using `pesos * 100`; category is a positive integer and stock a nonnegative integer.

URLs accept only `http:`, `https:`, or `data:image/(png|jpeg|webp|gif);base64,...`; no upload input. A 400 preserves values and renders the top-level `error` plus every string in `errors`. Only exact field prefixes (`title`, `priceCents`, `stock`, `categoryId`, `imageUrl`, `hoverImageUrl`, `description`, `active`) are attached to fields; unmatched strings remain in the summary. `categoryId does not exist` maps to category while remaining visible in the summary.

## Security and Accessibility

No token logging, HTML injection, URL fetching/preview, or client trust assumption. Backend remains authoritative. Use `aria-labelledby`, labels, descriptions, invalid states, visible focus, live status/errors, semantic buttons, and narrow-screen scrolling. Save only with successful categories and a valid selection.

## Testing Strategy

| Layer | Coverage |
|---|---|
| RED Node | APF-01/03/08/09: conversion, integers, URL allowlist, payload, all backend strings, methods/paths/body, 401 reuse |
| Static/build | No detail endpoint/upload/dependency; JS-to-TS import; `npm run lint`, `npm run build`, existing assertions |
| Chromium runtime | APF-02/04-11: list DTO edit, category four states/retry, no duplicate request, preserved errors, refresh-close, focus/Escape/restore, 390px light UI, zero unexpected console errors |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary changes.

## Budget, Rollout, and Rollback

Current full-surface forecast: **~1,525 changed lines**, including planning, implementation, tests, verification, archive, and reserves. One PR is appropriate. The current-session hard cap is **3,000 lines**: checkpoint and reforecast at 2,400, trigger a split at 2,600, and hard-split if the projected final total exceeds 2,800; never exceed 3,000. At hard split, defer edit mode only; preserve create mode, runtime tests, accessibility, error mapping, verification, and archive. Rollback is one frontend revert; endpoints and persisted data remain compatible. No migration or feature flag.

## Open Questions

None.

## Result Contract

- **status**: success
- **executive_summary**: APF-01..11 designed as a native, dependency-free create/edit dialog reusing list DTO and central auth handling.
- **artifacts**: `openspec/changes/2026-06-candyland-v2/design.md`; Engram `sdd/2026-06-candyland-v2/design`
- **next_recommended**: sdd-tasks
- **risks**: Chromium dialog runtime gate; narrow `.d.ts` only if JSDoc inference fails; implementation budget drift.
- **skill_resolution**: paths-injected — sdd-design, frontend-design, playwright-best-practices, typescript-advanced-types, karpathy-guidelines, ponytail; shared SDD/OpenSpec conventions.
