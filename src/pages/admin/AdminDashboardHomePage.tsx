import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ClipboardCheck,
  Megaphone,
  PackageCheck,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getAdminDashboard } from '../../services/admin.service';
import type { AdminDashboardStats } from '../../types/admin';

const PIE_COLORS = ['#a78bfa', '#8eb4e0', '#e8a4c4', '#8ec9b4', '#e8b890'];

function formatMoney(value: number) {
  return `${Number(value).toFixed(2)} TND`;
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function AdminDashboardHomePage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getAdminDashboard();
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load the dashboard',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const usersPie = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Clients', value: stats.users.clients },
      { name: 'Companies', value: stats.users.companies },
      { name: 'Admins', value: stats.users.admins },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const productsPie = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Pending', value: stats.products.pending },
      { name: 'Approved', value: stats.products.approved },
      { name: 'Rejected', value: stats.products.rejected },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const companiesPie = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Pending', value: stats.companies.pending },
      { name: 'Approved', value: stats.companies.approved },
      { name: 'Rejected', value: stats.companies.rejected },
    ].filter((item) => item.value > 0);
  }, [stats]);

  return (
    <div className="admin-page admin-dashboard">
      <div className="admin-page-heading">
        <div>
          <h1 className="admin-page-title">Admin Dashboard</h1>
          <p className="admin-page-subtitle">
            Overview of the ParaShop+ platform
          </p>
        </div>
      </div>

      {loading && (
        <div className="admin-page-card admin-page-card--empty">
          <p>Loading statistics…</p>
        </div>
      )}

      {error && (
        <div className="admin-page-card admin-page-card--empty">
          <p className="admin-dashboard__error">{error}</p>
        </div>
      )}

      {stats && !loading && (
        <>
          <section className="admin-dashboard__section">
            <h2 className="admin-dashboard__section-title">Global statistics</h2>
            <div className="admin-stat-grid">
              <article className="admin-stat-card">
                <div className="admin-stat-card__icon">
                  <Users size={20} strokeWidth={2} />
                </div>
                <p className="admin-stat-card__label">Users</p>
                <p className="admin-stat-card__value">{stats.users.total}</p>
                <p className="admin-stat-card__meta">
                  {stats.users.clients} clients · {stats.users.companies}{' '}
                  companies · {stats.users.blocked} blocked
                </p>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-card__icon">
                  <Building2 size={20} strokeWidth={2} />
                </div>
                <p className="admin-stat-card__label">Companies</p>
                <p className="admin-stat-card__value">{stats.companies.total}</p>
                <p className="admin-stat-card__meta">
                  {stats.companies.pending} pending ·{' '}
                  {stats.companies.approved} approved
                </p>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-card__icon">
                  <PackageCheck size={20} strokeWidth={2} />
                </div>
                <p className="admin-stat-card__label">Products</p>
                <p className="admin-stat-card__value">{stats.products.total}</p>
                <p className="admin-stat-card__meta">
                  {stats.products.pending} to review ·{' '}
                  {stats.products.approved} published
                </p>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-card__icon">
                  <Wallet size={20} strokeWidth={2} />
                </div>
                <p className="admin-stat-card__label">Catalog stock</p>
                <p className="admin-stat-card__value admin-stat-card__value--sm">
                  {formatMoney(stats.catalog.approvedProductValue)}
                </p>
                <p className="admin-stat-card__meta">
                  Estimate: price × quantity of approved products (
                  {stats.catalog.totalStockUnits} units). This is not sales
                  revenue.
                </p>
              </article>
            </div>
          </section>

          <section className="admin-dashboard__section">
            <h2 className="admin-dashboard__section-title">Analytics</h2>
            <div className="admin-chart-grid">
              <div className="admin-page-card admin-chart-card">
                <h3>Activity (last 7 days)</h3>
                <p className="admin-chart-card__hint">
                  New accounts and products created each day
                </p>
                <div className="admin-chart-card__body">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={stats.charts.activityLast7Days}>
                      <defs>
                        <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="productsFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8eb4e0" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#8eb4e0" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-input)" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="users"
                        name="Users"
                        stroke="#a78bfa"
                        fill="url(#usersFill)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="products"
                        name="Products"
                        stroke="#8eb4e0"
                        fill="url(#productsFill)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="admin-page-card admin-chart-card">
                <h3>User breakdown</h3>
                <p className="admin-chart-card__hint">Clients / companies / admins</p>
                <div className="admin-chart-card__body">
                  {usersPie.length === 0 ? (
                    <p className="admin-dashboard__empty">No data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={usersPie}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {usersPie.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="admin-page-card admin-chart-card">
                <h3>Product status</h3>
                <p className="admin-chart-card__hint">Pending / approved / rejected</p>
                <div className="admin-chart-card__body">
                  {productsPie.length === 0 ? (
                    <p className="admin-dashboard__empty">No data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={productsPie}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                        >
                          {productsPie.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="admin-page-card admin-chart-card">
                <h3>Company status</h3>
                <p className="admin-chart-card__hint">Company account validation</p>
                <div className="admin-chart-card__body">
                  {companiesPie.length === 0 ? (
                    <p className="admin-dashboard__empty">No data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={companiesPie}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={90}
                          paddingAngle={2}
                        >
                          {companiesPie.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={PIE_COLORS[(index + 1) % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="admin-dashboard__section">
            <h2 className="admin-dashboard__section-title">Modules</h2>
            <div className="admin-module-grid">
              <Link to="/admin/users" className="admin-module-card">
                <UserCog size={22} strokeWidth={2} />
                <div>
                  <strong>User management</strong>
                  <span>Accounts, roles, and statuses</span>
                </div>
              </Link>
              <Link to="/admin/product-validations" className="admin-module-card">
                <PackageCheck size={22} strokeWidth={2} />
                <div>
                  <strong>Product validation</strong>
                  <span>
                    {stats.products.pending} product
                    {stats.products.pending === 1 ? '' : 's'} pending
                  </span>
                </div>
              </Link>
              <Link to="/admin/validations" className="admin-module-card">
                <ClipboardCheck size={22} strokeWidth={2} />
                <div>
                  <strong>Company validation</strong>
                  <span>
                    {stats.companies.pending} request
                    {stats.companies.pending === 1 ? '' : 's'} pending
                  </span>
                </div>
              </Link>
              <Link to="/admin/revenue" className="admin-module-card">
                <TrendingUp size={22} strokeWidth={2} />
                <div>
                  <strong>Revenue</strong>
                  <span>Platform financial tracking</span>
                </div>
              </Link>
              <Link to="/admin/campaigns" className="admin-module-card">
                <Megaphone size={22} strokeWidth={2} />
                <div>
                  <strong>Sponsored campaigns</strong>
                  <span>Promotions and paid visibility</span>
                </div>
              </Link>
            </div>
          </section>

          <section className="admin-dashboard__split">
            <div className="admin-page-card">
              <div className="admin-dashboard__card-head">
                <h2>Companies to review</h2>
                <Link to="/admin/validations">View all</Link>
              </div>
              {stats.recent.pendingCompanies.length === 0 ? (
                <p className="admin-dashboard__empty">No pending requests.</p>
              ) : (
                <ul className="admin-dashboard__list">
                  {stats.recent.pendingCompanies.map((company) => (
                    <li key={company.companyId}>
                      <span>{company.companyName}</span>
                      <time>{formatDate(company.createdAt)}</time>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="admin-page-card">
              <div className="admin-dashboard__card-head">
                <h2>Products to review</h2>
                <Link to="/admin/product-validations">View all</Link>
              </div>
              {stats.recent.pendingProducts.length === 0 ? (
                <p className="admin-dashboard__empty">No products pending.</p>
              ) : (
                <ul className="admin-dashboard__list">
                  {stats.recent.pendingProducts.map((product) => (
                    <li key={product.productId}>
                      <span>
                        {product.name}
                        <small>{product.companyName}</small>
                      </span>
                      <time>{formatDate(product.createdAt)}</time>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
