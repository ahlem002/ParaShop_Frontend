import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BackLink } from '../../components/layout/BackLink';
import { useConfirm } from '../../context/ConfirmContext';
import {
  getDeliveryOrder,
  updateDeliveryOrderStatus,
} from '../../services/orders.service';
import type { DeliveryOrderView } from '../../types/order';
import {
  formatOrderPrice,
  statusBadgeClass,
  statusLabel,
} from '../company/company-order-utils';
import { resolveUploadUrl } from '../../config/api';

export function DeliveryOrderDetailPage() {
  const { orderId = '' } = useParams();
  const { confirm } = useConfirm();
  const [order, setOrder] = useState<DeliveryOrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getDeliveryOrder(orderId);
      setOrder(data);
      setNote(data.deliveryNote ?? '');
    } catch {
      setError('Failed to load order.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleStatus(
    status: 'DELIVERED' | 'RETURNED',
    event?: FormEvent,
  ) {
    event?.preventDefault();
    if (!order) return;

    if (status === 'RETURNED' && note.trim().length < 3) {
      setError('Add a short note explaining the return.');
      return;
    }

    const ok = await confirm({
      title: status === 'DELIVERED' ? 'Mark delivered?' : 'Mark returned?',
      message:
        status === 'DELIVERED'
          ? 'Confirm that the client received this order.'
          : 'Confirm that you are returning this order to the company.',
      confirmLabel: status === 'DELIVERED' ? 'Delivered' : 'Returned',
      danger: status === 'RETURNED',
    });
    if (!ok) return;

    setBusy(true);
    setError('');
    try {
      const updated = await updateDeliveryOrderStatus(
        order.orderId,
        status,
        note.trim() || undefined,
      );
      setOrder(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update status.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="admin-page">
        <BackLink to="/delivery/orders" label="Back to deliveries" />
        <div className="admin-error">{error || 'Order not found.'}</div>
      </div>
    );
  }

  const mapsUrl = order.shippingAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shippingAddress)}`
    : null;
  const pickupMapsUrl = order.company.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.company.address)}`
    : null;
  const phone = order.client.phoneNumber ?? order.shippingPhone;

  return (
    <div className="admin-page">
      <BackLink to="/delivery/orders" label="Back to deliveries" />
      <div className="admin-page-heading">
        <div>
          <h1 className="admin-page-title">
            {order.client.firstName} {order.client.lastName}
          </h1>
          <p className="admin-page-subtitle">Tracking {order.trackingId}</p>
        </div>
        <span className={statusBadgeClass(order.status)}>
          {statusLabel(order.status)}
        </span>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-page-card">
        <h2>Client</h2>
        <p>
          <strong>Phone:</strong>{' '}
          {phone ? <a href={`tel:${phone}`}>{phone}</a> : '—'}
        </p>
        <p>
          <strong>Delivery address:</strong> {order.shippingAddress ?? '—'}
        </p>
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noreferrer">
            Open in maps
          </a>
        )}
        <p>
          <strong>Total:</strong> {formatOrderPrice(order.total)}
        </p>
      </div>

      <div className="admin-page-card">
        <h2>Pickup company</h2>
        <p>
          <strong>Name:</strong> {order.company.companyName}
        </p>
        <p>
          <strong>Address:</strong> {order.company.address ?? '—'}
        </p>
        <p>
          <strong>Phone:</strong>{' '}
          {order.company.phoneNumber ? (
            <a href={`tel:${order.company.phoneNumber}`}>
              {order.company.phoneNumber}
            </a>
          ) : (
            '—'
          )}
        </p>
        {pickupMapsUrl && (
          <a href={pickupMapsUrl} target="_blank" rel="noreferrer">
            Open pickup in maps
          </a>
        )}
      </div>

      <div className="admin-page-card">
        <h2>Items</h2>
        <ul className="company-order-items">
          {order.items.map((item) => (
            <li key={item.orderItemId}>
              {item.productImage && (
                <img
                  src={resolveUploadUrl(item.productImage) ?? undefined}
                  alt=""
                  width={40}
                  height={40}
                />
              )}
              <span>
                {item.productName} × {item.quantity} —{' '}
                {formatOrderPrice(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {(order.canMarkDelivered || order.canMarkReturned) && (
        <div className="admin-page-card">
          <h2>Update delivery</h2>
          <div className="form-group">
            <label htmlFor="delivery-note">Note (required for return)</label>
            <textarea
              id="delivery-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Client refused the order / wrong address"
            />
          </div>
          <div className="company-order-card__actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void handleStatus('DELIVERED')}
            >
              Mark delivered
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => void handleStatus('RETURNED')}
            >
              Mark returned
            </button>
          </div>
        </div>
      )}

      {order.deliveryNote && order.status !== 'SHIPPED' && (
        <div className="admin-page-card">
          <p>
            <strong>Delivery note:</strong> {order.deliveryNote}
          </p>
        </div>
      )}
    </div>
  );
}
