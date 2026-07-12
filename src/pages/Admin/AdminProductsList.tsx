import React, { useCallback, useEffect, useState } from 'react';
import { getAdminToken, AdminAuthError } from '../../lib/adminAuth.js';
import {
  listAdminProducts,
  deactivateAdminProduct,
  reactivateAdminProduct,
  AdminApiError,
} from '../../lib/adminApi.js';
import type { AdminProduct } from '../../lib/adminApi.js';
import shared from '../PublicRoutes/PublicRoutes.module.css';
import styles from './AdminProductsList.module.css';

type ListState = 'loading' | 'error' | 'empty' | 'success';

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(cents / 100);
}

const AdminProductsList: React.FC = () => {
  const [state, setState] = useState<ListState>('loading');
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [error, setError] = useState('');
  const [mutationStatus, setMutationStatus] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    setError('');
    try {
      const token = getAdminToken();
      if (!token) {
        setState('error');
        setError('No hay sesión activa.');
        return;
      }
      const list = await listAdminProducts(token);
      setProducts(list);
      setState(list.length === 0 ? 'empty' : 'success');
    } catch (err) {
      if (err instanceof AdminAuthError) {
        setError('Sesión expirada. Volvé a iniciar sesión.');
      } else if (err instanceof AdminApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al cargar productos.');
      }
      setState('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDeactivate = async (id: number) => {
    setMutationStatus('Desactivando…');
    try {
      const token = getAdminToken();
      if (!token) return;
      await deactivateAdminProduct(token, id);
      await load();
      setMutationStatus('');
    } catch (err) {
      setMutationStatus(err instanceof Error ? err.message : 'Error al desactivar');
    }
  };

  const handleReactivate = async (id: number) => {
    setMutationStatus('Reactivando…');
    try {
      const token = getAdminToken();
      if (!token) return;
      await reactivateAdminProduct(token, id);
      await load();
      setMutationStatus('');
    } catch (err) {
      setMutationStatus(err instanceof Error ? err.message : 'Error al reactivar');
    }
  };

  if (state === 'loading') {
    return (
      <section className={shared.state} aria-busy="true">
        <h1 className={shared.stateTitle}>Cargando productos…</h1>
        <p className={shared.stateText}>Estamos trayendo el catálogo.</p>
      </section>
    );
  }

  if (state === 'error') {
    return (
      <section className={shared.state} role="alert">
        <h1 className={shared.stateTitle}>No se pudieron cargar los productos</h1>
        <p className={shared.stateText}>{error}</p>
        <button type="button" className={shared.retryBtn} onClick={() => void load()}>
          Reintentar
        </button>
      </section>
    );
  }

  if (state === 'empty') {
    return (
      <section className={shared.state}>
        <h1 className={shared.stateTitle}>No hay productos</h1>
        <p className={shared.stateText}>Todavía no se creó ningún producto en el catálogo.</p>
        <span className={styles.soonNote} aria-disabled="true">
          La creación de productos estará disponible próximamente.
        </span>
      </section>
    );
  }

  return (
    <section className={shared.page}>
      <div className={styles.header}>
        <h1 className={shared.pageTitle}>Productos</h1>
        <span className={styles.soonNote} aria-disabled="true" title="Próximamente">
          Crear producto — Próximamente
        </span>
      </div>
      {mutationStatus && (
        <p className={`${shared.status} ${shared.statusLoading}`} aria-live="polite">
          {mutationStatus}
        </p>
      )}
      <div className={styles.tableWrap} role="table" aria-label="Lista de productos">
        <div className={styles.row + ' ' + styles.rowHeader} role="row">
          <span role="columnheader">ID</span>
          <span role="columnheader">Título</span>
          <span role="columnheader">Categoría</span>
          <span role="columnheader">Precio</span>
          <span role="columnheader">Stock</span>
          <span role="columnheader">Estado</span>
          <span role="columnheader">Acciones</span>
        </div>
        {products.map((p) => (
          <div key={p.id} className={styles.row} role="row">
            <span role="cell" className={styles.cellId}>{p.id}</span>
            <span role="cell">{p.title}</span>
            <span role="cell">{p.category || '—'}</span>
            <span role="cell">{formatPrice(p.priceCents)}</span>
            <span role="cell">{p.stock}</span>
            <span role="cell">
              {p.active ? (
                <span className={`${styles.badge} ${styles.badgeActive}`}>Activo</span>
              ) : (
                <span className={`${styles.badge} ${styles.badgeInactive}`}>Inactivo</span>
              )}
            </span>
            <span role="cell" className={styles.actions}>
              <span className={styles.editDisabled} aria-disabled="true" title="Próximamente">
                Editar
              </span>
              {p.active ? (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionDanger}`}
                  onClick={() => void handleDeactivate(p.id)}
                >
                  Desactivar
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => void handleReactivate(p.id)}
                >
                  Reactivar
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AdminProductsList;