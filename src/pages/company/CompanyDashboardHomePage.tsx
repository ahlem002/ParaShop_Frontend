import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Heart,
  Package,
  PackageX,
  ShoppingCart,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getCompanyStats } from '../../services/company.service';
import type { CompanyDashboardStats } from '../../types/company';

const COLORS = {
  mint: '#8ec9b4',
  peach: '#e8b890',
  rose: '#e8a4c4',
  blue: '#8eb4e0',
  lavender: '#a78bfa',
};

const PIE_COLORS = [
  COLORS.mint,
  COLORS.peach,
  COLORS.rose,
  COLORS.blue,
  COLORS.lavender,
];

function formatMoney(value: number) {
  return `${Number(value).toFixed(2)} TND`;
}

function shortLabel(name: string, max = 14) {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

export function CompanyDashboardHomePage() {
  const [stats, setStats] = useState<CompanyDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getCompanyStats();
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load dashboard statistics',
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

  const stockPie = useMemo(() => {
    if (!stats) return [];
    const healthy =
      Math.max(0, stats.products.inStock - stats.products.lowStock);
    return [
      { name: 'Healthy stock', value: healthy },
      { name: 'Low stock', value: stats.products.lowStock },
      { name: 'Out of stock', value: stats.products.outOfStock },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const statusPie = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Pending', value: stats.products.pending },
      { name: 'Approved', value: stats.products.approved },
      { name: 'Rejected', value: stats.products.rejected },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const topSellingBars = useMemo(() => {
    if (!stats) return [];
    return stats.topSelling.map((p) => ({
      name: shortLabel(p.name),
      units: p.unitsSold,
      revenue: p.revenue,
    }));
  }, [stats]);

  const engagementBars = useMemo(() => {
    if (!stats) return [];
    const byId = new Map<
      string,
      { name: string; favorites: number; cartUnits: number }
    >();

    for (const p of stats.mostFavorited) {
      byId.set(p.productId, {
        name: shortLabel(p.name),
        favorites: p.favorites,
        cartUnits: 0,
      });
    }
    for (const p of stats.mostInCart) {
      const existing = byId.get(p.productId);
      if (existing) {
        existing.cartUnits = p.cartUnits;
      } else {
        byId.set(p.productId, {
          name: shortLabel(p.name),
          favorites: 0,
          cartUnits: p.cartUnits,
        });
      }
    }

    return Array.from(byId.values()).slice(0, 6);
  }, [stats]);

  const radarData = useMemo(() => {
    if (!stats) return [];
    return [
      { metric: 'Products', value: stats.products.total },
      { metric: 'In stock', value: stats.products.inStock },
      { metric: 'Units sold', value: stats.sales.unitsSold },
      { metric: 'Favorites', value: stats.engagement.favorites },
      { metric: 'In carts', value: stats.engagement.inCarts },
      { metric: 'Orders', value: stats.sales.paidOrders },
    ];
  }, [stats]);

  const hasSalesTrend = Boolean(
    stats?.charts.salesLast7Days.some(
      (d) => d.revenue > 0 || d.units > 0 || d.orders > 0,
    ),
  );
  const hasFavoritesTrend = Boolean(
    stats?.charts.favoritesLast7Days.some((d) => d.favorites > 0),
  );

  return (
    <div className="admin-page admin-dashboard">
      <div className="admin-page-heading">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">
            Stock, sales, and customer interest for your products
          </p>
        </div>
        <Link to="/company/products" className="btn btn-primary">
          Manage products
        </Link>
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
            <h2 className="admin-dashboard__section-title">Overview</h2>
            <div className="admin-stat-grid">
              <article className="admin-stat-card">
                <div className="admin-stat-card__icon">
                  <Package size={20} strokeWidth={2} />
                </div>
                <p className="admin-stat-card__label">Products</p>
                <p className="admin-stat-card__value">{stats.products.total}</p>
                <p className="admin-stat-card__meta">
                  {stats.products.approved} approved · {stats.products.pending}{' '}
                  pending · {stats.products.rejected} rejected
                </p>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-card__icon">
                  <PackageX size={20} strokeWidth={2} />
                </div>
                <p className="admin-stat-card__label">Out of stock</p>
                <p className="admin-stat-card__value">
                  {stats.products.outOfStock}
                </p>
                <p className="admin-stat-card__meta">
                  {stats.products.lowStock} low stock (≤ 5) ·{' '}
                  {stats.products.inStock} in stock
                </p>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-card__icon">
                  <ShoppingBag size={20} strokeWidth={2} />
                </div>
                <p className="admin-stat-card__label">Units sold</p>
                <p className="admin-stat-card__value">{stats.sales.unitsSold}</p>
                <p className="admin-stat-card__meta">
                  {stats.sales.paidOrders} paid order
                  {stats.sales.paidOrders === 1 ? '' : 's'}
                </p>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-card__icon">
                  <Wallet size={20} strokeWidth={2} />
                </div>
                <p className="admin-stat-card__label">Revenue</p>
                <p className="admin-stat-card__value admin-stat-card__value--sm">
                  {formatMoney(stats.sales.revenue)}
                </p>
                <p className="admin-stat-card__meta">
                  This month: {formatMoney(stats.sales.revenueThisMonth)}
                </p>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-card__icon">
                  <Heart size={20} strokeWidth={2} />
                </div>
                <p className="admin-stat-card__label">Favorites</p>
                <p className="admin-stat-card__value">
                  {stats.engagement.favorites}
                </p>
                <p className="admin-stat-card__meta">
                  Times clients saved your products
                </p>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-card__icon">
                  <ShoppingCart size={20} strokeWidth={2} />
                </div>
                <p className="admin-stat-card__label">In carts</p>
                <p className="admin-stat-card__value">
                  {stats.engagement.inCarts}
                </p>
                <p className="admin-stat-card__meta">
                  {stats.engagement.cartUnits} unit
                  {stats.engagement.cartUnits === 1 ? '' : 's'} waiting in carts
                </p>
              </article>
            </div>
          </section>

          <section className="admin-dashboard__section">
            <h2 className="admin-dashboard__section-title">Analytics</h2>
            <div className="admin-chart-grid admin-chart-grid--wide">
              <div className="admin-page-card admin-chart-card admin-chart-card--span2">
                <h3>Sales trend (7 days)</h3>
                <p className="admin-chart-card__hint">
                  Revenue and units sold from paid orders
                </p>
                <div className="admin-chart-card__body">
                  {!hasSalesTrend ? (
                    <p className="admin-dashboard__empty">
                      No paid sales in the last 7 days.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <ComposedChart data={stats.charts.salesLast7Days}>
                        <defs>
                          <linearGradient
                            id="companyRevenueFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={COLORS.mint}
                              stopOpacity={0.35}
                            />
                            <stop
                              offset="95%"
                              stopColor={COLORS.mint}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border-input)"
                        />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis
                          yAxisId="left"
                          allowDecimals={false}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === 'revenue') {
                              return [formatMoney(Number(value)), 'Revenue'];
                            }
                            return [value, name === 'units' ? 'Units' : 'Orders'];
                          }}
                        />
                        <Legend />
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="revenue"
                          name="Revenue"
                          stroke={COLORS.mint}
                          fill="url(#companyRevenueFill)"
                          strokeWidth={2}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="units"
                          name="Units"
                          fill={COLORS.blue}
                          radius={[6, 6, 0, 0]}
                          barSize={28}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="orders"
                          name="Orders"
                          stroke={COLORS.peach}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="admin-page-card admin-chart-card">
                <h3>Stock mix</h3>
                <p className="admin-chart-card__hint">
                  In stock / low stock / out of stock
                </p>
                <div className="admin-chart-card__body">
                  {stockPie.length === 0 ? (
                    <p className="admin-dashboard__empty">No products yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={stockPie}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {stockPie.map((entry, index) => (
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
                <h3>Product validation</h3>
                <p className="admin-chart-card__hint">
                  Pending / approved / rejected
                </p>
                <div className="admin-chart-card__body">
                  {statusPie.length === 0 ? (
                    <p className="admin-dashboard__empty">No products yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={statusPie}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                        >
                          {statusPie.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]}
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
                <h3>Top selling products</h3>
                <p className="admin-chart-card__hint">Units sold (paid)</p>
                <div className="admin-chart-card__body">
                  {topSellingBars.length === 0 ? (
                    <p className="admin-dashboard__empty">No paid sales yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={topSellingBars} layout="vertical">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border-input)"
                        />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={90}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(value, name) =>
                            name === 'revenue'
                              ? [formatMoney(Number(value)), 'Revenue']
                              : [value, 'Units']
                          }
                        />
                        <Bar
                          dataKey="units"
                          name="Units"
                          fill={COLORS.lavender}
                          radius={[0, 6, 6, 0]}
                          barSize={16}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="admin-page-card admin-chart-card">
                <h3>Stock levels</h3>
                <p className="admin-chart-card__hint">
                  Lowest stock products first
                </p>
                <div className="admin-chart-card__body">
                  {stats.charts.stockLevels.length === 0 ? (
                    <p className="admin-dashboard__empty">No products yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={stats.charts.stockLevels}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border-input)"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar
                          dataKey="stock"
                          name="Stock"
                          fill={COLORS.peach}
                          radius={[6, 6, 0, 0]}
                        >
                          {stats.charts.stockLevels.map((entry) => (
                            <Cell
                              key={entry.productId}
                              fill={
                                entry.stock === 0
                                  ? COLORS.rose
                                  : entry.stock <= 5
                                    ? COLORS.peach
                                    : COLORS.mint
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="admin-page-card admin-chart-card">
                <h3>Favorites trend</h3>
                <p className="admin-chart-card__hint">
                  New favorites over the last 7 days
                </p>
                <div className="admin-chart-card__body">
                  {!hasFavoritesTrend ? (
                    <p className="admin-dashboard__empty">
                      No new favorites this week.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={stats.charts.favoritesLast7Days}>
                        <defs>
                          <linearGradient
                            id="companyFavFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={COLORS.rose}
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor={COLORS.rose}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border-input)"
                        />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="favorites"
                          name="Favorites"
                          stroke={COLORS.rose}
                          fill="url(#companyFavFill)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="admin-page-card admin-chart-card">
                <h3>Engagement by product</h3>
                <p className="admin-chart-card__hint">
                  Favorites vs units currently in carts
                </p>
                <div className="admin-chart-card__body">
                  {engagementBars.length === 0 ? (
                    <p className="admin-dashboard__empty">
                      No favorites or cart activity yet.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={engagementBars}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border-input)"
                        />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="favorites"
                          name="Favorites"
                          fill={COLORS.rose}
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="cartUnits"
                          name="In cart"
                          fill={COLORS.blue}
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="admin-page-card admin-chart-card">
                <h3>Business snapshot</h3>
                <p className="admin-chart-card__hint">
                  Relative overview of catalog, sales, and interest
                </p>
                <div className="admin-chart-card__body">
                  {radarData.every((d) => d.value === 0) ? (
                    <p className="admin-dashboard__empty">No data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="var(--border-input)" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis tick={{ fontSize: 10 }} />
                        <Radar
                          name="Activity"
                          dataKey="value"
                          stroke={COLORS.lavender}
                          fill={COLORS.lavender}
                          fillOpacity={0.35}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="admin-page-card admin-chart-card">
                <h3>Daily orders</h3>
                <p className="admin-chart-card__hint">Paid orders per day</p>
                <div className="admin-chart-card__body">
                  {!hasSalesTrend ? (
                    <p className="admin-dashboard__empty">
                      No paid orders this week.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={stats.charts.salesLast7Days}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border-input)"
                        />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="orders"
                          name="Orders"
                          stroke={COLORS.blue}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: COLORS.blue }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="admin-dashboard__split">
            <div className="admin-page-card">
              <div className="admin-dashboard__card-head">
                <h2>
                  <AlertTriangle size={18} strokeWidth={2} /> Out of stock
                </h2>
                <Link to="/company/products">View all</Link>
              </div>
              {stats.outOfStockProducts.length === 0 ? (
                <p className="admin-dashboard__empty">
                  All products have stock.
                </p>
              ) : (
                <ul className="admin-dashboard__list">
                  {stats.outOfStockProducts.map((product) => (
                    <li key={product.productId}>
                      <span>
                        <Link to={`/company/products/${product.productId}`}>
                          {product.name}
                        </Link>
                        <small>{product.verificationStatus}</small>
                      </span>
                      <time>0 left</time>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="admin-page-card">
              <div className="admin-dashboard__card-head">
                <h2>
                  <Package size={18} strokeWidth={2} /> Low stock
                </h2>
                <Link to="/company/products">View all</Link>
              </div>
              {stats.lowStockProducts.length === 0 ? (
                <p className="admin-dashboard__empty">
                  No products with low stock.
                </p>
              ) : (
                <ul className="admin-dashboard__list">
                  {stats.lowStockProducts.map((product) => (
                    <li key={product.productId}>
                      <span>
                        <Link to={`/company/products/${product.productId}`}>
                          {product.name}
                        </Link>
                        <small>{formatMoney(product.price)}</small>
                      </span>
                      <time>{product.stock} left</time>
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
