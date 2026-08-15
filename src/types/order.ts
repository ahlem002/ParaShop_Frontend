export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PAYMENT_FAILED'
  | 'CANCELLED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'RETURNED';

export interface OrderItemView {
  orderItemId: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderClientView {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
}

export interface OrderDeliveryView {
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
}

export type CompanyOrderNextStatus = 'PROCESSING';

export type DeliveryOrderNextStatus = 'DELIVERED' | 'RETURNED';

export interface OrderView {
  orderId: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  trackingId: string;
  flouciPaymentId: string | null;
  shippingAddress: string | null;
  shippingPhone?: string | null;
  deliveryNote?: string | null;
  deliveredAt?: string | null;
  returnedAt?: string | null;
  paidAt: string | null;
  createdAt: string;
  delivery?: OrderDeliveryView | null;
  company: {
    companyId: string;
    companyName: string;
    address?: string | null;
    phoneNumber?: string | null;
  };
  items: OrderItemView[];
  paymentVerified?: boolean;
  paymentStatus?: string;
  canRateDelivery?: boolean;
  myDeliveryRating?: { rating: number; comment: string | null } | null;
}

export interface CompanyOrderView extends OrderView {
  client: OrderClientView;
  nextStatuses: CompanyOrderNextStatus[];
  canAssignDriver?: boolean;
}

export interface DeliveryOrderView extends OrderView {
  client: OrderClientView;
  canMarkDelivered?: boolean;
  canMarkReturned?: boolean;
}

export interface AvailableDriverView {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  isFree: boolean;
  averageRating: number | null;
  ratingCount: number;
  recentNotes: {
    rating: number;
    comment: string | null;
    createdAt: string;
  }[];
}

export interface CheckoutResponse {
  orderId: string;
  trackingId: string;
  total: number;
  amountMillimes: number;
  paymentId: string | null;
  paymentUrl: string | null;
  company: {
    companyId: string;
    companyName: string;
  };
}
