import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import type { FavoritesResponse } from '../types/favorite';
import {
  getFavorites,
  removeFavorite,
  toggleFavorite,
} from '../services/favorites.service';

const EMPTY: FavoritesResponse = { items: [], count: 0, productIds: [] };

interface FavoritesContextValue {
  favorites: FavoritesResponse;
  loading: boolean;
  error: string;
  isFavorite: (productId: string) => boolean;
  refreshFavorites: () => Promise<void>;
  toggle: (productId: string) => Promise<FavoritesResponse>;
  remove: (productId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [favorites, setFavorites] = useState<FavoritesResponse>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'CLIENT') {
      setFavorites(EMPTY);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load favorites');
      setFavorites(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);

  const isFavorite = useCallback(
    (productId: string) => favorites.productIds.includes(productId),
    [favorites.productIds],
  );

  const toggle = useCallback(async (productId: string) => {
    const data = await toggleFavorite(productId);
    setFavorites(data);
    return data;
  }, []);

  const remove = useCallback(async (productId: string) => {
    const data = await removeFavorite(productId);
    setFavorites(data);
  }, []);

  const value = useMemo(
    () => ({
      favorites,
      loading,
      error,
      isFavorite,
      refreshFavorites,
      toggle,
      remove,
    }),
    [favorites, loading, error, isFavorite, refreshFavorites, toggle, remove],
  );

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
