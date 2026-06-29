# src/AGENTS.md — Frontend CandyLand

## Objetivo

Frontend React + Vite + TypeScript para CandyLand.

## Reglas

- Usar React + TypeScript.
- Mantener Vite.
- Mantener React Router.
- Todas las llamadas al backend deben pasar por una capa tipo `src/lib/api.ts` o equivalente.
- Usar `import.meta.env.VITE_API_URL`.
- No hardcodear Railway ni localhost dentro de componentes.
- Modo claro únicamente.
- Marca final: CandyLand.
- No crear `/producto/:id`.
- No implementar dark mode.

## Rutas públicas obligatorias

```text
/
/catalogo
/tienda              # alias/redirect opcional
/nuestros-dulces     # alias/redirect opcional
/menu
/tutoriales
/franquicias
/trabaja-con-nosotros
/contacto
/carrito
/checkout
```

## Rutas admin obligatorias

```text
/admin/login
/admin
/admin/productos
/admin/categorias
/admin/pedidos
```

## Estados obligatorios

Cada pantalla con datos remotos debe contemplar:

- loading;
- error;
- vacío;
- éxito;
- fallback si API no responde.

## Assets

- Assets estáticos de Macarena: `public/img/candyland/...`.
- Imágenes administrables de productos: URL desde API/DB.
- No importar imágenes pesadas en componentes si pueden servirse desde `public`.
- Agregar `alt` real.

## Diseño

Combinar lo mejor del MVP y de `tienda-candyland`, pero no copiar HTML/CSS sin adaptar.

Mobile-first. Evitar estética genérica SaaS si no encaja con CandyLand.
