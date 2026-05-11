import { Link, useSearchParams } from 'react-router-dom';
import { usePublicPublishedProfiles } from '../../hooks/use-public-profile';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { BackToTop } from '@/components/core/back-to-top/back-to-top';
import { Search, User, Globe, Link as LinkIcon, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { UserProfile } from '../../types/profile.types';

const PAGE_SIZE = 12;

export function BrowsePage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('recent');
  const [pageNo, setPageNo] = useState(1);

  const { data, isLoading, isFetching } = usePublicPublishedProfiles(pageNo, PAGE_SIZE);
  const profiles = data?.getUserProfiles?.items || [];
  const totalCount = data?.getUserProfiles?.totalCount ?? 0;

  // Pagination: prefer response-provided hasNextPage/hasPreviousPage when present,
  // otherwise fall back to computed values from totalCount / returned item count.
  const responseAny = data as unknown as {
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  } | undefined;
  const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : pageNo;
  const hasPreviousPage =
    typeof responseAny?.hasPreviousPage === 'boolean' ? responseAny.hasPreviousPage : pageNo > 1;
  const hasNextPage =
    typeof responseAny?.hasNextPage === 'boolean'
      ? responseAny.hasNextPage
      : totalCount > 0
        ? pageNo < totalPages
        : profiles.length === PAGE_SIZE;

  const filtered = profiles
    .filter((p: UserProfile) => {
      const term = searchTerm.toLowerCase();
      return (
        p.display_name?.toLowerCase().includes(term) ||
        p.username?.toLowerCase().includes(term) ||
        p.headline?.toLowerCase().includes(term)
      );
    })
    .sort((a: UserProfile, b: UserProfile) => {
      if (sortBy === 'views') return (b.view_count || 0) - (a.view_count || 0);
      if (sortBy === 'name') return (a.display_name || '').localeCompare(b.display_name || '');
      return 0;
    });

  const goPrev = () => {
    if (hasPreviousPage) setPageNo((p) => Math.max(1, p - 1));
  };
  const goNext = () => {
    if (hasNextPage) setPageNo((p) => p + 1);
  };

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
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('SEARCH_PROFILES')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="recent">{t('SORT_RECENT')}</option>
            <option value="views">{t('SORT_VIEWS')}</option>
            <option value="name">{t('SORT_NAME')}</option>
          </select>
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

                  <div className="mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                      <Globe className="w-4 h-4" />
                      {t('VIEW_PROFILE')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const url = `${window.location.origin}/u/${profile.username}`;
                        navigator.clipboard.writeText(url);
                        setCopiedId(profile.ItemId);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {copiedId === profile.ItemId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-green-500">{t('COPIED')}</span>
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-3.5 h-3.5" />
                          {t('COPY_LINK')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination controls — hide when there is literally nothing to paginate */}
        {(profiles.length > 0 || pageNo > 1) && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={goPrev}
              disabled={!hasPreviousPage || isFetching}
              aria-label={t('PAGINATION_PREVIOUS')}
              className="inline-flex items-center gap-1 px-4 py-2 border rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('PAGINATION_PREVIOUS')}
            </button>
            <span className="text-sm text-gray-600" aria-live="polite">
              {totalCount > 0
                ? t('PAGINATION_PAGE_OF', { page: pageNo, total: totalPages })
                : t('PAGINATION_PAGE', { page: pageNo })}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={!hasNextPage || isFetching}
              aria-label={t('PAGINATION_NEXT')}
              className="inline-flex items-center gap-1 px-4 py-2 border rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('PAGINATION_NEXT')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <BackToTop />
    </div>
  );
}
