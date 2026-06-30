// MenuPage: category-led menu from GET /api/categories.
// Renders loading, error (with retry), empty, and success states.
// Filters categories to activeProductCount > 0. No /producto/:id links.
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCategories, ApiCategory, PublicApiError } from '../../lib/api';
import shared from '../PublicRoutes/PublicRoutes.module.css';

type Status = 'loading' | 'error' | 'empty' | 'success';

const MenuPage: React.FC = () => {
  const [status, setStatus] = useState<Status>('loading');
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [error, setError] = useState<string>('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const all = await fetchCategories();
      const active = all.filter((c) => c.activeProductCount > 0);
      setCategories(active);
      setStatus(active.length === 0 ? 'empty' : 'success');
    } catch (err) {
      const e = err as PublicApiError;
      setError(e?.error || 'No se pudo cargar el menú.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'loading') {
    return (
      <section className={shared.state} aria-busy="true">
        <h1 className={shared.stateTitle}>Cargando menú…</h1>
        <p className={shared.stateText}>Estamos trayendo las categorías disponibles.</p>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className={shared.state} role="alert">
        <h1 className={shared.stateTitle}>No se pudo cargar el menú</h1>
        <p className={shared.stateText}>{error}</p>
        <button type="button" className={shared.retryBtn} onClick={() => void load()}>
          Reintentar
        </button>
      </section>
    );
  }

  if (status === 'empty') {
    return (
      <section className={shared.state}>
        <h1 className={shared.stateTitle}>Menú</h1>
        <p className={shared.stateText}>
          Por ahora no hay categorías con productos disponibles. Volvé en breve.
        </p>
        <Link to="/catalogo" className={shared.retryBtn}>
          Ver tienda
        </Link>
      </section>
    );
  }

  return (
    <section className={shared.page}>
      <h1 className={shared.pageTitle}>Menú</h1>
      <p className={shared.pageLead}>
        Explorá nuestras categorías de golosinas. Cada una agrupa los productos
        disponibles en la tienda.
      </p>
      <ul className={shared.grid} aria-label="Categorías del menú">
        {categories.map((c) => (
          <li key={c.id} className={shared.card}>
            <h2 className={shared.cardTitle}>{c.name}</h2>
            <p className={shared.cardMeta}>
              {c.activeProductCount}{' '}
              {c.activeProductCount === 1 ? 'producto disponible' : 'productos disponibles'}
            </p>
            <Link to={`/catalogo?categoria=${encodeURIComponent(c.name)}`} className={shared.retryBtn}>
              Ver productos
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default MenuPage;