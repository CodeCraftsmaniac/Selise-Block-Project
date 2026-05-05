import { Loader2, Eye, BarChart3, FileText, User, Palette, Layers, ExternalLink } from 'lucide-react';
import {
  DashboardHeader,
  DashboardOverview,
  DashboardUserPlatform,
  DashboardUserActivityGraph,
  DashboardSystemOverview,
} from '@/modules/dashboard';
import { useGetAccount } from '@/modules/profile/hooks/use-account';
import { useGetProfileByUserId } from '@/modules/profile/hooks/use-profile';
import { useGetSectionsByUserId } from '@/modules/profile/hooks/use-profile';
import { useAuthStore } from '@/state/store/auth';

const DashboardLoader = () => {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
};

export const DashboardPage = () => {
  const { isLoading } = useGetAccount();
  const user = useAuthStore((state) => state.user);
  const userId = user?.itemId || '';
  const { data: profileData } = useGetProfileByUserId(userId);
  const { data: sectionsData } = useGetSectionsByUserId(userId);
  const profile = profileData?.getUserProfiles?.items?.[0];
  const sections = sectionsData?.getUserCustomSections?.items || [];

  const profileViews = profile?.view_count || 0;
  const sectionCount = sections.length;
  const completionScore = [
    !!profile?.display_name,
    !!profile?.username,
    !!profile?.headline,
    !!profile?.bio_text,
    !!profile?.profile_image_url,
    (profile?.social_links?.length || 0) > 0,
    !!profile?.theme_preference,
  ].filter(Boolean).length;
  const completionPercent = Math.round((completionScore / 7) * 100);

  return (
    <>
      {isLoading ? (
        <DashboardLoader />
      ) : (
        <main className="flex w-full flex-col" role="main" aria-label="Dashboard Content">
          <DashboardHeader />
          <div className="flex flex-col gap-4">
            {/* Profile Stats */}
            {profile && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Eye className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Profile Views</p>
                      <p className="text-2xl font-bold">{profileViews}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Completion</p>
                      <p className="text-2xl font-bold">{completionPercent}%</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sections</p>
                      <p className="text-2xl font-bold">{sectionCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {profile && (
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Edit Profile', icon: <User className="w-5 h-5" />, href: '/profile/editor', color: 'bg-blue-100 text-blue-600' },
                    { label: 'Appearance', icon: <Palette className="w-5 h-5" />, href: '/profile/appearance', color: 'bg-purple-100 text-purple-600' },
                    { label: 'Sections', icon: <Layers className="w-5 h-5" />, href: '/profile/sections', color: 'bg-green-100 text-green-600' },
                    { label: 'Preview', icon: <ExternalLink className="w-5 h-5" />, href: `/u/${profile.username}`, color: 'bg-orange-100 text-orange-600', external: true },
                  ].map((action) => (
                    <a
                      key={action.href}
                      href={action.href}
                      target={action.external ? '_blank' : undefined}
                      rel={action.external ? 'noopener noreferrer' : undefined}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
                        {action.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{action.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <DashboardOverview />
            <div className="flex flex-col md:flex-row gap-4">
              <DashboardUserPlatform />
              <DashboardUserActivityGraph />
            </div>
            <DashboardSystemOverview />
          </div>
        </main>
      )}
    </>
  );
};
