import React from 'react';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const getMyProfileState = {
  data: undefined as unknown,
  isLoading: false,
};

const updateProfileMock = {
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
  isError: false,
  isSuccess: false,
  reset: vi.fn(),
};

vi.mock('../../hooks/use-profile', () => ({
  useGetMyProfile: () => getMyProfileState,
  useUpdateMyProfile: () => updateProfileMock,
}));

// ThemeProvider pokes <html> class lists; short-circuit it in tests so we
// don't have to set up the full profile-aware override effect.
vi.mock('@/styles/theme/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { AppearancePage } from './appearance';

const renderPage = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AppearancePage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const seededProfile = {
  getUserProfiles: {
    items: [
      {
        ItemId: 'profile-1',
        user_id: 'user-1',
        username: 'alice',
        display_name: 'Alice',
        headline: '',
        bio_text: '',
        profile_image_url: '',
        header_image_url: '',
        social_links: [],
        theme_preference: 'minimal',
        accent_color: '#3b82f6',
        font_family: 'sans',
        is_published: false,
      },
    ],
  },
};

describe('AppearancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyProfileState.isLoading = false;
    getMyProfileState.data = seededProfile;
  });

  test('renders the four theme selector buttons **Validates: Design §Theme System, Task 9.2**', () => {
    renderPage();

    // Each theme renders its label inside a <button>.
    expect(screen.getByRole('button', { name: /Minimal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bold/i })).toBeInTheDocument();
    // "Dark" appears multiple times (button label + palette). Any count > 0 is fine.
    expect(screen.getAllByText(/Dark/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Gradient/i })).toBeInTheDocument();
  });

  test('clicking a different theme button updates the selection', () => {
    renderPage();

    // Before click, Minimal is the selected theme (ring-4 class is the
    // visual selection marker in the component).
    const boldBtn = screen.getByRole('button', { name: /Bold/i });
    fireEvent.click(boldBtn);

    // After the click, the Bold button is now the one with the ring-4
    // selection marker. We assert the UI responded; we do NOT drive the
    // full submit here because react-hook-form's `isValid` gate requires
    // a mount-time re-validation round-trip that is flaky across
    // environments and isn't what this test is about.
    expect(boldBtn.className).toContain('ring-4');
  });
});
