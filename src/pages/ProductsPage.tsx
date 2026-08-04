import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PublicShell } from '../components/layout/PublicShell';
import { ProductCard } from '../components/home/ProductCard';
import { ListToolbar } from '../components/common/ListToolbar';
import type { PublicProduct } from '../types/product';
import { getPublicProducts } from '../services/products.service';
import '../styles/pages/home.css';
import '../styles/pages/admin.css';

export function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get('category') ?? 'ALL',
  );
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [priceFilter, setPriceFilter] = useState('ALL');

  useEffect(() => {
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    if (q != null) setSearch(q);
    if (category != null) setCategoryFilter(category);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const data = await getPublicProducts();
        if (!cancelled) {
          setProducts(data);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load products.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

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

    return products.filter((product) => {
      if (categoryFilter !== 'ALL') {
        const name = product.category?.name ?? '';
        if (
          name !== categoryFilter &&
          !name.toLowerCase().includes(categoryFilter.toLowerCase())
        ) {
          return false;
        }
      }

      if (
        companyFilter !== 'ALL' &&
        product.company?.companyName !== companyFilter
      ) {
        return false;
      }

      if (stockFilter === 'IN' && product.stock <= 0) return false;
      if (stockFilter === 'OUT' && product.stock > 0) return false;

      const price = Number(product.price);
      if (priceFilter === 'LOW' && !(price < 50)) return false;
      if (priceFilter === 'MID' && !(price >= 50 && price <= 150)) return false;
      if (priceFilter === 'HIGH' && !(price > 150)) return false;

      if (!query) return true;

      return (
        product.name.toLowerCase().includes(query) ||
        product.laboratory.toLowerCase().includes(query) ||
        (product.company?.companyName ?? '').toLowerCase().includes(query) ||
        (product.description ?? '').toLowerCase().includes(query) ||
        (product.category?.name ?? '').toLowerCase().includes(query)
      );
    });
  }, [
    products,
    search,
    categoryFilter,
    companyFilter,
    stockFilter,
    priceFilter,
  ]);

  return (
    <PublicShell>
      <main className="container home-container">
        <section className="best-sellers">
          <div className="section-header">
            <h2>Products</h2>
          </div>
          <p className="products-page-intro">
            Browse all approved products from our partner companies.
          </p>

          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, company, laboratory..."
            searchAriaLabel="Search products"
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
              {
                id: 'stock',
                label: 'Filter by stock',
                value: stockFilter,
                onChange: setStockFilter,
                options: [
                  { value: 'ALL', label: 'All stock' },
                  { value: 'IN', label: 'In stock' },
                  { value: 'OUT', label: 'Out of stock' },
                ],
              },
              {
                id: 'price',
                label: 'Filter by price',
                value: priceFilter,
                onChange: setPriceFilter,
                options: [
                  { value: 'ALL', label: 'All prices' },
                  { value: 'LOW', label: 'Under 50' },
                  { value: 'MID', label: '50 – 150' },
                  { value: 'HIGH', label: 'Over 150' },
                ],
              },
            ]}
          />

          {loading && <p>Loading products...</p>}
          {error && <p>{error}</p>}

          {!loading && !error && products.length === 0 && (
            <p>No products available yet.</p>
          )}

          {!loading && products.length > 0 && filtered.length === 0 && (
            <p>No products match your search or filters.</p>
          )}

          {!loading && filtered.length > 0 && (
            <div className="products-grid">
              {filtered.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          )}

          <div style={{ marginTop: 32 }}>
            <Link to="/" className="btn btn-secondary">
              Back to home
            </Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
