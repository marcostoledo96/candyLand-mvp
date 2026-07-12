import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginAdmin, AdminApiError } from '../../lib/adminApi.js';
import { setAdminToken, AdminAuthError } from '../../lib/adminAuth.js';
import shared from '../PublicRoutes/PublicRoutes.module.css';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedFrom = (location.state as { from?: string } | null)?.from;
  const from = typeof requestedFrom === 'string' && requestedFrom.startsWith('/admin/')
    ? requestedFrom
    : '/admin/productos';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const { token } = await loginAdmin({ email: email.trim(), password });
      setAdminToken(token);
      // Clear inputs only on success
      setEmail('');
      setPassword('');
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof AdminAuthError) {
        setError(err.message);
      } else if (err instanceof AdminApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error inesperado al iniciar sesión');
      }
      setStatus('error');
      // Preserve input on error — do NOT clear email/password
    }
  };

  return (
    <section className={shared.state}>
      <h1 className={shared.stateTitle}>Panel de administración</h1>
      <p className={shared.stateText}>Ingresá tus credenciales para acceder al panel.</p>
      <form className={shared.form} onSubmit={handleSubmit} style={{ margin: '0 auto' }}>
        <div className={shared.field}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            disabled={status === 'loading'}
          />
        </div>
        <div className={shared.field}>
          <label htmlFor="admin-password">Contraseña</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            disabled={status === 'loading'}
          />
        </div>
        {status === 'error' && (
          <p className={`${shared.status} ${shared.statusError}`} role="alert">
            {error}
          </p>
        )}
        {status === 'loading' && (
          <p className={`${shared.status} ${shared.statusLoading}`} aria-live="polite">
            Iniciando sesión…
          </p>
        )}
        <button
          type="submit"
          className={shared.submitBtn}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </section>
  );
};

export default AdminLogin;
