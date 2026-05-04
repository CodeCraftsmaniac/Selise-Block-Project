import { useState, useEffect } from 'react';
import { useAuthStore } from '@/state/store/auth';
import { useGetProfileByUserId, useUpdateProfile } from '../../hooks/use-profile';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui-kit/button';
import { Label } from '@/components/ui-kit/label';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { Check } from 'lucide-react';

const THEMES = [
  { id: 'minimal', label: 'Minimal', className: 'bg-white border-2 border-gray-200' },
  { id: 'bold', label: 'Bold', className: 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' },
  { id: 'dark', label: 'Dark', className: 'bg-gray-900 text-white border-2 border-gray-700' },
  { id: 'gradient', label: 'Gradient', className: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white' },
];

export function AppearancePage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const userId = user?.itemId || '';

  const { data, isLoading } = useGetProfileByUserId(userId);
  const existingProfile = data?.getUserProfiles?.items?.[0];
  const updateProfile = useUpdateProfile();

  const [selectedTheme, setSelectedTheme] = useState('minimal');

  useEffect(() => {
    if (existingProfile?.theme_preference) {
      setSelectedTheme(existingProfile.theme_preference);
    }
  }, [existingProfile]);

  const handleSave = () => {
    if (!existingProfile) return;
    updateProfile.mutate({
      filter: existingProfile.ItemId,
      input: { theme_preference: selectedTheme },
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

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('APPEARANCE')}</h1>

      <div className="space-y-6">
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
                  {t(`${theme.id.toUpperCase()}_THEME_DESC`)}
                </p>
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
    </div>
  );
}
