import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import CatalogPage from "./pages/Catalog/CatalogPage";
import Layout from "./layout/Layout";
import Contacto from "./components/Contact/Contacto";
import CartPage from "./pages/CartPage";
import PaymentMethod from "./pages/Checkout/PaymentMethod";
import Confirmation from "./pages/Checkout/Confirmation";
import AddressForm from "./pages/Checkout/AddressForm";


const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/checkout/direccion" element={<AddressForm />} />
          <Route path="/checkout/pago" element={<PaymentMethod />} />
          <Route path="/checkout/confirmacion" element={<Confirmation />} />
 
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
