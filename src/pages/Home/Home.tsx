import React, { useEffect } from "react";
import HomeProductCard from "../../components/HomeProductCard/HomeProductCard";
import styles from "./Home.module.css";
import { fetchProducts } from "../../lib/api";

// Usar rutas públicas para evitar empaquetar imágenes gigantes en el bundle
const g1 = "/img/golosina1.jpg";
const g1h = "/img/golosina1-hover.png";
const g2 = "/img/golosina2.jpg";
const g3 = "/img/golosina3.jpg";
const g4 = "/img/golosina4.jpg";
const g5 = "/img/golosina5.jpg";
const g6 = "/img/golosina6.jpg";

const HomeProducts = () => {
  // Prefetch liviano de productos para acelerar la primera visita al catálogo
  useEffect(() => {
    const CACHE_KEY = 'catalogProductsV1';
    if (sessionStorage.getItem(CACHE_KEY)) return;
    fetchProducts().then((data) => {
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
    }).catch(() => {});
  }, []);

  const productos = [
    { img: g1, hoverImg: g1h, title: "Caramelos Frutales" },
    { img: g2, hoverImg: g1h, title: "Gomitas Ácidas" },
    { img: g3, hoverImg: g1h, title: "Chocolate Relleno" },
    { img: g4, hoverImg: g1h, title: "Paletas Multisabor" },
    { img: g5, hoverImg: g1h, title: "Bombones" },
    { img: g6, hoverImg: g1h, title: "Galletitas Dulces" },
  ];

  return (
    <section className={styles.productosCandy}>
      <h2 className={styles.tituloProductos}>NUESTROS DULCES</h2>
      <div className={styles.productosFlex}>
        {productos.map((p, i) => (
          <HomeProductCard key={i} {...p} />
        ))}
      </div>
    </section>
  );
};

export default HomeProducts;
