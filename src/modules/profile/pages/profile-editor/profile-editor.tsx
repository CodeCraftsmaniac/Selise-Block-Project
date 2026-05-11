import { useEffect, useRef, useCallback, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Label } from '@/components/ui-kit/label';
import { Textarea } from '@/components/ui-kit/textarea';
import { Skeleton } from '@/components/ui-kit/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui-kit/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Trash,
  Upload,
  X,
  ExternalLink,
  Keyboard,
  Sparkles,
  Copy,
  Globe,
  EyeOff,
} from 'lucide-react';

import { ProfileCompletionBar } from '../../components/profile-completion-bar/profile-completion-bar';
import {
  useGetMyProfile,
  useUpdateMyProfile,
  useCreateProfile,
  usePublishProfile,
  useUnpublishProfile,
} from '../../hooks/use-profile';
import { useUploadImage } from '../../hooks/use-upload-image';
import { useProfileEditorStore } from '../../state/use-profile-editor-store';
import {
  profileFormSchema,
  socialPlatformSchema,
  ProfileFormValues,
} from '../../types/profile.types';
import type { SocialLink } from '../../types/profile.types';

type SocialPlatform = ProfileFormValues['social_links'][number]['platform'];

const PREDEFINED_PLATFORMS: SocialPlatform[] = [
  'linkedin',
  'github',
  'portfolio',
  'twitter',
  'youtube',
  'email',
  'other',
];

/**
 * Normalize form-side social links (which may omit `label`) to the gateway
 * shape (which requires `label` as a string). Keeps the submit payload
 * type-compatible with `UpdateProfileParams.input.social_links`.
 */
function normalizeSocialLinks(
  links: ProfileFormValues['social_links']
): SocialLink[] {
  return links.map((l) => ({
    platform: l.platform,
    url: l.url,
    label: l.label ?? '',
  }));
}

function toUpdateInput(values: ProfileFormValues): {
  display_name: string;
  username: string;
  headline: string;
  bio_text: string;
  profile_image_url: string;
  header_image_url: string;
  social_links: SocialLink[];
  theme_preference: string;
  accent_color: string;
  font_family: string;
  is_published: boolean;
} {
  return {
    display_name: values.display_name,
    username: values.username,
    headline: values.headline,
    bio_text: values.bio_text,
    profile_image_url: values.profile_image_url,
    header_image_url: values.header_image_url,
    social_links: normalizeSocialLinks(values.social_links),
    theme_preference: values.theme_preference,
    accent_color: values.accent_color,
    font_family: values.font_family,
    is_published: values.is_published,
  };
}

/** Values applied to the form when no profile exists yet (create-first UX). */
const EMPTY_FORM_VALUES: ProfileFormValues = {
  display_name: '',
  username: '',
  headline: '',
  bio_text: '',
  profile_image_url: '',
  header_image_url: '',
  social_links: [],
  theme_preference: 'minimal',
  accent_color: '#3b82f6',
  font_family: 'sans',
  is_published: false,
};

/**
 * Hydrate form defaults from the server-side `UserProfile`. Any field whose
 * persisted value fails the Zod schema (e.g. a legacy free-form
 * `theme_preference` that predates the enum constraint) falls back to the
 * schema default so the form never opens in an unrecoverable invalid state.
 */
function seedFormValues(profile: ReturnType<typeof useGetMyProfile>['data'] extends infer T
  ? T extends { getUserProfiles: { items: infer I } }
    ? I extends Array<infer P>
      ? P
      : undefined
    : undefined
  : undefined): ProfileFormValues {
  if (!profile) return EMPTY_FORM_VALUES;

  const themePreference = profileFormSchema.shape.theme_preference.safeParse(
    profile.theme_preference
  );
  const fontFamily = profileFormSchema.shape.font_family.safeParse(profile.font_family);
  const accentColor = profileFormSchema.shape.accent_color.safeParse(profile.accent_color);

  return {
    display_name: profile.display_name ?? '',
    username: profile.username ?? '',
    headline: profile.headline ?? '',
    bio_text: profile.bio_text ?? '',
    profile_image_url: profile.profile_image_url ?? '',
    header_image_url: profile.header_image_url ?? '',
    social_links: (profile.social_links ?? []).map((link) => {
      const parsedPlatform = socialPlatformSchema.safeParse(
        (link.platform ?? '').toString().toLowerCase()
      );
      return {
        platform: parsedPlatform.success ? parsedPlatform.data : 'other',
        url: link.url ?? '',
        label: link.label ?? '',
      };
    }),
    theme_preference: themePreference.success ? themePreference.data : 'minimal',
    accent_color: accentColor.success ? accentColor.data : '#3b82f6',
    font_family: fontFamily.success ? fontFamily.data : 'sans',
    is_published: Boolean(profile.is_published),
  };
}

