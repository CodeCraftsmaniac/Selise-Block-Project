import { describe, it, expect } from 'vitest';
import { UserProfile, UserCustomSection } from './profile.types';

describe('Profile Types', () => {
  it('UserProfile type has all required fields', () => {
    const profile: UserProfile = {
      ItemId: 'test-id',
      user_id: 'user-123',
      username: 'testuser',
      display_name: 'Test User',
      headline: 'Developer',
      bio_text: 'Hello world',
      profile_image_url: '',
      header_image_url: '',
      social_links: [],
      theme_preference: 'minimal',
      accent_color: '#3b82f6',
      font_family: 'sans',
      view_count: 0,
      is_published: false,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      CreatedBy: 'user-123',
      CreatedDate: '2024-01-01',
      LastUpdatedBy: 'user-123',
      LastUpdatedDate: '2024-01-01',
    };
    expect(profile.username).toBe('testuser');
    expect(profile.is_published).toBe(false);
    expect(profile.theme_preference).toBe('minimal');
  });

  it('UserCustomSection type has all required fields', () => {
    const section: UserCustomSection = {
      ItemId: 'section-id',
      user_id: 'user-123',
      section_type: 'Experience',
      section_title: 'Software Engineer',
      section_content: 'Worked on...',
      section_order: 0,
      is_visible: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      CreatedBy: 'user-123',
      CreatedDate: '2024-01-01',
      LastUpdatedBy: 'user-123',
      LastUpdatedDate: '2024-01-01',
    };
    expect(section.section_type).toBe('Experience');
    expect(section.section_order).toBe(0);
    expect(section.is_visible).toBe(true);
  });
});
