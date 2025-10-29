import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import styles from "./CartPage.module.css";

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, totalPrice, removeFromCart, increaseQuantity, decreaseQuantity } = useCart();

  if (cart.length === 0) {
    return (
      <div className={styles.container}>
        <h2>Tu carrito está vacío 😢</h2>
        <button onClick={() => navigate("/catalogo")}>Volver a la tienda</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Tu Carrito</h2>

      <div className={styles.items}>
        {cart.map((item) => (
          <div key={item.id} className={styles.item}>
            <div className={styles.left}>
              <img src={item.image} alt={item.title} />
              <div className={styles.details}>
                <h4>{item.title}</h4>
                <p>${item.price}</p>

                <div className={styles.quantityControl}>
                  <button onClick={() => decreaseQuantity(item.id)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => increaseQuantity(item.id)}>+</button>
                </div>
              </div>
            </div>

            <button
              className={styles.removeBtn}
              onClick={() => removeFromCart(item.id)}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <div className={styles.summary}>
        <p>
          <b>Total:</b> ${totalPrice}
        </p>
        <div className={styles.actions}>
          <button
            className={styles.backBtn}
            onClick={() => navigate("/catalogo")}
          >
            Seguir comprando
          </button>

          <button
            className={styles.confirmBtn}
            onClick={() => navigate("/checkout/direccion")}
          >
            Confirmar compra
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
