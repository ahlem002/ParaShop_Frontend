import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark';

export type AccentColor =
  | 'lavender'
  | 'pink'
  | 'blue'
  | 'mint'
  | 'peach'
  | 'rose';

export interface AccentOption {
  value: AccentColor;
  label: string;
  description: string;
  swatch: string;
}

/** Fixed HSL for each accent — saturated enough to read as real color, not a shadow tint */
const ACCENT_PALETTES: Record<
  AccentColor,
  { h: number; s: number; l: number; hoverL: number }
> = {
  lavender: { h: 268, s: 48, l: 42, hoverL: 34 },
  mint: { h: 152, s: 42, l: 34, hoverL: 26 },
  peach: { h: 24, s: 78, l: 48, hoverL: 40 },
  blue: { h: 210, s: 55, l: 42, hoverL: 34 },
  rose: { h: 350, s: 48, l: 46, hoverL: 38 },
  pink: { h: 340, s: 55, l: 52, hoverL: 44 },
};

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    value: 'lavender',
    label: 'Modern purple',
    description: 'Clean royal lilac',
    swatch: 'hsl(268 48% 42%)',
  },
  {
    value: 'mint',
    label: 'Natural green',
    description: 'Fresh forest green',
    swatch: 'hsl(152 42% 34%)',
  },
  {
    value: 'peach',
    label: 'Warm peach',
    description: 'Welcoming apricot',
    swatch: 'hsl(24 78% 48%)',
  },
  {
    value: 'blue',
    label: 'Calm blue',
    description: 'Trustworthy blue',
    swatch: 'hsl(210 55% 42%)',
  },
  {
    value: 'rose',
    label: 'Soft rose',
    description: 'Muted rose',
    swatch: 'hsl(350 48% 46%)',
  },
  {
    value: 'pink',
    label: 'Blush',
    description: 'Soft blush',
    swatch: 'hsl(340 55% 52%)',
  },
];

interface ThemeContextValue {
  theme: ThemeMode;
  accent: AccentColor;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
}

const THEME_KEY = 'parashop-theme';
const ACCENT_KEY = 'parashop-accent';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function hsl(h: number, s: number, l: number, a?: number) {
  if (a === undefined) return `hsl(${h} ${s}% ${l}%)`;
  return `hsl(${h} ${s}% ${l}% / ${a})`;
}

function isAccentColor(value: string | null): value is AccentColor {
  return ACCENT_OPTIONS.some((option) => option.value === value);
}

function getPreferredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';

  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getPreferredAccent(): AccentColor {
  if (typeof window === 'undefined') return 'lavender';
  const stored = window.localStorage.getItem(ACCENT_KEY);
  return isAccentColor(stored) ? stored : 'lavender';
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme);
}

function applyAccentAttr(accent: AccentColor) {
  document.documentElement.setAttribute('data-accent', accent);
}

