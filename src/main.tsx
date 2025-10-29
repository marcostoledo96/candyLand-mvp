import React,{ StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { CartProvider } from './context/CartContext';

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <CartProvider>
    <App />
    </CartProvider>
  </StrictMode>
);

