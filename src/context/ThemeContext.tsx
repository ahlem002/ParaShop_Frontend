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

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    value: 'lavender',
    label: 'Lavender',
    description: 'Soft muted purple',
    swatch: '#a78bfa',
  },
  {
    value: 'pink',
    label: 'Pastel pink',
    description: 'Gentle blush accents',
    swatch: '#e8a4c4',
  },
  {
    value: 'rose',
    label: 'Rose',
    description: 'Dusty rose tones',
    swatch: '#e8a0a8',
  },
  {
    value: 'blue',
    label: 'Sky blue',
    description: 'Calm powder blue',
    swatch: '#8eb4e0',
  },
  {
    value: 'mint',
    label: 'Mint',
    description: 'Soft sage green',
    swatch: '#8ec9b4',
  },
  {
    value: 'peach',
    label: 'Peach',
    description: 'Warm muted apricot',
    swatch: '#e8b890',
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

function applyAccent(accent: AccentColor) {
  document.documentElement.setAttribute('data-accent', accent);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const initial = getPreferredTheme();
    applyTheme(initial);
    return initial;
  });

  const [accent, setAccentState] = useState<AccentColor>(() => {
    const initial = getPreferredAccent();
    applyAccent(initial);
    return initial;
  });

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    applyAccent(accent);
    window.localStorage.setItem(ACCENT_KEY, accent);
  }, [accent]);

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
    () => ({ theme, accent, toggleTheme, setTheme, setAccent }),
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
