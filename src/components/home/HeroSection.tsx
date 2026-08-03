import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PublicProduct } from '../../types/product';
import { getPublicProducts } from '../../services/products.service';
import { resolveUploadUrl } from '../../config/api';

const ROTATE_MS = 3500;

export function HeroSection() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getPublicProducts();
        if (!cancelled) {
          setProducts(data);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const slides = useMemo(() => {
    const images: { src: string; alt: string }[] = [];

    for (const product of products) {
      const first = product.images?.[0];
      const url = resolveUploadUrl(first ?? null);
      if (url) {
        images.push({ src: url, alt: product.name });
      }
    }

    return images;
  }, [products]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = window.setInterval(() => {
      setFade(false);
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % slides.length);
        setFade(true);
      }, 280);
    }, ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const current = slides[index] ?? null;

  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1>
          Your health essentials, <span>one click away.</span>
        </h1>
        <p>
          Discover trusted pharmacies and wellness products from verified
          partners — carefully selected for everyday care.
        </p>
        <div className="hero-buttons">
          <Link to="/products" className="btn btn-primary">
            Explore products
          </Link>
          <a href="#best-sellers" className="btn btn-secondary">
            Learn more
          </a>
        </div>
      </div>
      <div className="hero-image">
        <div className="hero-image-frame">
          {current ? (
            <img
              key={current.src}
              src={current.src}
              alt={current.alt}
              className={`hero-product-image${fade ? ' is-visible' : ''}`}
            />
          ) : (
            <div
              className="illustration-bg"
              role="img"
              aria-label="Wellness and pharmacy products"
            />
          )}
        </div>
      </div>
    </section>
  );
}
