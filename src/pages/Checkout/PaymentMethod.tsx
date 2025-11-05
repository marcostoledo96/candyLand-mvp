// Paso de pago: permite elegir método (efectivo/transferencia) y guarda en backend
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Checkout.module.css";
import { postPaymentMethod } from "../../lib/api";

const PaymentMethod = () => {
  const navigate = useNavigate();
  const alias = "candyland.tienda.mp";
  const [method, setMethod] = useState<'efectivo' | 'transferencia'>("efectivo");
  const [loading, setLoading] = useState(false);
  const bank = { alias: "candyland.tienda.mp", cbu: "0000003100000000000000", titular: "CandyLand" };

  // Si no hay datos de checkout previos, redirigir a dirección
  useEffect(() => {
    const hasCheckout = !!localStorage.getItem("checkoutData");
    if (!hasCheckout) {
      navigate("/checkout/direccion", { replace: true });
    }
  }, [navigate]);
  const handleContinue = async () => {
    try {
      setLoading(true);
      const cartId = localStorage.getItem("cartId");
      const res = await postPaymentMethod(method, cartId || undefined);
      if (res?.cartId) localStorage.setItem("cartId", res.cartId);
      localStorage.setItem("paymentMethod", method);
      const orderNumber = Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem("orderNumber", orderNumber.toString());
      navigate("/checkout/confirmacion");
    } catch (e: any) {
      alert(e?.error || "No se pudo guardar el método de pago. Verificá que el backend esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.payment}>
      <h2>Método de pago</h2>
      <div className={styles.paymentOptions}>
        <label className={`${styles.optionCard} ${method === 'efectivo' ? styles.selected : ''}`}>
          <input
            type="radio"
            name="payment"
            checked={method === "efectivo"}
            onChange={() => setMethod("efectivo")}
          />
          <span className={styles.optionIcon} aria-hidden>💵</span>
          <span className={styles.optionTitle}>Efectivo</span>
          <span className={styles.optionDesc}>Pagás al recibir</span>
        </label>

        <label className={`${styles.optionCard} ${method === 'transferencia' ? styles.selected : ''}`}>
          <input
            type="radio"
            name="payment"
            checked={method === "transferencia"}
            onChange={() => setMethod("transferencia")}
          />
          <span className={styles.optionIcon} aria-hidden>💳</span>
          <span className={styles.optionTitle}>Transferencia</span>
          <span className={styles.optionDesc}>Datos bancarios al continuar</span>
        </label>
      </div>
      {method === "transferencia" && (
        <div className={styles.bankBox}>
          <p className={styles.bankTitle}>Datos para transferencia</p>
          <p><b>Alias:</b> {alias}</p>
          <p><b>CBU:</b> {bank.cbu}</p>
          <p><b>Titular:</b> {bank.titular}</p>
          <p className={styles.bankHint}>Una vez realizada, envianos el comprobante por WhatsApp.</p>
        </div>
      )}
      <button onClick={handleContinue} disabled={loading}>{loading ? "Guardando..." : "Continuar"}</button>
    </div>
  );
};

export default PaymentMethod;
