import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { useAuthStore } from '@/state/store/auth';
import { ThemeProvider } from '@/styles/theme/theme-provider';
import type { ThemeOverrides } from '@/styles/theme/theme-provider';
import {
  usePublicProfileByUsername,
  usePublicSectionsByUserId,
} from '../../hooks/use-public-profile';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { NotFoundPage } from '@/modules/error-view';
import { BackToTop } from '@/components/core/back-to-top/back-to-top';
import {
  Globe,
  Github,
  Linkedin,
  Youtube,
  Mail,
  ExternalLink,
  Link as LinkIcon,
  BarChart3,
  User,
  Printer,
  Clock,
} from 'lucide-react';
import { SocialLink, UserCustomSection, UserProfile } from '../../types/profile.types';

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
 * SeoHead
 *
 * Minimal SEO head component — imperatively updates `<title>` and the
 * `description` / `og:*` meta tags already present in `index.html`.
 * Kept inline with the page so it has no side effects outside this route;
 * restores the default document title on unmount.
 */
interface SeoHeadProps {
  title: string;
  description?: string;
  ogImage?: string;
}

function SeoHead({ title, description, ogImage }: SeoHeadProps) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} — Universal Profile Engine`;

    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };

    const desc = description || `${title}'s profile`;
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[property="og:image"]', ogImage || '');

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, ogImage]);

  return null;
}

/**
 * Renders a single profile section's markdown content through
 * `react-markdown` + `rehype-sanitize`. Any HTML tags in the source are
 * stripped by the default rehype-sanitize schema — no `dangerouslySetInnerHTML`
 * is used anywhere in the render path (design §Security Considerations XSS).
 */
interface SafeMarkdownProps {
  children: string;
  className?: string;
}

function SafeMarkdown({ children, className }: SafeMarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{children}</ReactMarkdown>
    </div>
  );
}

