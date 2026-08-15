import { Link, useSearchParams } from 'react-router-dom';
import { PublicShell } from '../components/layout/PublicShell';
import { BackLink } from '../components/layout/BackLink';
import '../styles/pages/cart.css';

export function PaymentFailPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <PublicShell>
      <main className="container home-container cart-page">
        <BackLink to="/cart" label="Back to cart" />
        <div className="payment-result">
          <h1>Payment failed</h1>
          <p>
            The Flouci payment was cancelled or did not complete.
            {orderId ? ' You can try checkout again from your cart.' : ''}
          </p>
          <div className="payment-result__actions">
            <Link to="/products" className="btn btn-secondary">
              Browse products
            </Link>
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
