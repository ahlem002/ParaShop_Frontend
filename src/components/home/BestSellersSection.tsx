import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import type { PublicProduct } from '../../types/product';
import { getPublicProducts } from '../../services/products.service';

export function BestSellersSection() {
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
          setProducts(data.slice(0, 8));
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
    <section className="best-sellers" id="best-sellers">
      <div className="section-header">
        <h2>Best sellers</h2>
        <Link to="/products" className="view-all">
          View all
        </Link>
      </div>

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
    </section>
  );
}