export function ProfileEditorPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data, isLoading } = useGetMyProfile();
  const profile = data?.getUserProfiles?.items?.[0];

  const updateProfile = useUpdateMyProfile();
  const createProfile = useCreateProfile();
  const publishProfile = usePublishProfile();
  const unpublishProfile = useUnpublishProfile();

  const profileImage = useUploadImage({
    moduleName: 'profile_image',
    maxBytes: 5 * 1024 * 1024,
  });
  const headerImage = useUploadImage({
    moduleName: 'header_image',
    maxBytes: 10 * 1024 * 1024,
  });

  const markDirty = useProfileEditorStore((s) => s.markDirty);
  const clearDirty = useProfileEditorStore((s) => s.clearDirty);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: EMPTY_FORM_VALUES,
    mode: 'onBlur',
  });

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors, isDirty, isSubmitting },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'social_links',
  });

  const [newLink, setNewLink] = useState<ProfileFormValues['social_links'][number]>({
    platform: 'linkedin',
    url: '',
    label: '',
  });

  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [copyFlash, setCopyFlash] = useState(false);

  // Reset the form whenever the server-side profile arrives or changes.
  useEffect(() => {
    if (profile) {
      reset(seedFormValues(profile));
    }
  }, [profile, reset]);

  // Mirror react-hook-form's dirty state into the editor store so the rest
  // of the app (e.g. an unsaved-changes guard) can react to it.
  useEffect(() => {
    if (isDirty) {
      markDirty();
    } else {
      clearDirty();
    }
  }, [isDirty, markDirty, clearDirty]);

  // ----- Submit -------------------------------------------------------------

  const onSubmit = useCallback(
    async (values: ProfileFormValues) => {
      if (profile) {
        await updateProfile.mutateAsync({
          filter: JSON.stringify({ ItemId: profile.ItemId }),
          input: toUpdateInput(values),
        });
        // Re-seed form so `isDirty` flips back to false against the saved snapshot.
        reset(values);
        clearDirty();
      } else {
        await createProfile.mutateAsync({
          input: {
            user_id: '',
            ...toUpdateInput(values),
          },
        });
      }
    },
    [profile, updateProfile, createProfile, reset, clearDirty]
  );

  // Auto-save debounced on form changes.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (!profile) return;
    const subscription = watch((_value, { type }) => {
      if (type !== 'change') return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaveStatus('idle');
      debounceRef.current = setTimeout(() => {
        const snapshot = JSON.stringify(getValues());
        if (snapshot === lastSavedRef.current) return;
        handleSubmit(async (values) => {
          setSaveStatus('saving');
          try {
            await updateProfile.mutateAsync({
              filter: JSON.stringify({ ItemId: profile.ItemId }),
              input: toUpdateInput(values),
            });
            lastSavedRef.current = JSON.stringify(values);
            reset(values);
            clearDirty();
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
          } catch {
            setSaveStatus('idle');
          }
        })();
      }, 1500);
    });
    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [profile, watch, getValues, handleSubmit, updateProfile, reset, clearDirty]);

  // Ctrl+S saves via handleSubmit.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void handleSubmit(onSubmit)();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSubmit, onSubmit]);

  // ----- AI bio suggestion (kept from previous implementation) --------------

  const handleAiSuggestBio = async () => {
    setAiSuggesting(true);
    setAiSuggestion(null);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const projectKey = import.meta.env.VITE_X_BLOCKS_KEY || '';
      const projectSlug = import.meta.env.VITE_PROJECT_SLUG || '';
      const slugPath = projectSlug ? `/${projectSlug}` : '';
      const aiUrl = `${baseUrl}/ai/v1${slugPath}/agent/chat`;

      const values = getValues();
      const prompt = `Write a professional bio for a profile page. Name: ${
        values.display_name || 'User'
      }. Headline: ${
        values.headline || 'Professional'
      }. Keep it under 200 words, first person, engaging and professional. Return only the bio text.`;

      const res = await fetch(aiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-blocks-key': projectKey,
        },
        body: JSON.stringify({ message: prompt }),
      });

      const json = (await res.json()) as {
        response?: string;
        message?: string;
        data?: { response?: string };
      };
      const suggestion =
        json?.response || json?.message || json?.data?.response || null;
      if (suggestion) {
        setAiSuggestion(suggestion);
      } else {
        setAiSuggestion(t('AI_SUGGESTION_UNAVAILABLE'));
      }
    } catch {
      setAiSuggestion(t('AI_SUGGESTION_UNAVAILABLE'));
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleAcceptAiSuggestion = () => {
    if (aiSuggestion && aiSuggestion !== t('AI_SUGGESTION_UNAVAILABLE')) {
      setValue('bio_text', aiSuggestion.slice(0, 500), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    setAiSuggestion(null);
  };

  // ----- Image uploads ------------------------------------------------------

  const handleImagePick = useCallback(
    async (
      file: File,
      field: 'profile_image_url' | 'header_image_url'
    ) => {
      if (!profile) return;
      const uploader = field === 'profile_image_url' ? profileImage : headerImage;
      try {
        const { fileUrl } = await uploader.upload(file);
        setValue(field, fileUrl, { shouldDirty: true, shouldValidate: true });
        await updateProfile.mutateAsync({
          filter: JSON.stringify({ ItemId: profile.ItemId }),
          input: { [field]: fileUrl },
        });
        // Re-seed so the uploaded URL is treated as the canonical baseline.
        reset({ ...getValues(), [field]: fileUrl });
      } catch {
        // useUploadImage + useUpdateProfile already surface destructive toasts.
      }
    },
    [profile, profileImage, headerImage, setValue, updateProfile, reset, getValues]
  );

  const handleClearImage = (field: 'profile_image_url' | 'header_image_url') => {
    setValue(field, '', { shouldDirty: true, shouldValidate: true });
  };

  // ----- Publish / Unpublish -----------------------------------------------

  const handlePublish = async () => {
    if (!profile) return;
    await publishProfile.mutateAsync(JSON.stringify({ ItemId: profile.ItemId }));
  };

  const handleUnpublish = async () => {
    if (!profile) return;
    await unpublishProfile.mutateAsync(JSON.stringify({ ItemId: profile.ItemId }));
    setShowUnpublishConfirm(false);
  };

  const usernameValue = watch('username');
  const appDomain = import.meta.env.VITE_APP_DOMAIN || '';
  const shareUrl =
    usernameValue && appDomain
      ? `${appDomain.replace(/\/$/, '')}/u/${usernameValue}`
      : usernameValue
      ? `/u/${usernameValue}`
      : '';

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyFlash(true);
      toast({
        variant: 'success',
        title: t('COPIED'),
        description: shareUrl,
      });
      setTimeout(() => setCopyFlash(false), 1500);
    } catch {
      // Clipboard API unavailable (non-secure origin, etc.) — silently ignore.
    }
  };

  // ----- Loading branch -----------------------------------------------------

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-32" />
        <Skeleton className="w-32 h-10" />
      </div>
    );
  }

  const isSaving =
    isSubmitting || updateProfile.isPending || createProfile.isPending;
  const isPublishing = publishProfile.isPending || unpublishProfile.isPending;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('PROFILE_EDITOR')}</h1>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Keyboard className="w-5 h-5" />
            </button>
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border rounded-xl shadow-lg p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <p className="font-semibold text-gray-900 mb-2">
                {t('KEYBOARD_SHORTCUTS')}
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('SAVE_PROFILE')}</span>
                  <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                    Ctrl + S
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('ADD_LINK')}</span>
                  <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                    Enter
                  </kbd>
                </div>
              </div>
            </div>
          </div>
          {profile?.username && (
            <a
              href={`/u/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {t('LIVE_PREVIEW')}
            </a>
          )}
        </div>
      </div>

      {profile && <ProfileCompletionBar profile={profile} />}

      {/* Publish / Share bar */}
      {profile && (
        <div className="mb-6 rounded-xl border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {watch('is_published') ? (
                <>
                  <Globe className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {t('PROFILE_IS_PUBLISHED')}
                  </span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {t('PROFILE_IS_UNPUBLISHED')}
                  </span>
                </>
              )}
            </div>
            {watch('is_published') ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowUnpublishConfirm(true)}
                disabled={isPublishing}
              >
                {unpublishProfile.isPending ? t('SAVING') : t('UNPUBLISH')}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handlePublish}
                disabled={isPublishing || !profile.username}
              >
                {publishProfile.isPending ? t('SAVING') : t('PUBLISH')}
              </Button>
            )}
          </div>
          {watch('is_published') && shareUrl && (
            <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
              <span className="text-xs text-gray-500">{t('SHARE_URL')}</span>
              <code className="flex-1 text-xs text-gray-800 truncate">{shareUrl}</code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyShareUrl}
                className="gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                {copyFlash ? t('COPIED') : t('COPY')}
              </Button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Display Name */}
        <div>
          <Label htmlFor="display_name">{t('DISPLAY_NAME')}</Label>
          <Input
            id="display_name"
            {...register('display_name')}
            placeholder={t('DISPLAY_NAME_PLACEHOLDER')}
          />
          {errors.display_name && (
            <p className="text-sm text-red-600 mt-1">{errors.display_name.message}</p>
          )}
        </div>

        {/* Username */}
        <div>
          <Label htmlFor="username">{t('USERNAME')}</Label>
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <Input
                id="username"
                value={field.value}
                onBlur={field.onBlur}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                  field.onChange(val);
                }}
                placeholder={t('USERNAME_PLACEHOLDER')}
              />
            )}
          />
          <p className="text-sm text-gray-500 mt-1">{t('USERNAME_HELP')}</p>
          {errors.username && (
            <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>
          )}
        </div>

        {/* Headline */}
        <div>
          <Label htmlFor="headline">{t('HEADLINE')}</Label>
          <Input
            id="headline"
            {...register('headline')}
            placeholder={t('HEADLINE_PLACEHOLDER')}
          />
          {errors.headline && (
            <p className="text-sm text-red-600 mt-1">{errors.headline.message}</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="bio_text">{t('BIO')}</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAiSuggestBio}
                disabled={aiSuggesting}
                className="gap-1.5 text-purple-600 border-purple-300 hover:bg-purple-50"
              >
                <Sparkles className="w-4 h-4" />
                {aiSuggesting ? t('GENERATING') : t('AI_SUGGEST_BIO')}
              </Button>
              <span className="text-xs text-gray-400">
                {(watch('bio_text') || '').length} / 500 {t('CHARS')} ·{' '}
                {(watch('bio_text') || '').trim().split(/\s+/).filter(Boolean).length}{' '}
                {t('WORDS')}
              </span>
            </div>
          </div>
          <Controller
            name="bio_text"
            control={control}
            render={({ field }) => (
              <Textarea
                id="bio_text"
                value={field.value}
                onBlur={field.onBlur}
                onChange={(e) => field.onChange(e.target.value.slice(0, 500))}
                placeholder={t('BIO_PLACEHOLDER')}
                rows={5}
              />
            )}
          />
          {errors.bio_text && (
            <p className="text-sm text-red-600 mt-1">{errors.bio_text.message}</p>
          )}
          {aiSuggestion && (
            <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-xs font-medium text-purple-700 mb-1">
                {t('AI_SUGGESTION')}
              </p>
              <p className="text-sm text-gray-700">{aiSuggestion}</p>
              <div className="flex gap-2 mt-2">
                <Button type="button" size="sm" onClick={handleAcceptAiSuggestion}>
                  {t('ACCEPT')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setAiSuggestion(null)}
                >
                  {t('DISMISS')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Image */}
        <div>
          <Label>{t('PROFILE_IMAGE')}</Label>
          <div className="flex items-center gap-4 mt-2">
            {watch('profile_image_url') ? (
              <div className="relative">
                <img
                  src={watch('profile_image_url')}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleClearImage('profile_image_url')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-2xl">?</span>
              </div>
            )}
            <label
              className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                  void handleImagePick(file, 'profile_image_url');
                }
              }}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={profileImage.isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImagePick(file, 'profile_image_url');
                  e.target.value = '';
                }}
              />
              <div className="flex flex-col items-center text-center">
                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">
                  {profileImage.isUploading
                    ? `${t('UPLOADING')} ${profileImage.progress}%`
                    : t('DRAG_DROP_OR_CLICK')}
                </span>
                {profileImage.isUploading && (
                  <div className="mt-1 h-1 w-24 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${profileImage.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </label>
          </div>
          {errors.profile_image_url && (
            <p className="text-sm text-red-600 mt-1">
              {errors.profile_image_url.message}
            </p>
          )}
        </div>

        {/* Header Image */}
        <div>
          <Label>{t('HEADER_IMAGE')}</Label>
          <div className="mt-2">
            {watch('header_image_url') ? (
              <div className="relative">
                <img
                  src={watch('header_image_url')}
                  alt="Header"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleClearImage('header_image_url')}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label
                className="block w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center transition-colors"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) {
                    void handleImagePick(file, 'header_image_url');
                  }
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={headerImage.isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImagePick(file, 'header_image_url');
                    e.target.value = '';
                  }}
                />
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <span className="text-gray-500">
                    {headerImage.isUploading
                      ? `${t('UPLOADING')} ${headerImage.progress}%`
                      : t('DRAG_DROP_OR_CLICK')}
                  </span>
                  {headerImage.isUploading && (
                    <div className="mt-2 h-1 w-40 mx-auto rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${headerImage.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </label>
            )}
          </div>
          {errors.header_image_url && (
            <p className="text-sm text-red-600 mt-1">{errors.header_image_url.message}</p>
          )}
        </div>

        {/* Social Links */}
        <div>
          <Label>{t('SOCIAL_LINKS')}</Label>
          <div className="space-y-3 mt-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-sm w-24 capitalize">
                  {watch(`social_links.${index}.platform`)}
                </span>
                <span className="text-sm text-gray-600 flex-1 truncate">
                  {watch(`social_links.${index}.url`)}
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-500"
                >
                  <Trash className="w-4 h-4" />
                </button>
                {errors.social_links?.[index]?.url && (
                  <p className="text-xs text-red-600 ml-2">
                    {errors.social_links[index]?.url?.message}
                  </p>
                )}
              </div>
            ))}

            <div className="flex gap-2">
              <select
                value={newLink.platform}
                onChange={(e) =>
                  setNewLink((prev) => ({
                    ...prev,
                    platform: e.target.value as (typeof PREDEFINED_PLATFORMS)[number],
                  }))
                }
                className="border rounded-md px-3 py-2 text-sm"
              >
                {PREDEFINED_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <Input
                placeholder={t('URL')}
                value={newLink.url}
                onChange={(e) => setNewLink((prev) => ({ ...prev, url: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newLink.url) {
                      append({
                        platform: newLink.platform,
                        url: newLink.url,
                        label: newLink.label,
                      });
                      setNewLink({ platform: 'linkedin', url: '', label: '' });
                    }
                  }
                }}
                className="flex-1"
              />
              <Input
                placeholder={t('LABEL_OPTIONAL')}
                value={newLink.label ?? ''}
                onChange={(e) =>
                  setNewLink((prev) => ({ ...prev, label: e.target.value }))
                }
                className="w-40"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (!newLink.url) return;
                  append({
                    platform: newLink.platform,
                    url: newLink.url,
                    label: newLink.label,
                  });
                  setNewLink({ platform: 'linkedin', url: '', label: '' });
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 flex items-center gap-4">
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full md:w-auto"
          >
            {isSaving ? t('SAVING') : t('SAVE_PROFILE')}
          </Button>
          {saveStatus === 'saving' && (
            <span className="text-sm text-blue-600">{t('AUTO_SAVING')}</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-sm text-green-600">{t('AUTO_SAVED')}</span>
          )}
        </div>
      </form>

      {/* Unpublish confirmation dialog */}
      <AlertDialog open={showUnpublishConfirm} onOpenChange={setShowUnpublishConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('UNPUBLISH_PROFILE')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('UNPUBLISH_PROFILE_CONFIRMATION')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('CANCEL')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleUnpublish();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {unpublishProfile.isPending ? t('SAVING') : t('UNPUBLISH')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
