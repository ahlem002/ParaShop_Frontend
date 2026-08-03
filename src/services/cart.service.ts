import { authFetch } from '../config/api';
import type { CartResponse } from '../types/cart';

export function getCart() {
  return authFetch<CartResponse>('/cart');
}

export function addCartItem(productId: string, quantity = 1) {
  return authFetch<CartResponse>('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });
}

export function updateCartItem(cartItemId: string, quantity: number) {
  return authFetch<CartResponse>(`/cart/items/${cartItemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
}

export function removeCartItem(cartItemId: string) {
  return authFetch<CartResponse>(`/cart/items/${cartItemId}`, {
    method: 'DELETE',
  });
}

export function clearCart() {
  return authFetch<CartResponse>('/cart', { method: 'DELETE' });
}

export function clearCartCompany(companyId: string) {
  return authFetch<CartResponse>(`/cart/company/${companyId}`, {
    method: 'DELETE',
  });
}
