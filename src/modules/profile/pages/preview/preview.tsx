import { useAuthStore } from '@/state/store/auth';
import { useGetProfileByUserId } from '../../hooks/use-profile';
import { usePublishProfile, useUnpublishProfile } from '../../hooks/use-profile';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui-kit/button';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { ExternalLink, Globe, Eye, EyeOff, QrCode, BarChart3, Printer, Clock, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { ShareProfileModal } from '../../components/share-profile-modal/share-profile-modal';

function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function PreviewPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const userId = user?.itemId || '';

  const { data, isLoading } = useGetProfileByUserId(userId);
  const profile = data?.getUserProfiles?.items?.[0];

  const publishProfile = usePublishProfile();
  const unpublishProfile = useUnpublishProfile();

  const publicUrl = profile?.username ? `/u/${profile.username}` : '';

  const handlePublishToggle = () => {
    if (!profile) return;
    if (profile.is_published) {
      unpublishProfile.mutate(profile.ItemId);
    } else {
      publishProfile.mutate(profile.ItemId);
    }
  };

  const handleCopyLink = () => {
    if (publicUrl) {
      const fullUrl = `${window.location.origin}${publicUrl}`;
      navigator.clipboard.writeText(fullUrl);
    }
  };

  const handlePrintProfile = () => {
    window.open(`${window.location.origin}${publicUrl}?print=1`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('PROFILE_PREVIEW')}</h1>
          {profile?.updated_at && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {t('LAST_UPDATED')}: {formatRelativeTime(profile.updated_at)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {profile?.is_published && (
            <>
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('COPY_LINK')}
              </Button>
              <ShareProfileModal
                username={profile.username}
                displayName={profile.display_name}
              />
              <Button variant="outline" size="sm" onClick={handlePrintProfile}>
                <Printer className="w-4 h-4 mr-2" />
                {t('PRINT')}
              </Button>
            </>
          )}
          {profile?.is_published && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600">
              <BarChart3 className="w-4 h-4" />
              <span>{profile.view_count || 0} {t('VIEWS')}</span>
            </div>
          )}
          <Button
            variant={profile?.is_published ? 'outline' : 'default'}
            size="sm"
            onClick={handlePublishToggle}
            disabled={publishProfile.isPending || unpublishProfile.isPending}
          >
            {profile?.is_published ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                {t('UNPUBLISH')}
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                {t('PUBLISH')}
              </>
            )}
          </Button>
        </div>
      </div>

      {!profile && (
        <div className="text-center py-12 text-gray-500">
          <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">{t('NO_PROFILE_YET')}</p>
          <p className="text-sm mt-1">{t('CREATE_PROFILE_FIRST')}</p>
        </div>
      )}

      {profile && (
        <>
          <div className="border rounded-xl overflow-hidden">
            <div className="bg-gray-100 p-4 border-b flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-sm text-gray-500 ml-2">{t('LIVE_PREVIEW')}</span>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-400">
                  {profile.profile_image_url ? (
                    <img
                      src={profile.profile_image_url}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    profile.display_name?.charAt(0)?.toUpperCase() || '?'
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{profile.display_name}</h2>
                  {profile.headline && <p className="text-gray-600">{profile.headline}</p>}
                </div>
              </div>

              {profile.bio_text && (
                <div className="mb-4">
                  <h3 className="font-semibold text-sm text-gray-500 uppercase mb-1">{t('ABOUT')}</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.bio_text}</p>
                </div>
              )}

              {profile.social_links && profile.social_links.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 uppercase mb-2">{t('CONNECT')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.social_links.map((link, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                      >
                        {link.platform}: {link.label || link.url}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {profile.is_published && publicUrl && (
            <div className="border rounded-xl p-6 mt-6 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold">{t('QR_CODE')}</h3>
              </div>
              <div className="flex items-center gap-6">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    `${window.location.origin}${publicUrl}`
                  )}`}
                  alt="QR Code"
                  className="w-36 h-36 rounded-lg border"
                />
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900 mb-1">{t('SCAN_TO_VISIT')}</p>
                  <p className="text-xs">{t('QR_CODE_DESC')}</p>
                  <p className="mt-2 text-xs text-gray-400 break-all">
                    {`${window.location.origin}${publicUrl}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Getting Started Checklist */}
          {profile && !profile.is_published && (
            <div className="border rounded-xl p-6 mt-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                {t('GETTING_STARTED')}
              </h3>
              <div className="space-y-2">
                {[
                  { label: t('ADD_DISPLAY_NAME'), done: !!profile.display_name },
                  { label: t('ADD_USERNAME'), done: !!profile.username },
                  { label: t('ADD_HEADLINE'), done: !!profile.headline },
                  { label: t('ADD_BIO'), done: !!profile.bio_text },
                  { label: t('ADD_PROFILE_IMAGE'), done: !!profile.profile_image_url },
                  { label: t('ADD_SOCIAL_LINKS'), done: (profile.social_links?.length || 0) > 0 },
                  { label: t('CUSTOMIZE_APPEARANCE'), done: !!profile.theme_preference },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    {item.done ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    <span className={item.done ? 'text-green-800 line-through' : 'text-blue-800'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
