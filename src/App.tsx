// App raíz: define el layout y las rutas principales
import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";

// Code splitting de páginas pesadas
const Home = React.lazy(() => import("./pages/Home/Home"));
const CatalogPage = React.lazy(() => import("./pages/Catalog/CatalogPage"));
const Contacto = React.lazy(() => import("./components/Contact/Contacto"));
const CartPage = React.lazy(() => import("./pages/CartPage"));
const PaymentMethod = React.lazy(() => import("./pages/Checkout/PaymentMethod"));
const Confirmation = React.lazy(() => import("./pages/Checkout/Confirmation"));
const AddressForm = React.lazy(() => import("./pages/Checkout/AddressForm"));
// Public routes (branch frontend/nuevas-rutas-macarena)
const MenuPage = React.lazy(() => import("./pages/Menu/MenuPage"));
const TutorialesPage = React.lazy(() => import("./pages/Tutoriales/TutorialesPage"));
const FranquiciasPage = React.lazy(() => import("./pages/Franquicias/FranquiciasPage"));
const TrabajaPage = React.lazy(() => import("./pages/Trabaja/TrabajaPage"));


const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<div style={{ padding: 24 }}>Cargando…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalogo" element={<CatalogPage />} />
            {/* Aliases to CatalogPage per src/AGENTS.md */}
            <Route path="/tienda" element={<CatalogPage />} />
            <Route path="/nuestros-dulces" element={<CatalogPage />} />
            {/* Public pages */}
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/tutoriales" element={<TutorialesPage />} />
            <Route path="/franquicias" element={<FranquiciasPage />} />
            <Route path="/trabaja-con-nosotros" element={<TrabajaPage />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/carrito" element={<CartPage />} />
            {/* /checkout alias to AddressForm; keep explicit checkout steps */}
            <Route path="/checkout" element={<AddressForm />} />
            <Route path="/checkout/direccion" element={<AddressForm />} />
            <Route path="/checkout/pago" element={<PaymentMethod />} />
            <Route path="/checkout/confirmacion" element={<Confirmation />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
};

export default App;
