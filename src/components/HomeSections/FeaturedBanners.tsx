// FeaturedBanners: two highlight banners linking to /catalogo and /menu.
// Light-mode only, mobile-first. Real alt per image.
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './FeaturedBanners.module.css';

const FeaturedBanners: React.FC = () => {
  return (
    <div className={styles.banners}>
      <Link to="/catalogo" className={styles.banner}>
        <img
          src="/img/destacado-golosina1.webp"
          alt="Golosinas destacadas en CandyLand"
          className={styles.bannerImg}
          loading="lazy"
          decoding="async"
        />
        <span className={styles.bannerLabel}>Ver tienda</span>
      </Link>
      <Link to="/menu" className={styles.banner}>
        <img
          src="/img/destacado-golosina2.webp"
          alt="Categorías de golosinas en el menú de CandyLand"
          className={styles.bannerImg}
          loading="lazy"
          decoding="async"
        />
        <span className={styles.bannerLabel}>Ver menú</span>
      </Link>
    </div>
  );
};

export default FeaturedBanners;