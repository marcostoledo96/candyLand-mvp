import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Checkout.module.css";

const PaymentMethod = () => {
  const navigate = useNavigate();
  const alias = "candyland.tienda.mp";
  const handleContinue = () => {
    const orderNumber = Math.floor(100000 + Math.random() * 900000);
    localStorage.setItem("orderNumber", orderNumber.toString());
    navigate("/checkout/confirmacion");
  };

  return (
    <div className={styles.payment}>
      <h2>Método de pago</h2>
      <p>Transferencia bancaria o Mercado Pago</p>
      <p><b>Alias:</b> {alias}</p>
      <p>Una vez realizada la transferencia, envianos el comprobante por WhatsApp.</p>
      <button onClick={handleContinue}>Continuar</button>
    </div>
  );
};

export default PaymentMethod;
