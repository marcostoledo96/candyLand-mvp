import React from "react";
import styles from "./HomeProductCard.module.css";

interface HomeProductCardProps {
  img: string;
  hoverImg: string;
  title: string;
}

const HomeProductCard: React.FC<HomeProductCardProps> = ({ img, hoverImg, title }) => {
  const toWebp = (p: string) => p.replace(/\.(jpg|jpeg|png)$/i, ".webp");
  const convertible = /\.(jpg|jpeg|png)$/i;
  return (
    <div className={styles.producto}>
      <div className={styles.imagenHover}>
        <picture>
          {convertible.test(img) && <source srcSet={toWebp(img)} type="image/webp" />}
          <img src={img} alt={title} loading="lazy" decoding="async" />
        </picture>
        <picture>
          {convertible.test(hoverImg) && <source srcSet={toWebp(hoverImg)} type="image/webp" />}
          <img src={hoverImg} alt={`${title} Hover`} className={styles.hoverImg} loading="lazy" decoding="async" />
        </picture>
      </div>
      <p>{title}</p>
    </div>
  );
};

export default HomeProductCard;
