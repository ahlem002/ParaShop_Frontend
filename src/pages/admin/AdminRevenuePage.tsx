import { useCallback, useEffect, useState } from 'react';
import { Megaphone, TrendingUp, Wallet } from 'lucide-react';
import type { AdminPromotionRevenue } from '../../types/promotion';
import { getAdminPromotionRevenue } from '../../services/promotions.service';

function money(value: number | string) {
  return `${Number(value).toFixed(2)} TND`;
}

function offerLabel(offerType: string) {
  switch (offerType) {
    case 'CATEGORY_BOOST':
      return 'Category boost';
    case 'SEARCH_BOOST':
      return 'Search boost';
    case 'HOME_SPOTLIGHT':
      return 'Home spotlight';
    case 'PACK':
      return 'Product pack';
    case 'AI_BOOST':
      return 'AI assistant boost';
    default:
      return offerType;
  }
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function AdminRevenuePage() {
  const [data, setData] = useState<AdminPromotionRevenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const revenue = await getAdminPromotionRevenue();
      setData(revenue);
    } catch {
      setError('Failed to load promotion revenue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Revenue</h1>
        <p className="admin-page-subtitle">Loading…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Revenue</h1>
        <p className="admin-page-subtitle">{error || 'No data available.'}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Revenue</h1>
      <p className="admin-page-subtitle">
        Platform earnings from company-paid promotion campaigns.
      </p>

      <div className="admin-stat-grid">
        <article className="admin-stat-card">
          <div className="admin-stat-card__icon">
            <Wallet size={20} strokeWidth={2} />
          </div>
          <p className="admin-stat-card__label">Total promotions</p>
          <p className="admin-stat-card__value admin-stat-card__value--sm">
            {money(data.total)}
          </p>
          <p className="admin-stat-card__meta">
            {data.paidCampaigns} paid campaign
            {data.paidCampaigns === 1 ? '' : 's'}
          </p>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-card__icon">
            <TrendingUp size={20} strokeWidth={2} />
          </div>
          <p className="admin-stat-card__label">This month</p>
          <p className="admin-stat-card__value admin-stat-card__value--sm">
            {money(data.thisMonth)}
          </p>
          <p className="admin-stat-card__meta">Payments in the current month</p>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-card__icon">
            <Megaphone size={20} strokeWidth={2} />
          </div>
          <p className="admin-stat-card__label">Offer types</p>
          <p className="admin-stat-card__value">{data.byOfferType.length}</p>
          <p className="admin-stat-card__meta">Breakdown below</p>
        </article>
      </div>

      {data.byOfferType.length > 0 && (
        <section className="admin-page-card" style={{ marginTop: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>By offer type</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Offer</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.byOfferType.map((row) => (
                  <tr key={row.offerType}>
                    <td>{offerLabel(row.offerType)}</td>
                    <td>{money(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="admin-page-card" style={{ marginTop: 20 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Promotion payments</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Offer</th>
                <th>Products</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid on</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.length === 0 ? (
                <tr>
                  <td colSpan={6}>No promotion payments yet.</td>
                </tr>
              ) : (
                data.payments.map((payment) => (
                  <tr key={payment.campaignId}>
                    <td>{payment.companyName}</td>
                    <td>{offerLabel(payment.offerType)}</td>
                    <td>
                      {payment.products.map((p) => p.name).join(', ') || '—'}
                    </td>
                    <td>{money(payment.totalPrice)}</td>
                    <td>{payment.status}</td>
                    <td>{formatDate(payment.paidAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
