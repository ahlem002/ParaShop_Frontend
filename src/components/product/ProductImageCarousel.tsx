import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type ProductImageCarouselProps = {
  images: string[];
  alt: string;
  intervalMs?: number;
  className?: string;
};

export function ProductImageCarousel({
  images,
  alt,
  intervalMs = 3500,
  className = '',
}: ProductImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = images.length;
  const current = images[index] ?? images[0] ?? null;

  useEffect(() => {
    setIndex(0);
  }, [images.join('|')]);

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [count, paused, intervalMs]);

  function goTo(next: number) {
    if (count < 1) return;
    setIndex((next + count) % count);
  }

  if (!current) {
    return (
      <div
        className={`product-carousel product-carousel--empty${className ? ` ${className}` : ''}`}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={`product-carousel${className ? ` ${className}` : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="product-carousel__stage">
        {count > 1 && (
          <button
            type="button"
            className="product-carousel__nav product-carousel__nav--prev"
            aria-label="Previous image"
            onClick={() => goTo(index - 1)}
          >
            <ChevronLeft size={22} strokeWidth={2.25} />
          </button>
        )}

        <img
          key={current}
          src={current}
          alt={alt}
          className="product-carousel__image"
        />

        {count > 1 && (
          <button
            type="button"
            className="product-carousel__nav product-carousel__nav--next"
            aria-label="Next image"
            onClick={() => goTo(index + 1)}
          >
            <ChevronRight size={22} strokeWidth={2.25} />
          </button>
        )}
      </div>

      {count > 1 && (
        <div className="product-carousel__dots" role="tablist" aria-label="Product images">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Image ${i + 1} of ${count}`}
              className={`product-carousel__dot${i === index ? ' is-active' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
