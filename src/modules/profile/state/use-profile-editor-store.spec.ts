import { describe, it, expect, beforeEach } from 'vitest';

import { useProfileEditorStore } from './use-profile-editor-store';

/**
 * Unit tests for `useProfileEditorStore` (Task 5.2).
 *
 * The store is session-scoped and has no React dependencies, so we exercise it
 * directly via the Zustand-exposed `getState()` helpers. `reset()` is called
 * before every test to guarantee a clean starting point.
 *
 * _Design: §State Management (useProfileEditorStore)_
 */
describe('useProfileEditorStore', () => {
  beforeEach(() => {
    useProfileEditorStore.getState().reset();
  });

  describe('dirty flag', () => {
    it('starts clean on initial state', () => {
      expect(useProfileEditorStore.getState().isDirty).toBe(false);
    });

    it('flips to true after markDirty()', () => {
      useProfileEditorStore.getState().markDirty();

      expect(useProfileEditorStore.getState().isDirty).toBe(true);
    });

    it('flips back to false after clearDirty()', () => {
      useProfileEditorStore.getState().markDirty();
      useProfileEditorStore.getState().clearDirty();

      expect(useProfileEditorStore.getState().isDirty).toBe(false);
    });
  });

  describe('draftSection', () => {
    it('stores the draft when setDraftSection receives a partial section', () => {
      useProfileEditorStore.getState().setDraftSection({ section_type: 'Experience' });

      expect(useProfileEditorStore.getState().draftSection).toEqual({
        section_type: 'Experience',
      });
    });

    it('clears the draft when setDraftSection receives null', () => {
      useProfileEditorStore.getState().setDraftSection({ section_type: 'Experience' });
      useProfileEditorStore.getState().setDraftSection(null);

      expect(useProfileEditorStore.getState().draftSection).toBeNull();
    });
  });

  describe('dragPreviewOrder', () => {
    it('stores the ordered ItemIds when setDragPreview receives an array', () => {
      useProfileEditorStore.getState().setDragPreview(['a', 'b']);

      expect(useProfileEditorStore.getState().dragPreviewOrder).toEqual(['a', 'b']);
    });

    it('clears the preview when setDragPreview receives null', () => {
      useProfileEditorStore.getState().setDragPreview(['a', 'b']);
      useProfileEditorStore.getState().setDragPreview(null);

      expect(useProfileEditorStore.getState().dragPreviewOrder).toBeNull();
    });
  });

  describe('reset()', () => {
    it('returns all fields to their initial values', () => {
      const store = useProfileEditorStore.getState();
      store.markDirty();
      store.setDraftSection({ section_type: 'Experience', section_title: 'Engineer' });
      store.setDragPreview(['a', 'b', 'c']);

      useProfileEditorStore.getState().reset();

      const after = useProfileEditorStore.getState();
      expect(after.isDirty).toBe(false);
      expect(after.draftSection).toBeNull();
      expect(after.dragPreviewOrder).toBeNull();
    });
  });
});
