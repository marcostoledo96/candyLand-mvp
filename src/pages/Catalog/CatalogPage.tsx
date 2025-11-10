import React, { useState, useEffect } from "react";
import { Product } from "../../components/Catalog/CatalogCard/CatalogCard";
import CatalogCard from "../../components/Catalog/CatalogCard/CatalogCard";
import styles from "./CatalogPage.module.css";
import { useCart } from "../../context/CartContext";
import { fetchProducts, ApiProduct } from "../../lib/api";

const CatalogPage = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [visibleProducts, setVisibleProducts] = useState(20); // mostrar más inicialmente
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // loader scroll

  const loadMore = () => {
    if (loadingMore || visibleProducts >= filteredProducts.length) return;
    setLoadingMore(true);
    // Incremento inmediato sin delay artificial
    setVisibleProducts((prev) => prev + 20);
    setLoadingMore(false);
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

  // Removido mock local con delay artificial: se usa solo backend real

  // Cargar productos desde backend con caché en sessionStorage para respuesta instantánea
  useEffect(() => {
    let mounted = true;
    const CACHE_KEY = 'catalogProductsV1';
    async function load() {
      try {
        setLoading(true);
        const data: ApiProduct[] = await fetchProducts();
        if (!mounted) return;
        const normalizeImageUrl = (u?: string | null) => {
          const s = String(u || '').trim();
          if (!s) return '/img/dulce1.jpg';
          if (s.startsWith('/img/')) return s; // mantener ruta pública correcta
          if (/^https?:/i.test(s)) return s; // URLs externas
          return `/img/${s.replace(/^\/+/, '')}`; // nombre simple -> carpeta img
        };
        const mapped: Product[] = data.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description || "",
          price: Math.round((p.priceCents || 0) / 100),
          image: normalizeImageUrl(p.image),
          category: p.category || "Otros",
        }));
        setProducts(mapped);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    // Intentar responder desde caché primero
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached: ApiProduct[] = JSON.parse(raw);
        const normalizeImageUrl = (u?: string | null) => {
          const s = String(u || '').trim();
          if (!s) return '/img/dulce1.jpg';
          if (s.startsWith('/img/')) return s;
          if (/^https?:/i.test(s)) return s;
          return `/img/${s.replace(/^\/+/, '')}`;
        };
        const mapped: Product[] = cached.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description || "",
          price: Math.round((p.priceCents || 0) / 100),
          image: normalizeImageUrl(p.image),
          category: p.category || "Otros",
        }));
        setProducts(mapped);
        setLoading(false);
      }
    } catch {}
    load();
    return () => { mounted = false; };
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
            <CatalogCard key={product.id} product={product} />
          ))
        )}

        {/* Loader al cargar más en scroll */}
        {loadingMore && !loading && (
          <p className={styles.loadingMore}>Cargando más productos...</p>
        )}

        {/* Mensaje si ya no hay más */}
        {!loadingMore && visibleProducts >= filteredProducts.length && (
          <p className={styles.endMessage}>Cargando productos... 😊</p>
        )}
      </section>

    </div>
  );
};

export default CatalogPage;
