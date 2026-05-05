import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileCompletionBar } from './profile-completion-bar';
import { UserProfile } from '../../types/profile.types';

const baseProfile: UserProfile = {
  ItemId: 'test-id',
  user_id: 'user-123',
  username: '',
  display_name: '',
  headline: '',
  bio_text: '',
  profile_image_url: '',
  header_image_url: '',
  social_links: [],
  theme_preference: '',
  is_published: false,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  CreatedBy: 'user-123',
  CreatedDate: '2024-01-01',
  LastUpdatedBy: 'user-123',
  LastUpdatedDate: '2024-01-01',
};

describe('ProfileCompletionBar', () => {
  it('shows 0% when no fields are filled', () => {
    render(<ProfileCompletionBar profile={baseProfile} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows 100% when all fields are filled', () => {
    const fullProfile: UserProfile = {
      ...baseProfile,
      display_name: 'John Doe',
      username: 'johndoe',
      headline: 'Developer',
      bio_text: 'A passionate software engineer with 5 years of experience.',
      profile_image_url: 'https://example.com/pic.jpg',
      header_image_url: 'https://example.com/header.jpg',
      social_links: [{ platform: 'GitHub', url: 'https://github.com/johndoe', label: 'GitHub' }],
      theme_preference: 'minimal',
    };
    render(<ProfileCompletionBar profile={fullProfile} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows partial completion when some fields are filled', () => {
    const partialProfile: UserProfile = {
      ...baseProfile,
      display_name: 'John Doe',
      username: 'johndoe',
      headline: 'Developer',
      theme_preference: 'minimal',
    };
    render(<ProfileCompletionBar profile={partialProfile} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('bio_text under 20 chars does not count as complete', () => {
    const shortBioProfile: UserProfile = {
      ...baseProfile,
      bio_text: 'Too short',
    };
    render(<ProfileCompletionBar profile={shortBioProfile} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
