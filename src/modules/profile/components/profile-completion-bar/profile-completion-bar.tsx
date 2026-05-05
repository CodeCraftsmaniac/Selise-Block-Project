import { useTranslation } from 'react-i18next';
import { UserProfile } from '../../types/profile.types';
import { CheckCircle2, Circle } from 'lucide-react';

interface ProfileCompletionBarProps {
  profile: UserProfile;
}

export function ProfileCompletionBar({ profile }: ProfileCompletionBarProps) {
  const { t } = useTranslation();

  const checks = [
    { label: t('DISPLAY_NAME'), done: !!profile.display_name },
    { label: t('USERNAME'), done: !!profile.username },
    { label: t('HEADLINE'), done: !!profile.headline },
    { label: t('BIO'), done: !!profile.bio_text && profile.bio_text.length > 20 },
    { label: t('PROFILE_IMAGE'), done: !!profile.profile_image_url },
    { label: t('HEADER_IMAGE'), done: !!profile.header_image_url },
    { label: t('SOCIAL_LINKS'), done: (profile.social_links?.length || 0) > 0 },
    { label: t('THEME'), done: !!profile.theme_preference },
  ];

  const completed = checks.filter((c) => c.done).length;
  const percent = Math.round((completed / checks.length) * 100);

  return (
    <div className="bg-white border rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{t('PROFILE_COMPLETION')}</h3>
        <span className="text-sm font-medium text-blue-600">{percent}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-2 text-sm">
            {check.done ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-gray-300 shrink-0" />
            )}
            <span className={check.done ? 'text-gray-700' : 'text-gray-400'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
