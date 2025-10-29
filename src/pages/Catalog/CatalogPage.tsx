import React, { useState, useEffect } from "react";
import { Product } from "../../components/Catalog/CatalogCard/CatalogCard";
import CatalogCard from "../../components/Catalog/CatalogCard/CatalogCard";
import styles from "./CatalogPage.module.css";
import { useCart } from "../../context/CartContext";

const CatalogPage = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [visibleProducts, setVisibleProducts] = useState(10); // Cantidad inicial
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // loader scroll

  const loadMore = () => {
    if (loadingMore || visibleProducts >= filteredProducts.length) return;
    setLoadingMore(true);

    // Simula un delay como si pidiera más al backend
    setTimeout(() => {
      setVisibleProducts((prev) => prev + 10);
      setLoadingMore(false);
    }, 1500);
  };


  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.offsetHeight
      ) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });

 // ✅ Simular carga inicial de productos
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setProducts([
      { id: 1, title: "Caramelos Frutales", description: "Dulces tropicales suaves.", price: 1200, image: "/src/assets/img/dulce1.jpg", category: "Caramelos" },
      { id: 2, title: "Gomitas Ácidas", description: "Con un toque ácido y suave.", price: 1500, image: "/src/assets/img/dulce2.jpg", category: "Gomitas" },
      { id: 3, title: "Chocolates", description: "Chocolate con leche cremoso.", price: 2000, image: "/src/assets/img/dulce3.jpg", category: "Chocolate" },
      { id: 4, title: "Alfajores", description: "Clásicos con dulce de leche.", price: 1800, image: "/src/assets/img/dulce4.jpg", category: "Alfajores" },
      { id: 5, title: "Bombones", description: "Bombones rellenos variados.", price: 2500, image: "/src/assets/img/dulce5.jpg", category: "Chocolate" },
      { id: 6, title: "Chicles", description: "Sabor a frutas explosivas.", price: 800, image: "/src/assets/img/dulce6.jpg", category: "Chicles" },
      { id: 7, title: "Malvaviscos", description: "Esponjosos y deliciosos.", price: 900, image: "/src/assets/img/chocolate1.jpg", category: "Golosinas" },
      { id: 8, title: "Paletas", description: "Paletas de caramelo clásicas.", price: 700, image: "/src/assets/img/caramelos3.jpg", category: "Caramelos" },
      { id: 9, title: "Turrón de Maní", description: "Turrón suave con maní.", price: 1300, image: "/src/assets/img/golosina1.jpg", category: "Turrón" },
      { id: 10, title: "Dulce de Leche", description: "Dulce tradicional argentino.", price: 1600, image: "/src/assets/img/golosina2.jpg", category: "Postres" },
      { id: 11, title: "Confites", description: "Confites de colores festivos.", price: 1100, image: "/src/assets/img/golosina3.jpg", category: "Caramelos" },
      { id: 12, title: "Galletitas", description: "Galletas dulces crocantes.", price: 1000, image: "/src/assets/img/golosina4.jpg", category: "Galletas" },
      { id: 13, title: "Barritas de Cereal", description: "Con chocolate y avena.", price: 1400, image: "/src/assets/img/golosina5.jpg", category: "Snacks" },
      { id: 14, title: "Praliné de Maní", description: "Maní acaramelado crocante.", price: 900, image: "/src/assets/img/golosina6.jpg", category: "Snacks" },
      { id: 15, title: "Rellenitas", description: "Galletas rellenas de dulce.", price: 1200, image: "/src/assets/img/gomitas2.jpg", category: "Galletas" },
      { id: 16, title: "Ositos de Gomita", description: "Gomitas suaves de colores.", price: 1500, image: "/src/assets/img/destacado-golosina1.jpg", category: "Gomitas" },
      { id: 17, title: "Mentitas", description: "Refrescantes caramelos de menta.", price: 700, image: "/src/assets/img/tutorial2.jpg", category: "Caramelos" },
      { id: 18, title: "Dragees", description: "Chocolate cubierto de colores.", price: 1700, image: "/src/assets/img/destacado-golosina2.jpg", category: "Chocolate" },
      { id: 19, title: "Caramelos Masticables", description: "Suaves y frutales.", price: 900, image: "/src/assets/img/dulzura-central.jpg", category: "Caramelos" },
      { id: 20, title: "Rocklets", description: "Chocolates con grageas.", price: 1800, image: "/src/assets/img/tutorial5.jpg", category: "Chocolate" },
    ]);
      setLoading(false);
    }, 2000);
  }, []);
  
  // Filtrado desde frontend
  const filteredProducts = products.filter((product) => {
    return (
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === "Todos" || product.category === selectedCategory) &&
      product.price >= minPrice &&
      product.price <= maxPrice
    );
  });

  // Obtener categorías únicas
  const categories = ["Todos", ...new Set(products.map((p) => p.category))];

  return (
    <div className={styles.catalogContainer}>
      <aside className={styles.filters}>
        <h3>Filtros</h3>
        
        {/* Buscador */}
        <input
          type="text"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Categorías */}
        <select onChange={(e) => setSelectedCategory(e.target.value)} value={selectedCategory}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Precio mínimo */}
        <label>Precio mínimo: </label>
        <input type="number" value={minPrice} onChange={(e) => setMinPrice(Number(e.target.value))} />

        {/* Precio máximo */}
        <label>Precio máximo: </label>
        <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
      </aside>

      {/* Productos */}
          <section className={styles.catalogGrid}>
        {loading ? (
          <p className={styles.loader}>Cargando productos...</p>
        ) : (
          filteredProducts.slice(0, visibleProducts).map((product) => (
            <CatalogCard key={product.id} product={product}  onAddToCart={() => addToCart(product)}/>
          ))
        )}

        {/* Loader al cargar más en scroll */}
        {loadingMore && !loading && (
          <p className={styles.loadingMore}>Cargando más productos...</p>
        )}

        {/* Mensaje si ya no hay más */}
        {!loadingMore && visibleProducts >= filteredProducts.length && (
          <p className={styles.endMessage}>No hay más productos para mostrar 😊</p>
        )}
      </section>

    </div>
  );
};

export default CatalogPage;
