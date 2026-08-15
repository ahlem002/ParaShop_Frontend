import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PublicShell } from '../components/layout/PublicShell';
import { useAuth } from '../context/AuthContext';
import { getMyOrder } from '../services/orders.service';
import type { OrderView } from '../types/order';
import '../styles/pages/cart.css';
import '../styles/pages/checkout.css';

function formatPrice(value: number) {
  return `${value.toFixed(2)} TND`;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatCardNumber(value: string) {
  return onlyDigits(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();
}

function formatExpiry(value: string) {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

type CardDraft = {
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
};

function cardDraftKey(orderId: string) {
  return `parashop-card-draft-${orderId}`;
}

function cardReadyKey(orderId: string) {
  return `parashop-card-ready-${orderId}`;
}

function loadCardDraft(orderId: string): CardDraft {
  try {
    const raw = sessionStorage.getItem(cardDraftKey(orderId));
    if (!raw) {
      return { cardName: '', cardNumber: '', expiry: '', cvc: '' };
    }
    const parsed = JSON.parse(raw) as Partial<CardDraft>;
    return {
      cardName: parsed.cardName ?? '',
      cardNumber: parsed.cardNumber ?? '',
      expiry: parsed.expiry ?? '',
      cvc: parsed.cvc ?? '',
    };
  } catch {
    return { cardName: '', cardNumber: '', expiry: '', cvc: '' };
  }
}

function saveCardDraft(orderId: string, draft: CardDraft) {
  sessionStorage.setItem(cardDraftKey(orderId), JSON.stringify(draft));
}

export function FakePaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const { user, saveCheckoutDetails } = useAuth();

  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    if (!orderId) return;

    const draft = loadCardDraft(orderId);
    const hasDraft = Boolean(
      draft.cardName || draft.cardNumber || draft.expiry || draft.cvc,
    );

    if (hasDraft) {
      setCardName(draft.cardName);
      setCardNumber(draft.cardNumber);
      setExpiry(draft.expiry);
      setCvc(draft.cvc);
      return;
    }

    const saved = user?.savedPaymentMethod;
    if (saved?.cardName || saved?.cardNumber || saved?.cardExpiry) {
      setCardName(saved.cardName ?? '');
      setCardNumber(
        saved.cardNumber ? formatCardNumber(saved.cardNumber) : '',
      );
      setExpiry(saved.cardExpiry ? formatExpiry(saved.cardExpiry) : '');
    }
  }, [orderId, user?.savedPaymentMethod]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!orderId) {
        setError('Missing order.');
        setLoading(false);
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
        if (data.status !== 'PENDING_PAYMENT') {
          setError('This order cannot be paid.');
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!order) return;

    const digits = onlyDigits(cardNumber);
    const expiryDigits = onlyDigits(expiry);
    const cvcDigits = onlyDigits(cvc);

    if (cardName.trim().length < 2) {
      setError('Enter the name on the card.');
      return;
    }
    if (digits.length !== 16) {
      setError('Enter a valid 16-digit card number.');
      return;
    }
    if (expiryDigits.length !== 4) {
      setError('Enter expiry as MM/YY.');
      return;
    }
    const month = Number(expiryDigits.slice(0, 2));
    if (month < 1 || month > 12) {
      setError('Enter a valid expiry month.');
      return;
    }
    if (cvcDigits.length < 3) {
      setError('Enter a valid CVC.');
      return;
    }

    const draft = { cardName, cardNumber, expiry, cvc };
    saveCardDraft(order.orderId, draft);
    sessionStorage.setItem(cardReadyKey(order.orderId), '1');

    try {
      await saveCheckoutDetails({
        cardName: cardName.trim(),
        cardNumber: digits,
        cardExpiry: `${expiryDigits.slice(0, 2)}/${expiryDigits.slice(2)}`,
      });
    } catch {
      // Continue checkout even if preference save fails.
    }

    navigate(`/checkout/confirm?orderId=${order.orderId}`);
  }

  return (
    <PublicShell>
      <main className="container home-container checkout-page">
        <div className="checkout-page__header">
          <div>
            <p className="checkout-page__eyebrow">Payment</p>
            <h1>Card details</h1>
            <p>
              Enter your card information to continue. No real charge is made.
              Saved details will be reused next time.
            </p>
          </div>
        </div>

        {loading && <p>Loading payment...</p>}
        {!loading && error && !order && (
          <div className="checkout-empty">
            <h2>Payment unavailable</h2>
            <p className="cart-page__error">{error}</p>
            <Link to="/orders" className="btn btn-secondary">
              My orders
            </Link>
          </div>
        )}

        {!loading && order && (
          <form
            className="checkout-layout"
            onSubmit={(e) => void handleSubmit(e)}
          >
            <section className="checkout-card">
              <h2>Visa / card details</h2>
              {error && <div className="cart-page__error">{error}</div>}

              <div className="form-group">
                <label htmlFor="card-name">Name on card</label>
                <input
                  id="card-name"
                  value={cardName}
                  onChange={(event) => setCardName(event.target.value)}
                  placeholder="Full name"
                  autoComplete="cc-name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="card-number">Card number</label>
                <input
                  id="card-number"
                  value={cardNumber}
                  onChange={(event) =>
                    setCardNumber(formatCardNumber(event.target.value))
                  }
                  placeholder="ACCT-000003"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  required
                />
              </div>

              <div className="checkout-card-row">
                <div className="form-group">
                  <label htmlFor="card-expiry">Expiry</label>
                  <input
                    id="card-expiry"
                    value={expiry}
                    onChange={(event) =>
                      setExpiry(formatExpiry(event.target.value))
                    }
                    placeholder="MM/YY"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="card-cvc">CVC</label>
                  <input
                    id="card-cvc"
                    value={cvc}
                    onChange={(event) =>
                      setCvc(onlyDigits(event.target.value).slice(0, 4))
                    }
                    placeholder="123"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    required
                  />
                </div>
              </div>
            </section>

            <aside className="checkout-summary checkout-card">
              <h2>Amount due</h2>
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
                This is a simulated payment for demo purposes. CVC is never
                saved.
              </p>
              <button
                type="submit"
                className="btn btn-primary checkout-summary__pay"
              >
                Continue to confirmation
              </button>
            </aside>
          </form>
        )}
      </main>
    </PublicShell>
  );
}
