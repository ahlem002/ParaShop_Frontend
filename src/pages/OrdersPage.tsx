import { useEffect, useState } from 'react';
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
import type { OrderView } from '../types/order';
import '../styles/pages/cart.css';

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

export function OrdersPage() {
  const { confirm } = useConfirm();
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

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

        <div className="products-grid">
          {orders.map((order) => {
            const busy = busyId === order.orderId;
            const showCancel = canCancelOrder(order.status);
            const primary = order.items[0];
            const image = resolveUploadUrl(primary?.productImage ?? null);
            const extraCount = Math.max(0, order.items.length - 1);

            return (
              <article
                key={order.orderId}
                className="product-card shop-line-card"
              >
                <div className="shop-line-card__media">
                  {image ? (
                    <img
                      src={image}
                      alt={primary?.productName ?? 'Order'}
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
                </div>

                <div className="product-details shop-line-card__details">
                  <span className="company-name">
                    {order.company.companyName}
                  </span>
                  <h3 className="product-title">
                    {primary ? (
                      <Link to={`/products/${primary.productId}`}>
                        {primary.productName}
                        {primary.quantity > 1 ? ` × ${primary.quantity}` : ''}
                      </Link>
                    ) : (
                      'Order'
                    )}
                  </h3>
                  <div className="product-meta">
                    <span className="price">{formatPrice(order.total)}</span>
                    <span className="rating">
                      {extraCount > 0
                        ? `+${extraCount} more`
                        : new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="shop-line-card__meta">
                    Delivery {formatPrice(order.deliveryFee)}
                    {order.shippingPhone ? ` · ${order.shippingPhone}` : ''}
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
                      {busy ? 'Cancelling…' : 'Cancel'}
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
