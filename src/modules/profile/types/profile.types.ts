import { z } from 'zod';

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
  accent_color?: string;
  font_family?: string;
  view_count?: number;
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
    accent_color?: string;
    font_family?: string;
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
    accent_color?: string;
    font_family?: string;
    view_count?: number;
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

// ---------------------------------------------------------------------------
// Zod schemas (Task 2.1)
//
// These schemas enforce the field-level validation rules documented in
// design.md §Data Models (Validation rules) and §Security Considerations
// (Open redirect protection). They are consumed by react-hook-form resolvers
// on the profile editor, appearance, and sections pages.
// ---------------------------------------------------------------------------

/** 3–30 chars, lowercase/digits/hyphen/underscore, starts with alphanumeric. */
export const usernameSchema = z.string().regex(/^[a-z0-9][a-z0-9-_]{2,29}$/);

/** 1–60 chars, trimmed. */
export const displayNameSchema = z.string().trim().min(1).max(60);

/** 0–120 chars. */
export const headlineSchema = z.string().max(120).default('');

/** 0–2000 chars, Markdown allowed. */
export const bioTextSchema = z.string().max(2000).default('');

/** `#RRGGBB` hex color. */
export const accentColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

/** Theme preset applied to `/u/:username` via ThemeProvider overrides. */
export const themePreferenceSchema = z.enum(['minimal', 'bold', 'dark', 'gradient']);

/** Font-family preset applied to `/u/:username` via ThemeProvider overrides. */
export const fontFamilySchema = z.enum(['sans', 'serif', 'mono']);

/** Allowed social-link platforms. */
export const socialPlatformSchema = z.enum([
  'linkedin',
  'github',
  'portfolio',
  'twitter',
  'youtube',
  'email',
  'other',
]);

/**
 * social_links entry. Rejects `javascript:` URLs outright (open-redirect /
 * XSS guard). `mailto:` is only accepted when `platform === 'email'`. All
 * other platforms must use an `https://` URL.
 */
export const socialLinkSchema = z
  .object({
    platform: socialPlatformSchema,
    url: z.string().min(1),
    label: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    const trimmedUrl = val.url.trim();

    // Reject javascript: scheme regardless of platform.
    if (/^javascript:/i.test(trimmedUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'javascript: URLs are not allowed',
      });
      return;
    }

    if (val.platform === 'email') {
      if (!/^mailto:/i.test(trimmedUrl)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['url'],
          message: 'Email social link must use a mailto: URL',
        });
      }
      return;
    }

    // Non-email platforms: disallow mailto:, require https URL.
    if (/^mailto:/i.test(trimmedUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'mailto: URLs are only allowed for the email platform',
      });
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmedUrl);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'Invalid URL',
      });
      return;
    }

    if (parsed.protocol !== 'https:') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'URL must use the https:// scheme',
      });
    }
  });

/** Empty string (unset) or an https URL. */
export const imageUrlSchema = z.union([
  z.literal(''),
  z.string().url().startsWith('https://'),
]);

/** Aggregate schema for the profile editor form. */
export const profileFormSchema = z.object({
  display_name: displayNameSchema,
  username: usernameSchema,
  headline: headlineSchema,
  bio_text: bioTextSchema,
  profile_image_url: imageUrlSchema,
  header_image_url: imageUrlSchema,
  social_links: z.array(socialLinkSchema).default([]),
  theme_preference: themePreferenceSchema,
  accent_color: accentColorSchema,
  font_family: fontFamilySchema,
  is_published: z.boolean(),
});

/** Allowed user_custom_section.section_type values. */
export const sectionTypeSchema = z.enum([
  'Experience',
  'Project',
  'Skill',
  'Education',
  'Custom',
]);

/** Aggregate schema for the section create/edit form. */
export const sectionFormSchema = z.object({
  section_type: sectionTypeSchema,
  section_title: z.string().max(80).default(''),
  section_content: z.string().max(5000).default(''),
  section_order: z.number().int().nonnegative(),
  is_visible: z.boolean(),
});

/**
 * Parse a username, throwing if it does not match the spec regex.
 * Use in command-line-style call sites (e.g. route params) where a
 * structured Zod error is not helpful.
 */
export function parseUsername(s: string): string {
  return usernameSchema.parse(s);
}

/**
 * Parse an accent color, throwing if it is not a valid `#RRGGBB` hex string.
 */
export function parseAccentColor(s: string): string {
  return accentColorSchema.parse(s);
}

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export type SectionFormValues = z.infer<typeof sectionFormSchema>;
