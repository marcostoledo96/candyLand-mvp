# Índice de documentación — CandyLand v2

## Backend y deploy

- `DECISIONES_CERRADAS.md` — decisiones de producto/arquitectura ya cerradas.
- `DEPLOY_RAILWAY_VERCEL.md` — Railway backend + PostgreSQL y Vercel frontend; incluye variables de email.
- `EMAILS_PEDIDOS.md` — servicio de emails de pedidos: noop por defecto y Resend vía `fetch` sin SDK.
- `AUTENTICACION.md` — auth admin: JWT sessionStorage, `/api/admin/me` bootstrap, 401 clear/redirect, logout. Slice parcial (auth + productos + categorías; pedidos diferidos).

## Trabajo asistido por IA

- `CODEGRAPH_INIT.md` — cómo inicializar y consultar CodeGraph localmente.
- `ENGRAM_GUIDE.md` — qué guardar en memoria persistente y cómo usar Engram.

## Planificación

- `PLANIFICACION_CANDYLAND_V2.md` — planificación general de v2.
- `PLAN_DE_IMPLEMENTACION_DETALLADO.md` — fases y tareas de implementación.
- `AUDITORIA_INICIAL.md` — auditoría inicial del estado del proyecto.
- `MAPA_REFERENCIA.md` — mapa de referencia visual/assets de Macarena.
- `PROMPT_MAESTRO_OPENCODE.md` — prompt maestro de trabajo.
