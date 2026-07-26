import { Search } from 'lucide-react';

export interface ListToolbarSelect {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

interface ListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  selects?: ListToolbarSelect[];
  className?: string;
}

export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  searchAriaLabel = 'Search',
  selects = [],
  className = '',
}: ListToolbarProps) {
  return (
    <div className={`list-toolbar ${className}`.trim()}>
      <div className="list-toolbar__field list-toolbar__field--search">
        <span className="list-toolbar__label">{searchAriaLabel}</span>
        <div className="admin-search">
          <Search size={18} strokeWidth={2} className="admin-search__icon" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchAriaLabel}
          />
        </div>
      </div>

      {selects.map((select) => (
        <label key={select.id} className="list-toolbar__field">
          <span className="list-toolbar__label">{select.label}</span>
          <select
            className="admin-select"
            value={select.value}
            onChange={(event) => select.onChange(event.target.value)}
            aria-label={select.label}
          >
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
