import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  /** Show a “Dark mode” label (used in sidebars) */
  showLabel?: boolean;
}

export function ThemeToggle({
  className = '',
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`theme-switch-wrap${showLabel ? ' theme-switch-wrap--labeled' : ''} ${className}`.trim()}
    >
      {showLabel && (
        <span className="theme-switch-wrap__text">
          <span className="theme-switch-wrap__title">Dark mode</span>
          <span className="theme-switch-wrap__hint">
            {isDark ? 'On' : 'Off'}
          </span>
        </span>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        className={`theme-switch${isDark ? ' is-on' : ''}`}
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        <Sun
          size={13}
          strokeWidth={2.25}
          className="theme-switch__icon theme-switch__icon--sun"
          aria-hidden
        />
        <span className="theme-switch__track" aria-hidden>
          <span className="theme-switch__thumb" />
        </span>
        <Moon
          size={13}
          strokeWidth={2.25}
          className="theme-switch__icon theme-switch__icon--moon"
          aria-hidden
        />
      </button>
    </div>
  );
}
