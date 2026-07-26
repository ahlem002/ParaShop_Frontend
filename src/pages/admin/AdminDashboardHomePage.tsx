import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
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
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
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
              : 'Impossible de charger le dashboard',
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
      { name: 'Entreprises', value: stats.users.companies },
      { name: 'Admins', value: stats.users.admins },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const productsPie = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'En attente', value: stats.products.pending },
      { name: 'Approuvés', value: stats.products.approved },
      { name: 'Rejetés', value: stats.products.rejected },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const companiesPie = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'En attente', value: stats.companies.pending },
      { name: 'Validées', value: stats.companies.approved },
      { name: 'Rejetées', value: stats.companies.rejected },
    ].filter((item) => item.value > 0);
  }, [stats]);

  return (
    <div className="admin-page admin-dashboard">
      <div className="admin-page-heading">
        <div>
          <h1 className="admin-page-title">Dashboard Administrateur</h1>
          <p className="admin-page-subtitle">
            Vue d’ensemble de la plateforme ParaShop+
          </p>
        </div>
      </div>

      {loading && (
        <div className="admin-page-card admin-page-card--empty">
          <p>Chargement des statistiques…</p>
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
            <h2 className="admin-dashboard__section-title">
              Statistiques globales
            </h2>
            <div className="admin-stat-grid">
              <article className="admin-stat-card">
                <div className="admin-stat-card__icon">
                  <Users size={20} strokeWidth={2} />
                </div>
                <p className="admin-stat-card__label">Utilisateurs</p>
                <p className="admin-stat-card__value">{stats.users.total}</p>
                <p className="admin-stat-card__meta">
                  {stats.users.clients} clients · {stats.users.companies}{' '}
                  entreprises · {stats.users.blocked} bloqués
                </p>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-card__icon">
                  <Building2 size={20} strokeWidth={2} />
                </div>
                <p className="admin-stat-card__label">Entreprises</p>
                <p className="admin-stat-card__value">{stats.companies.total}</p>
                <p className="admin-stat-card__meta">
                  {stats.companies.pending} en attente ·{' '}
                  {stats.companies.approved} validées
                </p>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-card__icon">
                  <PackageCheck size={20} strokeWidth={2} />
                </div>
                <p className="admin-stat-card__label">Produits</p>
                <p className="admin-stat-card__value">{stats.products.total}</p>
                <p className="admin-stat-card__meta">
                  {stats.products.pending} à valider ·{' '}
                  {stats.products.approved} publiés
                </p>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-card__icon">
                  <Wallet size={20} strokeWidth={2} />
                </div>
                <p className="admin-stat-card__label">Stock catalogue</p>
                <p className="admin-stat-card__value admin-stat-card__value--sm">
                  {formatMoney(stats.catalog.approvedProductValue)}
                </p>
                <p className="admin-stat-card__meta">
                  Estimation : prix × quantité des produits approuvés (
                  {stats.catalog.totalStockUnits} unités). Ce n’est pas un
                  revenu de ventes.
                </p>
              </article>
            </div>
          </section>

          <section className="admin-dashboard__section">
            <h2 className="admin-dashboard__section-title">Analytics</h2>
            <div className="admin-chart-grid">
              <div className="admin-page-card admin-chart-card">
                <h3>Activité (7 derniers jours)</h3>
                <p className="admin-chart-card__hint">
                  Nouveaux comptes et produits créés chaque jour
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
                        name="Utilisateurs"
                        stroke="#a78bfa"
                        fill="url(#usersFill)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="products"
                        name="Produits"
                        stroke="#8eb4e0"
                        fill="url(#productsFill)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="admin-page-card admin-chart-card">
                <h3>Répartition des utilisateurs</h3>
                <p className="admin-chart-card__hint">Clients / entreprises / admins</p>
                <div className="admin-chart-card__body">
                  {usersPie.length === 0 ? (
                    <p className="admin-dashboard__empty">Pas encore de données.</p>
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
                <h3>Statut des produits</h3>
                <p className="admin-chart-card__hint">En attente / approuvés / rejetés</p>
                <div className="admin-chart-card__body">
                  {productsPie.length === 0 ? (
                    <p className="admin-dashboard__empty">Pas encore de données.</p>
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
                <h3>Statut des entreprises</h3>
                <p className="admin-chart-card__hint">Validation des comptes company</p>
                <div className="admin-chart-card__body">
                  {companiesPie.length === 0 ? (
                    <p className="admin-dashboard__empty">Pas encore de données.</p>
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
                  <strong>Gestion utilisateurs</strong>
                  <span>Comptes, rôles et statuts</span>
                </div>
              </Link>
              <Link to="/admin/product-validations" className="admin-module-card">
                <PackageCheck size={22} strokeWidth={2} />
                <div>
                  <strong>Validation produits</strong>
                  <span>
                    {stats.products.pending} produit
                    {stats.products.pending === 1 ? '' : 's'} en attente
                  </span>
                </div>
              </Link>
              <Link to="/admin/validations" className="admin-module-card">
                <ClipboardCheck size={22} strokeWidth={2} />
                <div>
                  <strong>Validation entreprises</strong>
                  <span>
                    {stats.companies.pending} demande
                    {stats.companies.pending === 1 ? '' : 's'} en attente
                  </span>
                </div>
              </Link>
              <Link to="/admin/revenue" className="admin-module-card">
                <TrendingUp size={22} strokeWidth={2} />
                <div>
                  <strong>Revenus</strong>
                  <span>Suivi financier de la plateforme</span>
                </div>
              </Link>
              <Link to="/admin/campaigns" className="admin-module-card">
                <Megaphone size={22} strokeWidth={2} />
                <div>
                  <strong>Campagnes sponsorisées</strong>
                  <span>Promotions et visibilité payante</span>
                </div>
              </Link>
              <Link to="/admin/analytics" className="admin-module-card">
                <BarChart3 size={22} strokeWidth={2} />
                <div>
                  <strong>Analytics</strong>
                  <span>Trafic, conversions et tendances</span>
                </div>
              </Link>
            </div>
          </section>

          <section className="admin-dashboard__split">
            <div className="admin-page-card">
              <div className="admin-dashboard__card-head">
                <h2>Entreprises à valider</h2>
                <Link to="/admin/validations">Voir tout</Link>
              </div>
              {stats.recent.pendingCompanies.length === 0 ? (
                <p className="admin-dashboard__empty">Aucune demande en attente.</p>
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
                <h2>Produits à valider</h2>
                <Link to="/admin/product-validations">Voir tout</Link>
              </div>
              {stats.recent.pendingProducts.length === 0 ? (
                <p className="admin-dashboard__empty">Aucun produit en attente.</p>
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
