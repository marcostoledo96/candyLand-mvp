# Spec — Frontend UI parity con tienda-candyland

## Goal

Agregar a CandyLand las pantallas faltantes del proyecto de referencia, implementadas en React.

## Requirements

### Scenario: Public routes exist

Given a user opens the site  
When they navigate from header/footer  
Then the site MUST expose `/menu`, `/tutoriales`, `/franquicias`, `/trabaja-con-nosotros` and `/contacto`.

### Scenario: Catalog remains canonical

Given the existing catalog route works  
When adding routes from Macarena  
Then `/catalogo` SHOULD remain canonical and `/tienda` or `/nuestros-dulces` MAY redirect to it.

### Scenario: Tutorials are visual cards

Given tutorials are for portfolio  
When rendering `/tutoriales`  
Then it MUST show visual cards and MUST NOT require a real CMS.

### Scenario: Menu uses API

Given categories/products exist in backend  
When rendering `/menu`  
Then the page SHOULD consume categories/products from API and avoid permanent hardcoded data.

### Scenario: Light mode only

Given CandyLand uses a fixed theme  
When building components  
Then dark mode MUST NOT be added.

## Acceptance checklist

```text
[ ] Header includes new routes
[ ] Footer includes new routes
[ ] All public routes render
[ ] Mobile navigation works
[ ] Brand says CandyLand
[ ] No /producto/:id route added
[ ] npm run build passes
```
