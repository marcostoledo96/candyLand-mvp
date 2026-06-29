# Spec — Admin productos, categorías, stock y pedidos

## Goal

Crear un admin MVP para gestionar productos reales de CandyLand.

## Requirements

### Scenario: Admin login

Given an admin user exists  
When they submit valid credentials  
Then the backend MUST return an auth token and the frontend MUST allow access to admin pages.

### Scenario: Product creation

Given admin is authenticated  
When they create a product  
Then they MUST be able to set name, description, price, stock, category, imageUrl, hoverImageUrl and active status.

### Scenario: Images by URL

Given admin manages products  
When they add an image  
Then the system MUST store a URL string and MUST NOT upload image files.

### Scenario: Real stock

Given a product has stock  
When an order is confirmed  
Then backend MUST validate stock and update/reserve it according to the order flow.

### Scenario: Orders visible

Given orders exist  
When admin opens `/admin/pedidos`  
Then they MUST see order list, payment method and status.

## Acceptance checklist

```text
[ ] /admin/login works
[ ] /admin/productos lists products
[ ] Create product works
[ ] Edit product works
[ ] Active/inactive works
[ ] Stock updates
[ ] Image URL saved
[ ] /admin/categorias works
[ ] /admin/pedidos works
[ ] Admin endpoints protected
```
