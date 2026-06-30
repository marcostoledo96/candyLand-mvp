// FranquiciasPage: lead form posting to /api/franchise/leads.
// Required: fullName, email, city. Optional: phone, message.
// Preserves input on validation/API error; clears only on success.
import React, { useState } from 'react';
import { postFranchiseLead, PublicApiError } from '../../lib/api';
import shared from '../PublicRoutes/PublicRoutes.module.css';

interface FormValues {
  fullName: string;
  email: string;
  city: string;
  phone: string;
  message: string;
}

const INITIAL: FormValues = {
  fullName: '',
  email: '',
  city: '',
  phone: '',
  message: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FranquiciasPage: React.FC = () => {
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [feedback, setFeedback] = useState<string>('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!values.fullName.trim()) next.fullName = 'Ingresá tu nombre completo.';
    if (!values.email.trim()) next.email = 'Ingresá tu email.';
    else if (!EMAIL_RE.test(values.email.trim())) next.email = 'El email no es válido.';
    if (!values.city.trim()) next.city = 'Ingresá tu ciudad.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    setFeedback('');
    try {
      await postFranchiseLead({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        city: values.city.trim(),
        phone: values.phone.trim() || undefined,
        message: values.message.trim() || undefined,
      });
      setStatus('success');
      setFeedback('¡Gracias! Recibimos tu consulta de franquicia. Te contactaremos a la brevedad.');
      setValues(INITIAL);
      setErrors({});
    } catch (err) {
      const e2 = err as PublicApiError;
      setStatus('error');
      setFeedback(e2?.error || 'Ocurrió un error al enviar. Intentá nuevamente.');
    }
  };

  return (
    <section className={shared.page}>
      <h1 className={shared.pageTitle}>Franquicias</h1>
      <p className={shared.pageLead}>
        ¿Querés formar parte de CandyLand? Dejános tus datos y te contamos cómo
        sumarte a nuestra red.
      </p>

      <form className={shared.form} onSubmit={handleSubmit} noValidate>
        <div className={shared.field}>
          <label htmlFor="fullName">Nombre completo *</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={values.fullName}
            onChange={handleChange}
            required
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-err' : undefined}
          />
          {errors.fullName && <p id="fullName-err" className={shared.fieldError}>{errors.fullName}</p>}
        </div>

        <div className={shared.field}>
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-err' : undefined}
          />
          {errors.email && <p id="email-err" className={shared.fieldError}>{errors.email}</p>}
        </div>

        <div className={shared.field}>
          <label htmlFor="city">Ciudad *</label>
          <input
            id="city"
            name="city"
            type="text"
            value={values.city}
            onChange={handleChange}
            required
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? 'city-err' : undefined}
          />
          {errors.city && <p id="city-err" className={shared.fieldError}>{errors.city}</p>}
        </div>

        <div className={shared.field}>
          <label htmlFor="phone">Teléfono (opcional)</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={values.phone}
            onChange={handleChange}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="message">Mensaje (opcional)</label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={values.message}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className={shared.submitBtn} disabled={status === 'loading'}>
          {status === 'loading' ? 'Enviando…' : 'Enviar consulta'}
        </button>

        {feedback && (
          <p
            role="status"
            aria-live="polite"
            className={`${shared.status} ${
              status === 'success'
                ? shared.statusSuccess
                : status === 'error'
                  ? shared.statusError
                  : shared.statusLoading
            }`}
          >
            {feedback}
          </p>
        )}
      </form>
    </section>
  );
};

export default FranquiciasPage;