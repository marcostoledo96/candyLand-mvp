# Engram Guide — CandyLand

## Objetivo

Usar Engram como memoria persistente para que OpenCode recuerde decisiones entre sesiones.

## Setup recomendado para OpenCode

```bash
engram setup opencode
```

Reiniciar OpenCode después del setup.

Verificar dentro de OpenCode:

```text
list memory tools
```

Deberían aparecer herramientas tipo `mem_save`, `mem_search`, `mem_context` o equivalentes según instalación.

## Qué guardar en memoria

Guardar sólo contexto útil y durable:

- decisiones técnicas;
- decisiones de producto;
- cambios de arquitectura;
- endpoints creados;
- migraciones importantes;
- bugs difíciles y solución;
- convenciones del proyecto;
- tareas pendientes relevantes.

No guardar secretos, tokens, contraseñas ni valores reales de `.env`.

## Memorias iniciales sugeridas

```text
CandyLand v2 usa React/Vite/TypeScript en frontend, Node/Express/Prisma en backend, PostgreSQL exclusivamente en Railway y frontend en Vercel.
```

```text
CandyLand v2 mantiene /catalogo como ruta canónica, agrega rutas de Macarena como /menu, /tutoriales, /franquicias, /trabaja-con-nosotros y /contacto, y no crea /producto/:id por ahora.
```

```text
CandyLand v2 usa admin para productos/categorías/pedidos. Las imágenes de producto se guardan como URL en DB; no hay upload de archivos.
```

```text
CandyLand v2 usa pagos manuales: transferencia o efectivo. No Mercado Pago, no tarjetas, no WhatsApp automático.
```

```text
CandyLand v2 debe enviar emails de pedido con provider desacoplado. Recomendado Resend; fallback SMTP/Nodemailer; el pedido no debe fallar si falla el email.
```

```text
El dominio Vercel actual para CORS es https://candy-land-mvp.vercel.app/ y el backend Railway debe permitir también http://localhost:5173 en desarrollo.
```

## Cuándo buscar memoria

Antes de iniciar una sesión de trabajo:

```bash
engram search "CandyLand Railway Vercel Prisma"
engram search "CandyLand admin productos stock imágenes URL"
```

O desde OpenCode, pedir:

```text
Buscá en Engram decisiones previas sobre CandyLand antes de modificar arquitectura o deploy.
```

## Al cerrar una sesión

Pedirle a OpenCode:

```text
Guardá en Engram un resumen de lo hecho, decisiones tomadas, archivos modificados, comandos verificados y próximos pasos. No guardes secretos.
```
