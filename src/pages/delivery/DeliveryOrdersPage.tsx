import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDeliveryOrders } from '../../services/orders.service';
import type { DeliveryOrderView } from '../../types/order';
import {
  formatOrderPrice,
  statusBadgeClass,
  statusLabel,
} from '../company/company-order-utils';

interface DeliveryOrdersPageProps {
  scope?: 'active' | 'history' | 'all';
  title?: string;
}

export function DeliveryOrdersPage({
  scope = 'active',
  title = 'Active deliveries',
}: DeliveryOrdersPageProps) {
  const [orders, setOrders] = useState<DeliveryOrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDeliveryOrders(scope);
      setOrders(data);
    } catch {
      setError('Failed to load deliveries.');
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">{title}</h1>
      {loading && <div className="admin-loading">Loading...</div>}
      {error && <div className="admin-error">{error}</div>}
      {!loading && orders.length === 0 && (
        <div className="admin-empty">No deliveries in this list.</div>
      )}
      <div className="company-order-list">
        {orders.map((order) => (
          <article key={order.orderId} className="company-order-card">
            <div className="company-order-card__header">
              <div>
                <h2>
                  {order.client.firstName} {order.client.lastName}
                </h2>
                <p>Tracking {order.trackingId}</p>
              </div>
              <span className={statusBadgeClass(order.status)}>
                {statusLabel(order.status)}
              </span>
            </div>
            <p>
              <strong>Address:</strong> {order.shippingAddress ?? '—'}
            </p>
            <p>
              <strong>Total:</strong> {formatOrderPrice(order.total)}
            </p>
            <Link
              className="btn btn-secondary"
              to={`/delivery/orders/${order.orderId}`}
            >
              View
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
