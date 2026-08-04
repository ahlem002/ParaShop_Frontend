import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PublicShell } from '../components/layout/PublicShell';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import type { PublicProduct } from '../types/product';
import { getPublicProduct } from '../services/products.service';
import { resolveUploadUrl } from '../config/api';
import '../styles/pages/home.css';
import '../styles/pages/auth.css';
import '../styles/pages/cart.css';

function formatPrice(value: number | string) {
  return `${Number(value).toFixed(2)} TND`;
}

export function PublicProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'ok' | 'error';
    text: string;
  } | null>(null);

  const loadProduct = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError('');

    try {
      const data = await getPublicProduct(productId);
      setProduct(data);
      setActiveImage(0);
      setQuantity(1);
    } catch {
      setError('Product not found or not available.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const images =
    product?.images
      ?.map((image) => resolveUploadUrl(image))
      .filter((url): url is string => Boolean(url)) ?? [];

  const mainImage = images[activeImage] ?? images[0] ?? null;
  const maxQty = Math.max(1, product?.stock ?? 1);
  const outOfStock = (product?.stock ?? 0) < 1;

  function requireClientLogin() {
    if (!isAuthenticated || user?.role !== 'CLIENT') {
      navigate(`/login?redirect=${encodeURIComponent(`/products/${productId}`)}`);
      return false;
    }
    return true;
  }

  async function handleAddToCart() {
    if (!product || !requireClientLogin()) return;
    setBusy(true);
    setFeedback(null);
    try {
      await addItem(product.productId, quantity);
      setFeedback({ type: 'ok', text: 'Added to cart.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not add to cart',
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleBuyNow() {
    if (!product || !requireClientLogin()) return;
    setBusy(true);
    setFeedback(null);
    try {
      await addItem(product.productId, quantity);
      navigate('/cart');
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not add to cart',
      });
      setBusy(false);
    }
  }

  return (
    <PublicShell>
      <main className="container home-container">
        {loading && <p>Loading product...</p>}

        {!loading && (error || !product) && (
          <div className="auth-card" style={{ maxWidth: 560, margin: '40px auto' }}>
            <h1>Product unavailable</h1>
            <p>{error || 'This product could not be found.'}</p>
            <Link to="/products" className="btn btn-primary">
              Back to products
            </Link>
          </div>
        )}

        {!loading && product && (
          <article className="public-product-detail">
            <div className="public-product-detail__media">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="public-product-detail__image"
                />
              ) : (
                <div className="public-product-detail__image public-product-detail__image--empty" />
              )}

              {images.length > 0 && (
                <div className="public-product-detail__thumbs">
                  {images.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      className={`public-product-detail__thumb${
                        index === activeImage ? ' is-active' : ''
                      }`}
                      onClick={() => setActiveImage(index)}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img src={url} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="public-product-detail__info">
              <p className="company-name">
                {product.company?.companyName ?? product.laboratory}
              </p>
              <h1>{product.name}</h1>
              <p className="public-product-detail__price">
                {formatPrice(product.price)}
              </p>

              <div className="public-product-detail__meta">
                {product.category?.name && (
                  <span>{product.category.name}</span>
                )}
                <span>Stock: {product.stock}</span>
                {images.length > 1 && (
                  <span>
                    {activeImage + 1} / {images.length} images
                  </span>
                )}
              </div>

              {product.description && (
                <div className="public-product-detail__block">
                  <h2>Description</h2>
                  <p>{product.description}</p>
                </div>
              )}

              {product.notice?.trim() && (
                <div className="public-product-detail__block">
                  <h2>Notice</h2>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{product.notice}</p>
                </div>
              )}

              <div className="product-buy-actions">
                <div className="qty-field">
                  <label htmlFor="product-qty">Qty</label>
                  <input
                    id="product-qty"
                    type="number"
                    min={1}
                    max={maxQty}
                    value={quantity}
                    disabled={outOfStock || busy}
                    onChange={(event) => {
                      const next = Number(event.target.value) || 1;
                      setQuantity(Math.min(maxQty, Math.max(1, next)));
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={outOfStock || busy}
                  onClick={() => void handleAddToCart()}
                >
                  Add to cart
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={outOfStock || busy}
                  onClick={() => void handleBuyNow()}
                >
                  Buy now
                </button>
              </div>

              {outOfStock && (
                <p className="product-buy-feedback is-error">Out of stock</p>
              )}
              {feedback && (
                <p
                  className={`product-buy-feedback is-${feedback.type}`}
                >
                  {feedback.text}{' '}
                  {feedback.type === 'ok' && (
                    <Link to="/cart">View cart</Link>
                  )}
                </p>
              )}

              <div className="hero-buttons" style={{ marginTop: 20 }}>
                <Link to="/products" className="btn btn-secondary">
                  Back to products
                </Link>
              </div>
            </div>
          </article>
        )}
      </main>
    </PublicShell>
  );
}
