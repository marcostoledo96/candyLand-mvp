# Emails de pedidos — CandyLand v2

## Decisión

CandyLand debe enviar emails cuando entra un pedido, pero el pedido no debe fallar si el email falla.

## Opción recomendada

### Resend

Recomendado para portfolio real porque en Node.js se integra con SDK y API key.

Ventajas:

- SDK simple.
- Buen encaje con Node/Express.
- Variables claras.
- Menos fricción que configurar SMTP si ya hay dominio verificado.

Limitación:

- Para enviar desde un remitente propio normalmente se requiere dominio verificado.

Variables:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
MAIL_FROM=CandyLand <pedidos@tudominio.com>
MAIL_TO=marcos@example.com
```

## Fallback simple

### SMTP/Nodemailer

Usar si no hay dominio verificado para Resend o si se quiere demo rápida.

Opciones:

- Brevo SMTP.
- Gmail App Password sólo para prueba/demo.

Variables:

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM=CandyLand <...>
MAIL_TO=...
```

## Provider noop

Para desarrollo local sin credenciales:

```env
EMAIL_PROVIDER=disabled
```

El backend debe simular éxito o registrar que el email está deshabilitado.

## Diseño recomendado

```text
backend/
  src/
    services/
      emailService.js
      emailProviders/
        resendProvider.js
        smtpProvider.js
        noopProvider.js
```

Si el backend actual no usa `src/`, adaptar a la estructura existente sin reordenar todo innecesariamente.

## Reglas

- No bloquear el pedido si falla email.
- No loguear API keys ni passwords.
- Registrar estado:
  - `sent`
  - `failed`
  - `disabled`
- Si se guarda `emailStatus` en `Order`, documentar migración.
- Email al negocio: nuevo pedido.
- Email al cliente: confirmación del pedido, opcional en segunda iteración.

## Template mínimo pedido

Asunto:

```text
Nuevo pedido CandyLand #{{orderNumber}}
```

Contenido:

```text
Nombre: {{customerName}}
Email: {{customerEmail}}
Teléfono: {{customerPhone}}
Método de pago: {{paymentMethod}}
Total: {{total}}
Productos:
- {{quantity}} x {{productName}} — {{subtotal}}
```

## Criterio de listo

```text
[ ] Provider Resend implementado o documentado
[ ] Provider SMTP/noop disponible
[ ] Pedido no falla si email falla
[ ] Variables en .env.example
[ ] Logs seguros
[ ] Test manual realizado desde checkout
```
