import React, { useState } from "react";
import "./Contacto.css";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { postContact, PublicApiError } from "../../lib/api";

interface FormValues {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const INITIAL: FormValues = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Contacto: React.FC = () => {
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [feedback, setFeedback] = useState<string>("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setValues((v) => ({ ...v, [id]: value }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!values.name.trim()) next.name = "Ingresá tu nombre.";
    if (!values.email.trim()) next.email = "Ingresá tu email.";
    else if (!EMAIL_RE.test(values.email.trim())) next.email = "El email no es válido.";
    if (!values.message.trim()) next.message = "Escribí tu consulta.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    setFeedback("");
    try {
      await postContact({
        name: values.name.trim(),
        email: values.email.trim(),
        message: values.message.trim(),
        phone: values.phone.trim() || undefined,
      });
      setStatus("success");
      setFeedback("Tu mensaje fue enviado correctamente. Te responderemos a la brevedad.");
      setValues(INITIAL);
      setErrors({});
    } catch (err) {
      const e2 = err as PublicApiError;
      setStatus("error");
      setFeedback(e2?.error || "Ocurrió un error al enviar. Intentá nuevamente.");
    }
  };

  return (
    <section className="contacto-container">
      <div className="columna-form">
        <h2 className="contacto-titulo">COMUNICATE CON NOSOTROS</h2>
        <p className="contacto-descripcion">
          Ante cualquier consulta no dudes en comunicarte. Dejá tus datos y consulta utilizando el
          formulario a continuación y nos contactaremos a la brevedad.
        </p>

        <form className="form-contacto" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">Nombre *</label>
            <input
              id="name"
              type="text"
              value={values.name}
              onChange={handleChange}
              required
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-err" : undefined}
            />
            {errors.name && <small id="name-err" style={{ color: "#b00020" }}>{errors.name}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail *</label>
            <input
              id="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              required
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-err" : undefined}
            />
            {errors.email && <small id="email-err" style={{ color: "#b00020" }}>{errors.email}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Teléfono (opcional)</label>
            <input
              id="phone"
              type="tel"
              value={values.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Mensaje *</label>
            <textarea
              id="message"
              rows={6}
              value={values.message}
              onChange={handleChange}
              required
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "message-err" : undefined}
            ></textarea>
            {errors.message && <small id="message-err" style={{ color: "#b00020" }}>{errors.message}</small>}
          </div>

          <button type="submit" className="btn-enviar" disabled={status === "loading"}>
            {status === "loading" ? "Enviando…" : "ENVIAR"}
          </button>

          {feedback && (
            <p
              role="status"
              aria-live="polite"
              style={{
                marginTop: 14,
                padding: "10px 14px",
                borderRadius: 4,
                background: status === "success" ? "#e8f5e9" : status === "error" ? "#fdecea" : "#fff3e0",
                color: status === "success" ? "#1b5e20" : status === "error" ? "#b00020" : "#7a4a00",
                fontSize: "0.92rem",
              }}
            >
              {feedback}
            </p>
          )}
        </form>
      </div>

      <div className="columna-redes">
        <h2 className="contacto-titulo">NUESTRAS REDES SOCIALES</h2>
        <div className="iconos-redes">
          {/* Social placeholders: inert labeled spans until real profile URLs are configured. */}
          <span aria-disabled="true" title="Próximamente Facebook" style={{ color: "#222", opacity: 0.7, cursor: "not-allowed" }}>
            <FaFacebookF />
          </span>
          <span aria-disabled="true" title="Próximamente Instagram" style={{ color: "#222", opacity: 0.7, cursor: "not-allowed" }}>
            <FaInstagram />
          </span>
        </div>
      </div>
    </section>
  );
};

export default Contacto;