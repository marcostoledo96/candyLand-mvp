// Locations: decorative fondo-locales background with CABA y GBA caption.
// Purely presentational — aria-hidden="true". Light-mode only, mobile-first.
import React from 'react';
import styles from './Locations.module.css';

const Locations: React.FC = () => {
  return (
    <div
      className={styles.locations}
      style={{ backgroundImage: 'url(/img/fondo-locales.webp)' }}
      aria-hidden="true"
    >
      <p className={styles.caption}>Encontranos en CABA y GBA</p>
    </div>
  );
};

export default Locations;