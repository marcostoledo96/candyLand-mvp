# Decisiones cerradas — CandyLand v2

Fecha: 2026-06-29

## Respuestas cerradas

1. Prisma: sí, mantener.
2. Backend Railway en la misma repo: sí, usando `backend/`.
3. Base de datos: exclusivamente Railway PostgreSQL.
4. Seed: manual/controlado.
5. Panel admin: sí. Las imágenes de productos se cargan mediante URL.
6. Stock: real.
7. Pedidos: se guardan en PostgreSQL aunque el pago sea manual.
8. Emails: sí. Implementar con la opción más simple y mantenible.
9. WhatsApp: no.
10. Métodos de pago: transferencia o efectivo.
11. Rutas: mantener catálogo y agregar rutas faltantes de Macarena. Usar `/catalogo` como canónica y aliases opcionales.
12. Diseño: combinar lo mejor de ambos proyectos, siempre React.
13. Páginas obligatorias: todas.
14. Nuestro menú: API.
15. Tutoriales: sólo tarjetas visuales.
16. Detalle de producto: no.
17. Marca: CandyLand.
18. Logo: revisar en proyecto de Macarena; usarlo si sirve.
19. Assets Macarena: sí, se pueden usar.
20. Tema: sólo modo claro.
21. Dominio actual Vercel: `https://candy-land-mvp.vercel.app/`.
22. Dominio final por ahora: el dominio anterior de Vercel.
23. Railway auto deploy desde `main`: sí.
24. Vercel previews por branch: sí.
25. Documentación deploy desde cero: sí.

## Consecuencias técnicas

- Neon queda deprecado.
- `api/index.cjs` de Vercel serverless debe quedar deprecado o eliminado sólo después de confirmar Railway.
- `vercel.json` no debe ejecutar Prisma, seed ni DB push.
- `DATABASE_URL` no debe estar en Vercel si el frontend ya no usa serverless backend.
- `VITE_API_URL` sí debe estar en Vercel.
- `CORS_ORIGIN` debe incluir el dominio de Vercel y localhost.

## Pendientes que OpenCode debe verificar en código

- Si ya existe `Product` con detalle, no crear ruta pública `/producto/:id` aunque el modelo tenga soporte.
- Si el README todavía dice Neon/Vercel serverless, actualizarlo.
- Si hay assets/logo en Macarena, mapearlos en `docs/MAPA_REFERENCIA.md`.
- Si hay scripts que ejecutan `db push` en producción, separarlos.
