import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDeliveryOrders } from '../../services/orders.service';
import type { DeliveryOrderView } from '../../types/order';
import {
  formatOrderPrice,
  statusBadgeClass,
  statusLabel,
} from '../company/company-order-utils';

export function DeliveryDashboardPage() {
  const [active, setActive] = useState<DeliveryOrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDeliveryOrders('active');
      setActive(data);
    } catch {
      setError('Failed to load active deliveries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Delivery dashboard</h1>
      <p className="admin-page-subtitle">
        Active orders assigned to you. Open an order to call the client or mark
        it delivered / returned.
      </p>

      {loading && <div className="admin-loading">Loading...</div>}
      {error && <div className="admin-error">{error}</div>}

      {!loading && active.length === 0 && (
        <div className="admin-empty">No active deliveries right now.</div>
      )}

      <div className="company-order-list">
        {active.map((order) => (
          <article key={order.orderId} className="company-order-card">
            <div className="company-order-card__header">
              <div>
                <h2>
                  {order.client.firstName} {order.client.lastName}
                </h2>
                <p>{order.company.companyName}</p>
              </div>
              <span className={statusBadgeClass(order.status)}>
                {statusLabel(order.status)}
              </span>
            </div>
            <p>
              <strong>Drop-off:</strong> {order.shippingAddress ?? '—'}
            </p>
            <p>
              <strong>Total:</strong> {formatOrderPrice(order.total)}
            </p>
            <Link
              className="btn btn-primary"
              to={`/delivery/orders/${order.orderId}`}
            >
              Open details
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
