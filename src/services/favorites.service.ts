import { authFetch } from '../config/api';
import type { FavoritesResponse } from '../types/favorite';

export function getFavorites() {
  return authFetch<FavoritesResponse>('/favorites');
}

export function addFavorite(productId: string) {
  return authFetch<FavoritesResponse>('/favorites', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
}

export function toggleFavorite(productId: string) {
  return authFetch<FavoritesResponse>('/favorites/toggle', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
}

export function removeFavorite(productId: string) {
  return authFetch<FavoritesResponse>(`/favorites/${productId}`, {
    method: 'DELETE',
  });
}
