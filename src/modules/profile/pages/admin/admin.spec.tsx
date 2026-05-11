import React from 'react';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const getAllState = {
  data: undefined as unknown,
  isLoading: false,
};

const unpublishMock = {
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
  isError: false,
  isSuccess: false,
  reset: vi.fn(),
};

vi.mock('../../hooks/use-profile', () => ({
  useGetAllPublishedProfiles: () => getAllState,
  useUnpublishProfile: () => unpublishMock,
}));

import { AdminPage } from './admin';

const renderPage = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const seeded = {
  getUserProfiles: {
    items: [
      {
        ItemId: 'profile-abc',
        user_id: 'user-1',
        username: 'alice',
        display_name: 'Alice Anderson',
        headline: 'Designer',
        view_count: 42,
        is_published: true,
        theme_preference: 'minimal',
      },
      {
        ItemId: 'profile-def',
        user_id: 'user-2',
        username: 'bob',
        display_name: 'Bob Builder',
        headline: '',
        view_count: 0,
        is_published: false,
        theme_preference: 'dark',
      },
    ],
    totalCount: 2,
  },
};

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllState.isLoading = false;
    getAllState.data = seeded;
  });

  test('renders the admin table headers **Validates: Design §Route Guard Design, Task 12.2**', () => {
    renderPage();

    expect(screen.getByText('ADMIN_DASHBOARD')).toBeInTheDocument();
    // Column headers (translation keys come through as-is via the identity `t`).
    expect(screen.getByText('USER')).toBeInTheDocument();
    expect(screen.getByText('USERNAME')).toBeInTheDocument();
    expect(screen.getByText('HEADLINE')).toBeInTheDocument();
    expect(screen.getByText('VIEWS')).toBeInTheDocument();
    expect(screen.getByText('STATUS')).toBeInTheDocument();
    expect(screen.getByText('ACTIONS')).toBeInTheDocument();

    // Published row is rendered with the Unpublish action.
    expect(screen.getByText('Alice Anderson')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeInTheDocument();
  });

  test('confirming Unpublish invokes the mutation with the profile ItemId filter', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Unpublish' }));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(unpublishMock.mutate).toHaveBeenCalledTimes(1);
    expect(unpublishMock.mutate).toHaveBeenCalledWith(
      JSON.stringify({ ItemId: 'profile-abc' })
    );

    confirmSpy.mockRestore();
  });
});
