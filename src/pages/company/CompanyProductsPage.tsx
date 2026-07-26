import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import type { CompanyProduct } from '../../types/product';
import {
  deleteCompanyProduct,
  getCompanyProducts,
} from '../../services/products.service';
import { resolveUploadUrl } from '../../config/api';

function formatPrice(value: number | string) {
  return `${Number(value).toFixed(2)} TND`;
}

export function CompanyProductsPage() {
  const [products, setProducts] = useState<CompanyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getCompanyProducts();
      setProducts(data);
    } catch {
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function handleDelete(product: CompanyProduct) {
    if (!window.confirm(`Delete "${product.name}"?`)) {
      return;
    }

    setDeletingId(product.productId);

    try {
      await deleteCompanyProduct(product.productId);
      setProducts((prev) =>
        prev.filter((item) => item.productId !== product.productId),
      );
    } catch {
      setError('Failed to delete product.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Product Management</h1>
        <div className="admin-loading">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <h1 className="admin-page-title">Product Management</h1>
        <Link to="/company/products/new" className="btn btn-primary">
          <Plus size={18} strokeWidth={2} />
          Add product
        </Link>
      </div>

      <div className="admin-page-card">
        {error && (
          <div className="admin-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="admin-empty">
            No products yet. Add your first product to get started.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const imageUrl = resolveUploadUrl(product.images?.[0] ?? null);

                  return (
                    <tr key={product.productId}>
                      <td>
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="product-thumb"
                          />
                        ) : (
                          <span className="product-thumb product-thumb--empty">
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <div>{product.name}</div>
                        {product.verificationStatus === 'REJECTED' &&
                          product.rejectionReason && (
                            <p
                              className="admin-validation-card__sub"
                              style={{ color: 'var(--error)', marginTop: 4 }}
                            >
                              Denied: {product.rejectionReason}
                            </p>
                          )}
                      </td>
                      <td>{product.category?.name ?? '—'}</td>
                      <td>{formatPrice(product.price)}</td>
                      <td>{product.stock}</td>
                      <td>
                        <span
                          className={`admin-badge admin-badge--${product.verificationStatus.toLowerCase()}`}
                        >
                          {product.verificationStatus.toLowerCase()}
                        </span>
                      </td>
                      <td>
                        <div className="admin-table__actions">
                          <Link
                            to={`/company/products/${product.productId}`}
                            className="admin-icon-btn"
                            aria-label={`View ${product.name}`}
                            title="View"
                          >
                            <Eye size={18} strokeWidth={2} />
                          </Link>
                          <Link
                            to={`/company/products/${product.productId}/edit`}
                            className="admin-icon-btn"
                            aria-label={`Edit ${product.name}`}
                            title="Edit"
                          >
                            <Pencil size={18} strokeWidth={2} />
                          </Link>
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-btn--danger"
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.productId}
                            aria-label={`Delete ${product.name}`}
                            title="Delete"
                          >
                            <Trash2 size={18} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
