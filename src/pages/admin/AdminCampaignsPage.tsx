import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { AdminProduct } from '../../types/admin';
import type {
  PromotionCampaign,
  PromotionOffer,
  PromotionOfferType,
  PromotionPriceOverride,
} from '../../types/promotion';
import { getAdminProducts } from '../../services/admin.service';
import {
  createAdminPromotionOverride,
  deactivateAdminPromotionOverride,
  getAdminPromotionCampaigns,
  getAdminPromotionOffers,
  getAdminPromotionOverrides,
  updateAdminPromotionOffer,
} from '../../services/promotions.service';
import { useConfirm } from '../../context/ConfirmContext';

function money(value: number | string) {
  return `${Number(value).toFixed(2)} TND`;
}

export function AdminCampaignsPage() {
  const { confirm } = useConfirm();
  const [offers, setOffers] = useState<PromotionOffer[]>([]);
  const [overrides, setOverrides] = useState<PromotionPriceOverride[]>([]);
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [overrideForm, setOverrideForm] = useState({
    offerType: 'CATEGORY_BOOST' as PromotionOfferType,
    productId: '',
    price: '',
    durationDays: '',
    reason: '',
  });
  const [savingOfferId, setSavingOfferId] = useState<string | null>(null);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    name: string;
    defaultPrice: string;
    defaultDurationDays: number;
    isActive: boolean;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [offerData, overrideData, campaignData, productData] =
        await Promise.all([
          getAdminPromotionOffers(),
          getAdminPromotionOverrides(),
          getAdminPromotionCampaigns(),
          getAdminProducts(),
        ]);
      setOffers(offerData);
      setOverrides(overrideData);
      setCampaigns(campaignData);
      setProducts(productData.filter((p) => p.verificationStatus === 'APPROVED'));
    } catch {
      setError('Failed to load campaigns module.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEditOffer(offer: PromotionOffer) {
    setEditingOfferId(offer.offerId);
    setEditDraft({
      name: offer.name,
      defaultPrice: String(Number(offer.defaultPrice)),
      defaultDurationDays: offer.defaultDurationDays,
      isActive: offer.isActive,
    });
    setSuccess('');
    setError('');
  }

  function cancelEditOffer() {
    setEditingOfferId(null);
    setEditDraft(null);
  }

  async function saveOffer(offerId: string) {
    if (!editDraft) return;
    setSavingOfferId(offerId);
    setError('');
    try {
      const updated = await updateAdminPromotionOffer(offerId, {
        name: editDraft.name.trim(),
        defaultPrice: Number(editDraft.defaultPrice),
        defaultDurationDays: editDraft.defaultDurationDays,
        isActive: editDraft.isActive,
      });
      setOffers((prev) =>
        prev.map((item) =>
          item.offerId === updated.offerId ? updated : item,
        ),
      );
      setEditingOfferId(null);
      setEditDraft(null);
      setSuccess('Offer updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update offer.');
    } finally {
      setSavingOfferId(null);
    }
  }

  async function handleCreateOverride(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      const created = await createAdminPromotionOverride({
        offerType: overrideForm.offerType,
        productId: overrideForm.productId || null,
        price: Number(overrideForm.price),
        durationDays: overrideForm.durationDays
          ? Number(overrideForm.durationDays)
          : undefined,
        reason: overrideForm.reason.trim(),
      });
      setOverrides((prev) => [created, ...prev]);
      setOverrideForm({
        offerType: 'CATEGORY_BOOST',
        productId: '',
        price: '',
        durationDays: '',
        reason: '',
      });
      setSuccess('Price override saved (reason recorded).');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create override.',
      );
    }
  }

  async function handleDeactivate(override: PromotionPriceOverride) {
    const ok = await confirm({
      title: 'Deactivate override?',
      message: 'This price override will no longer apply.',
      confirmLabel: 'Deactivate',
      danger: true,
    });
    if (!ok) return;
    try {
      const updated = await deactivateAdminPromotionOverride(
        override.overrideId,
      );
      setOverrides((prev) =>
        prev.map((item) =>
          item.overrideId === updated.overrideId ? updated : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to deactivate override.',
      );
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Sponsored campaigns</h1>
        <div className="admin-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Sponsored campaigns</h1>
      <p className="admin-page-subtitle">
        Set offer prices and durations, create justified overrides, and track
        active company promotions.
      </p>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <div className="admin-page-card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Offer defaults</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Offer</th>
                <th>Price</th>
                <th>Default days</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => {
                const isEditing = editingOfferId === offer.offerId;

                return (
                  <tr key={offer.offerId}>
                    <td>
                      {isEditing && editDraft ? (
                        <input
                          value={editDraft.name}
                          onChange={(e) =>
                            setEditDraft((prev) =>
                              prev
                                ? { ...prev, name: e.target.value }
                                : prev,
                            )
                          }
                        />
                      ) : (
                        <strong>{offer.name}</strong>
                      )}
                      <div className="admin-muted" style={{ fontSize: 12 }}>
                        {offer.offerType}
                      </div>
                    </td>
                    <td>
                      {isEditing && editDraft ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={editDraft.defaultPrice}
                          onChange={(e) =>
                            setEditDraft((prev) =>
                              prev
                                ? { ...prev, defaultPrice: e.target.value }
                                : prev,
                            )
                          }
                        />
                      ) : (
                        money(offer.defaultPrice)
                      )}
                    </td>
                    <td>
                      {isEditing && editDraft ? (
                        <input
                          type="number"
                          min={1}
                          value={editDraft.defaultDurationDays}
                          onChange={(e) =>
                            setEditDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    defaultDurationDays: Number(
                                      e.target.value,
                                    ),
                                  }
                                : prev,
                            )
                          }
                        />
                      ) : (
                        `${offer.defaultDurationDays} days`
                      )}
                    </td>
                    <td>
                      {isEditing && editDraft ? (
                        <label className="admin-checkbox-row">
                          <input
                            type="checkbox"
                            checked={editDraft.isActive}
                            onChange={(e) =>
                              setEditDraft((prev) =>
                                prev
                                  ? { ...prev, isActive: e.target.checked }
                                  : prev,
                              )
                            }
                          />
                          Active
                        </label>
                      ) : (
                        <span
                          className={`admin-badge admin-badge--${
                            offer.isActive ? 'approved' : 'rejected'
                          }`}
                        >
                          {offer.isActive ? 'active' : 'off'}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="admin-table__actions">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="admin-btn-sm admin-btn-sm--primary"
                              disabled={savingOfferId === offer.offerId}
                              onClick={() => void saveOffer(offer.offerId)}
                            >
                              {savingOfferId === offer.offerId
                                ? 'Saving...'
                                : 'Save'}
                            </button>
                            <button
                              type="button"
                              className="admin-btn-sm"
                              disabled={savingOfferId === offer.offerId}
                              onClick={cancelEditOffer}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="admin-btn-sm admin-btn-sm--primary"
                            disabled={editingOfferId !== null}
                            onClick={() => startEditOffer(offer)}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-page-card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>
          Price override (reason required)
        </h2>
        <form className="admin-form-grid" onSubmit={handleCreateOverride}>
          <div className="form-group">
            <label>Offer</label>
            <select
              value={overrideForm.offerType}
              onChange={(e) =>
                setOverrideForm((p) => ({
                  ...p,
                  offerType: e.target.value as PromotionOfferType,
                }))
              }
            >
              {offers.map((offer) => (
                <option key={offer.offerType} value={offer.offerType}>
                  {offer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Product (optional)</label>
            <select
              value={overrideForm.productId}
              onChange={(e) =>
                setOverrideForm((p) => ({ ...p, productId: e.target.value }))
              }
            >
              <option value="">Whole offer</option>
              {products.map((product) => (
                <option key={product.productId} value={product.productId}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Price (TND)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={overrideForm.price}
              onChange={(e) =>
                setOverrideForm((p) => ({ ...p, price: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Duration days (optional)</label>
            <input
              type="number"
              min={1}
              value={overrideForm.durationDays}
              onChange={(e) =>
                setOverrideForm((p) => ({
                  ...p,
                  durationDays: e.target.value,
                }))
              }
            />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Reason</label>
            <textarea
              rows={2}
              value={overrideForm.reason}
              onChange={(e) =>
                setOverrideForm((p) => ({ ...p, reason: e.target.value }))
              }
              required
              minLength={5}
              placeholder="Why is this price different?"
            />
          </div>
          <div className="form-group" style={{ alignSelf: 'end' }}>
            <button type="submit" className="btn btn-primary">
              Add override
            </button>
          </div>
        </form>

        <div className="admin-table-wrap" style={{ marginTop: 16 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Offer</th>
                <th>Scope</th>
                <th>Price</th>
                <th>Reason</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {overrides.length === 0 ? (
                <tr>
                  <td colSpan={6}>No overrides yet.</td>
                </tr>
              ) : (
                overrides.map((item) => (
                  <tr key={item.overrideId}>
                    <td>{item.offerType}</td>
                    <td>{item.product?.name ?? 'Whole offer'}</td>
                    <td>{money(item.price)}</td>
                    <td>{item.reason}</td>
                    <td>{item.isActive ? 'Active' : 'Off'}</td>
                    <td>
                      {item.isActive && (
                        <button
                          type="button"
                          className="admin-btn-sm admin-btn-sm--danger"
                          onClick={() => void handleDeactivate(item)}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-page-card">
        <h2 style={{ marginTop: 0, fontSize: 18 }}>All campaigns</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Offer</th>
                <th>Products</th>
                <th>Total</th>
                <th>Status</th>
                <th>Ends</th>
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
                    <td>{campaign.companyName}</td>
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
