// Decoupled order email service.
// Default: noop (logs disabled, no network). Resend: uses Node 20+ fetch only
// when EMAIL_PROVIDER=resend AND RESEND_API_KEY/MAIL_FROM/MAIL_TO are set.
// Never throws to the caller; returns { status: 'sent'|'disabled'|'failed' }.
// No `resend` dependency, no SMTP, no WhatsApp.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function normalizePaymentMethod(method) {
  if (!method) return 'desconocido';
  const m = String(method).toUpperCase();
  if (m === 'CASH' || m === 'EFECTIVO') return 'efectivo';
  if (m === 'TRANSFER' || m === 'TRANSFERENCIA') return 'transferencia';
  return String(method).toLowerCase();
}

function buildOrderEmailText(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const customer = order.customer || {};
  const customerName = customer.name || customer.nombre || 'N/A';
  const customerPhone = customer.phone || customer.telefono || 'N/A';
  const lines = [
    `Nuevo pedido CandyLand #${order.orderNumber || 'N/A'}`,
    '',
    `Nombre: ${customerName}`,
    `Teléfono: ${customerPhone}`,
    `Método de pago: ${normalizePaymentMethod(order.paymentMethod)}`,
    `Total: $${((order.totalCents || 0) / 100).toFixed(2)}`,
    '',
    'Productos:',
    ...items.map((it) => `- ${it.quantity} x producto ${it.productId} — $${(((it.quantity || 0) * (it.priceCents || 0)) / 100).toFixed(2)}`),
  ];
  return lines.join('\n');
}

/**
 * Send (or simulate) the new-order email. Never throws.
 * @param {object} order - { orderNumber, totalCents, items, customer, paymentMethod }
 * @returns {Promise<{status: 'sent'|'disabled'|'failed'}>}
 */
async function sendOrderConfirmationEmail(order) {
  const provider = (process.env.EMAIL_PROVIDER || 'noop').toLowerCase();

  if (provider !== 'resend') {
    console.log('email: disabled (EMAIL_PROVIDER=noop/missing)');
    return { status: 'disabled' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  const to = process.env.MAIL_TO;

  if (!apiKey || !from || !to) {
    console.log('email: disabled (resend selected but RESEND_API_KEY/MAIL_FROM/MAIL_TO missing)');
    return { status: 'disabled' };
  }

  try {
    const body = {
      from,
      to,
      subject: `Nuevo pedido CandyLand #${order.orderNumber || 'N/A'}`,
      text: buildOrderEmailText(order),
    };
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('email: Resend non-2xx response', res.status);
      return { status: 'failed' };
    }
    return { status: 'sent' };
  } catch {
    // Safe log: no stack trace, no secret leak.
    console.error('email: send failed (provider error swallowed)');
    return { status: 'failed' };
  }
}

module.exports = { sendOrderConfirmationEmail, buildOrderEmailText, normalizePaymentMethod };
