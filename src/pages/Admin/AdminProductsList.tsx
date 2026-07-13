import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import AdminProductForm from './AdminProductForm';

type ListState = 'loading' | 'error' | 'empty' | 'success';

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(cents / 100);
}

const AdminProductsList: React.FC = () => {
  const [state, setState] = useState<ListState>('loading');
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [error, setError] = useState('');
  const [mutationStatus, setMutationStatus] = useState('');
  const [form, setForm] = useState<{ mode: 'create' | 'edit'; product?: AdminProduct } | null>(null);
  const invoker = useRef<HTMLElement | null>(null);

  const load = useCallback(async (keepVisible = false) => {
    if (!keepVisible) setState('loading');
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
        <button type="button" data-product-form-invoker="create" className={styles.actionBtn} onClick={(event) => { invoker.current = event.currentTarget; setForm({ mode: 'create' }); }}>Crear producto</button>
        {form && <AdminProductForm {...form} invoker={invoker.current} invokerSelector={'[data-product-form-invoker="create"]'} onClose={() => setForm(null)} onSaved={() => load(true)} />}
      </section>
    );
  }

  return (
    <section className={shared.page}>
      <div className={styles.header}>
        <h1 className={shared.pageTitle}>Productos</h1>
        <button type="button" data-product-form-invoker="create" className={styles.actionBtn} onClick={(event) => { invoker.current = event.currentTarget; setForm({ mode: 'create' }); }}>Crear producto</button>
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
              <button type="button" data-product-form-invoker={`edit-${p.id}`} className={styles.actionBtn} onClick={(event) => { invoker.current = event.currentTarget; setForm({ mode: 'edit', product: p }); }}>Editar</button>
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
      {form && <AdminProductForm {...form} invoker={invoker.current} invokerSelector={form.mode === 'edit' ? `[data-product-form-invoker="edit-${form.product?.id}"]` : '[data-product-form-invoker="create"]'} onClose={() => setForm(null)} onSaved={() => load(true)} />}
    </section>
  );
};

export default AdminProductsList;
