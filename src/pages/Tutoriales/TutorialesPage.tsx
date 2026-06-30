// TutorialesPage: static visual cards using existing tutorial assets.
// No backend, no CMS, no auth, no network requests.
import React from 'react';
import shared from '../PublicRoutes/PublicRoutes.module.css';
import tutorial1 from '../../assets/img/tutorial1.jpg';
import tutorial2 from '../../assets/img/tutorial2.jpg';
import tutorial3 from '../../assets/img/tutorial3.jpg';
import tutorial4 from '../../assets/img/tutorial4.jpg';
import tutorial5 from '../../assets/img/tutorial5.jpg';
import tutorial6 from '../../assets/img/tutorial6.jpg';

interface TutorialCard {
  id: number;
  title: string;
  alt: string;
  image: string;
  blurb: string;
}

const TUTORIALS: TutorialCard[] = [
  {
    id: 1,
    title: 'Combo regalos dulces',
    alt: 'Combo de golosinas para regalos, presentado en mesa con colores pastel.',
    image: tutorial1,
    blurb: 'Ideas para armar combos de regalos con nuestras golosinas.',
  },
  {
    id: 2,
    title: 'Mesa dulce infantil',
    alt: 'Mesa dulce para cumpleaños infantil con frascos de caramelos de colores.',
    image: tutorial2,
    blurb: 'Cómo combinar frascos y colores para una mesa dulce.',
  },
  {
    id: 3,
    title: 'Caja sorpresa',
    alt: 'Caja sorpresa con chocolates y gomitas, lista para regalar.',
    image: tutorial3,
    blurb: 'Armado de cajas sorpresa paso a paso.',
  },
  {
    id: 4,
    title: 'Decoración con chupetines',
    alt: 'Decoración de fiesta usando chupetines de colores formando un centro de mesa.',
    image: tutorial4,
    blurb: 'Centros de mesa y detalles usando chupetines.',
  },
  {
    id: 5,
    title: 'Bolsitas para eventos',
    alt: 'Bolsitas translúcidas con surtido de golosinas para eventos.',
    image: tutorial5,
    blurb: 'Bolsitas listas para eventos y souvenirs.',
  },
  {
    id: 6,
    title: 'Topper personalizado',
    alt: 'Toppers personalizados con nombres sobre torta decorada con grageas.',
    image: tutorial6,
    blurb: 'Toppers y etiquetas para personalizar tu pedido.',
  },
];

const TutorialesPage: React.FC = () => {
  return (
    <section className={shared.page}>
      <h1 className={shared.pageTitle}>Tutoriales</h1>
      <p className={shared.pageLead}>
        Inspiración visual para tus regalos, mesas dulces y eventos. Todas las
        imágenes son referenciales de nuestro portfolio.
      </p>
      <ul className={shared.grid} aria-label="Galería de tutoriales">
        {TUTORIALS.map((t) => (
          <li key={t.id} className={shared.card}>
            <img
              src={t.image}
              alt={t.alt}
              className={shared.cardImage}
              loading="lazy"
            />
            <h2 className={shared.cardTitle}>{t.title}</h2>
            <p className={shared.cardMeta}>{t.blurb}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default TutorialesPage;