import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, X } from 'lucide-react';
import type { AdminCompany, AdminProduct, VerificationStatus } from '../../types/admin';
import {
  getAdminCompanies,
  getAdminProducts,
} from '../../services/admin.service';
import { ListToolbar } from '../../components/common/ListToolbar';
import { BackLink } from '../../components/layout/BackLink';
import { ProductImageCarousel } from '../../components/product/ProductImageCarousel';
import { resolveUploadUrl } from '../../config/api';
import '../../styles/pages/home.css';

function formatPrice(value: number) {
  return `${Number(value).toFixed(2)} TND`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  return (
    <span className={`admin-badge admin-badge--${status.toLowerCase()}`}>
      {status.toLowerCase()}
    </span>
  );
}

export function AdminCompanyProductsPage() {
  const { companyId } = useParams();
  const [company, setCompany] = useState<AdminCompany | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [viewProduct, setViewProduct] = useState<AdminProduct | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError('');
    try {
      const [companies, allProducts] = await Promise.all([
        getAdminCompanies(),
        getAdminProducts(),
      ]);
      const match = companies.find((item) => item.companyId === companyId) ?? null;
      setCompany(match);
      setProducts(
        allProducts.filter((product) => product.company.companyId === companyId),
      );
      if (!match) {
        setError('Company not found.');
      }
    } catch {
      setError('Failed to load company products.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => {
    const names = new Set<string>();
    for (const product of products) {
      if (product.category?.name) names.add(product.category.name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      if (statusFilter !== 'ALL' && product.verificationStatus !== statusFilter) {
        return false;
      }
      if (
        categoryFilter !== 'ALL' &&
        product.category?.name !== categoryFilter
      ) {
        return false;
      }
      if (!query) return true;
      return (
        product.name.toLowerCase().includes(query) ||
        product.laboratory.toLowerCase().includes(query) ||
        (product.category?.name ?? '').toLowerCase().includes(query)
      );
    });
  }, [products, search, statusFilter, categoryFilter]);

  const viewImages = useMemo(() => {
    if (!viewProduct?.images?.length) return [];
    return viewProduct.images
      .map((image) => resolveUploadUrl(image))
      .filter((url): url is string => Boolean(url));
  }, [viewProduct]);

  if (loading) {
    return (
      <div className="admin-page">
        <BackLink to="/admin/product-management" label="Back to product management" />
        <h1 className="admin-page-title">Company products</h1>
        <div className="admin-loading">Loading products...</div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="admin-page">
        <BackLink to="/admin/product-management" label="Back to product management" />
        <h1 className="admin-page-title">Company products</h1>
        <div className="admin-error">{error || 'Company not found.'}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <BackLink to="/admin/product-management" label="Back to product management" />
      <h1 className="admin-page-title">{company.companyName}</h1>
      <p className="admin-page-subtitle" style={{ marginTop: -8, marginBottom: 20 }}>
        {products.length} product{products.length === 1 ? '' : 's'} · {company.email}
      </p>

      <div className="admin-page-card">
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by product, lab, or category..."
          searchAriaLabel="Search products"
          selects={[
            {
              id: 'product-status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'ALL', label: 'All statuses' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'REJECTED', label: 'Rejected' },
              ],
            },
            {
              id: 'product-category',
              label: 'Category',
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: [
                { value: 'ALL', label: 'All categories' },
                ...categories.map((name) => ({ value: name, label: name })),
              ],
            },
          ]}
        />

        {filtered.length === 0 ? (
          <div className="admin-page-card--empty" style={{ padding: 24 }}>
            <p>
              {products.length === 0
                ? 'This company has no products yet.'
                : 'No products match this filter.'}
            </p>
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
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const thumb = product.images?.[0]
                    ? resolveUploadUrl(product.images[0])
                    : null;
                  return (
                    <tr key={product.productId}>
                      <td>
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            className="product-thumb"
                          />
                        ) : (
                          <div className="product-thumb product-thumb--empty" />
                        )}
                      </td>
                      <td>
                        <strong>{product.name}</strong>
                        <div
                          style={{
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {product.laboratory}
                        </div>
                      </td>
                      <td>{product.category?.name ?? '—'}</td>
                      <td>{formatPrice(product.price)}</td>
                      <td>{product.stock}</td>
                      <td>
                        <VerificationBadge status={product.verificationStatus} />
                      </td>
                      <td>{formatDate(product.updatedAt)}</td>
                      <td>
                        <div className="admin-table__actions">
                          <button
                            type="button"
                            className="admin-icon-btn"
                            title="View details"
                            aria-label={`View ${product.name}`}
                            onClick={() => setViewProduct(product)}
                          >
                            <Eye size={18} />
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

      {viewProduct && (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={() => setViewProduct(null)}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-product-detail-title"
            style={{ maxWidth: 720 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal__header">
              <h2 id="admin-product-detail-title">{viewProduct.name}</h2>
              <button
                type="button"
                className="admin-modal__close"
                aria-label="Close"
                onClick={() => setViewProduct(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: 20, maxWidth: 340 }}>
              <ProductImageCarousel
                images={viewImages}
                alt={viewProduct.name}
              />
            </div>

            <div className="admin-modal__grid">
              <div>
                <span className="admin-modal__label">Status</span>
                <p>
                  <VerificationBadge status={viewProduct.verificationStatus} />
                </p>
              </div>
              <div>
                <span className="admin-modal__label">Price</span>
                <p>{formatPrice(viewProduct.price)}</p>
              </div>
              <div>
                <span className="admin-modal__label">Stock</span>
                <p>{viewProduct.stock}</p>
              </div>
              <div>
                <span className="admin-modal__label">Category</span>
                <p>{viewProduct.category?.name ?? '—'}</p>
              </div>
              <div>
                <span className="admin-modal__label">Laboratory</span>
                <p>{viewProduct.laboratory}</p>
              </div>
              <div>
                <span className="admin-modal__label">Images</span>
                <p>{viewProduct.images?.length ?? 0}</p>
              </div>
              <div>
                <span className="admin-modal__label">Created</span>
                <p>{formatDate(viewProduct.createdAt)}</p>
              </div>
              <div>
                <span className="admin-modal__label">Updated</span>
                <p>{formatDate(viewProduct.updatedAt)}</p>
              </div>
            </div>

            {viewProduct.description && (
              <div style={{ marginTop: 16 }}>
                <span className="admin-modal__label">Description</span>
                <p style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>
                  {viewProduct.description}
                </p>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <span className="admin-modal__label">Notice</span>
              <p style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>
                {viewProduct.notice?.trim() ? viewProduct.notice : '—'}
              </p>
            </div>

            {viewProduct.rejectionReason && (
              <div style={{ marginTop: 16 }}>
                <span className="admin-modal__label">Rejection reason</span>
                <p style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>
                  {viewProduct.rejectionReason}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
