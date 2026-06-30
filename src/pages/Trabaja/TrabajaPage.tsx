// TrabajaPage: job application form posting to /api/jobs/applications.
// Required: fullName, email, position. Optional: phone, message, cvUrl (text only).
// NO file upload, NO drag-and-drop. cvUrl is a text URL only.
import React, { useState } from 'react';
import { postJobApplication, PublicApiError } from '../../lib/api';
import shared from '../PublicRoutes/PublicRoutes.module.css';

interface FormValues {
  fullName: string;
  email: string;
  position: string;
  phone: string;
  message: string;
  cvUrl: string;
}

const INITIAL: FormValues = {
  fullName: '',
  email: '',
  position: '',
  phone: '',
  message: '',
  cvUrl: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TrabajaPage: React.FC = () => {
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
    if (!values.position.trim()) next.position = 'Ingresá el puesto al que aplicás.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Limpiar feedback/estado previo antes de validar para que un éxito
    // persistente no quede mostrándose tras un submit inválido.
    setStatus('idle');
    setFeedback('');
    if (!validate()) return;
    setStatus('loading');
    try {
      await postJobApplication({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        position: values.position.trim(),
        phone: values.phone.trim() || undefined,
        message: values.message.trim() || undefined,
        cvUrl: values.cvUrl.trim() || undefined,
      });
      setStatus('success');
      setFeedback('¡Recibimos tu postulación! Te contactaremos si tu perfil encaja con la búsqueda.');
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
      <h1 className={shared.pageTitle}>Trabajá con nosotros</h1>
      <p className={shared.pageLead}>
        Sumate al equipo CandyLand. Completá el formulario con tus datos y el
        puesto al que querés aplicar. Si tenés tu CV online, pegá el link en el
        campo correspondiente.
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
          <label htmlFor="position">Puesto al que aplicás *</label>
          <input
            id="position"
            name="position"
            type="text"
            value={values.position}
            onChange={handleChange}
            required
            aria-invalid={!!errors.position}
            aria-describedby={errors.position ? 'position-err' : undefined}
          />
          {errors.position && <p id="position-err" className={shared.fieldError}>{errors.position}</p>}
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
          <label htmlFor="cvUrl">Link a tu CV (opcional)</label>
          <input
            id="cvUrl"
            name="cvUrl"
            type="url"
            inputMode="url"
            placeholder="https://..."
            value={values.cvUrl}
            onChange={handleChange}
          />
          <p className={shared.cardMeta}>Pegá un enlace a tu CV online. No subimos archivos.</p>
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
          {status === 'loading' ? 'Enviando…' : 'Enviar postulación'}
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

export default TrabajaPage;