# Decisiones cerradas — CandyLand v2

Fecha original: 2026-06-29  
**Superseded / actualizado:** 2026-07-28 (pivot demo mock-first)  
**Cierre de change:** 2026-07-28 — OpenSpec `2026-06-candyland-v2` **CLOSED** (demo-only final)

## Pivot vigente (2026-07-28)

El objetivo de portfolio/demo es:

1. **Demo frontend-only en Vercel** con datos **mock**.
2. **Sin dependencia** de Railway, PostgreSQL ni backend en runtime de demo.
3. Conservar `backend/` + Prisma como **código listo** para modo API opcional.
4. Selección de fuente de datos por configuración: `VITE_DATA_MODE=mock|api` (+ `VITE_API_URL` sólo en modo `api`).
5. Documentación canónica del pivot: `docs/DEMO_MOCK.md`.
6. **Cierre de producto:** la demo mock en Vercel es el entregable final del change `2026-06-candyland-v2`. La evidencia Railway/API (PD-01..PD-07 provider) **no es gate de cierre**; queda fuera de alcance hasta un change nuevo.

Las respuestas 1–4, 6–8 y 23 del bloque histórico siguen válidas para el **modo API opcional**, no como requisito del deploy demo.

## Respuestas cerradas (histórico + estado)

1. Prisma: sí, **mantener en repo** para modo API; no requerido en demo mock.
2. Backend en la misma repo (`backend/`): sí, **conservado**; no desplegado para demo.
3. Base de datos: PostgreSQL Railway **sólo en modo API**. Demo: sin DB.
4. Seed: manual/controlado **cuando** se use API/DB.
5. Panel admin: sí. Imágenes de productos por URL. En demo, admin mock.
6. Stock: real en modo API; en demo, stock simulado en memoria/sesión.
7. Pedidos: PostgreSQL en modo API; en demo, pedidos mock (no persistencia durable).
8. Emails: sí en modo API (noop/Resend). En demo: simulado/documentado, sin provider real.
9. WhatsApp: no.
10. Métodos de pago: transferencia o efectivo.
11. Rutas: mantener catálogo y agregar rutas de Macarena. `/catalogo` canónica + aliases opcionales.
12. Diseño: combinar lo mejor de ambos proyectos, siempre React.
13. Páginas obligatorias: todas.
14. Nuestro menú: sale del **mismo contrato de categorías** (mock o API), no hardcode suelto en UI.
15. Tutoriales: sólo tarjetas visuales.
16. Detalle de producto: no.
17. Marca: CandyLand.
18. Logo: revisar en proyecto de Macarena; usarlo si sirve.
19. Assets Macarena: sí, se pueden usar.
20. Tema: sólo modo claro.
21. Dominio actual Vercel: `https://candy-land-mvp.vercel.app/`.
22. Dominio final por ahora: el dominio anterior de Vercel.
23. Railway auto deploy desde `main`: **opcional / diferido** (modo API). Demo no lo requiere.
24. Vercel previews por branch: sí.
25. Documentación deploy: sí — demo en `DEMO_MOCK.md`; API en `DEPLOY_RAILWAY_VERCEL.md`.

## Consecuencias técnicas

- Deploy demo = Vercel frontend + mocks. Sin `DATABASE_URL`. Sin Railway obligatorio.
- Default de datos = **mock**. Modo API es opt-in explícito.
- `VITE_API_URL` sólo aplica con `VITE_DATA_MODE=api`.
- Neon sigue deprecado.
- `api/` serverless de Vercel permanece deprecado; no reactivar como backend de demo.
- OpenSpec parent `2026-06-candyland-v2` está **CLOSED** por decisión demo-only final (`archive-parent-demo-only.md`). Un revive de Railway/API abre un change nuevo.

## Pendientes fuera de este change

- Modo API / Railway: sólo si se decide reactivarlo (nuevo OpenSpec change + `DEPLOY_RAILWAY_VERCEL.md`).
- No borrar `backend/` ni migraciones; siguen siendo el camino opcional.
