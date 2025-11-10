import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
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
}

const CatalogCard: React.FC<Props> = ({ product }) => {
  const { addToCart, cart } = useCart();
  const navigate = useNavigate();

  const isInCart = cart.some((item) => item.id === product.id);

  const handleClick = () => {
    if (isInCart) {
      navigate("/carrito");
    } else {
      addToCart(product);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {(() => {
          const toWebp = (p: string) => p.replace(/\.(jpg|jpeg|png)$/i, ".webp");
          const isConvertible = /\.(jpg|jpeg|png)$/i.test(product.image);
          return (
            <picture>
              {isConvertible && (
                <source srcSet={toWebp(product.image)} type="image/webp" />
              )}
              <img
                src={product.image}
                alt={product.title}
                className={styles.image}
                loading="lazy"
                decoding="async"
              />
            </picture>
          );
        })()}
      </div>
      <h3>{product.title}</h3>
      <p className={styles.description}>{product.description}</p>
      <p className={styles.price}>${product.price}</p>
      <button
        className={`${styles.addButton} ${isInCart ? styles.inCart : ""}`}
        onClick={handleClick}
      >
        {isInCart ? "Ir al carrito" : "Agregar al carrito"}
      </button>
    </div>
  );
};

export default CatalogCard;
