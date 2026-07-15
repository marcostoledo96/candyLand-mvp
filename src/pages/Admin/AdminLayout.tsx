import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
          <NavLink to="/admin/productos" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>
            Productos
          </NavLink>
          <NavLink to="/admin/categorias" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>
            Categorías
          </NavLink>
          <NavLink to="/admin/pedidos" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>
            Pedidos
          </NavLink>
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
