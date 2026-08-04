export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PAYMENT_FAILED'
  | 'CANCELLED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED';

export interface OrderItemView {
  orderItemId: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

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
  paidAt: string | null;
  createdAt: string;
  company: {
    companyId: string;
    companyName: string;
  };
  items: OrderItemView[];
  paymentVerified?: boolean;
  paymentStatus?: string;
}

export interface CheckoutResponse {
  orderId: string;
  trackingId: string;
  total: number;
  amountMillimes: number;
  paymentId: string;
  paymentUrl: string;
  company: {
    companyId: string;
    companyName: string;
  };
}
