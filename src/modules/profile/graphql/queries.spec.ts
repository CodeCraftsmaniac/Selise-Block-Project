import { describe, it, expect } from 'vitest';
import {
  GET_PROFILE_BY_USERNAME_QUERY,
  GET_PROFILE_BY_USER_ID_QUERY,
  GET_ALL_PUBLISHED_PROFILES_QUERY,
  GET_SECTIONS_BY_USER_ID_QUERY,
} from './queries';

describe('Profile GraphQL Queries', () => {
  it('GET_PROFILE_BY_USERNAME_QUERY contains username filter', () => {
    expect(GET_PROFILE_BY_USERNAME_QUERY).toContain('getUserProfiles');
    expect(GET_PROFILE_BY_USERNAME_QUERY).toContain('username');
    expect(GET_PROFILE_BY_USERNAME_QUERY).toContain('display_name');
    expect(GET_PROFILE_BY_USERNAME_QUERY).toContain('bio_text');
    expect(GET_PROFILE_BY_USERNAME_QUERY).toContain('is_published');
  });

  it('GET_PROFILE_BY_USER_ID_QUERY contains user_id fields', () => {
    expect(GET_PROFILE_BY_USER_ID_QUERY).toContain('getUserProfiles');
    expect(GET_PROFILE_BY_USER_ID_QUERY).toContain('user_id');
    expect(GET_PROFILE_BY_USER_ID_QUERY).toContain('theme_preference');
  });

  it('GET_ALL_PUBLISHED_PROFILES_QUERY fetches published profiles', () => {
    expect(GET_ALL_PUBLISHED_PROFILES_QUERY).toContain('getUserProfiles');
    expect(GET_ALL_PUBLISHED_PROFILES_QUERY).toContain('is_published');
    expect(GET_ALL_PUBLISHED_PROFILES_QUERY).toContain('profile_image_url');
  });

  it('GET_SECTIONS_BY_USER_ID_QUERY contains section fields', () => {
    expect(GET_SECTIONS_BY_USER_ID_QUERY).toContain('getUserCustomSections');
    expect(GET_SECTIONS_BY_USER_ID_QUERY).toContain('section_type');
    expect(GET_SECTIONS_BY_USER_ID_QUERY).toContain('section_order');
    expect(GET_SECTIONS_BY_USER_ID_QUERY).toContain('is_visible');
  });
});
