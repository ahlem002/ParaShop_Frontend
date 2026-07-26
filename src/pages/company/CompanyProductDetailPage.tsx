import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { CompanyProduct } from '../../types/product';
import { getCompanyProduct } from '../../services/products.service';
import { resolveUploadUrl } from '../../config/api';

function formatPrice(value: number | string) {
  return `${Number(value).toFixed(2)} TND`;
}

export function CompanyProductDetailPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState<CompanyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProduct = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError('');

    try {
      const data = await getCompanyProduct(productId);
      setProduct(data);
    } catch {
      setError('Failed to load product.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Product details</h1>
        <div className="admin-loading">Loading product...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Product details</h1>
        <div className="admin-error">{error || 'Product not found.'}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <h1 className="admin-page-title">{product.name}</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span
            className={`admin-badge admin-badge--${product.verificationStatus.toLowerCase()}`}
          >
            {product.verificationStatus.toLowerCase()}
          </span>
          <Link
            to={`/company/products/${product.productId}/edit`}
            className="btn btn-primary"
          >
            Edit product
          </Link>
        </div>
      </div>

      {product.verificationStatus === 'PENDING' && (
        <div className="admin-page-card" style={{ marginBottom: 16 }}>
          <p>
            This product is waiting for admin validation. It will appear on the
            home page once approved.
          </p>
        </div>
      )}

      {product.verificationStatus === 'REJECTED' && (
        <div
          className="admin-error"
          style={{ marginBottom: 16, textAlign: 'left' }}
        >
          <strong>Product denied</strong>
          <p style={{ marginTop: 8, marginBottom: 0 }}>
            {product.rejectionReason ?? 'No reason provided.'}
          </p>
          <p style={{ marginTop: 8, marginBottom: 0 }}>
            You can edit the product and resubmit it for validation.
          </p>
        </div>
      )}

      {product.verificationStatus === 'APPROVED' && (
        <div className="admin-page-card" style={{ marginBottom: 16 }}>
          <p>This product is approved and visible on the home page.</p>
        </div>
      )}

      <div className="admin-page-card">
        <div className="admin-modal__grid">
          <div>
            <span className="admin-modal__label">Category</span>
            <p>{product.category?.name ?? '—'}</p>
          </div>
          <div>
            <span className="admin-modal__label">Company</span>
            <p>{product.laboratory}</p>
          </div>
          <div>
            <span className="admin-modal__label">Price</span>
            <p>{formatPrice(product.price)}</p>
          </div>
          <div>
            <span className="admin-modal__label">Stock</span>
            <p>{product.stock}</p>
          </div>
        </div>

        {product.description && (
          <div className="admin-validation-card__description" style={{ marginTop: 24 }}>
            <span className="admin-modal__label">Description</span>
            <p>{product.description}</p>
          </div>
        )}

        {product.images && product.images.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <span className="admin-modal__label">Images</span>
            <div className="product-image-preview">
              {product.images.map((image) => {
                const url = resolveUploadUrl(image);
                return url ? (
                  <img key={image} src={url} alt={product.name} className="product-thumb product-thumb--lg" />
                ) : null;
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <span className="admin-modal__label">Notice</span>
          <p style={{ whiteSpace: 'pre-wrap' }}>
            {product.notice?.trim() ? product.notice : '—'}
          </p>
        </div>

        <div style={{ marginTop: 28 }}>
          <Link to="/company/products" className="btn btn-secondary">
            Back to products
          </Link>
        </div>
      </div>
    </div>
  );
}
