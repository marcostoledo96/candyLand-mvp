import React from "react";
import styles from "./Catalog.module.css";

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

interface Props {
  product: Product;
  onAddToCart?: (id: number) => void;
}

const CatalogCard: React.FC<Props> = ({ product, onAddToCart }) => {
  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={product.image} alt={product.title} className={styles.image} />
      </div>
      <h3>{product.title}</h3>
      <p className={styles.description}>{product.description}</p>
      <p className={styles.price}>${product.price}</p>
      <button
        className={styles.addButton}
        onClick={() => onAddToCart && onAddToCart(product.id)}
      >
        Agregar al carrito
      </button>
    </div>
  );
};

export default CatalogCard;