function PublicProfileView({
  profile,
  sections,
  isOwner,
  copied,
  onCopyLink,
}: {
  profile: UserProfile;
  sections: UserCustomSection[];
  isOwner: boolean;
  copied: boolean;
  onCopyLink: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const accentColor = profile.accent_color || '#3b82f6';

  // Defense-in-depth: RLS already hides is_visible=false rows, but filter
  // client-side too in case the public client returns any such row.
  const orderedSections = sections
    .filter((s) => s.is_visible === true)
    .sort((a, b) => (a.section_order || 0) - (b.section_order || 0));

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--bg-hero)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-family)',
      }}
    >
      <SeoHead
        title={profile.display_name}
        description={profile.headline || profile.bio_text}
        ogImage={profile.profile_image_url}
      />

      {/* Header Image */}
      <div className="w-full h-64 md:h-80 overflow-hidden relative">
        {profile.header_image_url ? (
          <img
            src={profile.header_image_url}
            alt="Header"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)' }}
          />
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16">
        {/* Profile Info */}
        <div className="relative -mt-20 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            {/* Profile Picture */}
            <div
              className="w-32 h-32 rounded-full border-4 bg-gray-200 overflow-hidden flex-shrink-0 shadow-lg"
              style={{ borderColor: accentColor }}
            >
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                  {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            <div className="flex-1 pt-4 md:pt-0">
              <h1 className="text-3xl md:text-4xl font-bold">{profile.display_name}</h1>
              {profile.headline && (
                <p className="text-lg mt-1 opacity-80">{profile.headline}</p>
              )}
              <div className="flex items-center gap-3 mt-3 flex-wrap print:hidden">
                {isOwner && (
                  <span
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium bg-green-100 text-green-700"
                  >
                    <User className="w-4 h-4" />
                    {t('YOUR_PROFILE')}
                  </span>
                )}
                <button
                  onClick={onCopyLink}
                  className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    copied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-black/5 hover:bg-black/10'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  {copied ? t('COPIED') : t('COPY_LINK')}
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors bg-black/5 hover:bg-black/10"
                >
                  <Printer className="w-4 h-4" />
                  {t('PRINT')}
                </button>
                {profile.social_links?.some((l) => l.platform.toLowerCase() === 'email') && (
                  <a
                    href={`mailto:${profile.social_links.find((l) => l.platform.toLowerCase() === 'email')?.url}`}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors bg-black/5 hover:bg-black/10"
                  >
                    <Mail className="w-4 h-4" />
                    {t('CONTACT_ME')}
                  </a>
                )}
                {profile.view_count !== undefined && profile.view_count > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-black/5">
                    <BarChart3 className="w-4 h-4" />
                    {profile.view_count} {t('VIEWS')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bio — rendered through react-markdown + rehype-sanitize. */}
        {profile.bio_text && (
          <div className="mb-8">
            <SafeMarkdown className="text-base leading-relaxed prose prose-sm max-w-none dark:prose-invert">
              {profile.bio_text}
            </SafeMarkdown>
            <p className="text-xs mt-2 opacity-60">
              {Math.max(
                1,
                Math.ceil(
                  profile.bio_text.trim().split(/\s+/).filter(Boolean).length / 200
                )
              )}{' '}
              {t('MIN_READ')}
            </p>
          </div>
        )}

        {/* Social Links */}
        {profile.social_links && profile.social_links.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('CONNECT')}</h2>
            <div className="flex flex-wrap gap-3">
              {profile.social_links.map((link: SocialLink, index: number) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {platformIcons[link.platform.toLowerCase()] || <Globe className="w-5 h-5" />}
                  <span>{link.label || link.platform}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Custom Sections — section_content rendered through
            react-markdown + rehype-sanitize (design §XSS). */}
        {orderedSections.length > 0 && (
          <div className="space-y-8">
            {orderedSections.map((section: UserCustomSection) => (
              <div key={section.ItemId}>
                <h2 className="text-xl font-semibold mb-3">
                  {section.section_title || section.section_type}
                </h2>
                {section.section_content && (
                  <SafeMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                    {section.section_content}
                  </SafeMarkdown>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Last Updated */}
        {profile.updated_at && (
          <div className="text-center text-xs pt-4 print:hidden opacity-60">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t('LAST_UPDATED')}: {formatRelativeTime(profile.updated_at)}
            </span>
          </div>
        )}
      </div>
      <BackToTop />
    </div>
  );
}

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data, isLoading, error } = usePublicProfileByUsername(username || '');
  const profile = data?.getUserProfiles?.items?.[0];
  const [copied, setCopied] = useState(false);
  const currentUser = useAuthStore((state) => state.user);
  const isOwner = currentUser?.itemId === profile?.user_id;

  const { data: sectionsData } = usePublicSectionsByUserId(profile?.user_id || '');
  const sections: UserCustomSection[] = sectionsData?.getUserCustomSections?.items || [];

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/u/${profile?.username}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Increment view count (once per 24h per browser). RLS may reject the
  // mutation for unauthenticated viewers; failures are silently swallowed.
  useEffect(() => {
    if (!profile) return;
    const viewKey = `viewed_${profile.ItemId}`;
    const lastViewed = localStorage.getItem(viewKey);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (!lastViewed || now - Number(lastViewed) > oneDay) {
      import('../../services/public-profile.service').then(
        ({ incrementPublicProfileViewCount }) => {
          incrementPublicProfileViewCount(profile.ItemId, profile.view_count || 0).catch(
            () => {
              // Silently fail if RLS blocks public mutation
            }
          );
        }
      );
      localStorage.setItem(viewKey, String(now));
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="w-full h-64 rounded-xl mb-8" />
          <Skeleton className="w-32 h-32 rounded-full -mt-16 ml-8 mb-4" />
          <Skeleton className="w-64 h-8 mb-2" />
          <Skeleton className="w-96 h-5 mb-8" />
          <Skeleton className="w-full h-32 mb-4" />
        </div>
      </div>
    );
  }

  // RLS filters unpublished/nonexistent rows to an empty list. An empty
  // items[] OR any error from the public query collapses to a 404.
  if (error || !profile || !profile.is_published) {
    return <NotFoundPage />;
  }

  const overrides: ThemeOverrides = {
    theme_preference: profile.theme_preference as ThemeOverrides['theme_preference'],
    accent_color: profile.accent_color,
    font_family: profile.font_family as ThemeOverrides['font_family'],
  };

  return (
    <ThemeProvider overrides={overrides}>
      <PublicProfileView
        profile={profile}
        sections={sections}
        isOwner={isOwner}
        copied={copied}
        onCopyLink={handleCopyLink}
      />
    </ThemeProvider>
  );
}
