export type PromotionOfferType =
  | 'CATEGORY_BOOST'
  | 'SEARCH_BOOST'
  | 'HOME_SPOTLIGHT'
  | 'PACK'
  | 'AI_BOOST';

export type PromotionStatus =
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELLED';

export interface PromotionOffer {
  offerId: string;
  offerType: PromotionOfferType;
  name: string;
  description: string | null;
  defaultPrice: number | string;
  defaultDurationDays: number;
  isActive: boolean;
}

export interface PromotionPriceOverride {
  overrideId: string;
  offerType: PromotionOfferType;
  productId: string | null;
  price: number | string;
  durationDays: number | null;
  reason: string;
  isActive: boolean;
  createdAt: string;
  product?: { productId: string; name: string } | null;
}

export interface PromotionCampaign {
  campaignId: string;
  companyId: string;
  companyName: string;
  offerType: PromotionOfferType;
  status: PromotionStatus;
  durationDays: number;
  unitPrice: number;
  totalPrice: number;
  priceOverrideReason: string | null;
  paidAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  products: Array<{
    productId: string;
    name: string;
    price: number | null;
    images: string[] | null;
  }>;
}

export interface PromotionQuote {
  offerType: PromotionOfferType;
  offerName: string;
  productIds: string[];
  unitPrice: number;
  totalPrice: number;
  defaultDurationDays: number;
  durationOptions: number[];
  overrideReason: string | null;
  usedOverride: boolean;
}

export interface AdminPromotionRevenue {
  total: number;
  thisMonth: number;
  paidCampaigns: number;
  byOfferType: Array<{
    offerType: PromotionOfferType;
    amount: number;
  }>;
  payments: PromotionCampaign[];
}
