# Tasks — CandyLand v2

## 1. Documentación e inicialización

- [ ] 1.1 Copiar `AGENTS.md` al root.
- [ ] 1.2 Copiar `docs/`.
- [ ] 1.3 Copiar `openspec/`.
- [ ] 1.4 Agregar `.codegraph/` a `.gitignore`.
- [ ] 1.5 Ejecutar `codegraph init` en MVP.
- [ ] 1.6 Ejecutar `codegraph init` en referencia.
- [ ] 1.7 Generar `docs/MAPA_REFERENCIA.md`.
- [ ] 1.8 Generar `docs/AUDITORIA_INICIAL.md`.

## 2. Backend Railway

- [ ] 2.1 Revisar scripts backend.
- [x] 2.2 Ajustar `server.js` a Railway.
- [x] 2.3 Configurar CORS por env.
- [ ] 2.4 Confirmar Prisma PostgreSQL.
- [x] 2.5 Crear/ajustar health checks.
- [x] 2.6 Documentar `.env.example` backend.
- [x] 2.7 Preparar migraciones.
- [ ] 2.8 Verificar local.

## 3. Vercel separado

- [ ] 3.1 Configurar `VITE_API_URL`.
- [ ] 3.2 Quitar DB/Prisma/seed del build de Vercel.
- [x] 3.3 Revisar `api/index.cjs` y marcar deprecated si aplica.
- [ ] 3.4 Verificar build frontend.

## 4. Admin

- [x] 4.1 Diseñar auth admin.
- [x] 4.2 Crear modelo/admin user si falta.
- [x] 4.3 Crear endpoints admin productos.
- [x] 4.4 Crear endpoints admin categorías. (deferred to follow-up branch)
- [x] 4.5 Crear endpoints admin pedidos. (deferred to follow-up branch)
- [ ] 4.6 Crear pantallas admin.
- [x] 4.7 Proteger rutas admin.

## 5. Productos y stock

- [x] 5.1 Agregar/confirmar `stock` real.
- [x] 5.2 Confirmar imagen principal existente (`Product.image`; admin DTO futuro mapeará `imageUrl` ↔ `image`).
- [x] 5.3 Agregar imagen hover (`Product.hoverImage`; admin DTO futuro mapeará `hoverImageUrl` ↔ `hoverImage`).
- [ ] 5.4 Validar stock en checkout.
- [x] 5.5 Actualizar seed.

## 6. Pedidos y emails

- [ ] 6.1 Confirmar modelo Order/OrderItem.
- [ ] 6.2 Limitar métodos a transferencia/efectivo.
- [ ] 6.3 Implementar email service.
- [ ] 6.4 Implementar Resend provider.
- [ ] 6.5 Implementar noop provider.
- [ ] 6.6 Agregar SMTP provider si se decide.
- [ ] 6.7 Verificar que email failure no rompa checkout.

## 7. UI pública

- [ ] 7.1 Auditar assets Macarena.
- [ ] 7.2 Revisar logo Macarena.
- [ ] 7.3 Crear `MenuPage` desde API.
- [ ] 7.4 Crear `TutorialsPage` visual.
- [ ] 7.5 Crear `FranchisePage`.
- [ ] 7.6 Crear `JobsPage`.
- [ ] 7.7 Crear/mejorar `ContactPage`.
- [ ] 7.8 Mejorar Header/Footer.
- [ ] 7.9 Crear NotFound.

## 8. QA/deploy

- [x] 8.1 `npm run lint`.
- [x] 8.2 `npm run build`.
- [x] 8.3 Backend health local.
- [ ] 8.4 Railway health.
- [ ] 8.5 Vercel consume Railway.
- [ ] 8.6 Checkout end-to-end.
- [ ] 8.7 Admin end-to-end.
- [x] 8.8 Actualizar README.
- [ ] 8.9 Guardar memoria Engram final.
