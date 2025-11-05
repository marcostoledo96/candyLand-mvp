// Footer del sitio: links útiles y redes
import React from "react";
import styles from "./Footer.module.css";
import { FaFacebookF, FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      {/* Logo */}
      <div className={styles.footerColumn}>
        <img src="/src/assets/img/logo.png" alt="Candy Land" className={styles.logo} />
      </div>

      {/* Contenidos */}
      <div className={styles.footerColumn}>
        <h4>CONTENIDOS</h4>
        <ul>
          <li><a href="#inicio">Inicio</a></li>
          <li><a href="#nuestro-mundo">Nuestro Mundo</a></li>
          <li><a href="#menu">Menú</a></li>
        </ul>
      </div>

      {/* Ayuda */}
      <div className={styles.footerColumn}>
        <h4>AYUDA</h4>
        <ul>
          <li><a href="#tutoriales">Tutoriales</a></li>
          <li><a href="#trabaja">Trabajá con Nosotros</a></li>
          <li><a href="#franquicias">Franquicias</a></li>
          <li><a href="#contacto">Contacto</a></li>
        </ul>
      </div>

      {/* Newsletter */}
      <div className={`${styles.footerColumn} ${styles.newsletter}`}>
        <h4>¡SUSCRIBITE PARA NOVEDADES!</h4>
        <input type="text" placeholder="Tu nombre" />
        <input type="email" placeholder="Tu email" />
        <button className={styles.subscribeBtn}>SUSCRIBIRME</button>
        {/* Redes */}
      <div className={`${styles.footerColumn} ${styles.socials}`}>
        <h4>CONECTATE CON NOSOTROS</h4>
        <a href="#"><FaFacebookF /></a>
        <a href="#"><FaInstagram /></a>
      </div>
      </div>

    

      {/* Copy */}
      <div className={styles.copy}>
        © Copyright 2021 Tienda Candyland - Todos los derechos reservados.
      </div>
    </footer>
  );
};

export default Footer;
