// Header del sitio: navegacion principal y logo
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Header.module.css";
import { useCart } from "../../context/CartContext";
import logo from "../../assets/img/logo.png";

const Header = () => {
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setOpen((prev) => !prev);
  const closeMenu = () => setOpen(false);

  return (
    <>
      <header className={styles.navbar}>
        <Link to="/" className={styles.logoLink} onClick={closeMenu}>
          <img src={logo} alt="Candy Land" className={styles.logoNav} />
        </Link>

        <button
          type="button"
          className={`${styles.hamburger} ${open ? styles.hamburgerOpen : ""}`}
          aria-label="Abrir menu principal"
          aria-expanded={open}
          onClick={toggleMenu}
        >
          <span />
          <span />
          <span />
        </button>

        <ul className={`${styles.navLinks} ${open ? styles.active : ""}`}>
          <li>
            <Link to="/" onClick={closeMenu}>
              Nuestros dulces
            </Link>
          </li>
          <li>
            <Link to="/catalogo" onClick={closeMenu}>
              Tienda
            </Link>
          </li>
          <li>
            <Link to="/carrito" onClick={closeMenu}>
              Carrito
              {totalItems > 0 && (
                <span className={styles.cartBadge}>{totalItems}</span>
              )}
            </Link>
          </li>
          <li>
            <Link to="/contacto" onClick={closeMenu}>
              Contacto
            </Link>
          </li>
        </ul>
      </header>

      {open && (
        <div className={styles.overlay} onClick={closeMenu} aria-hidden="true" />
      )}
    </>
  );
};

export default Header;
