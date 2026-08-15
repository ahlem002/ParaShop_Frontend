import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { AdminCompany, AdminProduct } from '../../types/admin';
import {
  getAdminCompanies,
  getAdminProducts,
} from '../../services/admin.service';
import { ListToolbar } from '../../components/common/ListToolbar';

type CompanyProductRow = {
  company: AdminCompany;
  productCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
};

function VerificationBadge({
  status,
}: {
  status: AdminCompany['verificationStatus'];
}) {
  return (
    <span className={`admin-badge admin-badge--${status.toLowerCase()}`}>
      {status.toLowerCase()}
    </span>
  );
}

export function AdminProductManagementPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [companyData, productData] = await Promise.all([
        getAdminCompanies(),
        getAdminProducts(),
      ]);
      setCompanies(companyData);
      setProducts(productData);
    } catch {
      setError('Failed to load product management.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo<CompanyProductRow[]>(() => {
    const counts = new Map<
      string,
      { total: number; approved: number; pending: number; rejected: number }
    >();

    for (const product of products) {
      const id = product.company.companyId;
      const current = counts.get(id) ?? {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      };
      current.total += 1;
      if (product.verificationStatus === 'APPROVED') current.approved += 1;
      if (product.verificationStatus === 'PENDING') current.pending += 1;
      if (product.verificationStatus === 'REJECTED') current.rejected += 1;
      counts.set(id, current);
    }

    return companies
      .map((company) => {
        const stats = counts.get(company.companyId) ?? {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        };
        return {
          company,
          productCount: stats.total,
          approvedCount: stats.approved,
          pendingCount: stats.pending,
          rejectedCount: stats.rejected,
        };
      })
      .sort((a, b) => b.productCount - a.productCount);
  }, [companies, products]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (
        statusFilter !== 'ALL' &&
        row.company.verificationStatus !== statusFilter
      ) {
        return false;
      }
      if (!query) return true;
      return (
        row.company.companyName.toLowerCase().includes(query) ||
        row.company.email.toLowerCase().includes(query)
      );
    });
  }, [rows, search, statusFilter]);

  const totalProducts = products.length;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Product Management</h1>
      <p className="admin-page-subtitle" style={{ marginTop: -8, marginBottom: 20 }}>
        Browse companies and open their product catalogs. {totalProducts} product
        {totalProducts === 1 ? '' : 's'} across {companies.length} compan
        {companies.length === 1 ? 'y' : 'ies'}.
      </p>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-page-card">
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by company name or email..."
          searchAriaLabel="Search companies"
          selects={[
            {
              id: 'company-status',
              label: 'Company status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'ALL', label: 'All statuses' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'REJECTED', label: 'Rejected' },
              ],
            },
          ]}
        />

        {loading ? (
          <div className="admin-loading">Loading companies...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-page-card--empty" style={{ padding: 24 }}>
            <p>No companies match this filter.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Products</th>
                  <th>Approved</th>
                  <th>Pending</th>
                  <th>Rejected</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.company.companyId}
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      navigate(
                        `/admin/product-management/${row.company.companyId}`,
                      )
                    }
                  >
                    <td>
                      <strong>{row.company.companyName}</strong>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {row.company.email}
                      </div>
                    </td>
                    <td>
                      <VerificationBadge
                        status={row.company.verificationStatus}
                      />
                    </td>
                    <td>
                      <strong>{row.productCount}</strong>
                    </td>
                    <td>{row.approvedCount}</td>
                    <td>{row.pendingCount}</td>
                    <td>{row.rejectedCount}</td>
                    <td>
                      <div className="admin-table__actions">
                        <button
                          type="button"
                          className="admin-icon-btn"
                          title="View products"
                          aria-label={`View products for ${row.company.companyName}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(
                              `/admin/product-management/${row.company.companyId}`,
                            );
                          }}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
