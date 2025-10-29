import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import styles from "./Checkout.module.css";

const Confirmation = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const orderNumber = localStorage.getItem("orderNumber");
  const data = JSON.parse(localStorage.getItem("checkoutData") || "{}");
  const whatsappNumber = "5491122334455"; // reemplazá por el real

  const message = `Hola Candyland! 😊\n\nTe envío el comprobante de mi pedido.\nNúmero de orden: ${orderNumber}\nNombre: ${data.nombre}\nDirección: ${data.direccion}`;

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  // ✅ Limpiar el carrito solo una vez, al montar
  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.confirmation}>
      <h2>Confirmá tu pedido</h2>
      <p><b>Número de orden:</b> {orderNumber}</p>
      <p>Dirección: {data.direccion}, {data.ciudad}</p>
      <p>Enviá tu comprobante al WhatsApp de Candyland:</p>

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
