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

export interface OrderClientView {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
}

export type CompanyOrderNextStatus = 'PROCESSING' | 'SHIPPED' | 'DELIVERED';

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

export interface CompanyOrderView extends OrderView {
  client: OrderClientView;
  nextStatuses: CompanyOrderNextStatus[];
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
