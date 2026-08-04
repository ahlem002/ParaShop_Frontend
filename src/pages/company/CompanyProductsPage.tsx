import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import type { CompanyProduct } from '../../types/product';
import {
  deleteCompanyProduct,
  getCompanyProducts,
} from '../../services/products.service';
import { resolveUploadUrl } from '../../config/api';
import { ListToolbar } from '../../components/common/ListToolbar';
import { useConfirm } from '../../context/ConfirmContext';

function formatPrice(value: number | string) {
  return `${Number(value).toFixed(2)} TND`;
}

export function CompanyProductsPage() {
  const { confirm } = useConfirm();
  const [products, setProducts] = useState<CompanyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');

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
    void loadProducts();
  }, [loadProducts]);

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
      if (stockFilter === 'IN' && product.stock <= 0) return false;
      if (stockFilter === 'LOW' && !(product.stock > 0 && product.stock <= 10)) {
        return false;
      }
      if (stockFilter === 'OUT' && product.stock > 0) return false;

      if (!query) return true;

      return (
        product.name.toLowerCase().includes(query) ||
        product.laboratory.toLowerCase().includes(query) ||
        (product.category?.name ?? '').toLowerCase().includes(query)
      );
    });
  }, [products, search, statusFilter, categoryFilter, stockFilter]);

  async function handleDelete(product: CompanyProduct) {
    const ok = await confirm({
      title: 'Delete product?',
      message: `Delete "${product.name}"? This cannot be undone.`,
      confirmLabel: 'Yes, delete',
      danger: true,
    });
    if (!ok) return;

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

        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or category..."
          searchAriaLabel="Search company products"
          selects={[
            {
              id: 'status',
              label: 'Filter by status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'ALL', label: 'All statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
              ],
            },
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
              id: 'stock',
              label: 'Filter by stock',
              value: stockFilter,
              onChange: setStockFilter,
              options: [
                { value: 'ALL', label: 'All stock' },
                { value: 'IN', label: 'In stock' },
                { value: 'LOW', label: 'Low stock (≤ 10)' },
                { value: 'OUT', label: 'Out of stock' },
              ],
            },
          ]}
        />

        {products.length === 0 ? (
          <div className="admin-empty">
            No products yet. Add your first product to get started.
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            No products match your search or filters.
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
                {filtered.map((product) => {
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
                          <div className="product-thumb">—</div>
                        )}
                      </td>
                      <td>{product.name}</td>
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
                            className="admin-icon-btn"
                            disabled={deletingId === product.productId}
                            onClick={() => void handleDelete(product)}
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
