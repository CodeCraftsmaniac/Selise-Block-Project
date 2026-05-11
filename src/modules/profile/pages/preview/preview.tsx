import { useGetMyProfile, useGetMySections } from '../../hooks/use-profile';
import { usePublishProfile, useUnpublishProfile } from '../../hooks/use-profile';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { Button } from '@/components/ui-kit/button';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { ThemeProvider } from '@/styles/theme/theme-provider';
import type { ThemeOverrides } from '@/styles/theme/theme-provider';
import {
  ExternalLink,
  Globe,
  Github,
  Linkedin,
  Youtube,
  Mail,
  Eye,
  EyeOff,
  QrCode,
  BarChart3,
  Printer,
  Clock,
  Download,
  CheckCircle2,
  Circle,
  ArrowRight,
} from 'lucide-react';
import { ShareProfileModal } from '../../components/share-profile-modal/share-profile-modal';
import type { SocialLink, UserCustomSection } from '../../types/profile.types';

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

// Mirror of the platform icon map used by `PublicProfilePage` so the preview
// renders an identical visual for each social link.
const platformIcons: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-5 h-5" />,
  github: <Github className="w-5 h-5" />,
  portfolio: <Globe className="w-5 h-5" />,
  twitter: <ExternalLink className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  email: <Mail className="w-5 h-5" />,
  instagram: <ExternalLink className="w-5 h-5" />,
  facebook: <ExternalLink className="w-5 h-5" />,
  tiktok: <ExternalLink className="w-5 h-5" />,
  discord: <ExternalLink className="w-5 h-5" />,
  telegram: <ExternalLink className="w-5 h-5" />,
  whatsapp: <ExternalLink className="w-5 h-5" />,
  medium: <ExternalLink className="w-5 h-5" />,
  'dev.to': <ExternalLink className="w-5 h-5" />,
  behance: <ExternalLink className="w-5 h-5" />,
  dribbble: <ExternalLink className="w-5 h-5" />,
  twitch: <ExternalLink className="w-5 h-5" />,
  spotify: <ExternalLink className="w-5 h-5" />,
};

/**
 * PreviewPage
 *
 * Live preview of the authenticated user's profile (design §Algorithmic
 * Pseudocode — `renderPublicProfile`). The inner preview tree mirrors the
 * same hero / bio / social links / custom sections layout rendered by
 * `PublicProfilePage`, wrapped in a `<ThemeProvider overrides={...}>` so
 * the `theme_preference`, `accent_color`, and `font_family` overrides from
 * the authenticated profile apply exactly the way they do on `/u/:username`.
 *
 * Key differences from the public route:
 * - Data is sourced from the authenticated GraphQL client via
 *   `useGetMyProfile` / `useGetMySections`. No public client is used.
 * - Unpublished profiles still render so the owner can preview before going
 *   live (no redirect to `NotFoundPage`).
 * - Dashboard-only polish (copy link, share modal, QR card, publish toggle,
 *   export JSON, getting-started checklist) surrounds the preview tree.
 */
