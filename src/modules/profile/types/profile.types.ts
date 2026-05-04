export interface SocialLink {
  platform: string;
  url: string;
  label: string;
}

export interface UserProfile {
  ItemId: string;
  user_id: string;
  username: string;
  display_name: string;
  headline?: string;
  bio_text?: string;
  profile_image_url?: string;
  header_image_url?: string;
  social_links?: SocialLink[];
  theme_preference?: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
  CreatedBy?: string;
  CreatedDate?: string;
  LastUpdatedBy?: string;
  LastUpdatedDate?: string;
}

export interface UserCustomSection {
  ItemId: string;
  user_id: string;
  section_type: string;
  section_title?: string;
  section_content?: string;
  section_order?: number;
  is_visible?: boolean;
  created_at?: string;
  updated_at?: string;
  CreatedBy?: string;
  CreatedDate?: string;
  LastUpdatedBy?: string;
  LastUpdatedDate?: string;
}

export interface CreateProfileParams {
  input: {
    user_id: string;
    username: string;
    display_name: string;
    headline?: string;
    bio_text?: string;
    profile_image_url?: string;
    header_image_url?: string;
    social_links?: SocialLink[];
    theme_preference?: string;
    is_published?: boolean;
  };
}

export interface UpdateProfileParams {
  filter: string;
  input: {
    display_name?: string;
    headline?: string;
    bio_text?: string;
    profile_image_url?: string;
    header_image_url?: string;
    social_links?: SocialLink[];
    theme_preference?: string;
    is_published?: boolean;
    username?: string;
  };
}

export interface CreateSectionParams {
  input: {
    user_id: string;
    section_type: string;
    section_title?: string;
    section_content?: string;
    section_order?: number;
    is_visible?: boolean;
  };
}

export interface UpdateSectionParams {
  filter: string;
  input: {
    section_type?: string;
    section_title?: string;
    section_content?: string;
    section_order?: number;
    is_visible?: boolean;
  };
}

export interface DeleteSectionParams {
  filter: string;
  input: {
    isHardDelete: boolean;
  };
}

export interface ProfileMutationResponse {
  itemId: string;
  totalImpactedData: number;
  acknowledged: boolean;
}
