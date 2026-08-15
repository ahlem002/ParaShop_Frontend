import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Package, Truck } from 'lucide-react';
import { resolveUploadUrl } from '../../config/api';
import { useConfirm } from '../../context/ConfirmContext';
import {
  getCompanyOrders,
  updateCompanyOrderStatus,
} from '../../services/orders.service';
import type {
  CompanyOrderNextStatus,
  CompanyOrderView,
} from '../../types/order';
import {
  formatOrderPrice,
  nextActionLabel,
  statusBadgeClass,
  statusLabel,
} from './company-order-utils';

export function CompanyClientOrdersPage() {
  const { clientId = '' } = useParams();
  const { confirm } = useConfirm();
  const [orders, setOrders] = useState<CompanyOrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCompanyOrders();
      setOrders(data.filter((order) => order.client.clientId === clientId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const client = orders[0]?.client;
  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [orders],
  );

  async function handleStatusUpdate(
    order: CompanyOrderView,
    nextStatus: CompanyOrderNextStatus,
  ) {
    const ok = await confirm({
      title: `${nextActionLabel(nextStatus)}?`,
      message: `Update this order (${formatOrderPrice(order.total)}) to ${statusLabel(nextStatus)}? The client will be notified.`,
      confirmLabel: nextActionLabel(nextStatus),
    });
    if (!ok) return;

    setBusyId(order.orderId);
    setError('');
    try {
      const updated = await updateCompanyOrderStatus(order.orderId, nextStatus);
      setOrders((prev) =>
        prev.map((item) => (item.orderId === order.orderId ? updated : item)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update order status.',
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Client orders</h1>
        <div className="admin-loading">Loading client orders...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="admin-page">
        <Link to="/company/orders" className="admin-back-link">
          <ArrowLeft size={16} strokeWidth={2} />
          Back to order management
        </Link>
        <h1 className="admin-page-title">Client orders</h1>
        <div className="admin-empty">No orders found for this client.</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Link to="/company/orders" className="admin-back-link">
        <ArrowLeft size={16} strokeWidth={2} />
        Back to order management
      </Link>

      <div className="admin-page-heading">
        <div>
          <h1 className="admin-page-title">
            {client.firstName} {client.lastName}
          </h1>
          <p className="admin-page-subtitle">
            {client.email}
            {client.phoneNumber ? ` · ${client.phoneNumber}` : ''}
          </p>
        </div>
      </div>

      {error && (
        <div className="admin-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="company-client-orders">
        {sortedOrders.map((order) => {
          const busy = busyId === order.orderId;

          return (
            <section key={order.orderId} className="admin-page-card company-order-card">
              <div className="company-order-card__header">
                <div>
                  <div className="company-order-card__meta">
                    {new Date(order.createdAt).toLocaleString()}
                    {order.paidAt
                      ? ` · Paid ${new Date(order.paidAt).toLocaleDateString()}`
                      : ''}
                  </div>
                  <div className="company-order-card__shipping">
                    <strong>Shipping</strong>
                    <div>{order.shippingPhone ?? '—'}</div>
                    <div className="admin-muted company-order-address">
                      {order.shippingAddress ?? '—'}
                    </div>
                  </div>
                </div>
                <div className="company-order-card__aside">
                  <span className={statusBadgeClass(order.status)}>
                    {statusLabel(order.status)}
                  </span>
                  <strong>{formatOrderPrice(order.total)}</strong>
                  <div className="admin-table__actions">
                    {order.nextStatuses.map((next) => (
                      <button
                        key={next}
                        type="button"
                        className="admin-btn-sm admin-btn-sm--primary"
                        disabled={busy}
                        onClick={() => void handleStatusUpdate(order, next)}
                      >
                        <Package size={14} strokeWidth={2} />
                        {busy ? '…' : nextActionLabel(next)}
                      </button>
                    ))}
                    {order.status === 'PROCESSING' && (
                      <Link
                        to="/company/delivery"
                        className="admin-btn-sm admin-btn-sm--primary"
                      >
                        <Truck size={14} strokeWidth={2} />
                        Assign driver
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="company-order-items">
                {order.items.map((item) => {
                  const image = resolveUploadUrl(item.productImage ?? null);
                  return (
                    <div
                      key={item.orderItemId}
                      className="company-order-items__row"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={item.productName}
                          className="product-thumb"
                        />
                      ) : (
                        <div className="product-thumb">—</div>
                      )}
                      <div className="company-order-items__info">
                        <strong>{item.productName}</strong>
                        <div className="admin-muted">
                          × {item.quantity} · {formatOrderPrice(item.unitPrice)}{' '}
                          each
                        </div>
                      </div>
                      <div className="company-order-items__line">
                        {formatOrderPrice(item.lineTotal)}
                      </div>
                      <span className={statusBadgeClass(order.status)}>
                        {statusLabel(order.status)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="admin-muted company-order-card__footer">
                Subtotal {formatOrderPrice(order.subtotal)} · Delivery{' '}
                {formatOrderPrice(order.deliveryFee)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
