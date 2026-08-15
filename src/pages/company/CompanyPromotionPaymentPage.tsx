import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  confirmCompanyPromotionPayment,
  getCompanyPromotionCampaigns,
} from '../../services/promotions.service';
import type { PromotionCampaign } from '../../types/promotion';

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

export function CompanyPromotionPaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId') ?? '';
  const [campaign, setCampaign] = useState<PromotionCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!campaignId) {
        setError('Missing campaign.');
        setLoading(false);
        return;
      }
      try {
        const list = await getCompanyPromotionCampaigns();
        const found = list.find((item) => item.campaignId === campaignId);
        if (!cancelled) {
          if (!found) setError('Campaign not found.');
          else if (found.status === 'ACTIVE') {
            navigate('/company/promotions', { replace: true });
          } else setCampaign(found);
        }
      } catch {
        if (!cancelled) setError('Could not load campaign.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [campaignId, navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!campaign) return;
    if (onlyDigits(cardNumber).length < 16 || onlyDigits(cvc).length < 3) {
      setError('Enter a valid card number and CVC (demo payment).');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await confirmCompanyPromotionPayment(campaign.campaignId);
      navigate('/company/promotions', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading payment...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="admin-page">
        <div className="admin-error">{error || 'Campaign not found.'}</div>
        <Link to="/company/promotions">Back</Link>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Pay for promotion</h1>
      <p className="admin-page-subtitle">
        Demo card payment — {campaign.offerType} for{' '}
        {campaign.products.map((p) => p.name).join(', ')}
      </p>
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-page-card" style={{ maxWidth: 480 }}>
        <p>
          <strong>Total:</strong> {formatPrice(campaign.totalPrice)}
        </p>
        <p>
          <strong>Duration:</strong> {campaign.durationDays} days
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="promo-card-name">Name on card</label>
            <input
              id="promo-card-name"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="promo-card-number">Card number</label>
            <input
              id="promo-card-number"
              value={cardNumber}
              onChange={(e) =>
                setCardNumber(formatCardNumber(e.target.value))
              }
              placeholder="4242 4242 4242 4242"
              required
            />
          </div>
          <div className="admin-form-grid">
            <div className="form-group">
              <label htmlFor="promo-expiry">Expiry</label>
              <input
                id="promo-expiry"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="promo-cvc">CVC</label>
              <input
                id="promo-cvc"
                value={cvc}
                onChange={(e) => setCvc(onlyDigits(e.target.value).slice(0, 4))}
                required
              />
            </div>
          </div>
          <div className="admin-modal__actions">
            <Link to="/company/promotions" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Paying...' : `Pay ${formatPrice(campaign.totalPrice)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
