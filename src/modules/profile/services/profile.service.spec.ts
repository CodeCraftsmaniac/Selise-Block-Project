import { describe, it, expect } from 'vitest';
import {
  GET_PROFILE_BY_USERNAME_QUERY,
  GET_PROFILE_BY_USER_ID_QUERY,
  GET_ALL_PUBLISHED_PROFILES_QUERY,
  GET_SECTIONS_BY_USER_ID_QUERY,
} from '../graphql/queries';
import {
  CREATE_USER_PROFILE_MUTATION,
  UPDATE_USER_PROFILE_MUTATION,
  PUBLISH_USER_PROFILE_MUTATION,
  UNPUBLISH_USER_PROFILE_MUTATION,
  CREATE_CUSTOM_SECTION_MUTATION,
  UPDATE_CUSTOM_SECTION_MUTATION,
  DELETE_CUSTOM_SECTION_MUTATION,
} from '../graphql/mutations';

describe('Profile Service Query Patterns', () => {
  it('username query uses DynamicQueryInput', () => {
    expect(GET_PROFILE_BY_USERNAME_QUERY).toContain('DynamicQueryInput');
    expect(GET_PROFILE_BY_USERNAME_QUERY).toContain('getUserProfiles');
  });

  it('user_id query follows same DynamicQueryInput pattern', () => {
    expect(GET_PROFILE_BY_USER_ID_QUERY).toContain('DynamicQueryInput');
    expect(GET_PROFILE_BY_USER_ID_QUERY).toContain('getUserProfiles');
  });

  it('published profiles query includes pagination', () => {
    expect(GET_ALL_PUBLISHED_PROFILES_QUERY).toContain('hasNextPage');
    expect(GET_ALL_PUBLISHED_PROFILES_QUERY).toContain('totalCount');
    expect(GET_ALL_PUBLISHED_PROFILES_QUERY).toContain('items');
  });

  it('sections query includes section_order field', () => {
    expect(GET_SECTIONS_BY_USER_ID_QUERY).toContain('section_order');
    expect(GET_SECTIONS_BY_USER_ID_QUERY).toContain('is_visible');
  });
});

describe('Profile Service Mutation Patterns', () => {
  it('create mutation uses InsertInput', () => {
    expect(CREATE_USER_PROFILE_MUTATION).toContain('UserProfileInsertInput');
  });

  it('update mutation uses filter + UpdateInput', () => {
    expect(UPDATE_USER_PROFILE_MUTATION).toContain('filter');
    expect(UPDATE_USER_PROFILE_MUTATION).toContain('UserProfileUpdateInput');
  });

  it('publish mutation uses updateUserProfile with filter', () => {
    expect(PUBLISH_USER_PROFILE_MUTATION).toContain('updateUserProfile');
    expect(PUBLISH_USER_PROFILE_MUTATION).toContain('UserProfileUpdateInput');
  });

  it('unpublish mutation uses updateUserProfile with filter', () => {
    expect(UNPUBLISH_USER_PROFILE_MUTATION).toContain('updateUserProfile');
    expect(UNPUBLISH_USER_PROFILE_MUTATION).toContain('UserProfileUpdateInput');
  });

  it('section mutations follow Insert/Update/Delete pattern', () => {
    expect(CREATE_CUSTOM_SECTION_MUTATION).toContain('UserCustomSectionInsertInput');
    expect(UPDATE_CUSTOM_SECTION_MUTATION).toContain('UserCustomSectionUpdateInput');
    expect(DELETE_CUSTOM_SECTION_MUTATION).toContain('UserCustomSectionDeleteInput');
  });
});
