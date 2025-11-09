// Footer del sitio: links utiles, newsletter y redes sociales
import React from "react";
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
            <li><a href="#inicio">Inicio</a></li>
            <li><a href="#nuestro-mundo">Nuestro mundo</a></li>
            <li><a href="#menu">Menu</a></li>
          </ul>
        </div>

        <div className={styles.footerColumn}>
          <h4>Ayuda</h4>
          <ul>
            <li><a href="#tutoriales">Tutoriales</a></li>
            <li><a href="#trabaja">Trabaja con nosotros</a></li>
            <li><a href="#franquicias">Franquicias</a></li>
            <li><a href="#contacto">Contacto</a></li>
          </ul>
        </div>

        <div className={`${styles.footerColumn} ${styles.newsletter}`}>
          <h4>Suscribite para novedades</h4>
          <input type="text" placeholder="Tu nombre" />
          <input type="email" placeholder="Tu email" />
          <button className={styles.subscribeBtn}>Suscribirme</button>

          <div className={styles.socials}>
            <span>Conectate con nosotros</span>
            <div className={styles.socialIcons}>
              <a href="#" aria-label="Candy Land en Facebook">
                <FaFacebookF />
              </a>
              <a href="#" aria-label="Candy Land en Instagram">
                <FaInstagram />
              </a>
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
