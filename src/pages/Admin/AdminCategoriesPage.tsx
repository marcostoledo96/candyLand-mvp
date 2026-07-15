import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdminAuthError, getAdminToken } from '../../lib/adminAuth.js';
import {
  AdminApiError,
  createAdminCategory,
  deleteAdminCategory,
  listAdminCategories,
  updateAdminCategory,
} from '../../lib/adminApi.js';
import type { AdminCategory } from '../../lib/adminApi.js';
import { extractApiError } from '../../lib/adminValidation.js';
import shared from '../PublicRoutes/PublicRoutes.module.css';
import styles from './AdminCategoriesPage.module.css';

type ListState = 'loading' | 'error' | 'empty' | 'success';
type FormState = { mode: 'create' | 'edit'; category?: AdminCategory; invoker: HTMLElement; selector: string } | null;

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const AdminCategoriesPage: React.FC = () => {
  const [state, setState] = useState<ListState>('loading');
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(null);
  const [deleting, setDeleting] = useState<{ category: AdminCategory; invoker: HTMLElement; selector: string } | null>(null);
  const formDialog = useRef<HTMLDialogElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async (keepVisible = false) => {
    if (!keepVisible) setState('loading');
    setError('');
    try {
      const token = getAdminToken();
      if (!token) throw new Error('No hay sesión activa.');
      const list = await listAdminCategories(token);
      setCategories(list);
      setState(list.length ? 'success' : 'empty');
    } catch (cause) {
      setError(messageFor(cause, 'No se pudieron cargar las categorías.'));
      setState('error');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!form) return;
    formDialog.current?.showModal();
    const frame = requestAnimationFrame(() => nameInput.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [form]);
  useEffect(() => {
    if (deleting) deleteDialog.current?.showModal();
  }, [deleting]);

  const restore = (invoker: HTMLElement, selector: string) => {
    requestAnimationFrame(() => (invoker.isConnected ? invoker : document.querySelector<HTMLElement>(selector))?.focus());
  };
  const restoreAfterDelete = () => {
    requestAnimationFrame(() => headingRef.current?.focus());
  };
  const closeForm = () => {
    if (!form || saving) return;
    formDialog.current?.close();
    const current = form;
    setForm(null);
    restore(current.invoker, current.selector);
  };
  const closeDelete = () => {
    if (!deleting || removing) return;
    deleteDialog.current?.close();
    const current = deleting;
    setDeleting(null);
    restore(current.invoker, current.selector);
  };
  const openForm = (mode: 'create' | 'edit', category: AdminCategory | undefined, event: React.MouseEvent<HTMLButtonElement>) => {
    setName(category?.name ?? '');
    setFormError('');
    setForm({ mode, category, invoker: event.currentTarget, selector: mode === 'edit' ? `[data-category-edit="${category?.id}"]` : '[data-category-create]' });
  };
  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form || saving) return;
    const value = name.trim();
    if (!value) { setFormError('El nombre es obligatorio.'); return; }
    const token = getAdminToken();
    if (!token) { setFormError('Sesión expirada. Volvé a iniciar sesión.'); return; }
    setSaving(true);
    setFormError('');
    try {
      if (form.mode === 'edit' && form.category) await updateAdminCategory(token, form.category.id, { name: value });
      else await createAdminCategory(token, { name: value });
    } catch (cause) {
      if (cause instanceof AdminAuthError) setFormError('Sesión expirada. Volvé a iniciar sesión.');
      else {
        const api = cause as { message?: string; fields?: string[]; status?: number };
        setFormError(extractApiError({ error: api.message, errors: api.fields }, api.status ?? 0).message);
      }
      setSaving(false);
      return;
    }
    const current = form;
    setSaving(false);
    formDialog.current?.close();
    setForm(null);
    await load(true);
    restore(current.invoker, current.selector);
  };
  const confirmDelete = async () => {
    if (!deleting || removing) return;
    const token = getAdminToken();
    if (!token) { setDeleteError('Sesión expirada. Volvé a iniciar sesión.'); return; }
    setRemoving(true);
    setDeleteError('');
    try {
      await deleteAdminCategory(token, deleting.category.id);
    } catch (cause) {
      setDeleteError(messageFor(cause, 'No se pudo eliminar la categoría.'));
      setRemoving(false);
      return;
    }
    const current = deleting;
    const remaining = categories.filter((category) => category.id !== current.category.id);
    setCategories(remaining);
    setState(remaining.length ? 'success' : 'empty');
    setRemoving(false);
    deleteDialog.current?.close();
    setDeleting(null);
    restoreAfterDelete();
  };

  const createButton = <button type="button" data-category-create className={styles.actionBtn} onClick={(event) => openForm('create', undefined, event)}>Crear categoría</button>;
  let content: React.ReactNode;
  if (state === 'loading') content = <section className={shared.state} role="status" aria-live="polite" aria-busy="true"><h1 className={shared.stateTitle}>Cargando categorías…</h1><p className={shared.stateText}>Estamos preparando el panel.</p></section>;
  else if (state === 'error') content = <section className={shared.state} role="alert"><h1 className={shared.stateTitle}>No se pudieron cargar las categorías</h1><p className={shared.stateText}>{error}</p><button type="button" className={shared.retryBtn} onClick={() => void load()}>Reintentar</button></section>;
  else if (state === 'empty') content = <section className={shared.state}><h1 ref={headingRef} tabIndex={-1} className={shared.stateTitle}>No hay categorías</h1><p className={shared.stateText}>Creá la primera categoría para organizar el catálogo.</p>{createButton}</section>;
  else content = <section className={shared.page}><div className={styles.header}><h1 ref={headingRef} tabIndex={-1} className={`${shared.pageTitle} ${styles.focusTarget}`}>Categorías</h1>{createButton}</div><div className={styles.tableWrap} role="table" aria-label="Lista de categorías"><div className={`${styles.row} ${styles.rowHeader}`} role="row"><span role="columnheader">Nombre</span><span role="columnheader">Slug</span><span role="columnheader">Acciones</span></div>{categories.map((category) => <div className={styles.row} role="row" key={category.id}><span role="cell">{category.name}</span><span role="cell">{category.slug}</span><span role="cell" className={styles.actions}><button type="button" data-category-edit={category.id} className={styles.actionBtn} onClick={(event) => openForm('edit', category, event)}>Editar</button><button type="button" data-category-delete={category.id} className={`${styles.actionBtn} ${styles.danger}`} onClick={(event) => { setDeleteError(''); setDeleting({ category, invoker: event.currentTarget, selector: `[data-category-delete="${category.id}"]` }); }}>Eliminar</button></span></div>)}</div></section>;

  return <>{content}
    {form && <dialog ref={formDialog} className={styles.dialog} aria-labelledby="category-form-title" onCancel={(event) => { event.preventDefault(); closeForm(); }}><form onSubmit={submitForm} className={styles.form}><div className={styles.dialogHeader}><h2 id="category-form-title">{form.mode === 'edit' ? 'Editar categoría' : 'Crear categoría'}</h2><button type="button" onClick={closeForm} disabled={saving}>Cerrar</button></div>{formError && <p role="alert" className={styles.error}>{formError}</p>}<label className={styles.field}>Nombre<input ref={nameInput} name="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} disabled={saving} /></label><p aria-live="polite">{saving ? 'Guardando…' : ''}</p><div className={styles.dialogActions}><button type="button" onClick={closeForm} disabled={saving}>Cancelar</button><button type="submit" disabled={saving}>{saving ? 'Guardando…' : form.mode === 'edit' ? 'Guardar cambios' : 'Crear'}</button></div></form></dialog>}
    {deleting && <dialog ref={deleteDialog} className={styles.dialog} aria-labelledby="category-delete-title" onCancel={(event) => { event.preventDefault(); closeDelete(); }}><div className={styles.form}><h2 id="category-delete-title">Eliminar categoría</h2><p>¿Eliminar “{deleting.category.name}”?</p>{deleteError && <p role="alert" className={styles.error}>{deleteError}</p>}<p aria-live="polite">{removing ? 'Eliminando…' : ''}</p><div className={styles.dialogActions}><button type="button" onClick={closeDelete} disabled={removing}>Cancelar</button><button type="button" className={styles.danger} onClick={() => void confirmDelete()} disabled={removing}>{removing ? 'Eliminando…' : 'Eliminar'}</button></div></div></dialog>}
  </>;
};

export default AdminCategoriesPage;
