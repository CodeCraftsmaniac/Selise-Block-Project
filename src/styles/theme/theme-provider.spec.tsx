import { afterEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { ThemeProvider } from './theme-provider';

/**
 * Unit tests for `ThemeProvider` profile overrides (Task 6.3).
 *
 * Verifies:
 * - overrides write the expected `theme-*` / `font-*` classes and `--accent`
 * - unmount restores the prior class list and clears `--accent`
 * - invalid accent hex values are silently ignored
 *
 * _Design: §Theme System (apply algorithm)_
 */
describe('ThemeProvider overrides', () => {
  const THEME_CLASSES = ['theme-minimal', 'theme-bold', 'theme-dark', 'theme-gradient'];
  const FONT_CLASSES = ['font-sans', 'font-serif', 'font-mono'];

  afterEach(() => {
    // Defensive cleanup: strip any `theme-*` / `font-*` classes and `--accent`
    // that may have leaked from a failed test so tests stay isolated.
    const html = document.documentElement;
    html.classList.remove(...THEME_CLASSES, ...FONT_CLASSES);
    html.style.removeProperty('--accent');
    // Reset dashboard-theme classes that the base provider may have toggled.
    html.classList.remove('light', 'dark');
  });

  it('applies theme-*, font-* classes and --accent when overrides are provided', () => {
    render(
      <ThemeProvider
        overrides={{
          theme_preference: 'bold',
          accent_color: '#3b82f6',
          font_family: 'serif',
        }}
      >
        <div />
      </ThemeProvider>
    );

    const html = document.documentElement;

    expect(html.classList.contains('theme-bold')).toBe(true);
    expect(html.classList.contains('font-serif')).toBe(true);
    expect(html.style.getPropertyValue('--accent').trim()).toBe('#3b82f6');
  });

  it('restores the previous classes and --accent on unmount', () => {
    const { unmount } = render(
      <ThemeProvider
        overrides={{
          theme_preference: 'bold',
          accent_color: '#3b82f6',
          font_family: 'serif',
        }}
      >
        <div />
      </ThemeProvider>
    );

    const html = document.documentElement;
    // Sanity check: overrides were applied while mounted.
    expect(html.classList.contains('theme-bold')).toBe(true);
    expect(html.classList.contains('font-serif')).toBe(true);

    unmount();

    expect(html.classList.contains('theme-bold')).toBe(false);
    expect(html.classList.contains('theme-minimal')).toBe(false);
    expect(html.classList.contains('theme-dark')).toBe(false);
    expect(html.classList.contains('theme-gradient')).toBe(false);
    expect(html.classList.contains('font-serif')).toBe(false);
    expect(html.classList.contains('font-sans')).toBe(false);
    expect(html.classList.contains('font-mono')).toBe(false);
    expect(html.style.getPropertyValue('--accent')).toBe('');
  });

  it('silently ignores an invalid accent_color (does not write --accent)', () => {
    render(
      <ThemeProvider
        overrides={{
          theme_preference: 'minimal',
          accent_color: '#GGGGGG',
          font_family: 'sans',
        }}
      >
        <div />
      </ThemeProvider>
    );

    const html = document.documentElement;

    expect(html.classList.contains('theme-minimal')).toBe(true);
    expect(html.classList.contains('font-sans')).toBe(true);
    expect(html.style.getPropertyValue('--accent')).toBe('');
  });
});
