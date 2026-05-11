import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

/**
 * Task 14.3 — Smoke tests for PublicProfilePage.
 *
 * Three scenarios:
 *   - loading    → Skeleton rendered
 *   - success    → hero + bio render (published profile)
 *   - empty      → NotFoundPage rendered
 *
 * Plus defense-in-depth: hidden sections (is_visible === false) are
 * filtered out client-side even when the gateway accidentally returns
 * them (Design §Correctness Property #8).
 */

// ---- react-i18next ---------------------------------------------------------
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

// ---- Public profile hooks (the only two we need to drive) ------------------
const usePublicProfileByUsername = vi.fn();
const usePublicSectionsByUserId = vi.fn();

vi.mock('../../hooks/use-public-profile', () => ({
  usePublicProfileByUsername: (username: string) => usePublicProfileByUsername(username),
  usePublicSectionsByUserId: (userId: string) => usePublicSectionsByUserId(userId),
}));

// ---- Auth store (isOwner check) --------------------------------------------
vi.mock('@/state/store/auth', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) => selector({ user: null }),
}));

// ---- ThemeProvider: render children directly -------------------------------
vi.mock('@/styles/theme/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ---- Heavy visual deps -----------------------------------------------------
vi.mock('react-markdown', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('rehype-sanitize', () => ({ default: () => null }));

// NotFoundPage — stub so we can assert "rendered" via a known test id without
// pulling in the real error-view and its image assets.
vi.mock('@/modules/error-view', () => ({
  NotFoundPage: () => <div data-testid="not-found-page">NOT_FOUND</div>,
}));

// BackToTop is pure decoration for these tests.
vi.mock('@/components/core/back-to-top/back-to-top', () => ({
  BackToTop: () => null,
}));

// Avoid the dynamic import in the useEffect view-counter side effect.
vi.mock('../../services/public-profile.service', () => ({
  incrementPublicProfileViewCount: vi.fn().mockResolvedValue(undefined),
}));

import { PublicProfilePage } from './public-profile';

const renderAt = () =>
  render(
    <MemoryRouter initialEntries={['/u/alice']}>
      <Routes>
        <Route path="/u/:username" element={<PublicProfilePage />} />
      </Routes>
    </MemoryRouter>
  );

describe('PublicProfilePage', () => {
  beforeEach(() => {
    usePublicProfileByUsername.mockReset();
    usePublicSectionsByUserId.mockReset();
  });

  it('loading state → Skeleton rendered', () => {
    usePublicProfileByUsername.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    usePublicSectionsByUserId.mockReturnValue({ data: undefined });

    const { container } = renderAt();

    // The loading branch only renders Skeleton stripes — no hero, no NotFound.
    expect(screen.queryByTestId('not-found-page')).toBeNull();
    // Skeleton uses the `animate-pulse` class; at least one must be present.
    const pulses = container.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBeGreaterThan(0);
  });

  it('success with a published profile → hero and bio render', () => {
    usePublicProfileByUsername.mockReturnValue({
      data: {
        getUserProfiles: {
          items: [
            {
              ItemId: 'p1',
              user_id: 'u1',
              username: 'alice',
              display_name: 'Alice Wonderland',
              headline: 'Staff engineer',
              bio_text: 'Hi I am Alice.',
              social_links: [],
              is_published: true,
              accent_color: '#3b82f6',
            },
          ],
        },
      },
      isLoading: false,
      error: null,
    });
    usePublicSectionsByUserId.mockReturnValue({
      data: { getUserCustomSections: { items: [] } },
    });

    renderAt();

    expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
    expect(screen.getByText('Staff engineer')).toBeInTheDocument();
    expect(screen.getByText(/Hi I am Alice/)).toBeInTheDocument();
    expect(screen.queryByTestId('not-found-page')).toBeNull();
  });

  it('empty result → NotFoundPage rendered', () => {
    usePublicProfileByUsername.mockReturnValue({
      data: { getUserProfiles: { items: [] } },
      isLoading: false,
      error: null,
    });
    usePublicSectionsByUserId.mockReturnValue({ data: undefined });

    renderAt();

    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
  });

  it('filters out hidden sections (is_visible=false) client-side **Validates: Requirements Design §Correctness Property #8**', () => {
    usePublicProfileByUsername.mockReturnValue({
      data: {
        getUserProfiles: {
          items: [
            {
              ItemId: 'p1',
              user_id: 'u1',
              username: 'alice',
              display_name: 'Alice',
              headline: '',
              bio_text: '',
              social_links: [],
              is_published: true,
              accent_color: '#3b82f6',
            },
          ],
        },
      },
      isLoading: false,
      error: null,
    });
    usePublicSectionsByUserId.mockReturnValue({
      data: {
        getUserCustomSections: {
          items: [
            {
              ItemId: 's-visible',
              user_id: 'u1',
              section_type: 'Experience',
              section_title: 'VISIBLE_SECTION',
              section_content: 'public content',
              section_order: 0,
              is_visible: true,
            },
            {
              ItemId: 's-hidden',
              user_id: 'u1',
              section_type: 'Project',
              section_title: 'HIDDEN_SECTION',
              section_content: 'secret content',
              section_order: 1,
              // Defense-in-depth: even if the public gateway leaks a hidden
              // row, the page must still filter it out client-side.
              is_visible: false,
            },
          ],
        },
      },
    });

    renderAt();

    expect(screen.getByText('VISIBLE_SECTION')).toBeInTheDocument();
    expect(screen.queryByText('HIDDEN_SECTION')).toBeNull();
  });
});
