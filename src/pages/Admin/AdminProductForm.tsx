import React, { useEffect, useRef, useState } from 'react';
import { getAdminToken, AdminAuthError } from '../../lib/adminAuth.js';
import { createAdminProduct, listAdminCategories, updateAdminProduct, type AdminCategory, type AdminProduct } from '../../lib/adminApi.js';
import { extractApiError, productFormFields, validateProductPayload } from '../../lib/adminValidation.js';
import styles from './AdminProductForm.module.css';

type Props = { mode: 'create' | 'edit'; product?: AdminProduct; invoker: HTMLElement | null; invokerSelector: string; onClose: () => void; onSaved: () => Promise<void> };
type Fields = { title: string; description: string; price: string; stock: string; categoryId: string; imageUrl: string; hoverImageUrl: string; active: boolean };


export default function AdminProductForm({ mode, product, invoker, invokerSelector, onClose, onSaved }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState<Fields>(() => productFormFields(product));
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [categoryState, setCategoryState] = useState<'loading' | 'error' | 'empty' | 'success'>('loading');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const close = () => { dialog.current?.close(); onClose(); requestAnimationFrame(() => (invoker?.isConnected ? invoker : document.querySelector<HTMLElement>(invokerSelector))?.focus()); };
  const loadCategories = async () => {
    setCategoryState('loading');
    try {
      const token = getAdminToken();
      if (!token) throw new Error('No hay sesión activa.');
      const list = await listAdminCategories(token);
      setCategories(list);
      setCategoryState(list.length ? 'success' : 'empty');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las categorías.');
      setCategoryState('error');
    }
  };

  useEffect(() => {
    dialog.current?.showModal();
    const frame = requestAnimationFrame(() => title.current?.focus());
    void loadCategories();
    return () => cancelAnimationFrame(frame);
  }, []);

  const change = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.currentTarget;
    const checked = event.currentTarget instanceof HTMLInputElement && event.currentTarget.type === 'checkbox' ? event.currentTarget.checked : undefined;
    setFields((current) => ({ ...current, [name]: checked === undefined ? value : checked }));
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || categoryState !== 'success') return;
    setError(''); setSummary([]); setFieldErrors({});
    const checked = validateProductPayload(fields, mode === 'edit' ? product?.priceCents : undefined);
    if (!checked.ok) { setFieldErrors(checked.fields); return; }
    const token = getAdminToken();
    if (!token) { setError('Sesión expirada. Volvé a iniciar sesión.'); return; }
    setSaving(true);
    try {
      if (mode === 'edit' && product) await updateAdminProduct(token, product.id, checked.value);
      else await createAdminProduct(token, checked.value);
    } catch (cause) {
      if (cause instanceof AdminAuthError) setError('Sesión expirada. Volvé a iniciar sesión.');
      else {
        const api = cause as { message?: string; status?: number; fields?: string[] };
        const mapped = extractApiError({ error: api.message, errors: api.fields }, api.status ?? 0);
        setError(mapped.message); setSummary(mapped.summary); setFieldErrors({ ...mapped.fields, ...(mapped.fields.priceCents ? { price: mapped.fields.priceCents } : {}) });
      }
      setSaving(false);
      return;
    }
    setSaving(false);
    close();
    await onSaved();
  };
  const labelled = (name: keyof Fields, label: string, input: React.ReactNode) => <label className={styles.field}>{label}{input}{fieldErrors[name] && <span className={styles.fieldError}>{fieldErrors[name]}</span>}</label>;

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="product-form-title" onCancel={(event) => { event.preventDefault(); close(); }}>
    <form method="dialog" onSubmit={submit} className={styles.form}>
      <div className={styles.heading}><h2 id="product-form-title">{mode === 'edit' ? 'Editar producto' : 'Crear producto'}</h2><button type="button" onClick={close}>Cerrar</button></div>
      {(error || summary.length > 0) && <div className={styles.summary} role="alert"><strong>{error}</strong>{summary.map((item) => <div key={item}>{item}</div>)}</div>}
      {labelled('title', 'Título', <input ref={title} name="title" value={fields.title} onChange={change} aria-invalid={!!fieldErrors.title} />)}
      {labelled('description', 'Descripción (opcional)', <textarea name="description" value={fields.description} onChange={change} />)}
      <div className={styles.twoCols}>{labelled('price', 'Precio (pesos enteros)', <input name="price" inputMode="numeric" value={fields.price} onChange={change} aria-invalid={!!fieldErrors.price} />)}{labelled('stock', 'Stock', <input name="stock" inputMode="numeric" value={fields.stock} onChange={change} aria-invalid={!!fieldErrors.stock} />)}</div>
      {labelled('categoryId', 'Categoría', <select name="categoryId" value={fields.categoryId} onChange={change} disabled={categoryState !== 'success'} aria-invalid={!!fieldErrors.categoryId}><option value="">(Sin categoría)</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>)}
      {categoryState === 'loading' && <p aria-live="polite">Cargando categorías…</p>}
      {categoryState === 'error' && <p role="alert">{error} <button type="button" onClick={() => void loadCategories()}>Reintentar</button></p>}
      {categoryState === 'empty' && <p role="alert">No hay categorías.</p>}
      {labelled('imageUrl', 'URL de imagen (opcional)', <input name="imageUrl" type="url" value={fields.imageUrl} onChange={change} aria-invalid={!!fieldErrors.imageUrl} />)}
      {labelled('hoverImageUrl', 'URL de imagen hover (opcional)', <input name="hoverImageUrl" type="url" value={fields.hoverImageUrl} onChange={change} aria-invalid={!!fieldErrors.hoverImageUrl} />)}
      <label className={styles.check}><input name="active" type="checkbox" checked={fields.active} onChange={change} /> Activo</label>
      <div className={styles.actions}><button type="button" onClick={close} disabled={saving}>Cancelar</button><button type="submit" disabled={saving || categoryState !== 'success'}>{saving ? 'Guardando…' : mode === 'edit' ? 'Guardar cambios' : 'Crear'}</button></div>
    </form>
  </dialog>;
}
