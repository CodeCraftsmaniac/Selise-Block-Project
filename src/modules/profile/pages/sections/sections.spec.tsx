import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

/**
 * Task 10.4 — Smoke tests for SectionsPage.
 *
 * This page is heavy (react-hook-form + zod + dnd-kit + react-markdown +
 * AlertDialog). The task contract is deliberately minimal:
 *   1. Renders sections sorted by section_order.
 *   2. Clicking the row delete button → confirming in the AlertDialog calls
 *      useDeleteSection.mutate with the right filter and isHardDelete payload.
 *
 * Every upstream hook and heavy visual dependency is mocked so the test
 * exercises only the page's orchestration logic.
 */

// ---- react-i18next ---------------------------------------------------------
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

// ---- Auth store ------------------------------------------------------------
vi.mock('@/state/store/auth', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { itemId: 'me-123' } }),
}));

// ---- Profile hooks ---------------------------------------------------------
const mockSections = [
  {
    ItemId: 's2',
    user_id: 'me-123',
    section_type: 'Project',
    section_title: 'Second',
    section_content: 'Second content',
    section_order: 1,
    is_visible: true,
  },
  {
    ItemId: 's1',
    user_id: 'me-123',
    section_type: 'Experience',
    section_title: 'First',
    section_content: 'First content',
    section_order: 0,
    is_visible: true,
  },
];

const deleteMutate = vi.fn();
const createMutate = vi.fn();
const updateMutate = vi.fn();
const reorderMutate = vi.fn();

vi.mock('../../hooks/use-profile', () => ({
  useGetMySections: () => ({
    data: { getUserCustomSections: { items: mockSections } },
    isLoading: false,
  }),
  useCreateSection: () => ({ mutate: createMutate, mutateAsync: createMutate, isPending: false }),
  useUpdateSection: () => ({ mutate: updateMutate, mutateAsync: updateMutate, isPending: false }),
  useDeleteSection: () => ({ mutate: deleteMutate, mutateAsync: deleteMutate, isPending: false }),
  useReorderSections: () => ({
    mutate: reorderMutate,
    isPending: false,
    status: 'idle',
  }),
}));

// ---- Upload image hook -----------------------------------------------------
vi.mock('../../hooks/use-upload-image', () => ({
  useUploadImage: () => ({
    upload: vi.fn(),
    isUploading: false,
    progress: 0,
    error: null,
    reset: vi.fn(),
  }),
}));

// ---- Editor store ----------------------------------------------------------
const setDragPreview = vi.fn();
vi.mock('../../state/use-profile-editor-store', () => ({
  useProfileEditorStore: (selector: (s: unknown) => unknown) =>
    selector({ setDragPreview }),
}));

// ---- Heavy visual deps -----------------------------------------------------
// react-markdown is ESM-only and brings a large pipeline; smoke tests don't
// need real Markdown rendering.
vi.mock('react-markdown', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('rehype-sanitize', () => ({ default: () => null }));

// @dnd-kit: render children directly so sortable/context don't interfere.
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));
vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: <T,>(arr: T[], from: number, to: number) => {
    const next = arr.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  },
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));
vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

// Import the page AFTER every mock is registered.
import { SectionsPage } from './sections';

describe('SectionsPage', () => {
  beforeEach(() => {
    deleteMutate.mockClear();
    createMutate.mockClear();
    updateMutate.mockClear();
    reorderMutate.mockClear();
    setDragPreview.mockClear();
  });

  it('renders sections sorted by section_order (ascending)', () => {
    render(<SectionsPage />);

    // Titles from mock data.
    const first = screen.getByText('First');
    const second = screen.getByText('Second');
    expect(first).toBeInTheDocument();
    expect(second).toBeInTheDocument();

    // Sorted order: "First" (section_order=0) must appear in the DOM before
    // "Second" (section_order=1) even though the API returned them reversed.
    // eslint-disable-next-line no-bitwise
    const positionsCompare = first.compareDocumentPosition(second);
    expect(positionsCompare & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('delete → confirm dialog → calls useDeleteSection.mutate with correct filter', () => {
    render(<SectionsPage />);

    // The row has a delete button with title="DELETE" (t-key from the page).
    const deleteButtons = screen.getAllByTitle('DELETE');
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);

    // Click the first section's delete button — this opens the AlertDialog.
    fireEvent.click(deleteButtons[0]);

    // The AlertDialog action reads the "DELETE" translation key too, but is
    // rendered inside the portal. Scope the query to the dialog role to
    // disambiguate from the row trash icon.
    const dialog = screen.getByRole('alertdialog');
    const confirm = within(dialog).getByText('DELETE');
    fireEvent.click(confirm);

    expect(deleteMutate).toHaveBeenCalledTimes(1);
    const [arg] = deleteMutate.mock.calls[0];
    expect(arg).toEqual({
      // section_order=0 → ItemId "s1" renders first in the sorted list.
      filter: JSON.stringify({ ItemId: 's1' }),
      input: { isHardDelete: true },
    });
  });
});
