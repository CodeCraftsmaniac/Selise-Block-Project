import React from 'react';
import { vi, describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// The ui-kit Button renders its children through Radix `Slot` when `asChild`
// is set, which tightly couples to React.Children.only. In tests we only
// care that the nested <Link> targets are reachable, so swap the Button
// with a thin pass-through.
vi.mock('@/components/ui-kit/button', () => ({
  Button: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { LandingPage } from './landing';

const renderPage = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );

describe('LandingPage', () => {
  test('renders CTAs linking to /signup and /browse **Validates: Design §Components and Interfaces (route-module-map), Task 15.3**', () => {
    renderPage();

    // `GET_STARTED` renders in two CTAs (hero + secondary). Both point to /signup.
    const getStartedLinks = screen.getAllByRole('link', { name: /GET_STARTED/ });
    expect(getStartedLinks.length).toBeGreaterThanOrEqual(1);
    getStartedLinks.forEach((anchor) => {
      expect(anchor).toHaveAttribute('href', '/signup');
    });

    // `BROWSE_PROFILES` renders as a link to /browse (two occurrences, both /browse).
    const browseLinks = screen.getAllByRole('link', { name: 'BROWSE_PROFILES' });
    expect(browseLinks.length).toBeGreaterThanOrEqual(1);
    browseLinks.forEach((anchor) => {
      expect(anchor).toHaveAttribute('href', '/browse');
    });

    // Key marketing copy keys are rendered.
    expect(screen.getByText('HERO_TITLE')).toBeInTheDocument();
    expect(screen.getByText('HERO_SUBTITLE')).toBeInTheDocument();
  });
});
