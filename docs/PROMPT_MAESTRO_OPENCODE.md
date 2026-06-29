# Prompt maestro para OpenCode — CandyLand v2

Usar este prompt al iniciar el trabajo grande.

```text
Estoy trabajando en:
/home/marcos/Escritorio/CandyLand/CandyLand/candyLand-mvp

Proyecto de referencia visual/assets:
/home/marcos/Escritorio/CandyLand/CandyLand_Macarena/tienda-candyland

Leé primero:
- AGENTS.md
- docs/DECISIONES_CERRADAS.md
- docs/CODEGRAPH_INIT.md
- docs/ENGRAM_GUIDE.md
- docs/DEPLOY_RAILWAY_VERCEL.md
- openspec/config.yaml

Usá CodeGraph antes de leer muchos archivos.
Si Engram está disponible, buscá memoria previa sobre CandyLand antes de modificar arquitectura o deploy.

Objetivo general:
Mejorar CandyLand MVP combinando lo mejor del proyecto actual y el de Macarena, siempre implementando en React. Backend Node/Express/Prisma con PostgreSQL exclusivo en Railway. Frontend en Vercel. Admin para productos/categorías/pedidos, stock real, imágenes de producto por URL, pedidos guardados y emails de pedido con provider desacoplado.

Decisiones obligatorias:
- Marca CandyLand.
- Sólo modo claro.
- No crear /producto/:id.
- No WhatsApp.
- No Mercado Pago ni tarjetas.
- Pagos sólo transferencia o efectivo.
- Tutoriales como tarjetas visuales.
- Nuestro menú desde API.
- Seed manual.
- Railway auto deploy desde main.
- Vercel previews por branch.

Primera tarea:
No modifiques código todavía. Generá:
1. docs/MAPA_REFERENCIA.md comparando pantallas/assets/rutas de ambos proyectos.
2. docs/AUDITORIA_INICIAL.md con estado real de frontend/backend/API/deploy.
3. docs/PLAN_DE_IMPLEMENTACION_DETALLADO.md con orden de PRs o commits pequeños.

Después esperá mi confirmación antes de tocar código.
```
