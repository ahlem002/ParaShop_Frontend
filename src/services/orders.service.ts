import { authFetch } from '../config/api';
import type {
  AvailableDriverView,
  CheckoutResponse,
  CompanyOrderNextStatus,
  CompanyOrderView,
  DeliveryOrderNextStatus,
  DeliveryOrderView,
  OrderView,
} from '../types/order';

export interface CheckoutPayload {
  shippingAddress: string;
  phoneNumber: string;
  notes?: string;
}

export interface BuyNowPayload extends CheckoutPayload {
  productId: string;
  quantity: number;
}

export function checkoutCompany(companyId: string, payload: CheckoutPayload) {
  return authFetch<CheckoutResponse>('/orders/checkout', {
    method: 'POST',
    body: JSON.stringify({
      companyId,
      shippingAddress: payload.shippingAddress,
      phoneNumber: payload.phoneNumber,
      ...(payload.notes ? { notes: payload.notes } : {}),
    }),
  });
}

export function buyNowCheckout(payload: BuyNowPayload) {
  return authFetch<CheckoutResponse>('/orders/buy-now', {
    method: 'POST',
    body: JSON.stringify({
      productId: payload.productId,
      quantity: payload.quantity,
      shippingAddress: payload.shippingAddress,
      phoneNumber: payload.phoneNumber,
      ...(payload.notes ? { notes: payload.notes } : {}),
    }),
  });
}

export function confirmFakePayment(orderId: string) {
  return authFetch<OrderView>(`/orders/mine/${orderId}/confirm-payment`, {
    method: 'POST',
  });
}

export function getMyOrders() {
  return authFetch<OrderView[]>('/orders/mine');
}

export function getMyOrder(orderId: string) {
  return authFetch<OrderView>(`/orders/mine/${orderId}`);
}

export function verifyMyOrderPayment(orderId: string) {
  return authFetch<OrderView>(`/orders/mine/${orderId}/verify`, {
    method: 'POST',
  });
}

export function deleteMyOrder(orderId: string) {
  return authFetch<{ success: boolean }>(`/orders/mine/${orderId}`, {
    method: 'DELETE',
  });
}

export function cancelMyOrder(orderId: string) {
  return authFetch<OrderView>(`/orders/mine/${orderId}/cancel`, {
    method: 'POST',
  });
}

export function getCompanyOrders() {
  return authFetch<CompanyOrderView[]>('/company/orders');
}

export function getCompanyOrder(orderId: string) {
  return authFetch<CompanyOrderView>(`/company/orders/${orderId}`);
}

export function updateCompanyOrderStatus(
  orderId: string,
  status: CompanyOrderNextStatus,
) {
  return authFetch<CompanyOrderView>(`/company/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function getAvailableDrivers(freeOnly = false) {
  const query = freeOnly ? '?freeOnly=true' : '';
  return authFetch<AvailableDriverView[]>(
    `/company/orders/drivers/available${query}`,
  );
}

export function assignDriverToOrder(orderId: string, deliveryUserId: string) {
  return authFetch<CompanyOrderView>(
    `/company/orders/${orderId}/assign-driver`,
    {
      method: 'POST',
      body: JSON.stringify({ deliveryUserId }),
    },
  );
}

export function getDeliveryOrders(scope: 'active' | 'history' | 'all' = 'all') {
  return authFetch<DeliveryOrderView[]>(
    `/delivery/orders?scope=${scope}`,
  );
}

export function getDeliveryOrder(orderId: string) {
  return authFetch<DeliveryOrderView>(`/delivery/orders/${orderId}`);
}

export function updateDeliveryOrderStatus(
  orderId: string,
  status: DeliveryOrderNextStatus,
  note?: string,
) {
  return authFetch<DeliveryOrderView>(`/delivery/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      ...(note ? { note } : {}),
    }),
  });
}

export function rateDelivery(
  orderId: string,
  rating: number,
  comment?: string,
) {
  return authFetch<{
    ratingId: string;
    orderId: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  }>(`/orders/mine/${orderId}/rate-delivery`, {
    method: 'POST',
    body: JSON.stringify({
      rating,
      ...(comment ? { comment } : {}),
    }),
  });
}
