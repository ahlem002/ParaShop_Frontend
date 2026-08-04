import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Trash2 } from 'lucide-react';
import { PublicShell } from '../components/layout/PublicShell';
import { useConfirm } from '../context/ConfirmContext';
import { resolveUploadUrl } from '../config/api';
import {
  cancelMyOrder,
  deleteMyOrder,
  getMyOrders,
} from '../services/orders.service';
import type { OrderItemView, OrderStatus, OrderView } from '../types/order';
import '../styles/pages/cart.css';
import '../styles/pages/history.css';

function formatPrice(value: number) {
  return `${value.toFixed(2)} TND`;
}

function statusLabel(status: OrderView['status']) {
  switch (status) {
    case 'PAID':
      return 'Paid';
    case 'PENDING_PAYMENT':
      return 'Pending payment';
    case 'PAYMENT_FAILED':
      return 'Payment failed';
    case 'PROCESSING':
      return 'Processing';
    case 'SHIPPED':
      return 'Shipped';
    case 'DELIVERED':
      return 'Delivered';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

function statusTone(status: OrderView['status']) {
  switch (status) {
    case 'PAID':
    case 'DELIVERED':
      return 'paid';
    case 'PAYMENT_FAILED':
    case 'CANCELLED':
      return 'failed';
    case 'PENDING_PAYMENT':
      return 'pending';
    default:
      return 'neutral';
  }
}

function canCancelOrder(status: OrderView['status']) {
  return (
    status === 'PENDING_PAYMENT' ||
    status === 'PAYMENT_FAILED' ||
    status === 'PAID' ||
    status === 'PROCESSING'
  );
}

type StatusFilter =
  | 'all'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'progress';

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'paid', label: 'Paid' },
  { id: 'progress', label: 'In progress' },
  { id: 'failed', label: 'Failed' },
  { id: 'cancelled', label: 'Cancelled' },
];

function matchesStatusFilter(
  status: OrderStatus,
  filter: StatusFilter,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'pending') return status === 'PENDING_PAYMENT';
  if (filter === 'paid') return status === 'PAID';
  if (filter === 'failed') return status === 'PAYMENT_FAILED';
  if (filter === 'cancelled') return status === 'CANCELLED';
  return (
    status === 'PROCESSING' ||
    status === 'SHIPPED' ||
    status === 'DELIVERED'
  );
}

type OrderCardRow = {
  order: OrderView;
  item: OrderItemView;
};

export function OrdersPage() {
  const { confirm } = useConfirm();
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getMyOrders();
        if (!cancelled) setOrders(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load orders');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      all: orders.length,
      pending: 0,
      paid: 0,
      failed: 0,
      cancelled: 0,
      progress: 0,
    };

    for (const order of orders) {
      if (matchesStatusFilter(order.status, 'pending')) result.pending += 1;
      if (matchesStatusFilter(order.status, 'paid')) result.paid += 1;
      if (matchesStatusFilter(order.status, 'failed')) result.failed += 1;
      if (matchesStatusFilter(order.status, 'cancelled')) result.cancelled += 1;
      if (matchesStatusFilter(order.status, 'progress')) result.progress += 1;
    }

    return result;
  }, [orders]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => matchesStatusFilter(order.status, statusFilter)),
    [orders, statusFilter],
  );

  const cards = useMemo<OrderCardRow[]>(
    () =>
      filteredOrders.flatMap((order) =>
        order.items.map((item) => ({ order, item })),
      ),
    [filteredOrders],
  );

  async function handleCancel(order: OrderView) {
    const ok = await confirm({
      title: 'Cancel this order?',
      message: `Cancel your order from ${order.company.companyName} (${formatPrice(order.total)})? The order will stay in your list as cancelled.`,
      confirmLabel: 'Cancel order',
      cancelLabel: 'Keep order',
      danger: true,
    });
    if (!ok) return;

    setBusyId(order.orderId);
    setError('');
    try {
      const updated = await cancelMyOrder(order.orderId);
      setOrders((prev) =>
        prev.map((item) => (item.orderId === order.orderId ? updated : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel order');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(order: OrderView) {
    const ok = await confirm({
      title: 'Delete this order?',
      message: `Remove your order from ${order.company.companyName} (${formatPrice(order.total)})? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      danger: true,
    });
    if (!ok) return;

    setBusyId(order.orderId);
    setError('');
    try {
      await deleteMyOrder(order.orderId);
      setOrders((prev) => prev.filter((item) => item.orderId !== order.orderId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete order');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PublicShell>
      <main className="container home-container cart-page">
        <div className="cart-page__header">
          <div>
            <h1>My orders</h1>
            <p>Track your purchases and payment status.</p>
          </div>
        </div>

        <div className="history-toolbar orders-filter-toolbar">
          <div
            className="history-tabs"
            role="tablist"
            aria-label="Filter orders by status"
          >
            {STATUS_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={statusFilter === id}
                className={
                  statusFilter === id
                    ? 'history-tabs__tab history-tabs__tab--active'
                    : 'history-tabs__tab'
                }
                onClick={() => setStatusFilter(id)}
              >
                {label}
                <span className="history-tabs__count">{counts[id]}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <div className="cart-page__error">{error}</div>}
        {loading && <p>Loading orders...</p>}

        {!loading && orders.length === 0 && (
          <div className="cart-empty">
            <h2>No orders yet</h2>
            <p>When you checkout a company from your cart, orders appear here.</p>
            <Link to="/products" className="btn btn-primary">
              Browse products
            </Link>
          </div>
        )}

        {!loading && orders.length > 0 && cards.length === 0 && (
          <div className="cart-empty">
            <h2>
              No{' '}
              {STATUS_FILTERS.find((f) => f.id === statusFilter)?.label.toLowerCase()}{' '}
              orders
            </h2>
            <p>Try another status filter to see more orders.</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStatusFilter('all')}
            >
              Show all orders
            </button>
          </div>
        )}

        <div className="products-grid">
          {cards.map(({ order, item }) => {
            const busy = busyId === order.orderId;
            const showCancel = canCancelOrder(order.status);
            const image = resolveUploadUrl(item.productImage ?? null);

            return (
              <article
                key={item.orderItemId}
                className="product-card shop-line-card"
              >
                <Link
                  to={`/products/${item.productId}`}
                  className="shop-line-card__media"
                >
                  {image ? (
                    <img
                      src={image}
                      alt={item.productName}
                      className="product-img-placeholder"
                    />
                  ) : (
                    <div className="product-img-placeholder" />
                  )}
                  <span
                    className={`order-card__status order-card__status--${statusTone(order.status)} shop-line-card__badge`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </Link>

                <div className="product-details shop-line-card__details">
                  <span className="company-name">
                    {order.company.companyName}
                  </span>
                  <h3 className="product-title">
                    <Link to={`/products/${item.productId}`}>
                      {item.productName}
                    </Link>
                  </h3>
                  <div className="product-meta">
                    <span className="price">{formatPrice(item.lineTotal)}</span>
                    <span className="rating">
                      × {item.quantity} · {formatPrice(item.unitPrice)} each
                    </span>
                  </div>
                  <p className="shop-line-card__meta">
                    Order total {formatPrice(order.total)} ·{' '}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="shop-line-card__actions">
                  {showCancel && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-nav shop-line-card__btn"
                      onClick={() => void handleCancel(order)}
                      disabled={busy}
                    >
                      <Ban size={14} strokeWidth={2} />
                      {busy ? '…' : 'Cancel'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="shop-line-card__remove"
                    onClick={() => void handleDelete(order)}
                    disabled={busy}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </PublicShell>
  );
}
