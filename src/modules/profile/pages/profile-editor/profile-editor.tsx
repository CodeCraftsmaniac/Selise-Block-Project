import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/state/store/auth';
import {
  useGetProfileByUserId,
  useUpdateProfile,
  useCreateProfile,
} from '../../hooks/use-profile';
import { useGetPreSignedUrlForUpload } from '@/lib/api/hooks/use-storage';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Label } from '@/components/ui-kit/label';
import { Textarea } from '@/components/ui-kit/textarea';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { Plus, Trash, Upload, X, ExternalLink } from 'lucide-react';
import { ProfileCompletionBar } from '../../components/profile-completion-bar/profile-completion-bar';
import { SocialLink, UserProfile } from '../../types/profile.types';

const PREDEFINED_PLATFORMS = [
  'LinkedIn',
  'GitHub',
  'Portfolio',
  'Twitter',
  'YouTube',
  'Email',
  'Instagram',
  'Facebook',
  'TikTok',
  'Discord',
  'Telegram',
  'WhatsApp',
  'Medium',
  'Dev.to',
  'Behance',
  'Dribbble',
  'Twitch',
  'Spotify',
];

export function ProfileEditorPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const userId = user?.itemId || '';

  const { data, isLoading } = useGetProfileByUserId(userId);
  const existingProfile = data?.getUserProfiles?.items?.[0];

  const updateProfile = useUpdateProfile();
  const createProfile = useCreateProfile();
  const uploadMutation = useGetPreSignedUrlForUpload();

  const [form, setForm] = useState<Partial<UserProfile>>({
    display_name: '',
    username: '',
    headline: '',
    bio_text: '',
    profile_image_url: '',
    header_image_url: '',
    social_links: [],
    theme_preference: 'minimal',
  });

  const [newLink, setNewLink] = useState<SocialLink>({ platform: '', url: '', label: '' });
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    if (existingProfile) {
      setForm({
        display_name: existingProfile.display_name || '',
        username: existingProfile.username || '',
        headline: existingProfile.headline || '',
        bio_text: existingProfile.bio_text || '',
        profile_image_url: existingProfile.profile_image_url || '',
        header_image_url: existingProfile.header_image_url || '',
        social_links: existingProfile.social_links || [],
        theme_preference: existingProfile.theme_preference || 'minimal',
      });
    }
  }, [existingProfile]);

  const handleChange = (field: keyof UserProfile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddLink = () => {
    if (!newLink.platform || !newLink.url) return;
    setForm((prev) => ({
      ...prev,
      social_links: [...(prev.social_links || []), newLink],
    }));
    setNewLink({ platform: '', url: '', label: '' });
  };

  const handleRemoveLink = (index: number) => {
    setForm((prev) => ({
      ...prev,
      social_links: prev.social_links?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const res = await uploadMutation.mutateAsync({
        name: file.name,
        moduleName: 'profile',
        projectKey: import.meta.env.VITE_X_BLOCKS_KEY || '',
      });

      if (res?.uploadUrl) {
        await fetch(res.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        const downloadUrl = res.uploadUrl.split('?')[0];
        handleChange(field as keyof UserProfile, downloadUrl);
      }
    } catch {
      // handled by global mutation hook
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = useCallback(() => {
    if (!userId) return;

    const payload = {
      display_name: form.display_name || '',
      username: form.username || '',
      headline: form.headline || '',
      bio_text: form.bio_text || '',
      profile_image_url: form.profile_image_url || '',
      header_image_url: form.header_image_url || '',
      social_links: form.social_links || [],
      theme_preference: form.theme_preference || 'minimal',
    };

    if (existingProfile) {
      updateProfile.mutate({
        filter: existingProfile.ItemId,
        input: payload,
      });
    } else {
      createProfile.mutate({
        input: {
          user_id: userId,
          ...payload,
        },
      });
    }
  }, [userId, form, existingProfile, updateProfile, createProfile]);

  // Auto-save with debounce
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  const performAutoSave = useCallback(() => {
    if (!existingProfile || !userId) return;
    const payload = {
      display_name: form.display_name || '',
      username: form.username || '',
      headline: form.headline || '',
      bio_text: form.bio_text || '',
      profile_image_url: form.profile_image_url || '',
      header_image_url: form.header_image_url || '',
      social_links: form.social_links || [],
      theme_preference: form.theme_preference || 'minimal',
    };
    const snapshot = JSON.stringify(payload);
    if (snapshot === lastSavedRef.current) return;

    setSaveStatus('saving');
    updateProfile.mutate(
      {
        filter: existingProfile.ItemId,
        input: payload,
      },
      {
        onSuccess: () => {
          setSaveStatus('saved');
          lastSavedRef.current = snapshot;
          setTimeout(() => setSaveStatus('idle'), 2000);
        },
        onError: () => {
          setSaveStatus('idle');
        },
      }
    );
  }, [existingProfile, userId, form, updateProfile]);

  useEffect(() => {
    if (!existingProfile) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('idle');
    debounceRef.current = setTimeout(() => {
      performAutoSave();
    }, 1500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form, existingProfile, performAutoSave]);

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

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

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('PROFILE_EDITOR')}</h1>
        {existingProfile?.username && (
          <a
            href={`/u/${existingProfile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {t('LIVE_PREVIEW')}
          </a>
        )}
      </div>

      {existingProfile && <ProfileCompletionBar profile={existingProfile} />}

      <div className="space-y-6">
        {/* Display Name */}
        <div>
          <Label htmlFor="display_name">{t('DISPLAY_NAME')}</Label>
          <Input
            id="display_name"
            value={form.display_name || ''}
            onChange={(e) => handleChange('display_name', e.target.value)}
            placeholder={t('DISPLAY_NAME_PLACEHOLDER')}
          />
        </div>

        {/* Username */}
        <div>
          <Label htmlFor="username">{t('USERNAME')}</Label>
          <Input
            id="username"
            value={form.username || ''}
            onChange={(e) => {
              const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
              handleChange('username', val);
            }}
            placeholder={t('USERNAME_PLACEHOLDER')}
          />
          <p className="text-sm text-gray-500 mt-1">{t('USERNAME_HELP')}</p>
        </div>

        {/* Headline */}
        <div>
          <Label htmlFor="headline">{t('HEADLINE')}</Label>
          <Input
            id="headline"
            value={form.headline || ''}
            onChange={(e) => handleChange('headline', e.target.value)}
            placeholder={t('HEADLINE_PLACEHOLDER')}
          />
        </div>

        {/* Bio */}
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="bio_text">{t('BIO')}</Label>
            <span className="text-xs text-gray-400">
              {(form.bio_text || '').length} / 500 {t('CHARS')} · {(form.bio_text || '').trim().split(/\s+/).filter(Boolean).length} {t('WORDS')}
            </span>
          </div>
          <Textarea
            id="bio_text"
            value={form.bio_text || ''}
            onChange={(e) => {
              const val = e.target.value.slice(0, 500);
              handleChange('bio_text', val);
            }}
            placeholder={t('BIO_PLACEHOLDER')}
            rows={5}
          />
        </div>

        {/* Profile Image */}
        <div>
          <Label>{t('PROFILE_IMAGE')}</Label>
          <div className="flex items-center gap-4 mt-2">
            {form.profile_image_url ? (
              <div className="relative">
                <img
                  src={form.profile_image_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <button
                  onClick={() => handleChange('profile_image_url', '')}
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
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-50'); }}
              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                  const syntheticEvent = { target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>;
                  handleFileUpload(syntheticEvent, 'profile_image_url');
                }
              }}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'profile_image_url')}
                disabled={uploadingField === 'profile_image_url'}
              />
              <div className="flex flex-col items-center text-center">
                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">
                  {uploadingField === 'profile_image_url' ? t('UPLOADING') : t('DRAG_DROP_OR_CLICK')}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Header Image */}
        <div>
          <Label>{t('HEADER_IMAGE')}</Label>
          <div className="mt-2">
            {form.header_image_url ? (
              <div className="relative">
                <img
                  src={form.header_image_url}
                  alt="Header"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  onClick={() => handleChange('header_image_url', '')}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label
                className="block w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center transition-colors"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-50'); }}
                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50'); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) {
                    const syntheticEvent = { target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>;
                    handleFileUpload(syntheticEvent, 'header_image_url');
                  }
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'header_image_url')}
                  disabled={uploadingField === 'header_image_url'}
                />
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <span className="text-gray-500">
                    {uploadingField === 'header_image_url' ? t('UPLOADING') : t('DRAG_DROP_OR_CLICK')}
                  </span>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Social Links */}
        <div>
          <Label>{t('SOCIAL_LINKS')}</Label>
          <div className="space-y-3 mt-2">
            {form.social_links?.map((link, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-sm w-24">{link.platform}</span>
                <span className="text-sm text-gray-600 flex-1 truncate">{link.url}</span>
                <button onClick={() => handleRemoveLink(index)} className="text-red-500">
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="flex gap-2">
              <select
                value={newLink.platform}
                onChange={(e) => setNewLink((prev) => ({ ...prev, platform: e.target.value }))}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="">{t('SELECT_PLATFORM')}</option>
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
                className="flex-1"
              />
              <Input
                placeholder={t('LABEL_OPTIONAL')}
                value={newLink.label}
                onChange={(e) => setNewLink((prev) => ({ ...prev, label: e.target.value }))}
                className="w-40"
              />
              <Button type="button" size="sm" onClick={handleAddLink}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 flex items-center gap-4">
          <Button
            onClick={handleSave}
            disabled={updateProfile.isPending || createProfile.isPending}
            className="w-full md:w-auto"
          >
            {updateProfile.isPending || createProfile.isPending ? t('SAVING') : t('SAVE_PROFILE')}
          </Button>
          {saveStatus === 'saving' && (
            <span className="text-sm text-blue-600">{t('AUTO_SAVING')}</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-sm text-green-600">{t('AUTO_SAVED')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
