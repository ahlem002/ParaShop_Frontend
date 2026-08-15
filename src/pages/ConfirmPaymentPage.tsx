import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PublicShell } from '../components/layout/PublicShell';
import { useCart } from '../context/CartContext';
import {
  confirmFakePayment,
  getMyOrder,
} from '../services/orders.service';
import type { OrderView } from '../types/order';
import { resolveUploadUrl } from '../config/api';
import '../styles/pages/cart.css';
import '../styles/pages/checkout.css';

function formatPrice(value: number) {
  return `${value.toFixed(2)} TND`;
}

export function ConfirmPaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const { refreshCart } = useCart();

  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!orderId) {
        setError('Missing order.');
        setLoading(false);
        return;
      }

      const cardReady = sessionStorage.getItem(`parashop-card-ready-${orderId}`);
      if (!cardReady) {
        navigate(`/checkout/payment?orderId=${orderId}`, { replace: true });
        return;
      }

      try {
        const data = await getMyOrder(orderId);
        if (cancelled) return;
        if (data.status === 'PAID') {
          navigate(`/orders/payment/success?orderId=${orderId}`, {
            replace: true,
          });
          return;
        }
        setOrder(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load order');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId, navigate]);

  async function handleConfirm() {
    if (!order) return;
    setSubmitting(true);
    setError('');
    try {
      await confirmFakePayment(order.orderId);
      sessionStorage.removeItem(`parashop-card-ready-${order.orderId}`);
      sessionStorage.removeItem(`parashop-card-draft-${order.orderId}`);
      await refreshCart();
      navigate(`/orders/payment/success?orderId=${order.orderId}`, {
        replace: true,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not confirm payment',
      );
      setSubmitting(false);
    }
  }

  return (
    <PublicShell>
      <main className="container home-container checkout-page">
        <div className="checkout-page__header">
          <div>
            <p className="checkout-page__eyebrow">Final step</p>
            <h1>Confirm payment</h1>
            <p>
              Review your order one last time, then confirm to mark it as paid.
            </p>
          </div>
        </div>

        {loading && <p>Loading confirmation...</p>}
        {!loading && error && !order && (
          <div className="checkout-empty">
            <h2>Confirmation unavailable</h2>
            <p className="cart-page__error">{error}</p>
            <Link to="/orders" className="btn btn-secondary">
              My orders
            </Link>
          </div>
        )}

        {!loading && order && (
          <div className="checkout-layout">
            <section className="checkout-card">
              <h2>Order items</h2>
              {error && <div className="cart-page__error">{error}</div>}
              <ul className="checkout-summary__items">
                {order.items.map((item) => {
                  const image = resolveUploadUrl(item.productImage ?? null);
                  return (
                    <li key={item.orderItemId} className="checkout-summary__item">
                      <div className="checkout-summary__media">
                        {image ? (
                          <img src={image} alt="" />
                        ) : (
                          <div className="checkout-summary__placeholder" />
                        )}
                      </div>
                      <div className="checkout-summary__info">
                        <strong>{item.productName}</strong>
                        <span>
                          {item.quantity} × {formatPrice(item.unitPrice)}
                        </span>
                      </div>
                      <strong className="checkout-summary__line">
                        {formatPrice(item.lineTotal)}
                      </strong>
                    </li>
                  );
                })}
              </ul>
              <div className="company-order-card__shipping" style={{ marginTop: 16 }}>
                <strong>Delivery</strong>
                <div>{order.shippingPhone ?? '—'}</div>
                <div className="admin-muted">{order.shippingAddress ?? '—'}</div>
              </div>
            </section>

            <aside className="checkout-summary checkout-card">
              <h2>Pay {formatPrice(order.total)}</h2>
              <div className="checkout-summary__totals">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatPrice(order.subtotal)}</strong>
                </div>
                <div>
                  <span>Delivery fee</span>
                  <strong>{formatPrice(order.deliveryFee)}</strong>
                </div>
                <div className="checkout-summary__total">
                  <span>Total</span>
                  <strong>{formatPrice(order.total)}</strong>
                </div>
              </div>
              <p className="checkout-summary__note">
                By confirming, this demo payment is accepted and your order
                becomes paid.
              </p>
              <button
                type="button"
                className="btn btn-primary checkout-summary__pay"
                disabled={submitting}
                onClick={() => void handleConfirm()}
              >
                {submitting ? 'Confirming...' : 'Confirm payment'}
              </button>
              <button
                type="button"
                className="btn btn-secondary checkout-summary__pay"
                style={{ marginTop: 10 }}
                onClick={() =>
                  navigate(`/checkout/payment?orderId=${order.orderId}`)
                }
              >
                Back to card details
              </button>
            </aside>
          </div>
        )}
      </main>
    </PublicShell>
  );
}
