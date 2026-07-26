import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import type { PublicProduct } from '../types/product';
import { getPublicProduct } from '../services/products.service';
import { resolveUploadUrl } from '../config/api';
import '../styles/pages/home.css';
import '../styles/pages/auth.css';

function formatPrice(value: number | string) {
  return `${Number(value).toFixed(2)} TND`;
}

export function PublicProductDetailPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProduct = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError('');

    try {
      const data = await getPublicProduct(productId);
      setProduct(data);
      setActiveImage(0);
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

  return (
    <>
      <Navbar />
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

              <div className="hero-buttons" style={{ marginTop: 28 }}>
                <Link to="/products" className="btn btn-secondary">
                  Back to products
                </Link>
                <Link to="/" className="btn btn-primary">
                  Home
                </Link>
              </div>
            </div>
          </article>
        )}
      </main>
    </>
  );
}
