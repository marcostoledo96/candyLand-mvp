// NuestroMundoDulce: decorative copy block over dulzura-central image.
// Light-mode only, mobile-first. Pure presentational section.
import React from 'react';
import styles from './NuestroMundoDulce.module.css';

const NuestroMundoDulce: React.FC = () => {
  return (
    <section
      className={styles.section}
      style={{ backgroundImage: 'url(/img/dulzura-central.webp)' }}
      aria-label="Nuestro Mundo Dulce"
    >
      <div className={styles.content}>
        <h2 className={styles.title}>Nuestro Mundo Dulce</h2>
        <p className={styles.body}>
          En CandyLand creemos que cada golosina es una excusa para compartir un
          momento. Por eso elegimos los mejores sabores, los llevamos a tu puerta
          en CABA y GBA, y los acompañamos con la atención que te merecés.
        </p>
      </div>
    </section>
  );
};

export default NuestroMundoDulce;