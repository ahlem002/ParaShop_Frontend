import { Link } from 'react-router-dom';
import { categories } from '../../data/categories';

export function CategoriesSection() {
  return (
    <section className="categories-section">
      {categories.map(({ id, name, icon: Icon }) => (
        <Link
          key={id}
          to={`/products?category=${encodeURIComponent(name)}`}
          className="category-card"
        >
          <div className="category-icon">
            <Icon size={24} strokeWidth={2} />
          </div>
          <span className="category-name">{name}</span>
        </Link>
      ))}
    </section>
  );
}
