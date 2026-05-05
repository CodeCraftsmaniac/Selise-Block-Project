import { Link } from 'react-router-dom';
import { usePublicPublishedProfiles } from '../../hooks/use-public-profile';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { BackToTop } from '@/components/core/back-to-top/back-to-top';
import { Search, User, Globe } from 'lucide-react';
import { useState } from 'react';
import { UserProfile } from '../../types/profile.types';

export function BrowsePage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading } = usePublicPublishedProfiles(1, 50);
  const profiles = data?.getUserProfiles?.items || [];

  const filtered = profiles.filter((p: UserProfile) => {
    const term = searchTerm.toLowerCase();
    return (
      p.display_name?.toLowerCase().includes(term) ||
      p.username?.toLowerCase().includes(term) ||
      p.headline?.toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="w-64 h-10 mb-6" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('BROWSE_PROFILES')}</h1>
          <p className="text-gray-600">{t('BROWSE_PROFILES_SUBTITLE')}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('SEARCH_PROFILES')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Profile Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <User className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">{t('NO_PROFILES_FOUND')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('TRY_DIFFERENT_SEARCH')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((profile: UserProfile) => (
              <Link
                key={profile.ItemId}
                to={`/u/${profile.username}`}
                className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                {/* Header image strip */}
                <div className="h-24 bg-gray-200 relative overflow-hidden">
                  {profile.header_image_url ? (
                    <img
                      src={profile.header_image_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-100 to-purple-100" />
                  )}
                </div>

                <div className="p-4 relative">
                  {/* Profile pic */}
                  <div className="w-16 h-16 rounded-full border-4 border-white bg-gray-200 overflow-hidden absolute -top-8 left-4 shadow-sm">
                    {profile.profile_image_url ? (
                      <img src={profile.profile_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="mt-8">
                    <h3 className="font-bold text-gray-900 truncate">{profile.display_name}</h3>
                    <p className="text-sm text-gray-500">@{profile.username}</p>
                    {profile.headline && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{profile.headline}</p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-blue-600 text-sm font-medium">
                    <Globe className="w-4 h-4" />
                    {t('VIEW_PROFILE')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <BackToTop />
    </div>
  );
}