export function PreviewPage() {
  const { t } = useTranslation();

  const { data, isLoading } = useGetMyProfile();
  const profile = data?.getUserProfiles?.items?.[0];

  const { data: sectionsData } = useGetMySections();
  const sections: UserCustomSection[] = sectionsData?.getUserCustomSections?.items ?? [];

  const publishProfile = usePublishProfile();
  const unpublishProfile = useUnpublishProfile();

  const publicUrl = profile?.username ? `/u/${profile.username}` : '';

  const handlePublishToggle = () => {
    if (!profile) return;
    // Service contract: filter is a stringified Mongo-style filter. Matches
    // design §Key GraphQL Operations (publish/unpublish).
    const filter = JSON.stringify({ ItemId: profile.ItemId });
    if (profile.is_published) {
      unpublishProfile.mutate(filter);
    } else {
      publishProfile.mutate(filter);
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

  const handleDownloadJSON = () => {
    if (!profile) return;
    const payload = {
      display_name: profile.display_name,
      username: profile.username,
      headline: profile.headline,
      bio_text: profile.bio_text,
      social_links: profile.social_links,
      theme_preference: profile.theme_preference,
      accent_color: profile.accent_color,
      font_family: profile.font_family,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.username || 'profile'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-64" />
      </div>
    );
  }

  // Derive render-only theme values with the same defaults used by
  // `PublicProfilePage`. The ThemeProvider overrides wrapper applies the
  // `theme-*` / `font-*` classes to `<html>` so CSS contracts in
  // globals.css take effect; these local Tailwind classes continue to
  // provide a visual fallback for the Tailwind-only surface area.
  const theme = profile?.theme_preference || 'minimal';
  const accentColor = profile?.accent_color || '#3b82f6';
  const fontFamily = profile?.font_family || 'sans';

  const themeStyles: Record<string, string> = {
    minimal: 'bg-white text-gray-900',
    bold: 'bg-gradient-to-br from-blue-600 to-purple-600 text-white',
    dark: 'bg-gray-900 text-gray-100',
    gradient: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white',
  };

  const isDark = theme === 'dark' || theme === 'bold' || theme === 'gradient';
  const fontClass =
    fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';

  // Narrow the string-typed profile fields to the ThemeProvider enum contract.
  const themeOverrides: ThemeOverrides | undefined = profile
    ? {
        theme_preference: profile.theme_preference as ThemeOverrides['theme_preference'],
        accent_color: profile.accent_color,
        font_family: profile.font_family as ThemeOverrides['font_family'],
      }
    : undefined;

  // Defense-in-depth filter on visibility, sorted ascending by section_order.
  // Matches `PublicProfilePage` so the preview is a true mirror.
  const visibleSections = [...sections]
    .filter((s) => s.is_visible !== false)
    .sort((a, b) => (a.section_order || 0) - (b.section_order || 0));

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
              <Button variant="outline" size="sm" onClick={handleDownloadJSON}>
                <Download className="w-4 h-4 mr-2" />
                {t('EXPORT_JSON')}
              </Button>
            </>
          )}
          {profile?.is_published && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600">
              <BarChart3 className="w-4 h-4" />
              <span>
                {profile.view_count || 0} {t('VIEWS')}
              </span>
            </div>
          )}
          {profile && (
            <Button
              variant={profile.is_published ? 'outline' : 'default'}
              size="sm"
              onClick={handlePublishToggle}
              disabled={publishProfile.isPending || unpublishProfile.isPending}
            >
              {profile.is_published ? (
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
          )}
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

            {/*
              Owner preview wraps the same markup used on /u/:username inside
              a <ThemeProvider overrides={...}> so classes and --accent are
              applied to <html> exactly as they would be on the public route.
              Overrides are scoped: unmount restores the prior class list.
            */}
            <ThemeProvider overrides={themeOverrides}>
              <div className={`${themeStyles[theme] || themeStyles.minimal} ${fontClass}`}>
                {/* Header image */}
                <div className="w-full h-48 md:h-64 overflow-hidden relative">
                  {profile.header_image_url ? (
                    <img
                      src={profile.header_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
                  )}
                </div>

                <div className="px-6 pb-8">
                  {/* Profile hero */}
                  <div className="relative -mt-16 mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
                      <div
                        className="w-28 h-28 rounded-full border-4 bg-gray-200 overflow-hidden flex-shrink-0 shadow-lg"
                        style={{ borderColor: accentColor }}
                      >
                        {profile.profile_image_url ? (
                          <img
                            src={profile.profile_image_url}
                            alt={profile.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                            {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 pt-2 md:pt-0">
                        <h2 className="text-2xl md:text-3xl font-bold">
                          {profile.display_name}
                        </h2>
                        {profile.headline && (
                          <p
                            className={`text-base mt-1 ${
                              isDark ? 'text-gray-200' : 'text-gray-600'
                            }`}
                          >
                            {profile.headline}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* About / bio — rendered through react-markdown + rehype-sanitize
                      (design §Security Considerations — XSS in bio/sections). */}
                  {profile.bio_text && (
                    <div className={`mb-6 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                      <h3 className="font-semibold text-sm uppercase mb-2 opacity-80">
                        {t('ABOUT')}
                      </h3>
                      <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:my-2 dark:prose-invert">
                        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                          {profile.bio_text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Social links */}
                  {profile.social_links && profile.social_links.length > 0 && (
                    <div className="mb-6">
                      <h3
                        className={`text-base font-semibold mb-3 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {t('CONNECT')}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.social_links.map((link: SocialLink, index: number) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-white text-sm"
                            style={{ backgroundColor: accentColor }}
                          >
                            {platformIcons[link.platform.toLowerCase()] || (
                              <Globe className="w-4 h-4" />
                            )}
                            <span>{link.label || link.platform}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom sections — section_content is Markdown, sanitized. */}
                  {visibleSections.length > 0 && (
                    <div className="space-y-6">
                      {visibleSections.map((section) => (
                        <div key={section.ItemId}>
                          <h3
                            className={`text-lg font-semibold mb-2 ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}
                          >
                            {section.section_title || section.section_type}
                          </h3>
                          {section.section_content && (
                            <div
                              className={`prose prose-sm max-w-none prose-p:my-2 prose-headings:my-2 ${
                                isDark ? 'prose-invert text-gray-200' : 'text-gray-700'
                              }`}
                            >
                              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                                {section.section_content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ThemeProvider>
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

          {/* Getting Started Checklist — shown only before first publish. */}
          {!profile.is_published && (
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
                  {
                    label: t('ADD_SOCIAL_LINKS'),
                    done: (profile.social_links?.length || 0) > 0,
                  },
                  { label: t('CUSTOMIZE_APPEARANCE'), done: !!profile.theme_preference },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    {item.done ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    <span
                      className={item.done ? 'text-green-800 line-through' : 'text-blue-800'}
                    >
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
