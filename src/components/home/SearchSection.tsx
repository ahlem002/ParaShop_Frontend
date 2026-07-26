import { Search } from 'lucide-react';

export function SearchSection() {
  return (
    <section className="search-section">
      <div className="search-bar">
        <Search className="search-icon-left" size={18} strokeWidth={2} />
        <input
          type="text"
          placeholder="Search for a medicine or product..."
        />
        <button type="button" className="search-btn" aria-label="Search">
          <Search size={16} strokeWidth={2} />
        </button>
      </div>
    </section>
  );
}
