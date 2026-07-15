import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Checkout.module.css";
import { CheckoutApiError, postCheckout } from "../../lib/api";
import { buildCheckoutPayload, classifyCheckoutFailure, normalizeCheckoutData, validateCheckout } from "../../lib/checkout.js";

const AddressForm = () => {
  const navigate = useNavigate();
  const errorRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState(() => {
    try { return normalizeCheckoutData(localStorage.getItem("checkoutData")); } catch { return normalizeCheckoutData(null); }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const showError = (nextMessage: string, nextErrors: Record<string, string> = {}) => {
    setMessage(nextMessage);
    setErrors(nextErrors);
    requestAnimationFrame(() => errorRef.current?.focus());
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    const payload = buildCheckoutPayload(form);
    const clientErrors = validateCheckout(payload);
    if (Object.keys(clientErrors).length) {
      showError("Revisá los campos marcados para continuar.", clientErrors);
      return;
    }
    setLoading(true);
    setMessage("");
    setErrors({});
    try {
      const response = await postCheckout(payload, localStorage.getItem("cartId"));
      localStorage.setItem("checkoutData", JSON.stringify(payload));
      if (response.cartId) localStorage.setItem("cartId", response.cartId);
      navigate("/checkout/pago");
    } catch (error) {
      const failure = error instanceof CheckoutApiError ? error.failure : { kind: "transport" as const };
      const result = classifyCheckoutFailure(failure);
      showError(result.message, result.fields);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2>Dirección de envío</h2>
      {message && <div ref={errorRef} className={styles.messageError} role="alert" tabIndex={-1}>{message}</div>}
      {[
        ["nombre", "Nombre completo", "text"], ["direccion", "Dirección", "text"], ["localidad", "Localidad", "text"],
        ["telefono", "Teléfono", "tel"], ["provincia", "Provincia", "text"], ["codigoPostal", "Código postal", "text"],
      ].map(([name, label, type]) => (
        <label className={styles.field} key={name}>
          <span>{label}</span>
          <input
            name={name} type={type} value={form[name as keyof typeof form]}
            onChange={(event) => setForm({ ...form, [name]: event.target.value })}
            aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined}
          />
          {errors[name] && <span id={`${name}-error`} className={styles.fieldError}>{errors[name]}</span>}
        </label>
      ))}
      <button type="submit" disabled={loading}>{loading ? "Guardando…" : "Continuar al pago"}</button>
    </form>
  );
};

export default AddressForm;
