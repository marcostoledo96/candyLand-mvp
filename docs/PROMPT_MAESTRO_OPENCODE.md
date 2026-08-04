# Prompt maestro para OpenCode — CandyLand v2

> **Actualizado 2026-08:** el camino vigente es **demo mock-first**.  
> Usá primero `docs/HANDOFF_CURSOR_OPENCODE.md` y `docs/DEMO_MOCK.md`.  
> El bloque histórico abajo conserva contexto; no lo uses como gate de Railway obligatorio.

## Prompt vigente (copiar)

```text
Estoy en CandyLand MVP:
/home/marcos/Escritorio/CandyLand/CandyLand/candyLand-mvp

Referencia visual:
/home/marcos/Escritorio/CandyLand/CandyLand_Macarena/tienda-candyland

Leé en este orden:
1. docs/HANDOFF_CURSOR_OPENCODE.md
2. AGENTS.md
3. docs/DECISIONES_CERRADAS.md
4. docs/DEMO_MOCK.md
5. docs/PLANIFICACION_CANDYLAND_V2.md (fase 0)
6. openspec/config.yaml

Reglas:
- Demo vigente = VITE_DATA_MODE=mock en Vercel; sin Railway/DB obligatorios.
- Conservar backend/ para modo api opcional.
- OpenSpec 2026-06-candyland-v2 está CLOSED (demo-only). Trabajo API nuevo = change nuevo.
- CodeGraph antes de explorar en masa. No leer secretos .env.
- Commits sin atribución AI. No mergear sin que yo lo pida.

Primera tarea:
1) git pull + confirmar que PR #23 está merged (si no, avisame).
2) Resumen de 10 líneas del estado real vs el handoff.
3) Proponé 2–3 siguientes slices chicos y esperá mi elección antes de codear.
```

## Prompt histórico (pre–mock-first) — solo referencia

Usar este prompt al iniciar trabajo grande en la era Railway-first (obsoleto como default):

```text
Estoy trabajando en:
/home/marcos/Escritorio/CandyLand/CandyLand/candyLand-mvp

Proyecto de referencia visual/assets:
/home/marcos/Escritorio/CandyLand/CandyLand_Macarena/tienda-candyland

Leé primero:
- AGENTS.md
- docs/DECISIONES_CERRADAS.md
- docs/DEMO_MOCK.md
- docs/CODEGRAPH_INIT.md
- docs/ENGRAM_GUIDE.md
- docs/DEPLOY_RAILWAY_VERCEL.md
- openspec/config.yaml

Usá CodeGraph antes de leer muchos archivos.
Si Engram está disponible, buscá memoria previa sobre CandyLand antes de modificar arquitectura o deploy.

Objetivo general:
Portfolio demo en Vercel con mocks (default). Backend Node/Express/Prisma opcional con PostgreSQL en Railway cuando VITE_DATA_MODE=api. Admin productos/categorías/pedidos (mock en demo). Sin /producto/:id, sin WhatsApp, sin Mercado Pago. Pagos transferencia o efectivo. Solo modo claro.

Primera tarea:
No modifiques código todavía. Confirmá estado vs docs/HANDOFF_CURSOR_OPENCODE.md y esperá mi confirmación.
```
