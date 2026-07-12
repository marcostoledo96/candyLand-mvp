# Autenticación Admin — CandyLand

## Contrato

JWT (HS256) con token en `sessionStorage`. No cookie, no localStorage, no refresh. TTL 8h (backend).

## Flujo

1. `POST /api/admin/login` → `{ token, user }`
2. `setAdminToken(token)` → `sessionStorage['admin_token']`
3. Navigate a `/admin/productos`
4. `RequireAdminAuth` llama `GET /api/admin/me`
5. 200 → render admin shell
6. 401 → `clearAdminToken()` + redirect a `/admin/login`

## Cierre de sesión

Botón "Cerrar sesión" → `clearAdminToken()` + `navigate('/admin/login')`. Cualquier 401 → clear automático + redirect.

## Reglas

- No reset de contraseña, no MFA, no gestión de usuarios.
- El token nunca se loguea a consola.
- `decodeAdminTokenPayload` es solo display — no verifica firma.

## Endpoints usados en este slice

| Método | Endpoint | Uso |
|--------|----------|-----|
| POST | `/api/admin/login` | Autenticar |
| GET | `/api/admin/me` | Bootstrap + validar token |
| GET | `/api/admin/products` | Listar productos |
| DELETE | `/api/admin/products/:id` | Desactivar (soft) |
| PATCH | `/api/admin/products/:id` | Reactivar (`{active:true}`) |

## Diferido a `frontend/admin-product-form`

POST/PATCH products (create/edit), `listAdminCategories`, validadores de form (`parsePriceInput`, `validateProductPayload`, `isSafeAdminImageUrl`, `extractApiError`), modal UI.

## Archivos

- `backend/routes/admin.js`, `backend/middleware/admin.js`, `backend/utils/jwt.js`
- `src/lib/adminAuth.js`, `src/lib/adminApi.js`
- `src/components/Admin/RequireAdminAuth.tsx`
- `src/pages/Admin/AdminLayout.tsx`, `AdminLogin.tsx`, `AdminProductsList.tsx`