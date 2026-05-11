import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getThemeColors, type HSLColor } from './utils/utils';

/**
 * ThemeProvider Component
 *
 * A context provider that manages theme state for your application,
 * supporting light, dark, and system themes with localStorage persistence.
 *
 * Features:
 * - Theme state management (light, dark, system)
 * - Persistent theme selection using localStorage
 * - System theme detection and synchronization
 * - Automatic application of theme classes to the document root
 * - Context API for consuming theme state and functions throughout the app
 *
 * Props:
 * @param {ReactNode} children - Child components that will have access to the theme context
 * @param {Theme} [defaultTheme='light'] - The default theme to use if none is stored
 * @param {string} [storageKey='theme'] - The localStorage key used to persist theme preference
 *
 * @example
 * // Basic usage at the root of your app
 * <ThemeProvider defaultTheme="system">
 *   <App />
 * </ThemeProvider>
 *
 * // Consuming the theme context in a component
 * function ThemeToggle() {
 *   const { theme, setTheme } = useTheme();
 *
 *   return (
 *     <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *       Toggle theme
 *     </button>
 *   );
 * }
 */

type Theme = 'dark' | 'light' | 'system';

/**
 * Profile-aware theme overrides applied to `/u/:username`.
 *
 * When provided, `ThemeProvider` will:
 * - toggle `theme-minimal | theme-bold | theme-dark | theme-gradient` on `<html>`
 * - toggle `font-sans | font-serif | font-mono` on `<html>`
 * - set the inline CSS variable `--accent` only when `accent_color` matches
 *   `/^#[0-9a-fA-F]{6}$/` (invalid hex is silently ignored)
 *
 * The previous class list and `--accent` value are snapshotted on mount and
 * restored on unmount so the dashboard `light`/`dark`/`system` flow is never
 * polluted after leaving a public profile route.
 */
export type ThemeOverrides = {
  theme_preference?: 'minimal' | 'bold' | 'dark' | 'gradient';
  accent_color?: string;
  font_family?: 'sans' | 'serif' | 'mono';
};

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  overrides?: ThemeOverrides;
};

type ThemeProviderState = {
  theme: Theme;
  colors: {
    primary: string;
    secondary: string;
  };
  setTheme: (theme: Theme) => void;
};

type ColorPalette = {
  [key: string]: HSLColor;
};

const initialState: ThemeProviderState = {
  theme: 'light',
  colors: {
    primary: import.meta.env.VITE_PRIMARY_COLOR || '',
    secondary: import.meta.env.VITE_SECONDARY_COLOR || '',
  },
  setTheme: () => null,
};

const ThemeContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'theme',
  overrides,
}: Readonly<ThemeProviderProps>) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const [colors, setColors] = useState(() => {
    const themeColors = getThemeColors();
    const currentTheme = theme === 'dark' ? themeColors.dark : themeColors.light;
    const defaultPrimary = import.meta.env.VITE_PRIMARY_COLOR || '#15969B';
    const defaultSecondary = import.meta.env.VITE_SECONDARY_COLOR || '#5194B8';

    // Helper function to resolve color value
    const resolveColor = (
      color: string | HSLColor | ColorPalette | null | undefined,
      defaultValue: string
    ): string => {
      if (!color) return defaultValue;
      if (typeof color === 'string') return color;

      const hslColor = color as HSLColor;
      if (
        hslColor &&
        typeof hslColor === 'object' &&
        'h' in hslColor &&
        's' in hslColor &&
        'l' in hslColor
      ) {
        return `hsl(${hslColor.h}, ${hslColor.s}%, ${hslColor.l}%)`;
      }

      const colorPalette = color as ColorPalette;
      const firstColor = Object.values(colorPalette)[0];
      if (firstColor && 'h' in firstColor && 's' in firstColor && 'l' in firstColor) {
        return `hsl(${firstColor.h}, ${firstColor.s}%, ${firstColor.l}%)`;
      }

      return defaultValue;
    };

    const primaryColor = resolveColor(currentTheme.primary, defaultPrimary);
    const secondaryColor = resolveColor(currentTheme.secondary, defaultSecondary);

    return {
      primary: primaryColor,
      secondary: secondaryColor,
    };
  });

  useEffect(() => {
    const { light, dark } = getThemeColors();
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const colorSet = isDark ? dark : light;

    const style = document.documentElement.style;

    const setColorVariables = (prefix: string, palette: ColorPalette) => {
      Object.entries(palette).forEach(([key, value]) => {
        if (value) {
          style.setProperty(`--${prefix}-${key}`, `${value.h}, ${value.s}%, ${value.l}%`);
        }
      });
    };

    if (colorSet.primary) {
      setColorVariables('primary', colorSet.primary);
    }

    if (colorSet.secondary) {
      setColorVariables('secondary', colorSet.secondary);
    }

    setColors({
      primary: import.meta.env.VITE_PRIMARY_COLOR || '#15969B',
      secondary: import.meta.env.VITE_SECONDARY_COLOR || '#5194B8',
    });
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  /**
   * Profile-aware theme overrides for `/u/:username`.
   *
   * Snapshots the prior `theme-*` / `font-*` classes and `--accent` value on
   * mount, applies the overrides-derived classes and CSS variable, and
   * restores the exact prior state on unmount. Intentionally isolated from
   * the dashboard `light`/`dark`/`system` flow: `localStorage['ui-theme']`
   * and the dashboard theme state are never mutated here.
   */
  const overrideThemePreference = overrides?.theme_preference;
  const overrideAccentColor = overrides?.accent_color;
  const overrideFontFamily = overrides?.font_family;

  useEffect(() => {
    if (!overrides) return;

    const html = window.document.documentElement;
    const THEME_CLASSES = ['theme-minimal', 'theme-bold', 'theme-dark', 'theme-gradient'];
    const FONT_CLASSES = ['font-sans', 'font-serif', 'font-mono'];

    // Snapshot prior state so unmount restores exactly what was there before.
    const previousThemeClasses = THEME_CLASSES.filter((cls) => html.classList.contains(cls));
    const previousFontClasses = FONT_CLASSES.filter((cls) => html.classList.contains(cls));
    const previousAccent = html.style.getPropertyValue('--accent');

    // Apply theme preset class (defaults to `theme-minimal`).
    html.classList.remove(...THEME_CLASSES);
    html.classList.add(`theme-${overrideThemePreference ?? 'minimal'}`);

    // Apply font-family preset class (defaults to `font-sans`).
    html.classList.remove(...FONT_CLASSES);
    html.classList.add(`font-${overrideFontFamily ?? 'sans'}`);

    // Only write `--accent` when the supplied color is a valid `#RRGGBB` hex.
    // Invalid values are silently ignored per spec.
    if (overrideAccentColor && /^#[0-9a-fA-F]{6}$/.test(overrideAccentColor)) {
      html.style.setProperty('--accent', overrideAccentColor);
    }

    return () => {
      html.classList.remove(...THEME_CLASSES);
      if (previousThemeClasses.length > 0) {
        html.classList.add(...previousThemeClasses);
      }

      html.classList.remove(...FONT_CLASSES);
      if (previousFontClasses.length > 0) {
        html.classList.add(...previousFontClasses);
      }

      if (previousAccent) {
        html.style.setProperty('--accent', previousAccent);
      } else {
        html.style.removeProperty('--accent');
      }
    };
    // `overrides` identity may change every render; depend on its fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideThemePreference, overrideAccentColor, overrideFontFamily]);

  const value = useMemo(
    () => ({
      theme,
      colors,
      setTheme: (newTheme: Theme) => {
        localStorage.setItem(storageKey, newTheme);
        setTheme(newTheme);
      },
    }),
    [theme, colors, storageKey]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
