// Home: redesigned landing page. Order per tasks 7e.4.1:
// HeroCarousel -> FeaturedBanners -> NuestrosProductos -> NuestroMundoDulce -> Locations.
// Nuestros Productos is API-driven (fetchProducts) with loading/error/empty/success states.
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel, { HeroSlide } from '../../components/HeroCarousel/HeroCarousel';
import { SLIDES, MAX_SHOWN, decideProductStatus } from '../../lib/productStatus.js';
import FeaturedBanners from '../../components/HomeSections/FeaturedBanners';
import NuestroMundoDulce from '../../components/HomeSections/NuestroMundoDulce';
import Locations from '../../components/HomeSections/Locations';
import HomeProductCard from '../../components/HomeProductCard/HomeProductCard';
import { fetchProducts, ApiProduct, PublicApiError } from '../../lib/api';
import shared from '../PublicRoutes/PublicRoutes.module.css';
import styles from './Home.module.css';

const slides: HeroSlide[] = SLIDES;

type Status = 'loading' | 'error' | 'empty' | 'success';

const NuestrosProductos: React.FC = () => {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [error, setError] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const all = await fetchProducts();
      setProducts(all);
      setLoaded(true);
    } catch (err) {
      const e = err as PublicApiError;
      setError(e?.error || 'No se pudieron cargar los productos.');
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const status: Status = decideProductStatus({ products, error, loaded });

  if (status === 'loading') {
    return (
      <section className={shared.state} aria-busy="true">
        <h2 className={shared.stateTitle}>Cargando productos…</h2>
        <p className={shared.stateText}>Estamos trayendo las novedades de CandyLand.</p>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className={shared.state} role="alert">
        <h2 className={shared.stateTitle}>No se pudieron cargar los productos</h2>
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
        <h2 className={shared.stateTitle}>Nuestros dulces</h2>
        <p className={shared.stateText}>
          Por ahora no hay productos disponibles. Volvé en breve o explorá la tienda.
        </p>
        <Link to="/catalogo" className={shared.retryBtn}>
          Ver tienda
        </Link>
      </section>
    );
  }

  const shown = products.slice(0, MAX_SHOWN);

  return (
    <section className={styles.productosCandy}>
      <h2 className={styles.tituloProductos}>NUESTROS DULCES</h2>
      <div className={styles.productosFlex}>
        {shown.map((p) => (
          <HomeProductCard
            key={p.id}
            img={p.image || '/img/golosina1.jpg'}
            hoverImg={p.image || '/img/golosina1-hover.png'}
            title={p.title}
          />
        ))}
      </div>
    </section>
  );
};

const Home: React.FC = () => {
  return (
    <>
      <HeroCarousel slides={slides} />
      <FeaturedBanners />
      <NuestrosProductos />
      <NuestroMundoDulce />
      <Locations />
    </>
  );
};

export default Home;