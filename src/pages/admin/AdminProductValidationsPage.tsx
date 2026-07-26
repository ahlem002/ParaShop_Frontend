import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { AdminProduct, VerificationStatus } from '../../types/admin';
import {
  getAdminProducts,
  updateProductVerification,
} from '../../services/admin.service';
import { resolveUploadUrl } from '../../config/api';
import { ListToolbar } from '../../components/common/ListToolbar';

type FilterTab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatPrice(value: number) {
  return `${Number(value).toFixed(2)} TND`;
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  return (
    <span className={`admin-badge admin-badge--${status.toLowerCase()}`}>
      {status.toLowerCase()}
    </span>
  );
}

export function AdminProductValidationsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('PENDING');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState('ALL');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAdminProducts();
      setProducts(data);
    } catch {
      setError('Failed to load product validation requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const counts = useMemo(
    () => ({
      PENDING: products.filter((p) => p.verificationStatus === 'PENDING').length,
      APPROVED: products.filter((p) => p.verificationStatus === 'APPROVED').length,
      REJECTED: products.filter((p) => p.verificationStatus === 'REJECTED').length,
      ALL: products.length,
    }),
    [products],
  );

  const categories = useMemo(() => {
    const names = new Set<string>();
    for (const product of products) {
      if (product.category?.name) names.add(product.category.name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const companies = useMemo(() => {
    const names = new Set<string>();
    for (const product of products) {
      if (product.company?.companyName) names.add(product.company.companyName);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((p) => {
      if (filter !== 'ALL' && p.verificationStatus !== filter) return false;
      if (categoryFilter !== 'ALL' && p.category?.name !== categoryFilter) {
        return false;
      }
      if (companyFilter !== 'ALL' && p.company?.companyName !== companyFilter) {
        return false;
      }
      if (!query) return true;

      return (
        p.name.toLowerCase().includes(query) ||
        p.laboratory.toLowerCase().includes(query) ||
        (p.company?.companyName ?? '').toLowerCase().includes(query) ||
        (p.category?.name ?? '').toLowerCase().includes(query)
      );
    });
  }, [products, filter, search, categoryFilter, companyFilter]);

  async function handleApprove(product: AdminProduct) {
    if (
      !window.confirm(
        `Approve "${product.name}"? It will appear on the home page.`,
      )
    ) {
      return;
    }

    setUpdatingId(product.productId);

    try {
      const updated = await updateProductVerification(
        product.productId,
        'APPROVED',
      );
      setProducts((prev) =>
        prev.map((item) =>
          item.productId === updated.productId ? updated : item,
        ),
      );
    } catch {
      setError('Failed to approve product.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleReject(product: AdminProduct) {
    const reason = window.prompt(
      `Reject "${product.name}"? Enter a reason (required):`,
    );

    if (reason === null) {
      return;
    }

    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError('A rejection reason of at least 3 characters is required.');
      return;
    }

    setUpdatingId(product.productId);

    try {
      const updated = await updateProductVerification(
        product.productId,
        'REJECTED',
        trimmed,
      );
      setProducts((prev) =>
        prev.map((item) =>
          item.productId === updated.productId ? updated : item,
        ),
      );
      setError('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to reject product.',
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Product Validations</h1>
        <div className="admin-loading">Loading validation requests...</div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Product Validations</h1>
        <div className="admin-error">
          {error}
          <br />
          <button type="button" className="btn btn-primary" onClick={loadProducts}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
    { key: 'ALL', label: 'All' },
  ];

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Product Validations</h1>
      <div className="admin-validations">
        <p className="admin-validations__intro">
          Review products submitted by companies. Only approved products appear
          on the home page.
        </p>

        {error && (
          <div className="admin-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by product, company, or category..."
          searchAriaLabel="Search product validations"
          selects={[
            {
              id: 'category',
              label: 'Filter by category',
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: [
                { value: 'ALL', label: 'All categories' },
                ...categories.map((name) => ({ value: name, label: name })),
              ],
            },
            {
              id: 'company',
              label: 'Filter by company',
              value: companyFilter,
              onChange: setCompanyFilter,
              options: [
                { value: 'ALL', label: 'All companies' },
                ...companies.map((name) => ({ value: name, label: name })),
              ],
            },
          ]}
        />

        <div className="admin-filter-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`admin-filter-tab${filter === tab.key ? ' active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
              <span className="admin-filter-tab__count">{counts[tab.key]}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="admin-page-card admin-page-card--empty">
            <h2>
              {filter === 'PENDING'
                ? 'No pending products'
                : 'No products in this filter'}
            </h2>
            <p>
              {filter === 'PENDING'
                ? 'New products waiting for validation will appear here.'
                : 'Try another filter to see more results.'}
            </p>
          </div>
        ) : (
          <div className="admin-validation-list">
            {filtered.map((product) => {
              const isPending = product.verificationStatus === 'PENDING';
              const isUpdating = updatingId === product.productId;
              const imageUrls =
                product.images
                  ?.map((image) => resolveUploadUrl(image))
                  .filter((url): url is string => Boolean(url)) ?? [];

              return (
                <article
                  key={product.productId}
                  className="admin-validation-card"
                >
                  <div className="admin-validation-card__header">
                    <div>
                      <h2>{product.name}</h2>
                      <p className="admin-validation-card__meta">
                        Submitted {formatDate(product.createdAt)} ·{' '}
                        {product.company.companyName}
                      </p>
                    </div>
                    <VerificationBadge status={product.verificationStatus} />
                  </div>

                  {imageUrls.length > 0 && (
                    <div className="product-image-preview" style={{ marginBottom: 16 }}>
                      {imageUrls.map((url) => (
                        <img
                          key={url}
                          src={url}
                          alt={product.name}
                          className="product-thumb product-thumb--lg"
                        />
                      ))}
                    </div>
                  )}

                  <div className="admin-validation-card__grid">
                    <div>
                      <span className="admin-validation-card__label">
                        Company
                      </span>
                      <p>{product.company.companyName}</p>
                      <p className="admin-validation-card__sub">
                        {product.company.email}
                      </p>
                    </div>
                    <div>
                      <span className="admin-validation-card__label">
                        Category
                      </span>
                      <p>{product.category?.name ?? '—'}</p>
                    </div>
                    <div>
                      <span className="admin-validation-card__label">Price</span>
                      <p>{formatPrice(product.price)}</p>
                    </div>
                    <div>
                      <span className="admin-validation-card__label">Stock</span>
                      <p>{product.stock}</p>
                    </div>
                  </div>

                  {product.description && (
                    <div className="admin-validation-card__description">
                      <span className="admin-validation-card__label">
                        Description
                      </span>
                      <p>{product.description}</p>
                    </div>
                  )}

                  {product.notice?.trim() && (
                    <div className="admin-validation-card__description">
                      <span className="admin-validation-card__label">
                        Notice
                      </span>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{product.notice}</p>
                    </div>
                  )}

                  {product.verificationStatus === 'REJECTED' &&
                    product.rejectionReason && (
                      <div className="admin-validation-card__description">
                        <span className="admin-validation-card__label">
                          Rejection reason
                        </span>
                        <p>{product.rejectionReason}</p>
                      </div>
                    )}

                  {isPending && (
                    <div className="admin-validation-card__footer">
                      <div className="admin-table__actions">
                        <button
                          type="button"
                          className="admin-btn-sm admin-btn-sm--success"
                          disabled={isUpdating}
                          onClick={() => handleApprove(product)}
                        >
                          <CheckCircle2 size={16} strokeWidth={2} />
                          {isUpdating ? 'Updating...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          className="admin-btn-sm admin-btn-sm--danger"
                          disabled={isUpdating}
                          onClick={() => handleReject(product)}
                        >
                          <XCircle size={16} strokeWidth={2} />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
