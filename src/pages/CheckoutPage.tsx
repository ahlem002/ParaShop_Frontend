import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PublicShell } from '../components/layout/PublicShell';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { AddressMapPicker } from '../components/checkout/AddressMapPicker';
import { resolveUploadUrl } from '../config/api';
import {
  buyNowCheckout,
  checkoutCompany,
} from '../services/orders.service';
import { getPublicProduct } from '../services/products.service';
import type { PublicProduct } from '../types/product';
import '../styles/pages/cart.css';
import '../styles/pages/checkout.css';

function formatPrice(value: number) {
  return `${value.toFixed(2)} TND`;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') ?? '';
  const buyNowProductId = searchParams.get('productId') ?? '';
  const initialQty = Math.max(
    1,
    Number(searchParams.get('quantity') ?? '1') || 1,
  );
  const isBuyNow = Boolean(buyNowProductId);

  const { user, saveCheckoutDetails } = useAuth();
  const { cart, loading: cartLoading } = useCart();

  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [productLoading, setProductLoading] = useState(isBuyNow);
  const [quantity, setQuantity] = useState(initialQty);
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

  useEffect(() => {
    if (!isBuyNow || !buyNowProductId) return;

    let cancelled = false;
    async function load() {
      setProductLoading(true);
      setError('');
      try {
        const data = await getPublicProduct(buyNowProductId);
        if (cancelled) return;
        setProduct(data);
        setQuantity((current) =>
          Math.min(Math.max(1, current), Math.max(1, data.stock)),
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Could not load product',
          );
          setProduct(null);
        }
      } finally {
        if (!cancelled) setProductLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isBuyNow, buyNowProductId]);

  const buyNowSubtotal = product
    ? Number(product.price) * quantity
    : 0;
  const buyNowDelivery = product
    ? Number(product.company?.deliveryFee ?? 0)
    : 0;
  const buyNowTotal = buyNowSubtotal + buyNowDelivery;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

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
      const session = isBuyNow
        ? await buyNowCheckout({
            productId: buyNowProductId,
            quantity,
            shippingAddress: address,
            phoneNumber: phone,
            notes: notes.trim() || undefined,
          })
        : await checkoutCompany(group!.companyId, {
            shippingAddress: address,
            phoneNumber: phone,
            notes: notes.trim() || undefined,
          });

      try {
        await saveCheckoutDetails({
          address,
          phoneNumber: phone,
        });
      } catch {
        // Order already created; continue even if preference save fails.
      }

      navigate(`/checkout/payment?orderId=${session.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setSubmitting(false);
    }
  }

  if (!isBuyNow && !companyId) {
    return (
      <PublicShell>
        <main className="container home-container checkout-page">
          <div className="checkout-empty">
            <h1>Checkout</h1>
            <p>No product or company selected.</p>
            <Link to="/products" className="btn btn-primary">
              Browse products
            </Link>
          </div>
        </main>
      </PublicShell>
    );
  }

  if (isBuyNow && productLoading) {
    return (
      <PublicShell>
        <main className="container home-container checkout-page">
          <p>Loading checkout...</p>
        </main>
      </PublicShell>
    );
  }

  if (isBuyNow && (!product || error) && !product) {
    return (
      <PublicShell>
        <main className="container home-container checkout-page">
          <div className="checkout-empty">
            <h1>Product unavailable</h1>
            <p>{error || 'This product could not be found.'}</p>
            <Link to="/products" className="btn btn-primary">
              Browse products
            </Link>
          </div>
        </main>
      </PublicShell>
    );
  }

  if (!isBuyNow && cartLoading && !group) {
    return (
      <PublicShell>
        <main className="container home-container checkout-page">
          <p>Loading checkout...</p>
        </main>
      </PublicShell>
    );
  }

  if (!isBuyNow && !group) {
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

  const title = isBuyNow
    ? product?.company?.companyName ?? 'Checkout'
    : group!.companyName;
  const backTo = isBuyNow
    ? `/products/${buyNowProductId}`
    : '/cart';
  const backLabel = isBuyNow ? 'Back to product' : 'Back to cart';
  const maxQty = Math.max(1, product?.stock ?? 1);

  return (
    <PublicShell>
      <main className="container home-container checkout-page">
        <div className="checkout-page__header">
          <div>
            <p className="checkout-page__eyebrow">
              {isBuyNow ? 'Buy now' : 'Checkout'}
            </p>
            <h1>{title}</h1>
            <p>Confirm quantity, delivery details, and total before payment.</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(backTo)}
          >
            {backLabel}
          </button>
        </div>

        {error && <div className="cart-page__error">{error}</div>}

        <form className="checkout-layout" onSubmit={handleSubmit}>
          <section className="checkout-card">
            <h2>Delivery details</h2>
            <AddressMapPicker
              id="checkout-address"
              value={shippingAddress}
              onChange={setShippingAddress}
              required
            />
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
              {isBuyNow && product ? (
                <li className="checkout-summary__item">
                  <div className="checkout-summary__media">
                    {resolveUploadUrl(product.images?.[0] ?? null) ? (
                      <img
                        src={resolveUploadUrl(product.images?.[0] ?? null)!}
                        alt=""
                      />
                    ) : (
                      <div className="checkout-summary__placeholder" />
                    )}
                  </div>
                  <div className="checkout-summary__info">
                    <strong>{product.name}</strong>
                    <div className="checkout-qty">
                      <label htmlFor="buy-now-qty">Quantity</label>
                      <input
                        id="buy-now-qty"
                        type="number"
                        min={1}
                        max={maxQty}
                        value={quantity}
                        onChange={(event) => {
                          const next = Number(event.target.value) || 1;
                          setQuantity(Math.min(Math.max(1, next), maxQty));
                        }}
                      />
                    </div>
                    <span>{formatPrice(Number(product.price))} each</span>
                  </div>
                  <strong className="checkout-summary__line">
                    {formatPrice(buyNowSubtotal)}
                  </strong>
                </li>
              ) : (
                group!.items.map((item) => {
                  const image = resolveUploadUrl(
                    item.product.images?.[0] ?? null,
                  );
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
                })
              )}
            </ul>

            <div className="checkout-summary__totals">
              <div>
                <span>Subtotal</span>
                <strong>
                  {formatPrice(isBuyNow ? buyNowSubtotal : group!.subtotal)}
                </strong>
              </div>
              <div>
                <span>Delivery fee</span>
                <strong>
                  {formatPrice(
                    isBuyNow ? buyNowDelivery : group!.deliveryFee,
                  )}
                </strong>
              </div>
              <div className="checkout-summary__total">
                <span>Total</span>
                <strong>
                  {formatPrice(isBuyNow ? buyNowTotal : group!.total)}
                </strong>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary checkout-summary__pay"
              disabled={submitting || (isBuyNow && !product)}
            >
              {submitting ? 'Creating order...' : 'Confirm and continue'}
            </button>
          </aside>
        </form>
      </main>
    </PublicShell>
  );
}
