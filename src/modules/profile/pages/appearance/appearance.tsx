import { useState, useEffect } from 'react';
import { useAuthStore } from '@/state/store/auth';
import { useGetProfileByUserId, useUpdateProfile } from '../../hooks/use-profile';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui-kit/button';
import { Label } from '@/components/ui-kit/label';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { Check, Globe, User, Type } from 'lucide-react';

const THEMES = [
  { id: 'minimal', label: 'Minimal', className: 'bg-white border-2 border-gray-200 text-gray-900' },
  { id: 'bold', label: 'Bold', className: 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' },
  { id: 'dark', label: 'Dark', className: 'bg-gray-900 text-white border-2 border-gray-700' },
  { id: 'gradient', label: 'Gradient', className: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white' },
];

const ACCENT_COLORS = [
  { id: '#3b82f6', label: 'Blue' },
  { id: '#10b981', label: 'Green' },
  { id: '#f59e0b', label: 'Amber' },
  { id: '#ef4444', label: 'Red' },
  { id: '#8b5cf6', label: 'Purple' },
  { id: '#ec4899', label: 'Pink' },
  { id: '#06b6d4', label: 'Cyan' },
  { id: '#f97316', label: 'Orange' },
];

const FONT_FAMILIES = [
  { id: 'sans', label: 'Sans Serif', className: 'font-sans' },
  { id: 'serif', label: 'Serif', className: 'font-serif' },
  { id: 'mono', label: 'Monospace', className: 'font-mono' },
];

export function AppearancePage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const userId = user?.itemId || '';

  const { data, isLoading } = useGetProfileByUserId(userId);
  const existingProfile = data?.getUserProfiles?.items?.[0];
  const updateProfile = useUpdateProfile();

  const [selectedTheme, setSelectedTheme] = useState('minimal');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [fontFamily, setFontFamily] = useState('sans');

  useEffect(() => {
    if (existingProfile?.theme_preference) {
      setSelectedTheme(existingProfile.theme_preference);
    }
    if (existingProfile?.accent_color) {
      setAccentColor(existingProfile.accent_color);
    }
    if (existingProfile?.font_family) {
      setFontFamily(existingProfile.font_family);
    }
  }, [existingProfile]);

  const handleSave = () => {
    if (!existingProfile) return;
    updateProfile.mutate({
      filter: existingProfile.ItemId,
      input: {
        theme_preference: selectedTheme,
        accent_color: accentColor,
        font_family: fontFamily,
      },
    });
  };

  const themeStyles: Record<string, string> = {
    minimal: 'bg-white text-gray-900',
    bold: 'bg-gradient-to-br from-blue-600 to-purple-600 text-white',
    dark: 'bg-gray-900 text-gray-100',
    gradient: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white',
  };

  const isDark = selectedTheme === 'dark' || selectedTheme === 'bold' || selectedTheme === 'gradient';
  const selectedFont = FONT_FAMILIES.find((f) => f.id === fontFamily)?.className || 'font-sans';

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-40" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('APPEARANCE')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Theme Selector */}
        <div className="space-y-6">
          {/* Theme */}
          <div>
            <Label className="text-lg font-semibold mb-4 block">{t('SELECT_THEME')}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`relative p-6 rounded-xl text-left transition-all ${theme.className} ${
                    selectedTheme === theme.id
                      ? 'ring-4 ring-offset-2 ring-blue-500 scale-[1.02]'
                      : 'hover:scale-[1.01] opacity-90 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">{theme.label}</span>
                    {selectedTheme === theme.id && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm mt-2 opacity-80">
                    {t(`${theme.id.toUpperCase()}_THEME_DESC`) || `${theme.label} theme for your profile`}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <Label className="text-lg font-semibold mb-4 block">{t('ACCENT_COLOR')}</Label>
            <div className="flex flex-wrap gap-3 items-center">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setAccentColor(color.id)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    accentColor === color.id
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
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-10 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                  title={t('CUSTOM_COLOR') || 'Custom color'}
                />
                <span className="text-sm text-gray-500">{accentColor}</span>
              </div>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <Label className="text-lg font-semibold mb-4 block">{t('FONT_FAMILY')}</Label>
            <div className="grid grid-cols-3 gap-3">
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.id}
                  onClick={() => setFontFamily(font.id)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    fontFamily === font.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Type className="w-5 h-5 mx-auto mb-1" />
                  <span className={`text-sm ${font.className}`}>{font.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending || !existingProfile}
            >
              {updateProfile.isPending ? t('SAVING') : t('SAVE_THEME')}
            </Button>
          </div>
        </div>

        {/* Live Preview */}
        <div>
          <Label className="text-lg font-semibold mb-4 block">{t('LIVE_PREVIEW')}</Label>
          <div className="border rounded-xl overflow-hidden shadow-sm">
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
              className={`${themeStyles[selectedTheme] || themeStyles.minimal} ${selectedFont} transition-colors`}
            >
              <div className="h-24 w-full relative overflow-hidden">
                {existingProfile?.header_image_url ? (
                  <img src={existingProfile.header_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
                )}
              </div>

              <div className="px-4 pb-4 relative">
                <div className="flex items-end gap-3 -mt-8 mb-3">
                  <div
                    className="w-16 h-16 rounded-full border-4 border-white bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md"
                    style={{ borderColor: accentColor }}
                  >
                    {existingProfile?.profile_image_url ? (
                      <img src={existingProfile.profile_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="pb-1">
                    <h2 className="text-lg font-bold leading-tight">
                      {existingProfile?.display_name || t('YOUR_NAME')}
                    </h2>
                    {existingProfile?.headline && (
                      <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-600'}`}>
                        {existingProfile.headline}
                      </p>
                    )}
                  </div>
                </div>

                {existingProfile?.bio_text && (
                  <p className={`text-sm mb-3 line-clamp-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {existingProfile.bio_text}
                  </p>
                )}

                {existingProfile?.social_links && existingProfile.social_links.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {existingProfile.social_links.slice(0, 3).map((link, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Globe className="w-3 h-3" />
                        {link.platform}
                      </span>
                    ))}
                    {existingProfile.social_links.length > 3 && (
                      <span className={`text-xs px-2 py-1 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                        +{existingProfile.social_links.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
