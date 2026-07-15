import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdminAuthError, getAdminToken } from '../../lib/adminAuth.js';
import {
  ADMIN_ORDER_STATUSES,
  AdminApiError,
  formatAdminOrderPayment,
  formatAdminOrderStatus,
  getAdminOrder,
  listAdminOrders,
  updateAdminOrderStatus,
} from '../../lib/adminApi.js';
import type { AdminOrder, AdminOrderStatus } from '../../lib/adminApi.js';
import { finishOrderUpdate, isOrderPending, reconcileOrderUpdate } from '../../lib/adminOrdersState.js';
import shared from '../PublicRoutes/PublicRoutes.module.css';
import styles from './AdminOrdersPage.module.css';

type ListState = 'loading' | 'error' | 'empty' | 'success';
type DetailState = { loading?: boolean; order?: AdminOrder; error?: string };

const unavailable = (value: unknown) => typeof value === 'string' && value.trim() ? value : 'No disponible';
const money = (cents: number | null | undefined) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format((cents ?? 0) / 100);
const messageFor = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

const AdminOrdersPage: React.FC = () => {
  const [state, setState] = useState<ListState>('loading');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState<AdminOrderStatus | ''>('');
  const [error, setError] = useState('');
  const [details, setDetails] = useState<Record<number, DetailState>>({});
  const [drafts, setDrafts] = useState<Record<number, AdminOrderStatus>>({});
  const [pending, setPending] = useState<Record<number, number>>({});
  const [updateErrors, setUpdateErrors] = useState<Record<number, string>>({});
  const pendingRef = useRef<Record<number, number>>({});
  const listGeneration = useRef(0);
  const filterRef = useRef(filter);

  const load = useCallback(async (keepVisible = false) => {
    const generation = ++listGeneration.current;
    if (!keepVisible) setState('loading');
    setError('');
    try {
      const token = getAdminToken();
      if (!token) throw new Error('No hay sesión activa.');
      const list = await listAdminOrders(token, filter || undefined);
      if (generation !== listGeneration.current) return;
      setOrders(list);
      setState(list.length ? 'success' : 'empty');
    } catch (cause) {
      if (generation !== listGeneration.current) return;
      const message = messageFor(cause, 'No se pudieron cargar los pedidos.');
      if (keepVisible && orders.length) setError(message);
      else { setError(message); setState('error'); }
    }
  }, [filter, orders.length]);

  useEffect(() => { void load(orders.length > 0); }, [filter]); // filter changes intentionally trigger a fresh list.

  const loadDetail = async (id: number) => {
    if (details[id]?.order || details[id]?.loading) return;
    setDetails((current) => ({ ...current, [id]: { loading: true } }));
    try {
      const token = getAdminToken();
      if (!token) throw new Error('No hay sesión activa.');
      const order = await getAdminOrder(token, id);
      setDetails((current) => ({ ...current, [id]: { order } }));
    } catch (cause) {
      setDetails((current) => ({ ...current, [id]: { error: messageFor(cause, 'No se pudo cargar el detalle.') } }));
    }
  };

  const replaceOrder = (order: AdminOrder) => {
    setOrders((current) => {
      const next = reconcileOrderUpdate(current, order, filterRef.current);
      setState(next.length ? 'success' : 'empty');
      return next;
    });
    setDetails((current) => current[order.id] ? { ...current, [order.id]: { order } } : current);
  };

  const updateStatus = async (order: AdminOrder) => {
    if (isOrderPending(pendingRef.current, order.id)) return;
    const status = drafts[order.id] ?? order.status;
    const sequence = (pendingRef.current[order.id] ?? 0) + 1;
    pendingRef.current = { ...pendingRef.current, [order.id]: sequence };
    setPending(pendingRef.current);
    setUpdateErrors((current) => ({ ...current, [order.id]: '' }));
    try {
      const token = getAdminToken();
      if (!token) throw new Error('No hay sesión activa.');
      const updated = await updateAdminOrderStatus(token, order.id, status);
      if (pendingRef.current[order.id] !== sequence) return;
      listGeneration.current += 1;
      replaceOrder(updated);
      setDrafts((current) => { const { [order.id]: _, ...rest } = current; return rest; });
    } catch (cause) {
      if (pendingRef.current[order.id] !== sequence) return;
      setUpdateErrors((current) => ({ ...current, [order.id]: messageFor(cause, 'No se pudo actualizar el estado.') }));
    } finally {
      pendingRef.current = finishOrderUpdate(pendingRef.current, order.id, sequence);
      setPending(pendingRef.current);
    }
  };

  if (state === 'loading') return <section className={shared.state} role="status" aria-live="polite" aria-busy="true"><h1 className={shared.stateTitle}>Cargando pedidos…</h1><p className={shared.stateText}>Estamos preparando el panel.</p></section>;
  if (state === 'error') return <section className={shared.state} role="alert"><h1 className={shared.stateTitle}>No se pudieron cargar los pedidos</h1><p className={shared.stateText}>{error}</p><button type="button" className={shared.retryBtn} onClick={() => void load()}>Reintentar</button></section>;

  return <section className={shared.page}>
    <div className={styles.header}><h1 className={shared.pageTitle}>Pedidos</h1><label className={styles.filter}>Estado<select value={filter} onChange={(event) => { const next = event.target.value as AdminOrderStatus | ''; filterRef.current = next; setFilter(next); }}><option value="">Todos</option>{ADMIN_ORDER_STATUSES.map((status) => <option key={status} value={status}>{formatAdminOrderStatus(status)}</option>)}</select></label></div>
    {error && <div role="alert" className={styles.inlineError}><p>{error}</p><button type="button" onClick={() => void load(true)}>Reintentar</button></div>}
    {state === 'empty' ? <section className={shared.state}><h2 className={shared.stateTitle}>No hay pedidos</h2><p className={shared.stateText}>No hay resultados para el estado seleccionado.</p></section> : <div className={styles.list} aria-label="Lista de pedidos">
      {orders.map((order) => {
        const detail = details[order.id];
        const shown = detail?.order ?? order;
        const orderPending = isOrderPending(pending, order.id);
        return <details key={order.id} className={styles.order} onToggle={(event) => { if (event.currentTarget.open) void loadDetail(order.id); }}>
          <summary><span><strong>{unavailable(order.orderNumber)}</strong><small>{unavailable(order.contact?.name)}</small></span><span>{money(order.totalCents)}</span><span>{formatAdminOrderPayment(order.paymentMethod)}</span><span className={styles.status}>{formatAdminOrderStatus(order.status)}</span></summary>
          <div className={styles.detail}>
            {detail?.loading && <p role="status" aria-live="polite">Cargando detalle…</p>}
            {detail?.error && <div role="alert" className={styles.inlineError}><p>{detail.error}</p><button type="button" onClick={() => void loadDetail(order.id)}>Reintentar detalle</button></div>}
            {!detail?.loading && !detail?.error && <><dl><div><dt>Contacto</dt><dd>{unavailable(shown.contact?.name)} · {unavailable(shown.contact?.phone)}</dd></div><div><dt>Entrega</dt><dd>{[shown.contact?.address, shown.contact?.city, shown.contact?.province, shown.contact?.postalCode].map(unavailable).join(', ')}</dd></div><div><dt>Pago</dt><dd>{formatAdminOrderPayment(shown.paymentMethod)} · {unavailable(shown.paymentStatus)}</dd></div></dl><ul className={styles.items}>{shown.items.map((item) => <li key={item.productId}>{unavailable(item.productTitle)} × {item.quantity} · {money(item.priceCents)} · {money(item.subtotalCents)}</li>)}</ul></>}
            <div className={styles.update}><label>Estado<select aria-label={`Estado del pedido ${order.orderNumber}`} value={drafts[order.id] ?? order.status} disabled={orderPending} onChange={(event) => setDrafts((current) => ({ ...current, [order.id]: event.target.value as AdminOrderStatus }))}>{ADMIN_ORDER_STATUSES.map((status) => <option key={status} value={status}>{formatAdminOrderStatus(status)}</option>)}</select></label><button type="button" disabled={orderPending} onClick={() => void updateStatus(order)}>{orderPending ? 'Guardando…' : 'Guardar estado'}</button></div>
            {updateErrors[order.id] && <p role="alert" className={styles.inlineError}>{updateErrors[order.id]}</p>}
          </div>
        </details>;
      })}
    </div>}
  </section>;
};

export default AdminOrdersPage;
