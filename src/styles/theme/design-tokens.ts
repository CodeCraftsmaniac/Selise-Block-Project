/**
 * Design Tokens
 *
 * Centralized theme configuration for the Universal Profile Engine.
 * Used by Tailwind CSS and component-level theme applications.
 *
 * Note: Primary colors can be overridden via env vars:
 *   VITE_PRIMARY_COLOR, VITE_SECONDARY_COLOR
 */

export const designTokens = {
  colors: {
    primary: import.meta.env.VITE_PRIMARY_COLOR || '#15969B',
    secondary: import.meta.env.VITE_SECONDARY_COLOR || '#5194B8',
    accent: {
      blue: '#3b82f6',
      green: '#10b981',
      amber: '#f59e0b',
      red: '#ef4444',
      purple: '#8b5cf6',
      pink: '#ec4899',
      cyan: '#06b6d4',
      orange: '#f97316',
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      serif: ['Georgia', 'Cambria', 'serif'],
      mono: ['Fira Code', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
} as const;

/** Profile theme presets mapped to CSS classes */
export const profileThemePresets = {
  minimal: {
    background: 'bg-white',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    card: 'bg-white border border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
    button: 'bg-gray-900 text-white hover:bg-gray-800',
    socialBadge: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
  },
  bold: {
    background: 'bg-gradient-to-br from-blue-600 to-purple-600',
    text: 'text-white',
    textMuted: 'text-blue-100',
    card: 'bg-white/10 backdrop-blur-sm border border-white/20',
    badge: 'bg-white/20 text-white',
    button: 'bg-white text-blue-700 hover:bg-blue-50',
    socialBadge: 'bg-white/10 hover:bg-white/20 text-white',
  },
  dark: {
    background: 'bg-gray-900',
    text: 'text-gray-100',
    textMuted: 'text-gray-400',
    card: 'bg-gray-800 border border-gray-700',
    badge: 'bg-gray-700 text-gray-200',
    button: 'bg-blue-600 text-white hover:bg-blue-500',
    socialBadge: 'bg-gray-700 hover:bg-gray-600 text-gray-200',
  },
  gradient: {
    background: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500',
    text: 'text-white',
    textMuted: 'text-white/80',
    card: 'bg-white/10 backdrop-blur-sm border border-white/20',
    badge: 'bg-white/20 text-white',
    button: 'bg-white text-pink-600 hover:bg-pink-50',
    socialBadge: 'bg-white/10 hover:bg-white/20 text-white',
  },
} as const;

export type ProfileThemePreset = keyof typeof profileThemePresets;
