// Contexto global del carrito: maneja items, totales y persistencia por cartId en localStorage
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Product } from "../components/Catalog/CatalogCard/CatalogCard";
import { addItemToCart, getCart, ApiCart, updateCartItem, deleteCartItem } from "../lib/api";

export interface CartItem extends Product {
  quantity: number;
  cartItemId?: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (id: number) => Promise<void>;
  clearCart: () => void;
  increaseQuantity: (id: number) => Promise<void>;
  decreaseQuantity: (id: number) => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("cartId") : null
  );

  const normalizeImageUrl = (url?: string | null) => {
    const u = String(url || '').trim();
    if (!u) return '/src/assets/img/dulce1.jpg';
    // Si viene como /img/xxx.jpg (semántica de público), mapeamos a assets de desarrollo
    if (u.startsWith('/img/')) return `/src/assets${u}`; // => /src/assets/img/xxx.jpg
    return u;
  };

  const applyApiCart = (data: ApiCart) => {
    setCartId(data.cartId);
    try { localStorage.setItem("cartId", data.cartId); } catch {}
    const mapped: CartItem[] = data.items.map((i) => ({
      id: i.productId,
      cartItemId: i.id,
      title: i.title,
      description: i.description || "",
      price: Math.round(i.priceCents / 100),
      image: normalizeImageUrl(i.image),
      category: "",
      quantity: i.quantity,
    }));
    setCart(mapped);
  };

  const addToCart = async (product: Product) => {
    try {
      const data = await addItemToCart(product.id, 1, cartId || undefined);
      applyApiCart(data);
    } catch (e) {
      console.error(e);
      // fallback local si falla backend
      setCart((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...prev, { ...product, quantity: 1 }];
      });
    }
  };

  const removeFromCart = async (id: number) => {
    const item = cart.find((i) => i.id === id);
    if (!item || !item.cartItemId) {
      setCart((prev) => prev.filter((it) => it.id !== id));
      return;
    }
    try {
      const data = await deleteCartItem(item.cartItemId, cartId || undefined);
      applyApiCart(data);
    } catch (e) {
      console.error(e);
      setCart((prev) => prev.filter((it) => it.id !== id));
    }
  };

  const clearCart = () => setCart([]);

  const increaseQuantity = async (id: number) => {
    const item = cart.find((i) => i.id === id);
    if (!item || !item.cartItemId) {
      setCart((prev) =>
        prev.map((it) => (it.id === id ? { ...it, quantity: it.quantity + 1 } : it))
      );
      return;
    }
    try {
      const data = await updateCartItem(item.cartItemId, item.quantity + 1, cartId || undefined);
      applyApiCart(data);
    } catch (e) {
      console.error(e);
      setCart((prev) =>
        prev.map((it) => (it.id === id ? { ...it, quantity: it.quantity + 1 } : it))
      );
    }
  };

  const decreaseQuantity = async (id: number) => {
    const item = cart.find((i) => i.id === id);
    if (!item || !item.cartItemId) {
      setCart((prev) =>
        prev
          .map((it) => (it.id === id ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it))
          .filter((it) => it.quantity > 0)
      );
      return;
    }
    try {
      const nextQty = item.quantity - 1;
      const data =
        nextQty <= 0
          ? await deleteCartItem(item.cartItemId, cartId || undefined)
          : await updateCartItem(item.cartItemId, nextQty, cartId || undefined);
      applyApiCart(data);
    } catch (e) {
      console.error(e);
      setCart((prev) =>
        prev
          .map((it) => (it.id === id ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it))
          .filter((it) => it.quantity > 0)
      );
    }
  };

  const totalItems = cart.reduce((acc, p) => acc + p.quantity, 0);
  const totalPrice = cart.reduce((acc, p) => acc + p.price * p.quantity, 0);

  // Cargar carrito al montar para persistencia
  useEffect(() => {
    (async () => {
      try {
        const data = await getCart(cartId || undefined);
        applyApiCart(data);
      } catch (e) {
        console.warn("No se pudo cargar el carrito desde backend", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        increaseQuantity,
        decreaseQuantity,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider");
  return context;
};
