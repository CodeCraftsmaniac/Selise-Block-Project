import { describe, it, expect } from 'vitest';

import { routeModuleMap } from './route-module-map';

/**
 * Unit tests for `routeModuleMap` (Task 7.2).
 *
 * Pins the design-contract modules for every public + dashboard route so the
 * LanguageProvider loads the right translation bundles.
 *
 * _Design: §Components and Interfaces (route-module-map)_
 */
describe('routeModuleMap', () => {
  const expected: Record<string, string[]> = {
    '/': ['common', 'landing'],
    '/browse': ['common', 'browse'],
    '/login': ['common', 'auth'],
    '/signup': ['common', 'auth'],
    '/forgot-password': ['common', 'auth'],
    '/resetpassword': ['common', 'auth'],
    '/activate': ['common', 'auth'],
    '/verify-mfa': ['common', 'auth', 'mfa'],
    '/dashboard/profile': ['common', 'editor'],
    '/dashboard/appearance': ['common', 'editor', 'themes'],
    '/dashboard/sections': ['common', 'editor'],
    '/dashboard/preview': ['common', 'editor', 'viewer'],
    '/dashboard/admin': ['common', 'editor', 'admin'],
    '/u/:username': ['common', 'viewer'],
    '/404': ['common', 'error'],
    '/503': ['common', 'error'],
  };

  it.each(Object.entries(expected))(
    'maps %s to the expected modules',
    (route, modules) => {
      expect(routeModuleMap[route]).toEqual(modules);
    }
  );

  it('declares an entry for the parameterised /u/:username public-profile route', () => {
    // No matcher utility exists in the i18n module today, so we only assert
    // the entry is present. Concrete path resolution (e.g. `/u/alice`) is the
    // responsibility of LanguageProvider when it ships, covered by its own
    // tests at that layer.
    expect(Object.keys(routeModuleMap)).toContain('/u/:username');
  });
});
