import type { PublicProduct } from './product';

export interface FavoriteItem {
  favoriteId: string;
  createdAt: string;
  product: PublicProduct;
}

export interface FavoritesResponse {
  items: FavoriteItem[];
  count: number;
  productIds: string[];
}
