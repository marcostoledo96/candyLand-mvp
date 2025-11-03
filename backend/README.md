CandyLand Backend (Express) - Monorepo dentro de /candyLand

Requisitos
- Node.js 18+ (recomendado 20+)

Setup rápido (SQLite)
1) Copiar variables de entorno

   cp .env.example .env

2) Instalar dependencias

   npm install

3) Generar Prisma y migrar

   npx prisma generate
   npx prisma migrate dev --name init
   node prisma/seed.js

4) Ejecutar backend

   npm run dev

Nota: El frontend está en la carpeta superior, con Vite en 5173 y proxy /api hacia 3000.

Endpoints
- GET /api  → { "message": "API ok" }
- GET /api/productos → lista todos los productos
- POST /api/carrito → agregar producto (usa query ?cartId=)
- POST /api/checkout → guarda datos del comprador
- POST /api/payment-method → método de pago
- POST /api/orders/confirm → confirma orden
