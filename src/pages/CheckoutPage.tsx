import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PublicShell } from '../components/layout/PublicShell';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { checkoutCompany } from '../services/orders.service';
import { resolveUploadUrl } from '../config/api';
import '../styles/pages/cart.css';
import '../styles/pages/checkout.css';

function formatPrice(value: number) {
  return `${value.toFixed(2)} TND`;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') ?? '';
  const { user } = useAuth();
  const { cart, loading: cartLoading } = useCart();

  const [shippingAddress, setShippingAddress] = useState(user?.address ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const group = useMemo(
    () => cart.groups.find((item) => item.companyId === companyId) ?? null,
    [cart.groups, companyId],
  );

  useEffect(() => {
    if (user?.address) setShippingAddress((current) => current || user.address || '');
    if (user?.phoneNumber) {
      setPhoneNumber((current) => current || user.phoneNumber || '');
    }
  }, [user?.address, user?.phoneNumber]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!group) return;

    const address = shippingAddress.trim();
    const phone = phoneNumber.trim();

    if (address.length < 5) {
      setError('Please enter a full delivery address.');
      return;
    }
    if (phone.length < 6) {
      setError('Please enter a valid phone number.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const session = await checkoutCompany(group.companyId, {
        shippingAddress: address,
        phoneNumber: phone,
        notes: notes.trim() || undefined,
      });
      window.location.href = session.paymentUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setSubmitting(false);
    }
  }

  if (!companyId) {
    return (
      <PublicShell>
        <main className="container home-container checkout-page">
          <div className="checkout-empty">
            <h1>Checkout</h1>
            <p>No company selected. Go back to your cart and choose a company.</p>
            <Link to="/cart" className="btn btn-primary">
              Back to cart
            </Link>
          </div>
        </main>
      </PublicShell>
    );
  }

  if (cartLoading && !group) {
    return (
      <PublicShell>
        <main className="container home-container checkout-page">
          <p>Loading checkout...</p>
        </main>
      </PublicShell>
    );
  }

  if (!group) {
    return (
      <PublicShell>
        <main className="container home-container checkout-page">
          <div className="checkout-empty">
            <h1>Nothing to checkout</h1>
            <p>
              There are no cart items for this company anymore. Add products and
              try again.
            </p>
            <div className="checkout-empty__actions">
              <Link to="/cart" className="btn btn-secondary">
                Back to cart
              </Link>
              <Link to="/products" className="btn btn-primary">
                Browse products
              </Link>
            </div>
          </div>
        </main>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <main className="container home-container checkout-page">
        <div className="checkout-page__header">
          <div>
            <p className="checkout-page__eyebrow">Checkout</p>
            <h1>{group.companyName}</h1>
            <p>Confirm delivery details, then pay securely with Flouci.</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/cart')}
          >
            Back to cart
          </button>
        </div>

        {error && <div className="cart-page__error">{error}</div>}

        <form className="checkout-layout" onSubmit={handleSubmit}>
          <section className="checkout-card">
            <h2>Delivery details</h2>
            <div className="form-group">
              <label htmlFor="checkout-address">Delivery address</label>
              <textarea
                id="checkout-address"
                rows={3}
                value={shippingAddress}
                onChange={(event) => setShippingAddress(event.target.value)}
                placeholder="Street, city, governorate..."
                required
                minLength={5}
              />
            </div>
            <div className="form-group">
              <label htmlFor="checkout-phone">Phone number</label>
              <input
                id="checkout-phone"
                type="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="+216 XX XXX XXX"
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label htmlFor="checkout-notes">Order notes (optional)</label>
              <textarea
                id="checkout-notes"
                rows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Door code, preferred time, etc."
              />
            </div>
          </section>

          <aside className="checkout-summary checkout-card">
            <h2>Order summary</h2>
            <ul className="checkout-summary__items">
              {group.items.map((item) => {
                const image = resolveUploadUrl(item.product.images?.[0] ?? null);
                return (
                  <li key={item.cartItemId} className="checkout-summary__item">
                    <div className="checkout-summary__media">
                      {image ? (
                        <img src={image} alt="" />
                      ) : (
                        <div className="checkout-summary__placeholder" />
                      )}
                    </div>
                    <div className="checkout-summary__info">
                      <strong>{item.product.name}</strong>
                      <span>
                        {item.quantity} × {formatPrice(item.product.price)}
                      </span>
                    </div>
                    <strong className="checkout-summary__line">
                      {formatPrice(item.lineTotal)}
                    </strong>
                  </li>
                );
              })}
            </ul>

            <div className="checkout-summary__totals">
              <div>
                <span>Subtotal</span>
                <strong>{formatPrice(group.subtotal)}</strong>
              </div>
              <div>
                <span>Delivery fee</span>
                <strong>{formatPrice(group.deliveryFee)}</strong>
              </div>
              <div className="checkout-summary__total">
                <span>Total</span>
                <strong>{formatPrice(group.total)}</strong>
              </div>
            </div>

            <p className="checkout-summary__note">
              You will be redirected to Flouci to complete payment. Card and
              wallet details are entered on Flouci’s secure page.
            </p>

            <button
              type="submit"
              className="btn btn-primary checkout-summary__pay"
              disabled={submitting}
            >
              {submitting ? 'Redirecting to Flouci...' : 'Pay with Flouci'}
            </button>
          </aside>
        </form>
      </main>
    </PublicShell>
  );
}
