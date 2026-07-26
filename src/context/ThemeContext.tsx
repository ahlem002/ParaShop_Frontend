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

/** Hue for each accent family — tuned for pretty pastels */
const ACCENT_HUES: Record<AccentColor, number> = {
  lavender: 262,
  pink: 338,
  rose: 348,
  blue: 204,
  mint: 162,
  peach: 22,
};

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    value: 'lavender',
    label: 'Lavender',
    description: 'Soft lilac pastel',
    swatch: 'hsl(262 62% 74%)',
  },
  {
    value: 'pink',
    label: 'Pastel pink',
    description: 'Sweet blush pink',
    swatch: 'hsl(338 70% 78%)',
  },
  {
    value: 'rose',
    label: 'Rose',
    description: 'Soft rose petal',
    swatch: 'hsl(348 68% 76%)',
  },
  {
    value: 'blue',
    label: 'Sky blue',
    description: 'Airy powder blue',
    swatch: 'hsl(204 68% 74%)',
  },
  {
    value: 'mint',
    label: 'Mint',
    description: 'Fresh mint cream',
    swatch: 'hsl(162 52% 70%)',
  },
  {
    value: 'peach',
    label: 'Peach',
    description: 'Warm peach cream',
    swatch: 'hsl(22 78% 76%)',
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
const DEFAULT_INTENSITY = 48;

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
    // Soft = milky / washed pastel, Strong = deeper richer pastel.
    // Mix with white so intensity is obvious on solid buttons (not only shadows).
    const richS = 72;
    const richL = 58;
    const rich = hsl(h, richS, richL);
    const richHover = hsl(h, Math.min(84, richS + 6), Math.max(48, richL - 10));
    const amount = Math.round(32 + t * 68); // 32% → 100% color in the mix
    const hoverAmount = Math.min(100, amount + 8);
    const softAmount = Math.round(12 + t * 28);
    const shadowA = 0.06 + t * 0.14;

    const primary = `color-mix(in srgb, ${rich} ${amount}%, white)`;
    const primaryHover = `color-mix(in srgb, ${richHover} ${hoverAmount}%, white)`;
    const lightAccent = `color-mix(in srgb, ${rich} ${softAmount}%, white)`;

    // Page / surface backgrounds stay neutral — never follow accent hue
    const neutralBg = '#f8f8fa';
    const neutralBorder = '#ececf0';

    root.style.setProperty('--primary-lavender', primary);
    root.style.setProperty('--primary-hover', primaryHover);
    root.style.setProperty('--light-accent', lightAccent);
    root.style.setProperty('--bg-very-light', neutralBg);
    root.style.setProperty('--page-bg', '#ffffff');
    root.style.setProperty('--border-input', neutralBorder);
    root.style.setProperty('--sidebar-client', primaryHover);
    root.style.setProperty('--sidebar-company', primary);
    root.style.setProperty('--sidebar-admin-border', neutralBorder);
    root.style.setProperty('--sidebar-admin-hover', neutralBg);
    root.style.setProperty(
      '--soft-shadow',
      `0 4px 18px color-mix(in srgb, ${rich} ${Math.round(18 + t * 40)}%, transparent)`,
    );
    root.style.setProperty('--accent-icon-bg', lightAccent);
    root.style.setProperty('--accent-icon-fg', primaryHover);
    return;
  }

  // Dark mode: soft luminous pastels → stronger pastels
  const s = 40 + t * 38; // 40 → 78
  const l = 78 - t * 12; // 78 → 66 (stronger = slightly deeper)
  const hoverS = Math.min(82, s + 6);
  const hoverL = Math.min(88, l + 8);
  const softS = 24 + t * 22;
  const softL = 22 + t * 6;
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
