import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAdminToken, clearAdminToken, AdminAuthError, ADMIN_AUTH_EXPIRED_EVENT } from '../../lib/adminAuth.js';
import { getAdminMe } from '../../lib/adminApi.js';
import shared from '../../pages/PublicRoutes/PublicRoutes.module.css';

type AuthState = 'loading' | 'authorized' | 'unauthorized' | 'network-error';

interface RequireAdminAuthProps {
  children: React.ReactNode;
}

const RequireAdminAuth: React.FC<RequireAdminAuthProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>('loading');
  const [attempt, setAttempt] = useState(0);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    const expire = () => { if (active) setState('unauthorized'); };
    globalThis.addEventListener(ADMIN_AUTH_EXPIRED_EVENT, expire);
    const token = getAdminToken();
    if (!token) {
      setState('unauthorized');
      return () => {
        active = false;
        globalThis.removeEventListener(ADMIN_AUTH_EXPIRED_EVENT, expire);
      };
    }
    (async () => {
      try {
        await getAdminMe(token);
        if (active) setState('authorized');
      } catch (err) {
        if (!active) return;
        if (err instanceof AdminAuthError) {
          clearAdminToken();
          setState('unauthorized');
        } else {
          setState('network-error');
        }
      }
    })();
    return () => {
      active = false;
      globalThis.removeEventListener(ADMIN_AUTH_EXPIRED_EVENT, expire);
    };
  }, [attempt]);

  if (state === 'unauthorized') {
    const from = location.pathname.startsWith('/admin/') ? location.pathname : '/admin/productos';
    return <Navigate to="/admin/login" replace state={{ from }} />;
  }

  if (state === 'loading') {
    return (
      <section className={shared.state} aria-busy="true">
        <h1 className={shared.stateTitle}>Verificando sesión…</h1>
        <p className={shared.stateText}>Estamos validando tu acceso al panel.</p>
      </section>
    );
  }

  if (state === 'network-error') {
    return (
      <section className={shared.state} role="alert">
        <h1 className={shared.stateTitle}>No se pudo conectar al backend</h1>
        <p className={shared.stateText}>Verificá que el servidor esté corriendo e intentá nuevamente.</p>
        <button
          type="button"
          className={shared.retryBtn}
          onClick={() => {
            setState('loading');
            setAttempt((value) => value + 1);
          }}
        >
          Reintentar
        </button>
      </section>
    );
  }

  return <>{children}</>;
};

export default RequireAdminAuth;
