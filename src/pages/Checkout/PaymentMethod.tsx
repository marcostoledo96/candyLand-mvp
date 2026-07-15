import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Checkout.module.css";
import { CheckoutApiError, getPaymentMethods, PaymentMethodChoice, PaymentMethodCode, postPaymentMethod } from "../../lib/api";
import { buildPaymentPayload, classifyCheckoutFailure } from "../../lib/checkout.js";

const PaymentMethod = () => {
  const navigate = useNavigate();
  const errorRef = useRef<HTMLDivElement>(null);
  const [method, setMethod] = useState<PaymentMethodChoice>(() => {
    try { return localStorage.getItem("paymentMethod") === "transferencia" ? "transferencia" : "efectivo"; } catch { return "efectivo"; }
  });
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);
  const [message, setMessage] = useState("");
  const [methods, setMethods] = useState<PaymentMethodCode[]>(["CASH"]);

  useEffect(() => {
    try {
      if (!localStorage.getItem("checkoutData")) navigate("/checkout/direccion", { replace: true });
    } catch { navigate("/checkout/direccion", { replace: true }); }
  }, [navigate]);

  useEffect(() => {
    let current = true;
    setAvailabilityLoading(true);
    setAvailabilityError("");
    getPaymentMethods().then(({ methods }) => {
      if (!current) return;
      setMethods(methods);
      if (!methods.includes("TRANSFER")) setMethod("efectivo");
    }).catch(() => {
      if (current) setAvailabilityError("No pudimos cargar los métodos de pago. Intentá nuevamente.");
    }).finally(() => {
      if (current) setAvailabilityLoading(false);
    });
    return () => { current = false; };
  }, [availabilityAttempt]);

  const showError = (nextMessage: string) => {
    setMessage(nextMessage);
    requestAnimationFrame(() => errorRef.current?.focus());
  };

  const handleContinue = async () => {
    if (loading || availabilityLoading || availabilityError) return;
    const payload = buildPaymentPayload(method);
    if (!payload) return showError("Elegí efectivo o transferencia para continuar.");
    setLoading(true);
    setMessage("");
    try {
      const response = await postPaymentMethod(payload.method, localStorage.getItem("cartId"));
      if (response.cartId) localStorage.setItem("cartId", response.cartId);
      localStorage.setItem("paymentMethod", payload.method);
      if (response.bank) localStorage.setItem("checkoutBank", JSON.stringify(response.bank));
      else localStorage.removeItem("checkoutBank");
      navigate("/checkout/confirmacion");
    } catch (error) {
      const failure = error instanceof CheckoutApiError ? error.failure : { kind: "transport" as const };
      showError(classifyCheckoutFailure(failure).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.payment} aria-labelledby="payment-title">
      <h2 id="payment-title">Método de pago</h2>
      {availabilityLoading && <p role="status">Cargando métodos de pago…</p>}
      {availabilityError && <div className={styles.messageError} role="alert">{availabilityError} <button type="button" onClick={() => setAvailabilityAttempt((attempt) => attempt + 1)}>Reintentar</button></div>}
      {message && <div ref={errorRef} className={styles.messageError} role="alert" tabIndex={-1}>{message}</div>}
      <fieldset className={styles.paymentOptions} disabled={loading || availabilityLoading || Boolean(availabilityError)}>
        <legend>Elegí cómo querés pagar</legend>
        <label className={`${styles.optionCard} ${method === "efectivo" ? styles.selected : ""}`}>
          <input type="radio" name="payment" checked={method === "efectivo"} onChange={() => setMethod("efectivo")} />
          <span className={styles.optionTitle}>Efectivo</span><span className={styles.optionDesc}>Pagás al recibir tu pedido.</span>
        </label>
        {methods.includes("TRANSFER") && <label className={`${styles.optionCard} ${method === "transferencia" ? styles.selected : ""}`}>
          <input type="radio" name="payment" checked={method === "transferencia"} onChange={() => setMethod("transferencia")} />
          <span className={styles.optionTitle}>Transferencia</span><span className={styles.optionDesc}>Verás los datos bancarios provistos por el checkout antes de confirmar.</span>
        </label>}
      </fieldset>
      {method === "efectivo" ? <p className={styles.instruction}>Pagá en efectivo al recibir tu pedido.</p> : <p className={styles.instruction}>Guardaremos tu elección y te mostraremos los datos de transferencia en la confirmación.</p>}
      <button type="button" onClick={handleContinue} disabled={loading || availabilityLoading || Boolean(availabilityError)}>{loading ? "Guardando…" : "Continuar"}</button>
    </section>
  );
};

export default PaymentMethod;
