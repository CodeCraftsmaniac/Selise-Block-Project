import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Check, Globe, User, Type, Shuffle } from 'lucide-react';

import { useGetMyProfile, useUpdateMyProfile } from '../../hooks/use-profile';
import {
  themePreferenceSchema,
  accentColorSchema,
  fontFamilySchema,
} from '../../types/profile.types';
import { ThemeProvider } from '@/styles/theme/theme-provider';
import { Button } from '@/components/ui-kit/button';
import { Label } from '@/components/ui-kit/label';
import { Skeleton } from '@/components/ui-kit/skeleton';

// ---------------------------------------------------------------------------
// Local form schema (Task 9.1)
//
// The appearance page edits only three fields from the full `profileFormSchema`.
// Defining a local subset schema keeps the form state minimal and surfaces
// field-level Zod errors (e.g. malformed `#GGGGGG` accent color) inline in
// the UI without pulling unrelated profile fields into the form lifecycle.
// ---------------------------------------------------------------------------
const appearanceFormSchema = z.object({
  theme_preference: themePreferenceSchema,
  accent_color: accentColorSchema,
  font_family: fontFamilySchema,
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

const DEFAULT_VALUES: AppearanceFormValues = {
  theme_preference: 'minimal',
  accent_color: '#3b82f6',
  font_family: 'sans',
};

const THEMES: Array<{
  id: AppearanceFormValues['theme_preference'];
  label: string;
  className: string;
}> = [
  { id: 'minimal', label: 'Minimal', className: 'bg-white border-2 border-gray-200 text-gray-900' },
  { id: 'bold', label: 'Bold', className: 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' },
  { id: 'dark', label: 'Dark', className: 'bg-gray-900 text-white border-2 border-gray-700' },
  {
    id: 'gradient',
    label: 'Gradient',
    className: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white',
  },
];

const ACCENT_COLORS: Array<{ id: string; label: string }> = [
  { id: '#3b82f6', label: 'Blue' },
  { id: '#10b981', label: 'Green' },
  { id: '#f59e0b', label: 'Amber' },
  { id: '#ef4444', label: 'Red' },
  { id: '#8b5cf6', label: 'Purple' },
  { id: '#ec4899', label: 'Pink' },
  { id: '#06b6d4', label: 'Cyan' },
  { id: '#f97316', label: 'Orange' },
];

const FONT_FAMILIES: Array<{
  id: AppearanceFormValues['font_family'];
  label: string;
  className: string;
}> = [
  { id: 'sans', label: 'Sans Serif', className: 'font-sans' },
  { id: 'serif', label: 'Serif', className: 'font-serif' },
  { id: 'mono', label: 'Monospace', className: 'font-mono' },
];

const THEME_STYLES: Record<AppearanceFormValues['theme_preference'], string> = {
  minimal: 'bg-white text-gray-900',
  bold: 'bg-gradient-to-br from-blue-600 to-purple-600 text-white',
  dark: 'bg-gray-900 text-gray-100',
  gradient: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white',
};

export function AppearancePage() {
  const { t } = useTranslation();

  const { data, isLoading } = useGetMyProfile();
  const existingProfile = data?.getUserProfiles?.items?.[0];
  const updateProfile = useUpdateMyProfile();

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = form;

  // Seed form values from the authenticated user's persisted profile once it
  // loads. `reset` (not `setValue`) so `formState.isDirty` starts clean after
  // the async hydration.
  useEffect(() => {
    if (!existingProfile) return;
    const nextThemePreference = themePreferenceSchema.safeParse(existingProfile.theme_preference);
    const nextAccentColor = accentColorSchema.safeParse(existingProfile.accent_color);
    const nextFontFamily = fontFamilySchema.safeParse(existingProfile.font_family);

    reset({
      theme_preference: nextThemePreference.success
        ? nextThemePreference.data
        : DEFAULT_VALUES.theme_preference,
      accent_color: nextAccentColor.success ? nextAccentColor.data : DEFAULT_VALUES.accent_color,
      font_family: nextFontFamily.success ? nextFontFamily.data : DEFAULT_VALUES.font_family,
    });
  }, [existingProfile, reset]);

  // Watch the three form fields so the preview (and the `ThemeProvider`
  // overrides wrapping it) reflect every change instantly. `watch()` with no
  // args returns the latest aggregate values and triggers a re-render on
  // every keystroke/click.
  const watchedThemePreference = watch('theme_preference');
  const watchedAccentColor = watch('accent_color');
  const watchedFontFamily = watch('font_family');

  // Zod regex for `accent_color` – used to gate the live CSS overrides on the
  // preview card so a typed `#GGGGGG` value is visually ignored while the
  // inline error message surfaces the reason.
  const isAccentColorValid = /^#[0-9a-fA-F]{6}$/.test(watchedAccentColor);

  const onSubmit = (values: AppearanceFormValues) => {
    if (!existingProfile) return;
    updateProfile.mutate({
      filter: JSON.stringify({ ItemId: existingProfile.ItemId }),
      input: values,
    });
  };

  const handleRandomize = () => {
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const randomColor = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
    const randomFont = FONT_FAMILIES[Math.floor(Math.random() * FONT_FAMILIES.length)];
    setValue('theme_preference', randomTheme.id, { shouldDirty: true, shouldValidate: true });
    setValue('accent_color', randomColor.id, { shouldDirty: true, shouldValidate: true });
    setValue('font_family', randomFont.id, { shouldDirty: true, shouldValidate: true });
  };

  const handleResetDefaults = () => {
    setValue('theme_preference', DEFAULT_VALUES.theme_preference, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue('accent_color', DEFAULT_VALUES.accent_color, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue('font_family', DEFAULT_VALUES.font_family, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-40" />
      </div>
    );
  }

  const isDarkPreview =
    watchedThemePreference === 'dark' ||
    watchedThemePreference === 'bold' ||
    watchedThemePreference === 'gradient';
  const selectedFontClassName =
    FONT_FAMILIES.find((f) => f.id === watchedFontFamily)?.className ?? 'font-sans';
  // Fall back to the default accent color in the preview swatch when the
  // user-entered hex is invalid so the UI stays readable while the error
  // message explains the problem.
  const previewAccent = isAccentColorValid ? watchedAccentColor : DEFAULT_VALUES.accent_color;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('APPEARANCE')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Selectors column */}
        <div className="space-y-6">
          {/* Theme selector */}
          <div>
            <Label className="text-lg font-semibold mb-4 block">{t('SELECT_THEME')}</Label>
            <Controller
              control={control}
              name="theme_preference"
              render={({ field }) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {THEMES.map((theme) => {
                    const isSelected = field.value === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => field.onChange(theme.id)}
                        className={`relative p-6 rounded-xl text-left transition-all ${theme.className} ${
                          isSelected
                            ? 'ring-4 ring-offset-2 ring-blue-500 scale-[1.02]'
                            : 'hover:scale-[1.01] opacity-90 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-lg">{theme.label}</span>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm mt-2 opacity-80">
                          {t(`${theme.id.toUpperCase()}_THEME_DESC`) || `${theme.label} theme for your profile`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.theme_preference && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {errors.theme_preference.message}
              </p>
            )}
          </div>

          {/* Accent color */}
          <div>
            <Label className="text-lg font-semibold mb-4 block">{t('ACCENT_COLOR')}</Label>
            <Controller
              control={control}
              name="accent_color"
              render={({ field }) => (
                <div className="flex flex-wrap gap-3 items-center">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => field.onChange(color.id)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        field.value === color.id
                          ? 'border-gray-900 scale-110 shadow-md'
                          : 'border-gray-200 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.id }}
                      title={color.label}
                    />
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <input
                      type="color"
                      value={isAccentColorValid ? field.value : DEFAULT_VALUES.accent_color}
                      onChange={(event) => field.onChange(event.target.value)}
                      className="w-10 h-10 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                      title={t('CUSTOM_COLOR') || 'Custom color'}
                    />
                    {/* Free-form text input lets users type arbitrary values
                     * (including malformed ones such as `#GGGGGG`) so the Zod
                     * error message surfaces inline. Bound to the same
                     * Controller field as the color picker so both inputs
                     * stay in sync with react-hook-form state. */}
                    <input
                      type="text"
                      aria-label={t('ACCENT_COLOR') || 'Accent color'}
                      className={`w-28 text-sm border rounded px-2 py-1 font-mono ${
                        errors.accent_color ? 'border-red-500' : 'border-gray-200'
                      }`}
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      onBlur={field.onBlur}
                    />
                  </div>
                </div>
              )}
            />
            {errors.accent_color && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {errors.accent_color.message ?? t('INVALID_ACCENT_COLOR') ?? 'Invalid color'}
              </p>
            )}
          </div>

          {/* Font family */}
          <div>
            <Label className="text-lg font-semibold mb-4 block">{t('FONT_FAMILY')}</Label>
            <Controller
              control={control}
              name="font_family"
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-3">
                  {FONT_FAMILIES.map((font) => {
                    const isSelected = field.value === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => field.onChange(font.id)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Type className="w-5 h-5 mx-auto mb-1" />
                        <span className={`text-sm ${font.className}`}>{font.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.font_family && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {errors.font_family.message}
              </p>
            )}
          </div>

          <div className="pt-4 flex items-center gap-3">
            <Button
              type="submit"
              disabled={updateProfile.isPending || !existingProfile || !isValid}
            >
              {updateProfile.isPending ? t('SAVING') : t('SAVE_THEME')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRandomize}
              disabled={updateProfile.isPending || !existingProfile}
            >
              <Shuffle className="w-4 h-4 mr-2" />
              {t('RANDOMIZE')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetDefaults}
              disabled={updateProfile.isPending || !existingProfile}
            >
              {t('RESET_DEFAULTS')}
            </Button>
          </div>
        </div>

        {/* Live preview column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label className="text-lg font-semibold">{t('LIVE_PREVIEW')}</Label>
          </div>

          {/*
           * `ThemeProvider overrides={...}` is bound to the watched form
           * values so every selector change flows into the `<html>` class
           * list and the `--accent` CSS variable via the provider effect.
           * The preview card below additionally paints the selected preset
           * inline so the visual feedback is immediate even before the
           * global CSS contract ships to consumers.
           */}
          <ThemeProvider
            overrides={{
              theme_preference: watchedThemePreference,
              accent_color: isAccentColorValid ? watchedAccentColor : undefined,
              font_family: watchedFontFamily,
            }}
          >
            <div className="border rounded-xl overflow-hidden shadow-sm mx-auto transition-all duration-300">
              {/* Mini browser chrome */}
              <div className="bg-gray-100 px-3 py-2 border-b flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded px-2 py-0.5 text-xs text-gray-400 text-center truncate">
                  {existingProfile?.username ? `/u/${existingProfile.username}` : 'your-profile-url'}
                </div>
              </div>

              {/* Preview content */}
              <div
                className={`${THEME_STYLES[watchedThemePreference] ?? THEME_STYLES.minimal} ${selectedFontClassName} transition-colors`}
              >
                <div className="h-24 w-full relative overflow-hidden">
                  {existingProfile?.header_image_url ? (
                    <img src={existingProfile.header_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full ${isDarkPreview ? 'bg-gray-800' : 'bg-gray-200'}`} />
                  )}
                </div>

                <div className="px-4 pb-4 relative">
                  <div className="flex items-end gap-3 -mt-8 mb-3">
                    <div
                      className="w-16 h-16 rounded-full border-4 border-white bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md"
                      style={{ borderColor: previewAccent }}
                    >
                      {existingProfile?.profile_image_url ? (
                        <img
                          src={existingProfile.profile_image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="pb-1">
                      <h2 className="text-lg font-bold leading-tight">
                        {existingProfile?.display_name || t('YOUR_NAME')}
                      </h2>
                      {existingProfile?.headline && (
                        <p className={`text-sm ${isDarkPreview ? 'text-gray-200' : 'text-gray-600'}`}>
                          {existingProfile.headline}
                        </p>
                      )}
                    </div>
                  </div>

                  {existingProfile?.bio_text && (
                    <p className={`text-sm mb-3 line-clamp-3 ${isDarkPreview ? 'text-gray-200' : 'text-gray-700'}`}>
                      {existingProfile.bio_text}
                    </p>
                  )}

                  {existingProfile?.social_links && existingProfile.social_links.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {existingProfile.social_links.slice(0, 3).map((link, i) => (
                        <span
                          key={`${link.platform}-${i}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-white"
                          style={{ backgroundColor: previewAccent }}
                        >
                          <Globe className="w-3 h-3" />
                          {link.platform}
                        </span>
                      ))}
                      {existingProfile.social_links.length > 3 && (
                        <span className={`text-xs px-2 py-1 ${isDarkPreview ? 'text-gray-300' : 'text-gray-500'}`}>
                          +{existingProfile.social_links.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ThemeProvider>
        </div>
      </div>
    </form>
  );
}
