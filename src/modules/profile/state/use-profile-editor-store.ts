import { create } from 'zustand';

import type { UserCustomSection } from '../types/profile.types';

/**
 * Ephemeral, session-scoped UI state for the profile editor.
 *
 * Tracks dirty state for unsaved-changes guards, an in-flight draft for the
 * section editor dialog, and the optimistic drag-preview order used while the
 * user is reordering sections.
 *
 * Intentionally does NOT use the `persist` middleware — this state should reset
 * on page reload so stale drafts never leak across sessions.
 */
export interface ProfileEditorState {
  /** True when the editor has unsaved changes. */
  isDirty: boolean;
  /** Partial section currently being edited in the section dialog. */
  draftSection: Partial<UserCustomSection> | null;
  /** ItemIds in the order currently previewed during a drag operation. */
  dragPreviewOrder: string[] | null;

  /** Mark the editor as having unsaved changes. */
  markDirty: () => void;
  /** Clear the dirty flag (e.g. after a successful save). */
  clearDirty: () => void;
  /** Replace the current draft section (or clear it with `null`). */
  setDraftSection: (draft: Partial<UserCustomSection> | null) => void;
  /** Set or clear the optimistic drag-preview order. */
  setDragPreview: (ids: string[] | null) => void;
  /** Reset the entire store to its initial values. */
  reset: () => void;
}

const initialState = {
  isDirty: false,
  draftSection: null,
  dragPreviewOrder: null,
} satisfies Pick<ProfileEditorState, 'isDirty' | 'draftSection' | 'dragPreviewOrder'>;

export const useProfileEditorStore = create<ProfileEditorState>((set) => ({
  ...initialState,
  markDirty: () => set({ isDirty: true }),
  clearDirty: () => set({ isDirty: false }),
  setDraftSection: (draft) => set({ draftSection: draft }),
  setDragPreview: (ids) => set({ dragPreviewOrder: ids }),
  reset: () => set({ ...initialState }),
}));
