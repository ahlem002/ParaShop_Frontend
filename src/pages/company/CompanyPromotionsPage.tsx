import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CompanyProduct } from '../../types/product';
import type {
  PromotionCampaign,
  PromotionOffer,
  PromotionOfferType,
  PromotionQuote,
} from '../../types/promotion';
import { getCompanyProducts } from '../../services/products.service';
import {
  cancelCompanyPromotionCampaign,
  createCompanyPromotionCampaign,
  getCompanyPromotionCampaigns,
  getCompanyPromotionOffers,
  quoteCompanyPromotion,
} from '../../services/promotions.service';
import { useConfirm } from '../../context/ConfirmContext';

function money(value: number | string) {
  return `${Number(value).toFixed(2)} TND`;
}

export function CompanyPromotionsPage() {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [offers, setOffers] = useState<PromotionOffer[]>([]);
  const [products, setProducts] = useState<CompanyProduct[]>([]);
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offerType, setOfferType] =
    useState<PromotionOfferType>('CATEGORY_BOOST');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState(7);
  const [quote, setQuote] = useState<PromotionQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [creating, setCreating] = useState(false);

  const approved = useMemo(
    () => products.filter((p) => p.verificationStatus === 'APPROVED'),
    [products],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [offerData, productData, campaignData] = await Promise.all([
        getCompanyPromotionOffers(),
        getCompanyProducts(),
        getCompanyPromotionCampaigns(),
      ]);
      setOffers(offerData.filter((o) => o.isActive));
      setProducts(productData);
      setCampaigns(campaignData);
      if (offerData[0]) {
        setOfferType(offerData[0].offerType);
        setDurationDays(offerData[0].defaultDurationDays);
      }
    } catch {
      setError('Failed to load promotions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleProduct(productId: string) {
    setSelectedIds((prev) => {
      if (offerType === 'PACK') {
        return prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId];
      }
      return [productId];
    });
    setQuote(null);
  }

  async function handleQuote() {
    setQuoting(true);
    setError('');
    try {
      const data = await quoteCompanyPromotion({
        offerType,
        productIds: selectedIds,
      });
      setQuote(data);
      setDurationDays(data.defaultDurationDays);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get price.');
      setQuote(null);
    } finally {
      setQuoting(false);
    }
  }

  async function handleCheckout(event: FormEvent) {
    event.preventDefault();
    if (selectedIds.length === 0) {
      setError('Select at least one product.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const campaign = await createCompanyPromotionCampaign({
        offerType,
        productIds: selectedIds,
        durationDays,
      });
      navigate(`/company/promotions/pay?campaignId=${campaign.campaignId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not start promotion.',
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleCancel(campaign: PromotionCampaign) {
    const ok = await confirm({
      title: 'Cancel unpaid campaign?',
      message: 'This promotion will be cancelled.',
      confirmLabel: 'Cancel campaign',
      danger: true,
    });
    if (!ok) return;
    try {
      const updated = await cancelCompanyPromotionCampaign(campaign.campaignId);
      setCampaigns((prev) =>
        prev.map((item) =>
          item.campaignId === updated.campaignId ? updated : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed.');
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Promote products</h1>
        <div className="admin-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Promote products</h1>
      <p className="admin-page-subtitle">
        Sponsor approved products to appear first on home, category, or search.
        Packs need 2+ products.
      </p>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-page-card" style={{ marginBottom: 16 }}>
        <form onSubmit={handleCheckout}>
          <div className="admin-form-grid">
            <div className="form-group">
              <label htmlFor="promo-offer">Offer</label>
              <select
                id="promo-offer"
                value={offerType}
                onChange={(e) => {
                  setOfferType(e.target.value as PromotionOfferType);
                  setSelectedIds([]);
                  setQuote(null);
                }}
              >
                {offers.map((offer) => (
                  <option key={offer.offerType} value={offer.offerType}>
                    {offer.name} — {money(offer.defaultPrice)}
                  </option>
                ))}
              </select>
              {offers.find((o) => o.offerType === offerType)?.description ? (
                <p
                  style={{
                    margin: '8px 0 0',
                    fontSize: 13,
                    color: 'var(--muted, #64748b)',
                  }}
                >
                  {offers.find((o) => o.offerType === offerType)?.description}
                </p>
              ) : null}
            </div>
            <div className="form-group">
              <label htmlFor="promo-days">Duration (days)</label>
              <select
                id="promo-days"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
              >
                {[7, 14, 30]
                  .concat(quote ? [quote.defaultDurationDays] : [])
                  .filter((v, i, arr) => arr.indexOf(v) === i)
                  .sort((a, b) => a - b)
                  .map((days) => (
                    <option key={days} value={days}>
                      {days} days
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <p style={{ marginTop: 12 }}>
            Select product{offerType === 'PACK' ? 's' : ''}:
          </p>
          {approved.length === 0 ? (
            <div className="admin-empty">
              No approved products yet. Wait for admin validation.
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.map((product) => (
                    <tr key={product.productId}>
                      <td>
                        <input
                          type={offerType === 'PACK' ? 'checkbox' : 'radio'}
                          name="promo-product"
                          checked={selectedIds.includes(product.productId)}
                          onChange={() => toggleProduct(product.productId)}
                        />
                      </td>
                      <td>{product.name}</td>
                      <td>{money(product.price)}</td>
                      <td>{product.category?.name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="company-order-card__actions" style={{ marginTop: 14 }}>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={quoting || selectedIds.length === 0}
              onClick={() => void handleQuote()}
            >
              {quoting ? 'Checking...' : 'Get price'}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating || selectedIds.length === 0}
            >
              {creating ? 'Creating...' : 'Pay & promote'}
            </button>
          </div>

          {quote && (
            <div className="admin-success" style={{ marginTop: 12 }}>
              {quote.offerName}: <strong>{money(quote.totalPrice)}</strong>
              {quote.usedOverride && quote.overrideReason
                ? ` (special price: ${quote.overrideReason})`
                : ''}
            </div>
          )}
        </form>
      </div>

      <div className="admin-page-card">
        <h2 style={{ marginTop: 0, fontSize: 18 }}>My campaigns</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Offer</th>
                <th>Products</th>
                <th>Total</th>
                <th>Status</th>
                <th>Ends</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6}>No campaigns yet.</td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign.campaignId}>
                    <td>{campaign.offerType}</td>
                    <td>
                      {campaign.products.map((p) => p.name).join(', ')}
                    </td>
                    <td>{money(campaign.totalPrice)}</td>
                    <td>{campaign.status}</td>
                    <td>
                      {campaign.endsAt
                        ? new Date(campaign.endsAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      {campaign.status === 'PENDING_PAYMENT' && (
                        <>
                          <button
                            type="button"
                            className="admin-btn-sm admin-btn-sm--primary"
                            onClick={() =>
                              navigate(
                                `/company/promotions/pay?campaignId=${campaign.campaignId}`,
                              )
                            }
                          >
                            Pay
                          </button>{' '}
                          <button
                            type="button"
                            className="admin-btn-sm admin-btn-sm--danger"
                            onClick={() => void handleCancel(campaign)}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
