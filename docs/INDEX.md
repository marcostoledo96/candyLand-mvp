# Índice de documentación — CandyLand v2

## Backend, demo y deploy

- `DECISIONES_CERRADAS.md` — decisiones de producto/arquitectura (incluye pivot mock-first 2026-07-28).
- `DEMO_MOCK.md` — **contrato vigente** de demo Vercel sin backend/DB; modo API opcional.
- `DEPLOY_RAILWAY_VERCEL.md` — contrato histórico / modo API (Railway + PostgreSQL + Vercel). Diferido para el portfolio demo.
- `EMAILS_PEDIDOS.md` — emails de pedidos (modo API): noop por defecto y Resend vía `fetch` sin SDK.
- `AUTENTICACION.md` — auth admin JWT (modo API); en demo se usa sesión mock.

## Trabajo asistido por IA

- `HANDOFF_CURSOR_OPENCODE.md` — **empezar aquí en OpenCode**: estado post-Cursor, arquitectura mock, PRs #19–#23, prompt listo.
- `CODEGRAPH_INIT.md` — cómo inicializar y consultar CodeGraph localmente.
- `ENGRAM_GUIDE.md` — qué guardar en memoria persistente y cómo usar Engram.

## Planificación

- `PLANIFICACION_CANDYLAND_V2.md` — planificación general de v2 (fase 0 = demo mock-first).
- `PLAN_DE_IMPLEMENTACION_DETALLADO.md` — fases históricas; contrastar con `DEMO_MOCK.md` antes de ejecutar.
- `AUDITORIA_INICIAL.md` — auditoría inicial del estado del proyecto.
- `MAPA_REFERENCIA.md` — mapa de referencia visual/assets de Macarena.
- `PROMPT_MAESTRO_OPENCODE.md` — prompt maestro histórico (preferí `HANDOFF_CURSOR_OPENCODE.md` + `DEMO_MOCK.md`).
- `HANDOFF_CURSOR_OPENCODE.md` — handoff Cursor→OpenCode (2026-08).

## Evidencia OpenSpec (change CLOSED — demo-only final)

- `../openspec/changes/2026-06-candyland-v2/archive-parent-demo-only.md` — **cierre del parent** por supersesión de producto (2026-07-28).
- `../openspec/changes/2026-06-candyland-v2/verify-demo-mock-first.md` — smoke Vercel mock (PRs #19–#21).
- `../openspec/changes/2026-06-candyland-v2/archive-demo-mock-first.md` — archivo del slice demo mock-first.
