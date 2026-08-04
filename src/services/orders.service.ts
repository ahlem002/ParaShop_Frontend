import { authFetch } from '../config/api';
import type { CheckoutResponse, OrderView } from '../types/order';

export interface CheckoutPayload {
  shippingAddress: string;
  phoneNumber: string;
  notes?: string;
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
