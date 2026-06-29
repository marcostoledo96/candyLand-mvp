# Spec — Orders, pagos manuales y emails

## Goal

Confirmar pedidos con pago manual y enviar notificación por email sin romper el checkout si falla el proveedor.

## Requirements

### Scenario: Manual payment methods

Given the checkout is submitted  
When the user selects payment method  
Then the only allowed methods MUST be `transferencia` or `efectivo`.

### Scenario: Order persistence

Given checkout data is valid  
When the order is confirmed  
Then the order and items MUST be saved in PostgreSQL.

### Scenario: Email send attempt

Given an order was saved  
When email provider is configured  
Then backend SHOULD send a new order email.

### Scenario: Email failure does not break order

Given an order was saved  
When the email provider fails  
Then the API MUST still return successful order creation and SHOULD register email failure.

### Scenario: No WhatsApp

Given an order is confirmed  
When notifications are processed  
Then backend MUST NOT send WhatsApp messages in this stage.

## Acceptance checklist

```text
[ ] Transferencia works
[ ] Efectivo works
[ ] Orders saved
[ ] Order items saved
[ ] Stock validated
[ ] Email provider configured or noop
[ ] Email failure does not fail checkout
[ ] Admin can see order
```
