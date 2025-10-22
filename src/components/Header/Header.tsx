import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Header.module.css";

const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.navbar}>
      <img src="/src/assets/img/logo.png" alt="Candy Land" className={styles.logoNav} />

      <button className={styles.hamburger} onClick={() => setOpen(!open)}>
        ☰
      </button>

      <ul className={`${styles.navLinks} ${open ? styles.active : ""}`}>
     <li><Link to="/">NUESTROS DULCES</Link></li>
          <li><Link to="/catalogo">TIENDA</Link></li>
          <li><Link to="/carrito">CARRITO DE COMPRAS</Link></li>
          <li><Link to="/contacto">CONTACTO</Link></li>
      </ul>
    </header>
  );
};

export default Header;
