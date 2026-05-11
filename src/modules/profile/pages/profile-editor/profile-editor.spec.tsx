import React from 'react';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// Minimal react-i18next mock: identity `t` and default language.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Avoid pulling the real `ProfileCompletionBar` (and its transitive deps).
vi.mock('../../components/profile-completion-bar/profile-completion-bar', () => ({
  ProfileCompletionBar: () => <div data-testid="profile-completion-bar" />,
}));

// Hook factories - mutable so individual tests can override per-call.
const mutationBase = {
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
  isError: false,
  isSuccess: false,
  reset: vi.fn(),
};

const getMyProfileState = {
  data: undefined as unknown,
  isLoading: false,
};

vi.mock('../../hooks/use-profile', () => ({
  useGetMyProfile: () => getMyProfileState,
  useUpdateMyProfile: () => ({ ...mutationBase }),
  useCreateProfile: () => ({ ...mutationBase }),
  usePublishProfile: () => ({ ...mutationBase }),
  useUnpublishProfile: () => ({ ...mutationBase }),
}));

// Image-upload hook: return a uniform, inert shape.
vi.mock('../../hooks/use-upload-image', () => ({
  useUploadImage: () => ({
    upload: vi.fn().mockResolvedValue({ fileId: 'f', fileUrl: 'https://cdn/test.png' }),
    isUploading: false,
    progress: 0,
    error: null,
    reset: vi.fn(),
  }),
}));

// Editor store selector hook.
vi.mock('../../state/use-profile-editor-store', () => ({
  useProfileEditorStore: (selector: (s: unknown) => unknown) => {
    const state = {
      isDirty: false,
      draftSection: null,
      dragPreviewOrder: null,
      markDirty: vi.fn(),
      clearDirty: vi.fn(),
      setDraftSection: vi.fn(),
      setDragPreview: vi.fn(),
      reset: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

import { ProfileEditorPage } from './profile-editor';

const renderPage = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ProfileEditorPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ProfileEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyProfileState.data = undefined;
    getMyProfileState.isLoading = false;
  });

  test('renders loading skeletons while profile query is pending **Validates: Design §Example Usage, Task 8.4**', () => {
    getMyProfileState.isLoading = true;
    getMyProfileState.data = undefined;
    const { container } = renderPage();

    // Skeleton components render divs with `animate-pulse`; that is the
    // only shape used by the loading branch (4 skeleton blocks).
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('renders form fields seeded with the fetched profile values', () => {
    getMyProfileState.isLoading = false;
    getMyProfileState.data = {
      getUserProfiles: {
        items: [
          {
            ItemId: 'profile-1',
            user_id: 'user-1',
            username: 'alice',
            display_name: 'Alice Anderson',
            headline: 'Designer',
            bio_text: 'Hello world',
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

    renderPage();

    // The main heading + seeded fields both render.
    expect(screen.getByText('PROFILE_EDITOR')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Alice Anderson')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Designer')).toBeInTheDocument();
  });
});
