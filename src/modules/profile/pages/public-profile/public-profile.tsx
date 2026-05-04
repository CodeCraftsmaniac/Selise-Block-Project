import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicProfileByUsername, usePublicSectionsByUserId } from '../../hooks/use-public-profile';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { NotFoundPage } from '@/modules/error-view';
import { Globe, Github, Linkedin, Youtube, Mail, ExternalLink } from 'lucide-react';
import { SocialLink, UserCustomSection } from '../../types/profile.types';

const platformIcons: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-5 h-5" />,
  github: <Github className="w-5 h-5" />,
  portfolio: <Globe className="w-5 h-5" />,
  twitter: <ExternalLink className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  email: <Mail className="w-5 h-5" />,
};

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data, isLoading, error } = usePublicProfileByUsername(username || '');
  const profile = data?.getUserProfiles?.items?.[0];

  const { data: sectionsData } = usePublicSectionsByUserId(profile?.user_id || '');
  const sections = sectionsData?.getUserCustomSections?.items || [];

  useEffect(() => {
    if (profile) {
      document.title = `${profile.display_name} — Universal Profile Engine`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', profile.headline || profile.bio_text || `${profile.display_name}'s profile`);
      }
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', profile.display_name);
      }
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute('content', profile.headline || profile.bio_text || `${profile.display_name}'s profile`);
      }
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        ogImage.setAttribute('content', profile.profile_image_url || '');
      }

      // Increment view count (once per 24h per browser)
      const viewKey = `viewed_${profile.ItemId}`;
      const lastViewed = localStorage.getItem(viewKey);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (!lastViewed || now - Number(lastViewed) > oneDay) {
        import('../../services/public-profile.service').then(({ incrementPublicProfileViewCount }) => {
          incrementPublicProfileViewCount(profile.ItemId, profile.view_count || 0).catch(() => {
            // Silently fail if RLS blocks public mutation
          });
        });
        localStorage.setItem(viewKey, String(now));
      }
    }
    return () => {
      document.title = 'Universal Profile Engine';
    };
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

  if (error || !profile) {
    return <NotFoundPage />;
  }

  if (!profile.is_published) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Public</h1>
          <p className="text-gray-500">This profile has not been published yet.</p>
        </div>
      </div>
    );
  }

  const theme = profile.theme_preference || 'minimal';

  const themeStyles: Record<string, string> = {
    minimal: 'bg-white text-gray-900',
    bold: 'bg-gradient-to-br from-blue-600 to-purple-600 text-white',
    dark: 'bg-gray-900 text-gray-100',
    gradient: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white',
  };

  const isDark = theme === 'dark' || theme === 'bold' || theme === 'gradient';

  return (
    <div className={`min-h-screen ${themeStyles[theme] || themeStyles.minimal}`}>
      {/* Header Image */}
      <div className="w-full h-64 md:h-80 overflow-hidden relative">
        {profile.header_image_url ? (
          <img
            src={profile.header_image_url}
            alt="Header"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16">
        {/* Profile Info */}
        <div className="relative -mt-20 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            {/* Profile Picture */}
            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden flex-shrink-0 shadow-lg">
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
                <p className={`text-lg mt-1 ${isDark ? 'text-gray-200' : 'text-gray-600'}`}>
                  {profile.headline}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio_text && (
          <div className={`mb-8 whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            <p className="text-base leading-relaxed">{profile.bio_text}</p>
          </div>
        )}

        {/* Social Links */}
        {profile.social_links && profile.social_links.length > 0 && (
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Connect
            </h2>
            <div className="flex flex-wrap gap-3">
              {profile.social_links.map((link: SocialLink, index: number) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  {platformIcons[link.platform.toLowerCase()] || <Globe className="w-5 h-5" />}
                  <span>{link.label || link.platform}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Custom Sections */}
        {sections.length > 0 && (
          <div className="space-y-8">
            {sections
              .filter((s: UserCustomSection) => s.is_visible !== false)
              .sort((a: UserCustomSection, b: UserCustomSection) => (a.section_order || 0) - (b.section_order || 0))
              .map((section: UserCustomSection) => (
                <div key={section.ItemId}>
                  <h2
                    className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
                  >
                    {section.section_title || section.section_type}
                  </h2>
                  {section.section_content && (
                    <div
                      className={`whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                    >
                      {section.section_content}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
