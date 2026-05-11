import React from 'react';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      (opts as { defaultValue?: string } | undefined)?.defaultValue ?? key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Keep BackToTop inert so we don't have to stub scroll observers.
vi.mock('@/components/core/back-to-top/back-to-top', () => ({
  BackToTop: () => null,
}));

const publishedProfilesState = {
  data: undefined as unknown,
  isLoading: false,
  isFetching: false,
};

vi.mock('../../hooks/use-public-profile', () => ({
  usePublicPublishedProfiles: () => publishedProfilesState,
}));

import { BrowsePage } from './browse';

const renderPage = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('BrowsePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    publishedProfilesState.isLoading = false;
    publishedProfilesState.isFetching = false;
    publishedProfilesState.data = undefined;
  });

  test('renders the profile cards grid when profiles are present **Validates: Design §Hook Signatures (usePublicPublishedProfiles), Task 15.3**', () => {
    publishedProfilesState.data = {
      getUserProfiles: {
        items: [
          {
            ItemId: 'p1',
            user_id: 'u1',
            username: 'alice',
            display_name: 'Alice',
            headline: 'Designer',
            view_count: 10,
            is_published: true,
          },
          {
            ItemId: 'p2',
            user_id: 'u2',
            username: 'bob',
            display_name: 'Bob',
            headline: 'Developer',
            view_count: 5,
            is_published: true,
          },
        ],
        totalCount: 2,
      },
    };

    renderPage();

    expect(screen.getByText('BROWSE_PROFILES')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('@alice')).toBeInTheDocument();
  });

  test('renders empty state when no profiles match', () => {
    publishedProfilesState.data = {
      getUserProfiles: { items: [], totalCount: 0 },
    };

    renderPage();

    expect(screen.getByText('NO_PROFILES_FOUND')).toBeInTheDocument();
    expect(screen.getByText('TRY_DIFFERENT_SEARCH')).toBeInTheDocument();
  });
});
