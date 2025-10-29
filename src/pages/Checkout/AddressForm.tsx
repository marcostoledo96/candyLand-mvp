import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Checkout.module.css";

const AddressForm = () => {
  const [form, setForm] = useState({ nombre: "", direccion: "", ciudad: "", telefono: "" });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("checkoutData", JSON.stringify(form));
    navigate("/checkout/pago");
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2>Dirección de Envío</h2>
      <input name="nombre" placeholder="Nombre completo" onChange={handleChange} required />
      <input name="direccion" placeholder="Dirección" onChange={handleChange} required />
      <input name="ciudad" placeholder="Ciudad" onChange={handleChange} required />
      <input name="telefono" placeholder="Teléfono" onChange={handleChange} required />
      <button type="submit">Continuar al pago</button>
    </form>
  );
};

export default AddressForm;
