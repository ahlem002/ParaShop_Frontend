import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ShoppingCart } from 'lucide-react';
import { PublicShell } from '../components/layout/PublicShell';
import { useCart } from '../context/CartContext';
import { useConfirm } from '../context/ConfirmContext';
import { useFavorites } from '../context/FavoritesContext';
import { resolveUploadUrl } from '../config/api';
import '../styles/pages/cart.css';
import '../styles/pages/favorites.css';

function formatPrice(value: number) {
  return `${value.toFixed(2)} TND`;
}

export function FavoritesPage() {
  const navigate = useNavigate();
  const { favorites, loading, error, toggle, remove } = useFavorites();
  const { addItem } = useCart();
  const { confirm } = useConfirm();
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');
  const [buyMessage, setBuyMessage] = useState('');

  async function handleUnfavorite(productId: string, productName: string) {
    const ok = await confirm({
      title: 'Remove from favorites?',
      message: `Remove “${productName}” from your favorites?`,
      confirmLabel: 'Remove',
      cancelLabel: 'Keep',
      danger: true,
    });
    if (!ok) return;

    setBusyId(productId);
    setActionError('');
    try {
      await remove(productId);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not update favorites',
      );
    } finally {
      setBusyId('');
    }
  }

  async function handleBuy(productId: string) {
    setBusyId(productId);
    setActionError('');
    setBuyMessage('');
    try {
      await addItem(productId, 1);
      setBuyMessage('Added to cart');
      navigate('/cart');
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not add to cart',
      );
    } finally {
      setBusyId('');
    }
  }

  async function handleToggleHeart(productId: string) {
    setBusyId(productId);
    setActionError('');
    try {
      await toggle(productId);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not update favorites',
      );
    } finally {
      setBusyId('');
    }
  }

  return (
    <PublicShell>
      <main className="container home-container cart-page">
        <div className="cart-page__header">
          <div>
            <h1>Favorites</h1>
            <p>Products you saved with the heart. Buy them or remove anytime.</p>
          </div>
        </div>

        {(error || actionError) && (
          <div className="cart-page__error">{actionError || error}</div>
        )}
        {buyMessage && <div className="favorites-toast">{buyMessage}</div>}

        {loading && favorites.items.length === 0 && <p>Loading favorites...</p>}

        {!loading && favorites.items.length === 0 && (
          <div className="cart-empty">
            <Heart size={40} strokeWidth={1.5} />
            <h2>No favorites yet</h2>
            <p>Tap the heart on a product card to save it here.</p>
            <Link to="/products" className="btn btn-primary">
              Browse products
            </Link>
          </div>
        )}

        <div className="products-grid">
          {favorites.items.map(({ favoriteId, product }) => {
            const image = resolveUploadUrl(product.images?.[0] ?? null);
            const price = Number(product.price);
            const busy = busyId === product.productId;

            return (
              <article key={favoriteId} className="product-card shop-line-card">
                <div className="shop-line-card__media">
                  <button
                    type="button"
                    className="wishlist-btn is-active"
                    aria-label="Remove from favorites"
                    disabled={busy}
                    onClick={() => void handleToggleHeart(product.productId)}
                  >
                    <Heart size={14} strokeWidth={2} fill="currentColor" />
                  </button>
                  <Link to={`/products/${product.productId}`}>
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        className="product-img-placeholder"
                      />
                    ) : (
                      <div className="product-img-placeholder" />
                    )}
                  </Link>
                </div>

                <div className="product-details shop-line-card__details">
                  <span className="company-name">
                    {product.company?.companyName ?? product.laboratory}
                  </span>
                  <h3 className="product-title">
                    <Link to={`/products/${product.productId}`}>
                      {product.name}
                    </Link>
                  </h3>
                  <div className="product-meta">
                    <span className="price">{formatPrice(price)}</span>
                    {product.category?.name && (
                      <span className="rating">{product.category.name}</span>
                    )}
                  </div>
                </div>

                <div className="shop-line-card__actions favorites-card__actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-nav shop-line-card__btn"
                    disabled={busy || product.stock < 1}
                    onClick={() => void handleBuy(product.productId)}
                  >
                    <ShoppingCart size={14} strokeWidth={2} />
                    {product.stock < 1 ? 'Out of stock' : 'Buy'}
                  </button>
                  <button
                    type="button"
                    className="shop-line-card__remove"
                    disabled={busy}
                    onClick={() =>
                      void handleUnfavorite(product.productId, product.name)
                    }
                  >
                    <Heart size={15} />
                    Unfavorite
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {favorites.items.length > 0 && (
          <div className="favorites-footer-hint">
            <ShoppingBag size={16} />
            <span>
              Buy adds the product to your cart. Checkout still happens per
              company.
            </span>
          </div>
        )}
      </main>
    </PublicShell>
  );
}
