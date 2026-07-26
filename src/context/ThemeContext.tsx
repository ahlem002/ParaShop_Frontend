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

/** Hue for each accent family */
const ACCENT_HUES: Record<AccentColor, number> = {
  lavender: 258,
  pink: 330,
  rose: 355,
  blue: 210,
  mint: 158,
  peach: 28,
};

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    value: 'lavender',
    label: 'Lavender',
    description: 'Soft muted purple',
    swatch: 'hsl(258, 55%, 72%)',
  },
  {
    value: 'pink',
    label: 'Pastel pink',
    description: 'Gentle blush accents',
    swatch: 'hsl(330, 50%, 76%)',
  },
  {
    value: 'rose',
    label: 'Rose',
    description: 'Dusty rose tones',
    swatch: 'hsl(355, 48%, 76%)',
  },
  {
    value: 'blue',
    label: 'Sky blue',
    description: 'Calm powder blue',
    swatch: 'hsl(210, 48%, 72%)',
  },
  {
    value: 'mint',
    label: 'Mint',
    description: 'Soft sage green',
    swatch: 'hsl(158, 38%, 68%)',
  },
  {
    value: 'peach',
    label: 'Peach',
    description: 'Warm muted apricot',
    swatch: 'hsl(28, 55%, 74%)',
  },
];

interface ThemeContextValue {
  theme: ThemeMode;
  accent: AccentColor;
  /** 0 = softest / muted, 100 = strongest / vivid */
  accentIntensity: number;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  setAccentIntensity: (intensity: number) => void;
}

const THEME_KEY = 'parashop-theme';
const ACCENT_KEY = 'parashop-accent';
const INTENSITY_KEY = 'parashop-accent-intensity';
const DEFAULT_INTENSITY = 35;

const ThemeContext = createContext<ThemeContextValue | null>(null);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

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

function getPreferredIntensity(): number {
  if (typeof window === 'undefined') return DEFAULT_INTENSITY;
  const stored = window.localStorage.getItem(INTENSITY_KEY);
  if (stored == null) return DEFAULT_INTENSITY;
  const parsed = Number(stored);
  if (Number.isNaN(parsed)) return DEFAULT_INTENSITY;
  return clamp(Math.round(parsed), 0, 100);
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme);
}

function applyAccentAttr(accent: AccentColor) {
  document.documentElement.setAttribute('data-accent', accent);
}

/**
 * Maps intensity 0→100 onto soft pastel ↔ stronger accent brand tokens.
 */
function applyAccentPalette(
  accent: AccentColor,
  intensity: number,
  theme: ThemeMode,
) {
  const root = document.documentElement;
  const h = ACCENT_HUES[accent];
  const t = clamp(intensity, 0, 100) / 100;

  if (theme === 'light') {
    const s = 18 + t * 52; // 18 → 70
    const l = 78 - t * 22; // 78 → 56
    const hoverS = Math.min(78, s + 8);
    const hoverL = Math.max(42, l - 10);
    const softS = 10 + t * 18;
    const softL = 95 - t * 4;
    const bgL = 98 - t * 2;
    const borderL = 92 - t * 8;
    const iconBgL = 94 - t * 5;
    const shadowA = 0.05 + t * 0.1;

    root.style.setProperty('--primary-lavender', hsl(h, s, l));
    root.style.setProperty('--primary-hover', hsl(h, hoverS, hoverL));
    root.style.setProperty('--light-accent', hsl(h, softS, softL));
    root.style.setProperty('--bg-very-light', hsl(h, Math.max(6, softS * 0.45), bgL));
    root.style.setProperty('--border-input', hsl(h, softS, borderL));
    root.style.setProperty('--sidebar-client', hsl(h, hoverS, hoverL));
    root.style.setProperty('--sidebar-company', hsl(h, s, l));
    root.style.setProperty('--sidebar-admin-border', hsl(h, softS * 0.8, borderL + 2));
    root.style.setProperty('--sidebar-admin-hover', hsl(h, softS * 0.5, bgL));
    root.style.setProperty('--soft-shadow', `0 4px 18px ${hsl(h, s, l, shadowA)}`);
    root.style.setProperty('--accent-icon-bg', hsl(h, softS, iconBgL));
    root.style.setProperty('--accent-icon-fg', hsl(h, hoverS, hoverL));
    return;
  }

  // Dark mode: keep accents readable, intensity adds saturation
  const s = 22 + t * 42; // 22 → 64
  const l = 70 + t * 8; // 70 → 78
  const hoverS = Math.min(70, s + 6);
  const hoverL = Math.min(86, l + 8);
  const softS = 18 + t * 20;
  const softL = 18 + t * 4;
  const shadowA = 0.4;

  root.style.setProperty('--primary-lavender', hsl(h, s, l));
  root.style.setProperty('--primary-hover', hsl(h, hoverS, hoverL));
  root.style.setProperty('--light-accent', hsl(h, softS, softL));
  root.style.setProperty('--bg-very-light', '#16161f');
  root.style.setProperty('--border-input', '#3f3f54');
  root.style.setProperty('--sidebar-client', hsl(h, s, l));
  root.style.setProperty('--sidebar-company', hsl(h, hoverS, hoverL));
  root.style.setProperty('--sidebar-admin-border', '#2a2a3a');
  root.style.setProperty('--sidebar-admin-hover', '#222233');
  root.style.setProperty('--soft-shadow', `0 4px 24px hsl(0 0% 0% / ${shadowA})`);
  root.style.setProperty('--accent-icon-bg', hsl(h, softS, softL));
  root.style.setProperty('--accent-icon-fg', hsl(h, hoverS, hoverL));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const initialTheme = getPreferredTheme();
    const initialAccent = getPreferredAccent();
    const initialIntensity = getPreferredIntensity();
    applyTheme(initialTheme);
    applyAccentAttr(initialAccent);
    applyAccentPalette(initialAccent, initialIntensity, initialTheme);
    return initialTheme;
  });

  const [accent, setAccentState] = useState<AccentColor>(() =>
    getPreferredAccent(),
  );

  const [accentIntensity, setAccentIntensityState] = useState<number>(() =>
    getPreferredIntensity(),
  );

  useEffect(() => {
    applyTheme(theme);
    applyAccentAttr(accent);
    applyAccentPalette(accent, accentIntensity, theme);
    window.localStorage.setItem(THEME_KEY, theme);
    window.localStorage.setItem(ACCENT_KEY, accent);
    window.localStorage.setItem(INTENSITY_KEY, String(accentIntensity));
  }, [theme, accent, accentIntensity]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
  }, []);

  const setAccent = useCallback((next: AccentColor) => {
    setAccentState(next);
  }, []);

  const setAccentIntensity = useCallback((next: number) => {
    setAccentIntensityState(clamp(Math.round(next), 0, 100));
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      accent,
      accentIntensity,
      toggleTheme,
      setTheme,
      setAccent,
      setAccentIntensity,
    }),
    [
      theme,
      accent,
      accentIntensity,
      toggleTheme,
      setTheme,
      setAccent,
      setAccentIntensity,
    ],
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
