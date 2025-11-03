import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import styles from "./Checkout.module.css";
import { postConfirmOrder, ConfirmOrderResponse } from "../../lib/api";

const Confirmation = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<ConfirmOrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const data = JSON.parse(localStorage.getItem("checkoutData") || "{}");
  const whatsappNumber = "5491133190247"; // reemplazar por el real

  const message = order
    ? `Hola Candyland!%0A%0AComprobante de pedido:%0AOrden: ${order.orderNumber}%0ANombre: ${data.nombre}%0ADirección: ${data.direccion}`
    : `Hola Candyland!`;

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  useEffect(() => {
    (async () => {
      const cartId = localStorage.getItem("cartId");
      let lastErr: any = null;
      // Reintentos ante fallos de red transitorios
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await postConfirmOrder(cartId || undefined);
          setOrder(res);
          clearCart();
          setError(null);
          return;
        } catch (e: any) {
          lastErr = e;
          // si es un error del backend con mensaje, no tiene sentido reintentar
          if (e?.error) break;
          // pequeño backoff antes de reintentar fallos de red
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }
      }
      setError(lastErr?.error || lastErr?.message || "No se pudo confirmar la compra");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.confirmation}>
      <h2>Confirmá tu pedido</h2>
      {error && <p style={{ color: '#c00' }}>{error}</p>}
      {order ? (
        <>
          <p><b>Número de orden:</b> {order.orderNumber}</p>
          <p><b>Dirección:</b> {data.direccion}, {data.localidad || data.ciudad}</p>
          <div style={{ marginTop: 12 }}>
            <h4>Resumen</h4>
            <ul>
              {order.items.map((it) => (
                <li key={it.productId}>x{it.quantity} - ${Math.round(it.subtotalCents / 100)}</li>
              ))}
            </ul>
            <p><b>Total:</b> ${Math.round(order.totalCents / 100)}</p>
            <p><b>Método de pago:</b> {order.paymentMethod}</p>
            <p><b>Cliente:</b> {data.nombre} - {data.telefono}</p>
          </div>
          <p style={{ marginTop: 12 }}>Enviá tu comprobante al WhatsApp de Candyland:</p>
        </>
      ) : (
        <p>Generando tu orden...</p>
      )}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.whatsappBtn}
      >
        Enviar por WhatsApp
      </a>

      <p>¡Gracias por tu compra!</p>

      <button
        onClick={() => navigate("/catalogo")}
        className={styles.backToShopBtn}
      >
        Volver a la tienda
      </button>
    </div>
  );
};

export default Confirmation;
