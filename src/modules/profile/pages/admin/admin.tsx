import { Link } from 'react-router-dom';
import { useGetAllPublishedProfiles } from '../../hooks/use-profile';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { User, Globe, Users, BarChart3 } from 'lucide-react';

export function AdminPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useGetAllPublishedProfiles(1, 100);
  const profiles = data?.getUserProfiles?.items || [];
  const totalProfiles = profiles.length;
  const publishedProfiles = profiles.filter((p) => p.is_published).length;
  const totalViews = profiles.reduce((sum, p) => sum + (p.view_count || 0), 0);

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="w-64 h-10" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="w-full h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('ADMIN_DASHBOARD')}</h1>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('TOTAL_PROFILES')}</p>
              <p className="text-2xl font-bold">{totalProfiles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('PUBLISHED_PROFILES')}</p>
              <p className="text-2xl font-bold">{publishedProfiles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('DRAFT_PROFILES')}</p>
              <p className="text-2xl font-bold">{totalProfiles - publishedProfiles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('TOTAL_VIEWS')}</p>
              <p className="text-2xl font-bold">{totalViews}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profiles Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">{t('ALL_PROFILES')}</h2>
        </div>

        {profiles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>{t('NO_PROFILES_YET')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('USER')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('USERNAME')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('HEADLINE')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('VIEWS')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('STATUS')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('THEME')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('ACTIONS')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {profiles.map((profile) => (
                  <tr key={profile.ItemId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
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
                        <span className="font-medium">{profile.display_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">@{profile.username}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {profile.headline || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {profile.view_count || 0}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          profile.is_published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {profile.is_published ? t('PUBLISHED') : t('DRAFT')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{profile.theme_preference}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/u/${profile.username}`}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                      >
                        {t('VIEW')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
