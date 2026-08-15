import { useCallback, useEffect, useMemo, useState } from 'react';
import { useConfirm } from '../../context/ConfirmContext';
import {
  assignDriverToOrder,
  getAvailableDrivers,
  getCompanyOrders,
} from '../../services/orders.service';
import type {
  AvailableDriverView,
  CompanyOrderView,
} from '../../types/order';
import {
  formatOrderPrice,
  statusBadgeClass,
  statusLabel,
} from './company-order-utils';
import { ListToolbar } from '../../components/common/ListToolbar';

export function CompanyDeliveryPage() {
  const { confirm } = useConfirm();
  const [orders, setOrders] = useState<CompanyOrderView[]>([]);
  const [drivers, setDrivers] = useState<AvailableDriverView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [freeOnly, setFreeOnly] = useState(false);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [selectedDriverByOrder, setSelectedDriverByOrder] = useState<
    Record<string, string>
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [orderData, driverData] = await Promise.all([
        getCompanyOrders(),
        getAvailableDrivers(false),
      ]);
      setOrders(orderData);
      setDrivers(driverData);
    } catch {
      setError('Failed to load delivery management data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      try {
        const driverData = await getAvailableDrivers(freeOnly);
        setDrivers(driverData);
      } catch {
        // Keep previous list
      }
    })();
  }, [freeOnly]);

  const deliveryOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders
      .filter((order) =>
        ['PROCESSING', 'SHIPPED', 'DELIVERED', 'RETURNED'].includes(
          order.status,
        ),
      )
      .filter((order) => {
        if (statusFilter !== 'ALL' && order.status !== statusFilter) {
          return false;
        }
        if (!query) return true;
        const clientName =
          `${order.client.firstName} ${order.client.lastName}`.toLowerCase();
        const driverName = order.delivery
          ? `${order.delivery.firstName} ${order.delivery.lastName}`.toLowerCase()
          : '';
        return (
          clientName.includes(query) ||
          driverName.includes(query) ||
          order.trackingId.toLowerCase().includes(query) ||
          (order.shippingAddress ?? '').toLowerCase().includes(query)
        );
      });
  }, [orders, search, statusFilter]);

  async function handleAssign(order: CompanyOrderView) {
    const deliveryUserId = selectedDriverByOrder[order.orderId];
    if (!deliveryUserId) {
      setError('Choose a driver before assigning.');
      return;
    }

    const driver = drivers.find((item) => item.userId === deliveryUserId);
    const ok = await confirm({
      title: 'Assign driver?',
      message: `Assign ${driver?.firstName ?? 'this driver'} ${driver?.lastName ?? ''} to order ${order.trackingId}? The order will be marked as shipped.`,
      confirmLabel: 'Assign & ship',
    });
    if (!ok) return;

    setAssigningOrderId(order.orderId);
    setError('');
    try {
      const updated = await assignDriverToOrder(order.orderId, deliveryUserId);
      setOrders((prev) =>
        prev.map((item) =>
          item.orderId === updated.orderId ? updated : item,
        ),
      );
      const refreshed = await getAvailableDrivers(freeOnly);
      setDrivers(refreshed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to assign driver.',
      );
    } finally {
      setAssigningOrderId(null);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Delivery Management</h1>
        <div className="admin-loading">Loading deliveries...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <h1 className="admin-page-title">Delivery Management</h1>
          <p className="admin-page-subtitle">
            Assign drivers to processing orders and track delivery status.
          </p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-page-card" style={{ marginBottom: 16 }}>
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search client, driver, tracking..."
          searchAriaLabel="Search deliveries"
          selects={[
            {
              id: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'ALL', label: 'All delivery statuses' },
                { value: 'PROCESSING', label: 'Ready to assign' },
                { value: 'SHIPPED', label: 'Out for delivery' },
                { value: 'DELIVERED', label: 'Delivered' },
                { value: 'RETURNED', label: 'Returned' },
              ],
            },
          ]}
        />
        <label className="admin-checkbox-row">
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={(e) => setFreeOnly(e.target.checked)}
          />
          Show only free drivers in assign lists
        </label>
      </div>

      {deliveryOrders.length === 0 ? (
        <div className="admin-empty">
          No processing or delivery orders yet. Mark paid orders as processing
          first.
        </div>
      ) : (
        <div className="company-order-list">
          {deliveryOrders.map((order) => (
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

              <div className="company-order-card__meta">
                <p>
                  <strong>Address:</strong> {order.shippingAddress ?? '—'}
                </p>
                <p>
                  <strong>Phone:</strong>{' '}
                  {order.shippingPhone ?? order.client.phoneNumber ?? '—'}
                </p>
                <p>
                  <strong>Total:</strong> {formatOrderPrice(order.total)}
                </p>
                <p>
                  <strong>Driver:</strong>{' '}
                  {order.delivery
                    ? `${order.delivery.firstName} ${order.delivery.lastName}${
                        order.delivery.phoneNumber
                          ? ` · ${order.delivery.phoneNumber}`
                          : ''
                      }`
                    : 'Not assigned'}
                </p>
                {order.deliveryNote && (
                  <p>
                    <strong>Note:</strong> {order.deliveryNote}
                  </p>
                )}
              </div>

              {order.canAssignDriver && (
                <div className="company-order-card__actions">
                  <select
                    value={selectedDriverByOrder[order.orderId] ?? ''}
                    onChange={(e) =>
                      setSelectedDriverByOrder((prev) => ({
                        ...prev,
                        [order.orderId]: e.target.value,
                      }))
                    }
                  >
                    <option value="">Choose driver...</option>
                    {drivers.map((driver) => (
                      <option key={driver.userId} value={driver.userId}>
                        {driver.firstName} {driver.lastName}
                        {driver.averageRating != null
                          ? ` · ${driver.averageRating}/5 (${driver.ratingCount})`
                          : ' · no ratings'}
                        {driver.isFree ? '' : ' · busy'}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={assigningOrderId === order.orderId}
                    onClick={() => void handleAssign(order)}
                  >
                    {assigningOrderId === order.orderId
                      ? 'Assigning...'
                      : 'Assign driver'}
                  </button>
                  {selectedDriverByOrder[order.orderId] && (
                    <DriverNotes
                      driver={drivers.find(
                        (d) =>
                          d.userId === selectedDriverByOrder[order.orderId],
                      )}
                    />
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function DriverNotes({ driver }: { driver?: AvailableDriverView }) {
  if (!driver || driver.recentNotes.length === 0) return null;
  return (
    <div className="driver-notes">
      <p>
        <strong>Recent client notes</strong>
      </p>
      <ul>
        {driver.recentNotes.map((note, index) => (
          <li key={`${note.createdAt}-${index}`}>
            {note.rating}/5 — {note.comment}
          </li>
        ))}
      </ul>
    </div>
  );
}
