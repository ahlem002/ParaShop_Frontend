import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { ProductCard } from '../components/home/ProductCard';
import type { PublicProduct } from '../types/product';
import { getPublicProducts } from '../services/products.service';
import '../styles/pages/home.css';

export function ProductsPage() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Navbar />
      <main className="container home-container">
        <section className="best-sellers">
          <div className="section-header">
            <h2>Products</h2>
          </div>
          <p className="products-page-intro">
            Browse all approved products from our partner companies.
          </p>

          {loading && <p>Loading products...</p>}
          {error && <p>{error}</p>}

          {!loading && !error && products.length === 0 && (
            <p>No products available yet.</p>
          )}

          {!loading && products.length > 0 && (
            <div className="products-grid">
              {products.map((product) => (
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
    </>
  );
}
