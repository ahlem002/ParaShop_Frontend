import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { PublicProduct } from '../../types/product';
import { resolveUploadUrl } from '../../config/api';

interface ProductCardProps {
  product: PublicProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = resolveUploadUrl(product.images?.[0] ?? null);
  const price = Number(product.price);

  return (
    <Link to={`/products/${product.productId}`} className="product-card-link">
      <article className="product-card">
        <button
          type="button"
          className="wishlist-btn"
          aria-label="Add to wishlist"
          onClick={(e) => e.preventDefault()}
        >
          <Heart size={14} strokeWidth={2} />
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