function applyAccentPalette(accent: AccentColor, theme: ThemeMode) {
  const root = document.documentElement;
  const { h, s, l, hoverL } = ACCENT_PALETTES[accent];
  const primary = hsl(h, s, l);
  const primaryHover = hsl(h, Math.min(70, s + 8), hoverL);

  if (theme === 'light') {
    const soft = hsl(h, Math.max(18, s - 20), 94);
    const surface = hsl(h, Math.max(12, s - 28), 97);
    const pageBg = hsl(h, Math.max(10, s - 30), 98.5);
    const border = hsl(h, Math.max(10, s - 30), 88);

    root.style.setProperty('--primary-lavender', primary);
    root.style.setProperty('--primary-hover', primaryHover);
    root.style.setProperty('--light-accent', soft);
    root.style.setProperty('--bg-very-light', surface);
    root.style.setProperty('--page-bg', pageBg);
    root.style.setProperty('--white-cards', '#ffffff');
    root.style.setProperty('--border-input', border);
    root.style.setProperty('--sidebar-client', primaryHover);
    root.style.setProperty('--sidebar-company', primary);
    root.style.setProperty('--sidebar-admin-bg', primary);
    root.style.setProperty(
      '--sidebar-admin-border',
      hsl(h, s, Math.max(22, hoverL - 4)),
    );
    root.style.setProperty(
      '--sidebar-admin-hover',
      'rgba(255, 255, 255, 0.12)',
    );
    root.style.setProperty(
      '--soft-shadow',
      `0 8px 28px ${hsl(h, Math.min(40, s), 28, 0.12)}`,
    );
    root.style.setProperty('--accent-icon-bg', soft);
    root.style.setProperty('--accent-icon-fg', primary);
    root.style.setProperty('--chrome-bg', primary);
    root.style.setProperty('--chrome-bg-end', primaryHover);
    root.style.setProperty('--chrome-fg', '#ffffff');
    root.style.setProperty('--chrome-fg-muted', 'rgba(255, 255, 255, 0.82)');
    root.style.setProperty('--chrome-fg-active', '#ffffff');
    root.style.setProperty('--chrome-border', hsl(h, s, Math.max(22, hoverL - 4)));
    root.style.setProperty('--text-main', '#1c2430');
    root.style.setProperty('--text-secondary', '#5c6575');
    root.style.setProperty('--text-disabled', '#9aa3b2');
    return;
  }

  // Dark mode — brighter accent for contrast on dark surfaces
  const darkS = Math.min(70, s + 10);
  const darkL = Math.min(68, l + 18);
  const darkHoverL = Math.min(76, darkL + 8);
  const darkPrimary = hsl(h, darkS, darkL);
  const darkHover = hsl(h, darkS, darkHoverL);
  const soft = hsl(h, 28, 18);
  const border = '#3f3f54';

  root.style.setProperty('--primary-lavender', darkPrimary);
  root.style.setProperty('--primary-hover', darkHover);
  root.style.setProperty('--light-accent', soft);
  root.style.setProperty('--bg-very-light', '#16161f');
  root.style.setProperty('--page-bg', '#0f0f14');
  root.style.setProperty('--white-cards', '#1c1c28');
  root.style.setProperty('--border-input', border);
  root.style.setProperty('--sidebar-client', darkPrimary);
  root.style.setProperty('--sidebar-company', darkHover);
  root.style.setProperty(
    '--sidebar-admin-bg',
    hsl(h, darkS, Math.max(22, l - 8)),
  );
  root.style.setProperty(
    '--sidebar-admin-border',
    hsl(h, darkS, Math.max(12, l - 18)),
  );
  root.style.setProperty(
    '--sidebar-admin-hover',
    'rgba(255, 255, 255, 0.12)',
  );
  root.style.setProperty('--soft-shadow', '0 8px 28px hsl(0 0% 0% / 0.45)');
  root.style.setProperty('--accent-icon-bg', soft);
  root.style.setProperty('--accent-icon-fg', darkHover);
  root.style.setProperty('--chrome-bg', hsl(h, darkS, Math.max(22, l - 8)));
  root.style.setProperty('--chrome-bg-end', hsl(h, darkS, Math.max(16, l - 14)));
  root.style.setProperty('--chrome-fg', '#ffffff');
  root.style.setProperty('--chrome-fg-muted', 'rgba(255, 255, 255, 0.78)');
  root.style.setProperty('--chrome-fg-active', '#ffffff');
  root.style.setProperty('--chrome-border', hsl(h, darkS, Math.max(12, l - 18)));
  root.style.setProperty('--text-main', '#f3f4f6');
  root.style.setProperty('--text-secondary', '#a1a1aa');
  root.style.setProperty('--text-disabled', '#71717a');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const initialTheme = getPreferredTheme();
    const initialAccent = getPreferredAccent();
    applyTheme(initialTheme);
    applyAccentAttr(initialAccent);
    applyAccentPalette(initialAccent, initialTheme);
    return initialTheme;
  });

  const [accent, setAccentState] = useState<AccentColor>(() =>
    getPreferredAccent(),
  );

  useEffect(() => {
    applyTheme(theme);
    applyAccentAttr(accent);
    applyAccentPalette(accent, theme);
    window.localStorage.setItem(THEME_KEY, theme);
    window.localStorage.setItem(ACCENT_KEY, accent);
    window.localStorage.removeItem('parashop-accent-intensity');
  }, [theme, accent]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
  }, []);

  const setAccent = useCallback((next: AccentColor) => {
    setAccentState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      accent,
      toggleTheme,
      setTheme,
      setAccent,
    }),
    [theme, accent, toggleTheme, setTheme, setAccent],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
