import { useState, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { PublicProduct } from '../../types/product';
import { resolveUploadUrl } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';

interface ProductCardProps {
  product: PublicProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const [busy, setBusy] = useState(false);

  const imageUrl = resolveUploadUrl(product.images?.[0] ?? null);
  const price = Number(product.price);
  const favorited = isFavorite(product.productId);

  async function handleFavorite(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated || user?.role !== 'CLIENT') {
      navigate('/login');
      return;
    }

    setBusy(true);
    try {
      await toggle(product.productId);
    } catch {
      // keep UI stable; context holds last good state
    } finally {
      setBusy(false);
    }
  }

  return (
    <Link to={`/products/${product.productId}`} className="product-card-link">
      <article className="product-card">
        <button
          type="button"
          className={`wishlist-btn${favorited ? ' is-active' : ''}`}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={favorited}
          disabled={busy}
          onClick={(e) => void handleFavorite(e)}
        >
          <Heart
            size={14}
            strokeWidth={2}
            fill={favorited ? 'currentColor' : 'none'}
          />
        </button>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="product-img-placeholder"
          />
        ) : (
          <div className="product-img-placeholder" />
        )}
        <div className="product-details">
          <span className="company-name">
            {product.company?.companyName ?? product.laboratory}
          </span>
          <h3 className="product-title">{product.name}</h3>
          <div className="product-meta">
            <span className="price">{price.toFixed(2)} TND</span>
            {product.category?.name && (
              <span className="rating">{product.category.name}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
