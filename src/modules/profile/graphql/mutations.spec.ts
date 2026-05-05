import { describe, it, expect } from 'vitest';
import {
  CREATE_USER_PROFILE_MUTATION,
  UPDATE_USER_PROFILE_MUTATION,
  PUBLISH_USER_PROFILE_MUTATION,
  UNPUBLISH_USER_PROFILE_MUTATION,
  CREATE_CUSTOM_SECTION_MUTATION,
  UPDATE_CUSTOM_SECTION_MUTATION,
  DELETE_CUSTOM_SECTION_MUTATION,
  REORDER_CUSTOM_SECTIONS_MUTATION,
} from './mutations';

describe('Profile GraphQL Mutations', () => {
  it('CREATE_USER_PROFILE_MUTATION uses insertUserProfile', () => {
    expect(CREATE_USER_PROFILE_MUTATION).toContain('insertUserProfile');
    expect(CREATE_USER_PROFILE_MUTATION).toContain('itemId');
    expect(CREATE_USER_PROFILE_MUTATION).toContain('acknowledged');
  });

  it('UPDATE_USER_PROFILE_MUTATION uses updateUserProfile', () => {
    expect(UPDATE_USER_PROFILE_MUTATION).toContain('updateUserProfile');
    expect(UPDATE_USER_PROFILE_MUTATION).toContain('filter');
  });

  it('PUBLISH and UNPUBLISH use updateUserProfile', () => {
    expect(PUBLISH_USER_PROFILE_MUTATION).toContain('updateUserProfile');
    expect(UNPUBLISH_USER_PROFILE_MUTATION).toContain('updateUserProfile');
  });

  it('CREATE_CUSTOM_SECTION_MUTATION uses insertUserCustomSection', () => {
    expect(CREATE_CUSTOM_SECTION_MUTATION).toContain('insertUserCustomSection');
  });

  it('UPDATE_CUSTOM_SECTION_MUTATION uses updateUserCustomSection', () => {
    expect(UPDATE_CUSTOM_SECTION_MUTATION).toContain('updateUserCustomSection');
  });

  it('DELETE_CUSTOM_SECTION_MUTATION uses deleteUserCustomSection', () => {
    expect(DELETE_CUSTOM_SECTION_MUTATION).toContain('deleteUserCustomSection');
  });

  it('REORDER_CUSTOM_SECTIONS_MUTATION exists for bulk reorder', () => {
    expect(REORDER_CUSTOM_SECTIONS_MUTATION).toContain('reorderUserCustomSections');
  });
});
