import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * Task 11.2 — Smoke tests for PreviewPage.
 *
 * The preview renders the authenticated user's profile through the same
 * hero / bio / social-links / custom-sections tree used on `/u/:username`,
 * wrapped in a `<ThemeProvider overrides={...}>`. We only verify:
 *   1. Core content (hero, bio, social link) renders with mocked data.
 *   2. When `is_published === false`, the preview still renders (owner
 *      context — no NotFoundPage redirect).
 */

// ---- react-i18next ---------------------------------------------------------
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

// ---- Profile hooks ---------------------------------------------------------
const mockProfile = {
  ItemId: 'p1',
  user_id: 'u1',
  username: 'alice',
  display_name: 'Alice Wonderland',
  headline: 'Staff engineer',
  bio_text: 'Hi I am Alice and I build things.',
  profile_image_url: 'https://cdn.example.com/alice.png',
  header_image_url: 'https://cdn.example.com/alice-header.png',
  social_links: [
    { platform: 'github', url: 'https://github.com/alice', label: 'GitHub' },
  ],
  theme_preference: 'minimal',
  accent_color: '#3b82f6',
  font_family: 'sans',
  is_published: false,
  view_count: 0,
};

const mockSections = [
  {
    ItemId: 's1',
    user_id: 'u1',
    section_type: 'Experience',
    section_title: 'Work',
    section_content: 'Some experience',
    section_order: 0,
    is_visible: true,
  },
];

vi.mock('../../hooks/use-profile', () => ({
  useGetMyProfile: () => ({
    data: { getUserProfiles: { items: [mockProfile] } },
    isLoading: false,
  }),
  useGetMySections: () => ({
    data: { getUserCustomSections: { items: mockSections } },
    isLoading: false,
  }),
  usePublishProfile: () => ({ mutate: vi.fn(), isPending: false }),
  useUnpublishProfile: () => ({ mutate: vi.fn(), isPending: false }),
}));

// ---- Heavy visual deps -----------------------------------------------------
vi.mock('react-markdown', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('rehype-sanitize', () => ({ default: () => null }));

// Share-profile modal pulls in extra deps; stub it out.
vi.mock('../../components/share-profile-modal/share-profile-modal', () => ({
  ShareProfileModal: () => <button type="button">SHARE</button>,
}));

// Render children without touching the real ThemeProvider DOM side effects.
vi.mock('@/styles/theme/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { PreviewPage } from './preview';

describe('PreviewPage', () => {
  it('renders hero, bio, and social links with mocked profile', () => {
    render(<PreviewPage />);

    // Display name (hero)
    expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
    // Headline
    expect(screen.getByText('Staff engineer')).toBeInTheDocument();
    // Bio (rendered through the stubbed ReactMarkdown which just echoes its
    // children — still searchable as text in the DOM).
    expect(screen.getByText(/Hi I am Alice/)).toBeInTheDocument();
    // Social link label
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('still renders preview when is_published === false (owner context — no NotFoundPage redirect)', () => {
    render(<PreviewPage />);

    // Unpublished profile: the Getting Started checklist renders instead of
    // the "Copy link" toolbar. Either way, the hero is still in the DOM —
    // the page did NOT bail out to a NotFoundPage.
    expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
    // Sanity: the publish CTA is visible because profile.is_published = false.
    expect(screen.getByText('PUBLISH')).toBeInTheDocument();
  });
});
