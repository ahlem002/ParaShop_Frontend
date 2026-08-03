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

/** Hue for each accent — pharmacy / wellness professional tones */
const ACCENT_HUES: Record<AccentColor, number> = {
  lavender: 268,
  pink: 340,
  rose: 350,
  blue: 210,
  mint: 152,
  peach: 24,
};

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    value: 'lavender',
    label: 'Modern purple',
    description: 'Clean royal lilac',
    swatch: 'hsl(268 42% 42%)',
  },
  {
    value: 'mint',
    label: 'Natural green',
    description: 'Fresh forest green',
    swatch: 'hsl(152 38% 34%)',
  },
  {
    value: 'peach',
    label: 'Warm peach',
    description: 'Welcoming apricot',
    swatch: 'hsl(24 72% 48%)',
  },
  {
    value: 'blue',
    label: 'Calm blue',
    description: 'Trustworthy blue',
    swatch: 'hsl(210 48% 42%)',
  },
  {
    value: 'rose',
    label: 'Soft rose',
    description: 'Muted rose',
    swatch: 'hsl(350 42% 46%)',
  },
  {
    value: 'pink',
    label: 'Blush',
    description: 'Soft blush',
    swatch: 'hsl(340 48% 52%)',
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
const DEFAULT_INTENSITY = 72;

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
  const clamped = clamp(Math.round(parsed), 0, 100);
  // Old default (48) looked washed; lift once to the new default.
  if (clamped === 48) return DEFAULT_INTENSITY;
  return clamped;
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme);
}

function applyAccentAttr(accent: AccentColor) {
  document.documentElement.setAttribute('data-accent', accent);
}

/**
 * Maps intensity 0→100 onto soft tint ↔ deeper brand accent.
 * Tuned for pharmacy/wellness: deep buttons, cream-tinted surfaces.
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
    // Deep, muted primaries (forest / royal / apricot) — not candy pastels
    const primaryS = 34 + t * 22; // 34 → 56
    const primaryL = 40 - t * 8; // 40 → 32
    const hoverS = Math.min(62, primaryS + 6);
    const hoverL = Math.max(26, primaryL - 7);
    const softS = 20 + t * 14;
    const softL = 96 - t * 2;
    const primary = hsl(h, primaryS, primaryL);
    const primaryHover = hsl(h, hoverS, hoverL);
    const lightAccent = hsl(h, softS, softL);

    // Clean white surfaces — accent only on UI chrome, not the page wash
    const pageBg = '#ffffff';
    const surfaceBg = '#f7f7f9';
    const cardBg = '#ffffff';
    const border = '#e8e8ee';

    root.style.setProperty('--primary-lavender', primary);
    root.style.setProperty('--primary-hover', primaryHover);
    root.style.setProperty('--light-accent', lightAccent);
    root.style.setProperty('--bg-very-light', surfaceBg);
    root.style.setProperty('--page-bg', pageBg);
    root.style.setProperty('--white-cards', cardBg);
    root.style.setProperty('--border-input', border);
    root.style.setProperty('--sidebar-client', primaryHover);
    root.style.setProperty('--sidebar-company', primary);
    root.style.setProperty('--sidebar-admin-bg', cardBg);
    root.style.setProperty('--sidebar-admin-border', border);
    root.style.setProperty('--sidebar-admin-hover', surfaceBg);
    root.style.setProperty(
      '--soft-shadow',
      `0 8px 28px ${hsl(h, Math.min(40, primaryS), 28, 0.1 + t * 0.08)}`,
    );
    root.style.setProperty('--accent-icon-bg', lightAccent);
    root.style.setProperty('--accent-icon-fg', primary);
    root.style.setProperty('--text-main', '#1c2430');
    root.style.setProperty('--text-secondary', '#5c6575');
    root.style.setProperty('--text-disabled', '#9aa3b2');
    return;
  }

  // Dark mode
  const s = 36 + t * 28;
  const l = 68 - t * 8;
  const hoverS = Math.min(72, s + 6);
  const hoverL = Math.min(78, l + 6);
  const softS = 22 + t * 18;
  const softL = 18 + t * 6;

  root.style.setProperty('--primary-lavender', hsl(h, s, l));
  root.style.setProperty('--primary-hover', hsl(h, hoverS, hoverL));
  root.style.setProperty('--light-accent', hsl(h, softS, softL));
  root.style.setProperty('--bg-very-light', '#16161f');
  root.style.setProperty('--page-bg', '#0f0f14');
  root.style.setProperty('--white-cards', '#1c1c28');
  root.style.setProperty('--border-input', '#3f3f54');
  root.style.setProperty('--sidebar-client', hsl(h, s, l));
  root.style.setProperty('--sidebar-company', hsl(h, hoverS, hoverL));
  root.style.setProperty('--sidebar-admin-bg', '#151520');
  root.style.setProperty('--sidebar-admin-border', '#2a2a3a');
  root.style.setProperty('--sidebar-admin-hover', '#222233');
  root.style.setProperty('--soft-shadow', '0 8px 28px hsl(0 0% 0% / 0.45)');
  root.style.setProperty('--accent-icon-bg', hsl(h, softS, softL));
  root.style.setProperty('--accent-icon-fg', hsl(h, hoverS, hoverL));
  root.style.setProperty('--text-main', '#f3f4f6');
  root.style.setProperty('--text-secondary', '#a1a1aa');
  root.style.setProperty('--text-disabled', '#71717a');
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
