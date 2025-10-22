import React from "react";
import styles from "./HomeProductCard.module.css";

interface HomeProductCardProps {
  img: string;
  hoverImg: string;
  title: string;
}

const HomeProductCard: React.FC<HomeProductCardProps> = ({ img, hoverImg, title }) => {
  return (
    <div className={styles.producto}>
      <div className={styles.imagenHover}>
        <img src={img} alt={title} />
        <img src={hoverImg} alt={`${title} Hover`} className={styles.hoverImg} />
      </div>
      <p>{title}</p>
    </div>
  );
};

export default HomeProductCard;
