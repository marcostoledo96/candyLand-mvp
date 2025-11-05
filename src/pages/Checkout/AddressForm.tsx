import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Checkout.module.css";
import { postCheckout } from "../../lib/api";

// Formulario de datos del comprador; guarda en backend y avanza al paso de pago
const AddressForm = () => {
  const [form, setForm] = useState({ nombre: "", telefono: "", direccion: "", ciudad: "", localidad: "", provincia: "", codigoPostal: "" });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cartId = localStorage.getItem("cartId");
      const payload = {
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
        localidad: (form.localidad || form.ciudad || "").trim(),
        provincia: form.provincia.trim(),
        codigoPostal: String(form.codigoPostal).trim(),
      };
  // Guardamos datos del checkout en el backend (queda asociado al cartId)
  const res = await postCheckout(payload, cartId || undefined);
      localStorage.setItem("checkoutData", JSON.stringify(payload));
      if (res?.cartId) localStorage.setItem("cartId", res.cartId);
  // Si salió bien, avanzamos al siguiente paso
  navigate("/checkout/pago");
    } catch (e: any) {
      if (e?.missing?.length) {
        alert(`Faltan campos: ${e.missing.join(", ")}`);
      } else if (e?.error) {
        alert(e.error);
      } else {
        alert("No se pudo guardar el checkout. Verificá que el backend esté corriendo en http://localhost:3000 e intentá nuevamente.");
      }
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2>Dirección de Envío</h2>
      <input name="nombre" placeholder="Nombre completo" onChange={handleChange} required />
      <input name="direccion" placeholder="Dirección" onChange={handleChange} required />
      <input name="ciudad" placeholder="Ciudad" onChange={handleChange} required />
      <input name="telefono" placeholder="Teléfono" onChange={handleChange} required />
      <input name="provincia" placeholder="Provincia" onChange={handleChange} required />
      <input name="codigoPostal" placeholder="Codigo Postal" onChange={handleChange} required />
      <button type="submit">Continuar al pago</button>
    </form>
  );
};

export default AddressForm;
