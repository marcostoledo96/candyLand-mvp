# CodeGraph init — CandyLand

## Objetivo

Usar CodeGraph para que OpenCode no tenga que gastar tantos tokens leyendo archivos repetidos. CodeGraph crea un grafo local del código y permite explorar símbolos, relaciones, flujos y dependencias.

## Inicializar proyecto principal

```bash
cd /home/marcos/Escritorio/CandyLand/CandyLand/candyLand-mvp
codegraph init
codegraph status
```

## Inicializar proyecto de referencia

```bash
cd /home/marcos/Escritorio/CandyLand/CandyLand_Macarena/tienda-candyland
codegraph init
codegraph status
```

## Gitignore

Agregar al `.gitignore` del proyecto principal:

```gitignore
.codegraph/
```

No commitear `.codegraph/`.

## Consultas útiles

Desde el proyecto principal:

```bash
codegraph explore "flujo de productos desde backend Prisma hasta CatalogCard en React"
codegraph explore "cómo se confirma una orden y dónde se guarda el pago"
codegraph explore "rutas React actuales y componentes de layout"
codegraph explore "configuración actual de Vercel y API serverless"
codegraph explore "backend Express endpoints productos carrito checkout"
```

Desde referencia Macarena:

```bash
codegraph explore "páginas html disponibles y navegación principal"
codegraph explore "assets de img que parecen logo hero tutoriales productos"
codegraph explore "estructura CSS y secciones reutilizables para React"
```

## Protocolo para OpenCode

Antes de leer 4+ archivos por exploración, usar CodeGraph.

Después de editar mucho código:

```bash
codegraph status
```

Si aparece stale/pending:

```bash
codegraph sync
```

## Qué pedirle a OpenCode

```text
Usá CodeGraph primero para entender el flujo. Evitá leer archivos masivamente si CodeGraph puede responder. Si necesitás verificar una línea puntual, ahí sí abrí el archivo concreto.
```
