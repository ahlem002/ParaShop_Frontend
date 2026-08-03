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
import type { CartResponse } from '../types/cart';
import {
  addCartItem,
  clearCart,
  clearCartCompany,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../services/cart.service';

const EMPTY_CART: CartResponse = { items: [], groups: [], itemCount: 0 };

interface CartContextValue {
  cart: CartResponse;
  loading: boolean;
  error: string;
  refreshCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<CartResponse>;
  setItemQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  clearCompany: (companyId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState<CartResponse>(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'CLIENT') {
      setCart(EMPTY_CART);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getCart();
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load cart');
      setCart(EMPTY_CART);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      const data = await addCartItem(productId, quantity);
      setCart(data);
      return data;
    },
    [],
  );

  const setItemQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      const data = await updateCartItem(cartItemId, quantity);
      setCart(data);
    },
    [],
  );

  const removeItem = useCallback(async (cartItemId: string) => {
    const data = await removeCartItem(cartItemId);
    setCart(data);
  }, []);

  const clearAll = useCallback(async () => {
    const data = await clearCart();
    setCart(data);
  }, []);

  const clearCompany = useCallback(async (companyId: string) => {
    const data = await clearCartCompany(companyId);
    setCart(data);
  }, []);

  const value = useMemo(
    () => ({
      cart,
      loading,
      error,
      refreshCart,
      addItem,
      setItemQuantity,
      removeItem,
      clearAll,
      clearCompany,
    }),
    [
      cart,
      loading,
      error,
      refreshCart,
      addItem,
      setItemQuantity,
      removeItem,
      clearAll,
      clearCompany,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
