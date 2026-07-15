import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import styles from "./Checkout.module.css";
import { CheckoutApiError, ConfirmOrderResponse, postConfirmOrder } from "../../lib/api";
import { classifyCheckoutFailure, clearCartMutationLockForCart, confirmationTransition, getConfirmationAttempt, isCompleteConfirmResponse, lockConfirmationAttempt, shouldClearCheckout } from "../../lib/checkout.js";

type ConfirmationState = { state: "ready" | "pending" | "preDispatch" | "rejected" | "succeeded"; order?: ConfirmOrderResponse };

const readConfirmationAttempt = () => {
  try {
    const cartId = localStorage.getItem("cartId");
    if (!cartId) return null;
    const attempt = getConfirmationAttempt(localStorage.getItem("checkoutConfirmation"), cartId);
    localStorage.setItem("checkoutConfirmation", JSON.stringify(attempt));
    return attempt;
  } catch { return null; }
};

const readBank = () => {
  try {
    const value = JSON.parse(localStorage.getItem("checkoutBank") || "null");
    return value && ["alias", "cbu", "titular"].every((key) => typeof value[key] === "string") ? value as { alias: string; cbu: string; titular: string } : null;
  } catch { return null; }
};

const Confirmation = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const alertRef = useRef<HTMLDivElement>(null);
  const [hasCart] = useState(() => {
    try { return Boolean(localStorage.getItem("cartId")); } catch { return false; }
  });
  const [attempt] = useState(readConfirmationAttempt);
  const [confirmation, setConfirmation] = useState<ConfirmationState>({ state: "ready" });
  const [message, setMessage] = useState("");
  const bank = useMemo(readBank, []);

  const focusMessage = (nextMessage: string) => {
    setMessage(nextMessage);
    requestAnimationFrame(() => alertRef.current?.focus());
  };

  const clearSuccessfulCheckout = () => {
    clearCartMutationLockForCart(localStorage, attempt?.cartId);
    clearCart();
    try {
      ["checkoutData", "paymentMethod", "checkoutBank", "checkoutConfirmation", "checkoutConfirmState", "orderNumber"].forEach((key) => localStorage.removeItem(key));
    } catch {}
  };

  const confirmOrder = async () => {
    const pending = confirmationTransition(confirmation, { type: "submit" }) as ConfirmationState;
    if (pending.state !== "pending") return;
    setConfirmation(pending);
    setMessage("");
    try {
      const order = await postConfirmOrder(localStorage.getItem("cartId"), attempt?.key);
      const completed = confirmationTransition(pending, { type: "succeed", order }) as ConfirmationState;
      if (shouldClearCheckout(completed)) {
        setConfirmation(completed);
        clearSuccessfulCheckout();
        return;
      }
      try { localStorage.setItem("checkoutMutationLock", JSON.stringify(lockConfirmationAttempt(attempt))); } catch {}
      setConfirmation({ state: "rejected" });
      focusMessage("No pudimos verificar el resultado de tu pedido. Conservamos tu carrito para que puedas reintentar.");
    } catch (error) {
      const failure = error instanceof CheckoutApiError ? error.failure : { kind: "transport" as const };
      const result = classifyCheckoutFailure(failure);
      if (failure.kind === "pre-dispatch") {
        clearCartMutationLockForCart(localStorage, attempt?.cartId);
        setConfirmation(confirmationTransition(pending, { type: "preDispatch" }) as ConfirmationState);
        focusMessage(result.message);
        return;
      }
      if (failure.kind === "http") {
        clearCartMutationLockForCart(localStorage, attempt?.cartId);
        setConfirmation(confirmationTransition(pending, { type: "reject" }) as ConfirmationState);
        focusMessage(result.message);
        return;
      }
      try { localStorage.setItem("checkoutMutationLock", JSON.stringify(lockConfirmationAttempt(attempt))); } catch {}
      setConfirmation(confirmationTransition(pending, { type: "reject" }) as ConfirmationState);
      focusMessage(result.message);
    }
  };

  const order = confirmation.order;
  return (
    <section className={styles.confirmation} aria-labelledby="confirmation-title">
      <h2 id="confirmation-title">Confirmá tu pedido</h2>
      {message && <div ref={alertRef} className={confirmation.state === "succeeded" ? styles.messageSuccess : styles.messageError} role="alert" tabIndex={-1}>{message}</div>}
      {order && isCompleteConfirmResponse(order) ? (
        <>
          <p className={styles.messageSuccess} role="status">Tu pedido fue confirmado.</p>
          <p><b>Número de orden:</b> {order.orderNumber}</p>
          <p><b>Dirección:</b> {order.customer.direccion}, {order.customer.localidad}</p>
          <h3>Resumen</h3>
          <ul>{order.items.map((item) => <li key={item.productId}>x{item.quantity} — ${Math.round(item.subtotalCents / 100)}</li>)}</ul>
          <p><b>Total:</b> ${Math.round(order.totalCents / 100)}</p>
          {order.paymentMethod === "efectivo" ? <p className={styles.instruction}>Pagá en efectivo al recibir tu pedido.</p> : bank && <div className={styles.bankBox}><h3>Datos para transferencia</h3><p><b>Alias:</b> {bank.alias}</p><p><b>CBU:</b> {bank.cbu}</p><p><b>Titular:</b> {bank.titular}</p></div>}
        </>
      ) : hasCart ? (
        <p>Revisá los datos y confirmá cuando estés listo.</p>
      ) : (
        <p>No hay un pedido pendiente para confirmar.</p>
      )}
      {confirmation.state === "succeeded" ? <button type="button" disabled>Pedido confirmado</button> : hasCart && <button type="button" onClick={confirmOrder} disabled={confirmation.state === "pending"}>{confirmation.state === "pending" ? "Confirmando…" : confirmation.state === "preDispatch" || confirmation.state === "rejected" ? "Reintentar confirmación" : "Confirmar pedido"}</button>}
      <button type="button" onClick={() => { if (confirmation.state !== "pending") navigate("/catalogo"); }} className={styles.backToShopBtn}>Volver a la tienda</button>
    </section>
  );
};

export default Confirmation;
