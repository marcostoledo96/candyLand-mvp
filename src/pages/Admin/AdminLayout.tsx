import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { getAdminToken, clearAdminToken, decodeAdminTokenPayload } from '../../lib/adminAuth.js';
import styles from './AdminLayout.module.css';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAdminToken();
    navigate('/admin/login', { replace: true });
  };

  const token = getAdminToken();
  const payload = token ? decodeAdminTokenPayload(token) : null;
  const email = payload?.email || 'admin';

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>CandyLand Admin</div>
        <nav className={styles.nav} aria-label="Navegación del panel">
          <a href="/admin/productos" className={`${styles.navLink} ${styles.navLinkActive}`}>
            Productos
          </a>
          <span className={styles.navLinkDisabled} aria-disabled="true" title="Próximamente">
            Categorías <span className={styles.soon}>Próximamente</span>
          </span>
          <span className={styles.navLinkDisabled} aria-disabled="true" title="Próximamente">
            Pedidos <span className={styles.soon}>Próximamente</span>
          </span>
        </nav>
      </aside>
      <div className={styles.main}>
        <header className={styles.topbar}>
          <span className={styles.adminEmail}>{email}</span>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </header>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;