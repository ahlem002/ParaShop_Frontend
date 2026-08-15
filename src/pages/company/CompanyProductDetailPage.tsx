import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { CompanyProduct } from '../../types/product';
import {
  getCompanyProduct,
  updateCompanyProductStock,
} from '../../services/products.service';
import { resolveUploadUrl } from '../../config/api';
import { BackLink } from '../../components/layout/BackLink';
import { ProductImageCarousel } from '../../components/product/ProductImageCarousel';
import '../../styles/pages/home.css';

function formatPrice(value: number | string) {
  return `${Number(value).toFixed(2)} TND`;
}

function soldOutDeadline(soldOutAt: string | null | undefined) {
  if (!soldOutAt) return null;
  const end = new Date(soldOutAt);
  end.setDate(end.getDate() + 10);
  return end;
}

export function CompanyProductDetailPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState<CompanyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stockDraft, setStockDraft] = useState('');
  const [stockBusy, setStockBusy] = useState(false);
  const [stockMessage, setStockMessage] = useState('');

  const loadProduct = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError('');

    try {
      const data = await getCompanyProduct(productId);
      setProduct(data);
      setStockDraft(String(data.stock));
    } catch {
      setError('Failed to load product.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  async function handleRefillStock() {
    if (!product) return;
    const next = Number(stockDraft);
    if (!Number.isInteger(next) || next < 0) {
      setStockMessage('Enter a whole number >= 0.');
      return;
    }

    setStockBusy(true);
    setStockMessage('');
    try {
      const updated = await updateCompanyProductStock(product.productId, next);
      setProduct(updated);
      setStockDraft(String(updated.stock));
      setStockMessage(
        updated.stock > 0
          ? 'Stock updated. Product stays approved (no re-validation).'
          : 'Stock set to 0 — product is sold out.',
      );
    } catch (err) {
      setStockMessage(
        err instanceof Error ? err.message : 'Could not update stock.',
      );
    } finally {
      setStockBusy(false);
    }
  }

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
        <BackLink to="/company/products" label="Back to products" />
        <h1 className="admin-page-title">Product details</h1>
        <div className="admin-error">{error || 'Product not found.'}</div>
      </div>
    );
  }

  const deadline = soldOutDeadline(product.soldOutAt ?? null);

  return (
    <div className="admin-page">
      <BackLink to="/company/products" label="Back to products" />
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

      {product.stock <= 0 && (
        <div className="admin-error" style={{ marginBottom: 16, textAlign: 'left' }}>
          <strong>Sold out</strong>
          <p style={{ marginTop: 8, marginBottom: 0 }}>
            Clients cannot buy or add this product to cart.
            {deadline
              ? ` Refill before ${deadline.toLocaleDateString('en-GB')} or it will be deleted automatically.`
              : ' Refill within 10 days or it will be deleted automatically.'}
          </p>
        </div>
      )}

      {product.stock > 0 && product.stock <= 5 && (
        <div className="admin-page-card" style={{ marginBottom: 16 }}>
          <p>
            Low stock ({product.stock} left). Refill soon to avoid running out.
          </p>
        </div>
      )}

      <div className="admin-page-card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Refill stock</h2>
        <p className="admin-page-subtitle" style={{ marginTop: 0 }}>
          Updating stock here does not require admin re-validation.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'end',
            flexWrap: 'wrap',
          }}
        >
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="refill-stock">Quantity</label>
            <input
              id="refill-stock"
              type="number"
              min={0}
              step={1}
              value={stockDraft}
              onChange={(e) => setStockDraft(e.target.value)}
              style={{ width: 140 }}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={stockBusy}
            onClick={() => void handleRefillStock()}
          >
            {stockBusy ? 'Saving…' : 'Save stock'}
          </button>
        </div>
        {stockMessage && (
          <p style={{ marginBottom: 0, marginTop: 12 }}>{stockMessage}</p>
        )}
      </div>

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
            <p>
              {product.stock}
              {product.stock <= 0 ? ' (sold out)' : ''}
            </p>
          </div>
        </div>

        {product.description && (
          <div
            className="admin-validation-card__description"
            style={{ marginTop: 24 }}
          >
            <span className="admin-modal__label">Description</span>
            <p>{product.description}</p>
          </div>
        )}

        {product.images && product.images.length > 0 && (
          <div style={{ marginTop: 24, maxWidth: 420 }}>
            <span className="admin-modal__label">Images</span>
            <ProductImageCarousel
              images={product.images
                .map((image) => resolveUploadUrl(image))
                .filter((url): url is string => Boolean(url))}
              alt={product.name}
            />
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <span className="admin-modal__label">Notice</span>
          <p style={{ whiteSpace: 'pre-wrap' }}>
            {product.notice?.trim() ? product.notice : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
