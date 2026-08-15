import { authFetch } from '../config/api';
import type {
  AdminPromotionRevenue,
  PromotionCampaign,
  PromotionOffer,
  PromotionOfferType,
  PromotionPriceOverride,
  PromotionQuote,
} from '../types/promotion';

export function getAdminPromotionOffers() {
  return authFetch<PromotionOffer[]>('/admin/promotions/offers');
}

export function updateAdminPromotionOffer(
  offerId: string,
  payload: Partial<{
    name: string;
    description: string;
    defaultPrice: number;
    defaultDurationDays: number;
    isActive: boolean;
  }>,
) {
  return authFetch<PromotionOffer>(`/admin/promotions/offers/${offerId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function getAdminPromotionOverrides() {
  return authFetch<PromotionPriceOverride[]>('/admin/promotions/overrides');
}

export function createAdminPromotionOverride(payload: {
  offerType: PromotionOfferType;
  productId?: string | null;
  price: number;
  durationDays?: number;
  reason: string;
}) {
  return authFetch<PromotionPriceOverride>('/admin/promotions/overrides', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deactivateAdminPromotionOverride(overrideId: string) {
  return authFetch<PromotionPriceOverride>(
    `/admin/promotions/overrides/${overrideId}/deactivate`,
    { method: 'POST' },
  );
}

export function getAdminPromotionCampaigns() {
  return authFetch<PromotionCampaign[]>('/admin/promotions/campaigns');
}

export function getAdminPromotionRevenue() {
  return authFetch<AdminPromotionRevenue>('/admin/promotions/revenue');
}

export function getCompanyPromotionOffers() {
  return authFetch<PromotionOffer[]>('/company/promotions/offers');
}

export function quoteCompanyPromotion(payload: {
  offerType: PromotionOfferType;
  productIds: string[];
}) {
  return authFetch<PromotionQuote>('/company/promotions/quote', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getCompanyPromotionCampaigns() {
  return authFetch<PromotionCampaign[]>('/company/promotions/campaigns');
}

export function createCompanyPromotionCampaign(payload: {
  offerType: PromotionOfferType;
  productIds: string[];
  durationDays: number;
}) {
  return authFetch<PromotionCampaign>('/company/promotions/campaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function confirmCompanyPromotionPayment(campaignId: string) {
  return authFetch<PromotionCampaign>(
    `/company/promotions/campaigns/${campaignId}/confirm-payment`,
    { method: 'POST' },
  );
}

export function cancelCompanyPromotionCampaign(campaignId: string) {
  return authFetch<PromotionCampaign>(
    `/company/promotions/campaigns/${campaignId}/cancel`,
    { method: 'POST' },
  );
}
