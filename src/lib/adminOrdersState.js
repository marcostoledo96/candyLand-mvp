/** @typedef {{ id: number, status: string }} OrderWithStatus */

export function isOrderPending(pending, id) {
  return pending[id] !== undefined;
}

export function finishOrderUpdate(pending, id, sequence) {
  if (pending[id] !== sequence) return pending;
  const { [id]: _finished, ...remaining } = pending;
  return remaining;
}

export function reconcileOrderUpdate(orders, updated, filter) {
  if (filter && updated.status !== filter) return orders.filter((order) => order.id !== updated.id);
  const index = orders.findIndex((order) => order.id === updated.id);
  if (index < 0) return [...orders, updated];
  return orders.map((order) => order.id === updated.id ? updated : order);
}
