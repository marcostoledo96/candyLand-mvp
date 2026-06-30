# Proposal: Frontend Public Routes for Macarena Parity

## Intent

Complete the branch-scoped public frontend slice: expose the missing Macarena routes, replace placeholder navigation, and connect public forms to already-merged backend endpoints.

## Scope

### In Scope
- Add `/menu`, `/tutoriales`, `/franquicias`, `/trabaja-con-nosotros` pages.
- Route Header/Footer links to real public pages.
- Add `src/lib/api.ts` helpers for categories/contact/jobs/franchise.
- Connect `/contacto` to `POST /api/contact`.
- Cover loading, error, empty, and success states.
- Jobs may use optional `cvUrl`; no file upload.

### Out of Scope
- `/producto/:id`, dark mode, WhatsApp, Mercado Pago, cards, file upload.
- Backend changes, CMS-backed tutorials, admin screens.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `frontend-ui-parity`: add working nav, API-backed menu, connected public forms, and no-upload jobs behavior.

## Approach

Reuse React Router, CSS modules, and `VITE_API_URL` access. Keep pages compact, mobile-first, light-only, accessible, and aligned with CandyLand instead of copying Macarena HTML/CSS verbatim.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/App.tsx` | Modified | Add routes and optional catalog aliases. |
| `src/components/Header/`, `src/components/Footer/` | Modified | Route navigation to real pages. |
| `src/lib/api.ts` | Modified | Add typed public API helpers. |
| `src/components/Contact/Contacto.tsx` | Modified | Submit to backend. |
| `src/pages/Menu/`, `src/pages/Tutoriales/`, `src/pages/Franquicias/`, `src/pages/Trabaja/` | New | Branch-scoped public pages. |
| Backend, DB, deploy | Unchanged | Consume existing Railway API contracts only. |
| `openspec/specs/frontend-ui-parity/spec.md` | Modified later | Capture routes/forms delta. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Page diff exceeds review budget | Medium | Keep pages minimal; reuse shared patterns. |
| `/menu` duplicates `/catalogo` | Medium | Show category-led menu, leave product grid in catalog. |
| Form contract mismatch | Low | Match merged endpoint payloads. |

## Rollback Plan

Revert this artifact and the frontend route/nav/API/page changes. No DB or backend rollback is required.

## Dependencies

- Existing backend endpoints listed in exploration.
- `VITE_API_URL` configured for Railway.

## Success Criteria

- [ ] New routes render from Header/Footer on mobile and desktop.
- [ ] `/menu` loads categories from API with all required states.
- [ ] Contact, franchise, and jobs forms post successfully and show feedback.
- [ ] Jobs form does not upload files and uses optional `cvUrl` only if present.
- [ ] No forbidden scope is introduced.
- [ ] `npm run lint` and `npm run build` pass.
