# Mapa de referencia — CandyLand v2

> Origen: `/home/marcos/Escritorio/CandyLand/CandyLand_Macarena/tienda-candyland`  
> Destino: `/home/marcos/Escritorio/CandyLand/CandyLand/candyLand-mvp`

Este documento compara el sitio estático de referencia (`tienda-candyland`) contra el MVP actual y define qué rutas, secciones, assets y patrones visuales deben migrarse a React.

## 1. Rutas y páginas

| Origen (Macarena) | Ruta destino CandyLand | Componente/page sugerida | Estado actual | Notas |
|---|---|---|---|---|
| `index.html` | `/` | `src/pages/Home/Home.tsx` | Existe | Falta hero carousel, sección "Nuestro Mundo Dulce", locales y footer completo. |
| `tienda.html` | `/catalogo` (canónica) | `src/pages/Catalog/CatalogPage.tsx` | Existe | `/tienda` y `/nuestros-dulces` pueden ser aliases/redirects. |
| `menu-tienda.html` | `/menu` | `src/pages/Menu/MenuPage.tsx` | No existe | Debe consumir categorías/productos de la API (decisión cerrada #14). |
| `tutoriales.html` | `/tutoriales` | `src/pages/Tutoriales/TutorialesPage.tsx` | No existe | Sólo tarjetas visuales, sin CMS real (decisión cerrada #15). |
| `franquicias.html` | `/franquicias` | `src/pages/Franquicias/FranquiciasPage.tsx` | No existe | Formulario de lead; requiere endpoint `POST /api/franchise/leads`. |
| `trabaja-en-tdc.html` | `/trabaja-con-nosotros` | `src/pages/Trabaja/TrabajaPage.tsx` | No existe | Formulario de postulación; requiere endpoint `POST /api/jobs/applications`. |
| `contacto.html` | `/contacto` | `src/components/Contact/Contacto.tsx` | Existe | Formulario es falso (`console.log` + `alert`). Requiere `POST /api/contact` real. |
| — | `/carrito` | `src/pages/CartPage` | Existe | Funcional. |
| — | `/checkout/direccion`, `/checkout/pago`, `/checkout/confirmacion` | `src/pages/Checkout/*` | Existen | Funcional pero con campos desfasados (`ciudad` vs `localidad`). |
| — | `/admin/login`, `/admin`, `/admin/productos`, `/admin/categorias`, `/admin/pedidos` | — | No existen | Obligatorias según `src/AGENTS.md`. |

### Navegación

- **Header actual**: 4 links (`/`, `/catalogo`, `/carrito`, `/contacto`).
- **Header referencia**: 6 links (`tienda`, `tutoriales`, `menu`, `trabaja`, `franquicias`, `contacto`).
- **Footer actual**: anchors `#inicio`, `#nuestro-mundo`, etc. No son links de React Router.
- **Footer referencia**: 2 columnas de links + newsletter + redes + copyright extendido.

## 2. Secciones visuales por página

### Home (`/`)

| Sección referencia | Estado en MVP | Prioridad | Notas |
|---|---|---|---|
| Hero carousel (3 slides) | No existe | Alta | Requiere `slide1.jpg`, `slide2.jpg`, `slide3.jpg`. |
| Navbar flotante/transparente | Parcial | Media | Header existe pero no flota sobre el hero. |
| Carrusel de categorías/productos | Parcial | Alta | MVP tiene grid estático en Home; referencia tiene carousel con hover. |
| Banner destacados (2 cajas) | No existe | Media | `destacado-golosina1.jpg`, `destacado-golosina2.jpg`. |
| "Nuestro Mundo Dulce" (3 cols + imagen central) | No existe | Media | `dulzura-central.jpg`. |
| Sección locales con fondo | No existe | Baja | `fondo-locales.jpg`; puede ser decorativa. |
| Footer completo | Parcial | Alta | Replicar columnas, newsletter, redes. |

### Catálogo (`/catalogo`)

| Patrón referencia | Estado en MVP | Notas |
|---|---|---|
| Grid de cards con hover de imagen | Existe | MVP ya tiene `CatalogCard` con hover. |
| Filtros laterales (categoría, precio, búsqueda) | Existe | Funcional. |
| Foto default por producto | Existe | Hardcodeada por título en `CatalogPage.tsx`. |

### Menú (`/menu`)

| Sección referencia | Estado en MVP | Notas |
|---|---|---|
| Hero fijo con imagen de fondo | No existe | `golosinas-hero.jpg`. |
| Galería masonry con zoom/texto | No existe | Usar `dulce1.jpg` a `dulce6.jpg`. |
| Imagen central de dulzura | No existe | `dulzura-central.jpg`. |
| Sección locales | No existe | Reutilizable de Home. |

### Tutoriales (`/tutoriales`)

| Sección referencia | Estado en MVP | Notas |
|---|---|---|
| Intro textual | No existe | Texto de referencia puede reutilizarse. |
| Grid de 6 tarjetas con overlay | No existe | `tutorial1.jpg` a `tutorial6.jpg`. |

### Franquicias y Trabajá con nosotros

| Patrón referencia | Estado en MVP | Notas |
|---|---|---|
| Encabezado con subtítulo + separador + descripción | No existe | Replicar estilo. |
| Formulario en 2 columnas | No existe | Validación básica; sin adjunto real en MVP (decisión: sin upload). |

### Contacto

| Patrón referencia | Estado en MVP | Notas |
|---|---|---|
| Formulario + redes | Existe | Adaptar estilos; conectar a `POST /api/contact`. |

## 3. Assets candidatos para copiar

La mayoría de los assets de referencia ya están duplicados en `public/img/` del MVP. Se verificaron versiones JPG y WebP.

| Asset | Origen | MVP destino | Copiar | Notas |
|---|---|---|---|---|
| `img/logo.png` | Referencia | `public/img/logo.png` | No | MVP ya tiene logo. Revisar si el de referencia es mejor (decisión cerrada #18). |
| `img/candy.png` (favicon) | Referencia | `public/img/candy.png` | No | Ya existe. |
| `img/slide1.jpg`, `slide2.jpg`, `slide3.jpg` | Referencia | `public/img/` | Sí | Necesarios para hero carousel. |
| `img/golosina1.jpg` … `golosina6.jpg` | Referencia | `public/img/` | No | Ya existen. |
| `img/golosina1-hover.png` | Referencia | `public/img/` | No | Ya existe. |
| `img/caramelos3.jpg` / `-hover.jpg` | Referencia | `public/img/` | No | Ya existen. |
| `img/chocolate1.jpg` / `-hover.jpg` | Referencia | `public/img/` | No | Ya existen. |
| `img/gomitas2.jpg` / `-hover.jpg` | Referencia | `public/img/` | No | Ya existen. |
| `img/destacado-golosina1.jpg`, `destacado-golosina2.jpg` | Referencia | `public/img/` | No | Ya existen. |
| `img/dulce1.jpg` … `dulce6.jpg` | Referencia | `public/img/` | No | Ya existen. |
| `img/dulzura-central.jpg` | Referencia | `public/img/` | No | Ya existe. |
| `img/golosinas-hero.jpg` | Referencia | `public/img/` | No | Ya existe. |
| `img/fondo-locales.jpg` | Referencia | `public/img/` | No | Ya existe. |
| `img/tutorial1.jpg` … `tutorial6.jpg` | Referencia | `public/img/` | No | Ya existen. |
| `css/main.css`, `css/styles.css` | Referencia | — | No como CSS | Usar como referencia visual, adaptar a CSS Modules o Tailwind del MVP. |
| `js/scripts.js` | Referencia | — | No | Reimplementar carousel/mobile-menu en React. |

## 4. Patrones visuales y de UX a conservar

| Patrón | Cómo se verá en React |
|---|---|
| Tipografía `Raleway` + `Oswald` | Cargar desde Google Fonts en `index.html` o CSS global. |
| Colores pastel/rosa/blanco del header | Revisar variables CSS actuales; ajustar para coincidir. |
| Botones `.btn` con fondo oscuro/letra clara | Reutilizar clase `.btn` o componente `Button`. |
| Hover de imagen en cards (default → hover) | Ya existe en `HomeProductCard`; extender a `CatalogCard`. |
| Hero carousel con dots y flechas | Nuevo componente `HeroCarousel`. |
| Navbar transparente sobre hero que se vuelve sólido al scrollear | Nuevo comportamiento en `Header`. |
| Footer de 4 columnas con newsletter | Refactor de `Footer.tsx`. |

## 5. Decisiones pendientes de diseño

1. **Logo**: el MVP usa `src/assets/img/logo.png`; la referencia usa `img/logo.png`. Son archivos distintos. Se debe decidir cuál queda como definitivo.
2. **Tipografía**: la referencia usa `Raleway`/`Oswald`; el MVP no declara tipografía específica. Definir si se adopta la referencia.
3. **Sección locales**: la referencia promociona "locales CandyLand"; el MVP es e-commerce sin locales físicos reales. Decidir si se mantiene como decorativo o se reemplaza por envíos.
4. **Newsletter**: formulario falso en referencia. Se puede dejar sin acción real (sólo visual) o conectar a endpoint simple.

## 6. Checklist de mapeo

```text
[ ] Rutas faltantes creadas: /menu, /tutoriales, /franquicias, /trabaja-con-nosotros
[ ] Header actualizado con 6 links de navegación
[ ] Footer actualizado con links reales de React Router
[ ] Hero carousel en Home con slide1/2/3
[ ] Sección "Nuestro Mundo Dulce" en Home
[ ] Página /menu consume API de categorías
[ ] Página /tutoriales renderiza 6 tarjetas visuales
[ ] Página /franquicias conecta POST /api/franchise/leads
[ ] Página /trabaja-con-nosotros conecta POST /api/jobs/applications
[ ] Página /contacto conecta POST /api/contact
[ ] No se crea ruta /producto/:id
[ ] No se agrega dark mode
```
