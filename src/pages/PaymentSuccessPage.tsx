import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PublicShell } from '../components/layout/PublicShell';
import { useCart } from '../context/CartContext';
import { getMyOrder } from '../services/orders.service';
import type { OrderView } from '../types/order';
import '../styles/pages/cart.css';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const { refreshCart } = useCart();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!orderId) {
        setError('Missing order id.');
        setLoading(false);
        return;
      }

      try {
        const result = await getMyOrder(orderId);
        if (!cancelled) {
          setOrder(result);
          await refreshCart();
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Could not load order',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId, refreshCart]);

  const paid = order?.status === 'PAID';

  return (
    <PublicShell>
      <main className="container home-container cart-page">
        <div className="payment-result">
          {loading && <p>Loading your order...</p>}
          {!loading && error && (
            <>
              <h1>Order check failed</h1>
              <p className="cart-page__error">{error}</p>
              <Link to="/orders" className="btn btn-secondary">
                My orders
              </Link>
            </>
          )}
          {!loading && !error && paid && (
            <>
              <h1>Payment successful</h1>
              <p>
                Your order from <strong>{order?.company.companyName}</strong>{' '}
                is confirmed.
              </p>
              <p className="payment-result__meta">
                Total paid: <strong>{order?.total.toFixed(2)} TND</strong>
              </p>
              <div className="payment-result__actions">
                <Link to="/orders" className="btn btn-primary">
                  View my orders
                </Link>
                <Link to="/products" className="btn btn-secondary">
                  Continue shopping
                </Link>
              </div>
            </>
          )}
          {!loading && !error && !paid && (
            <>
              <h1>Payment pending</h1>
              <p>
                Status: <strong>{order?.status}</strong>
              </p>
              <div className="payment-result__actions">
                <Link
                  to={`/checkout/payment?orderId=${orderId}`}
                  className="btn btn-primary"
                >
                  Continue payment
                </Link>
                <Link to="/orders" className="btn btn-secondary">
                  My orders
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </PublicShell>
  );
}
