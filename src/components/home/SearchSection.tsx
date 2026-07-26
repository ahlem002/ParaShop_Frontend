import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export function SearchSection() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/products?q=${encodeURIComponent(value)}` : '/products');
  }

  return (
    <section className="search-section">
      <form className="search-bar" onSubmit={handleSubmit}>
        <Search className="search-icon-left" size={18} strokeWidth={2} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for a medicine or product..."
          aria-label="Search products"
        />
        <button type="submit" className="search-btn" aria-label="Search">
          <Search size={16} strokeWidth={2} />
        </button>
      </form>
    </section>
  );
}
