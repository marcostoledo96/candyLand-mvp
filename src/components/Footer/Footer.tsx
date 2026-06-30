// Footer del sitio: links utiles y redes sociales.
// Fake newsletter submit removed per design; social rendered as inert labeled
// spans (no real external URLs known in this slice).
import React from "react";
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import logo from "../../assets/img/logo.png";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerColumn}>
          <img src={logo} alt="Candy Land" className={styles.logo} />
          <p className={styles.tagline}>
            Golosinas elegidas con amor para cada momento dulce.
          </p>
        </div>

        <div className={styles.footerColumn}>
          <h4>Contenidos</h4>
          <ul>
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/catalogo">Tienda</Link></li>
            <li><Link to="/menu">Menú</Link></li>
          </ul>
        </div>

        <div className={styles.footerColumn}>
          <h4>Ayuda</h4>
          <ul>
            <li><Link to="/tutoriales">Tutoriales</Link></li>
            <li><Link to="/trabaja-con-nosotros">Trabajá con nosotros</Link></li>
            <li><Link to="/franquicias">Franquicias</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
          </ul>
        </div>

        <div className={`${styles.footerColumn} ${styles.newsletter}`}>
          <h4>Conectate con nosotros</h4>
          <p className={styles.tagline}>
            Pronto vas a poder suscribirte a nuestro newsletter. Mientras tanto,
            encontranos en nuestras redes.
          </p>

          <div className={styles.socials}>
            <div className={styles.socialIcons}>
              {/* Social links are inert labeled spans until real profile URLs are provided. */}
              <span aria-disabled="true" className={styles.socialIconInert} title="Próximamente Facebook">
                <FaFacebookF /> <span className={styles.socialLabel}>Facebook</span>
              </span>
              <span aria-disabled="true" className={styles.socialIconInert} title="Próximamente Instagram">
                <FaInstagram /> <span className={styles.socialLabel}>Instagram</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.copy}>
        (c) {year} Tienda Candyland - Todos los derechos reservados.
      </div>
    </footer>
  );
};

export default Footer;