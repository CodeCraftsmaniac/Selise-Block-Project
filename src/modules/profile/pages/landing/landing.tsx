import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui-kit/button';
import { Globe, Palette, Share2, Sparkles, User, ArrowRight, Loader2 } from 'lucide-react';
import { usePublicPublishedProfiles } from '../../hooks/use-public-profile';

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: profiles, isLoading } = usePublicPublishedProfiles();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          {t('POWERED_BY_SELISE_BLOCKS')}
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
          {t('HERO_TITLE')}
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          {t('HERO_SUBTITLE')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/signup')}>
            {t('CREATE_YOUR_PROFILE')}
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
            {t('SIGN_IN')}
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Palette className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('FEATURE_CUSTOMIZE_TITLE')}</h3>
            <p className="text-gray-600">{t('FEATURE_CUSTOMIZE_DESC')}</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('FEATURE_PUBLISH_TITLE')}</h3>
            <p className="text-gray-600">{t('FEATURE_PUBLISH_DESC')}</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Share2 className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('FEATURE_SHARE_TITLE')}</h3>
            <p className="text-gray-600">{t('FEATURE_SHARE_DESC')}</p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{t('HOW_IT_WORKS')}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '1', title: t('STEP_1_TITLE'), desc: t('STEP_1_DESC'), icon: <User className="w-6 h-6 text-white" /> },
            { step: '2', title: t('STEP_2_TITLE'), desc: t('STEP_2_DESC'), icon: <Palette className="w-6 h-6 text-white" /> },
            { step: '3', title: t('STEP_3_TITLE'), desc: t('STEP_3_DESC'), icon: <Globe className="w-6 h-6 text-white" /> },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                {item.icon}
              </div>
              <span className="text-sm font-bold text-blue-600 uppercase tracking-wide">{t('STEP')} {item.step}</span>
              <h3 className="text-lg font-semibold text-gray-900 mt-1 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Example Profile Preview */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('EXAMPLE_PROFILE_TITLE')}</h2>
            <p className="text-gray-600 mb-6">{t('EXAMPLE_PROFILE_DESC')}</p>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
            >
              {t('BROWSE_ALL_PROFILES')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mock profile card */}
          <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-500" />
            <div className="p-5 relative">
              <div className="w-20 h-20 rounded-full border-4 border-white bg-gray-200 overflow-hidden absolute -top-10 left-5 flex items-center justify-center">
                <User className="w-10 h-10 text-gray-400" />
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-bold">Alex Rivera</h3>
                <p className="text-gray-500 text-sm">@alexrivera · Full-Stack Developer</p>
                <p className="text-gray-600 mt-3 text-sm">
                  Building digital experiences with React, Node.js, and cloud platforms. Open source
                  contributor and tech speaker.
                </p>
                <div className="flex gap-2 mt-4">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                    GitHub
                  </span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                    LinkedIn
                  </span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                    Portfolio
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Profiles */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t('RECENT_PROFILES')}</h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : profiles?.getUserProfiles?.items && profiles.getUserProfiles.items.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.getUserProfiles.items.slice(0, 6).map((profile) => (
              <Link
                key={profile.ItemId}
                to={`/u/${profile.username}`}
                className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="h-24 bg-gray-200 relative overflow-hidden">
                  {profile.header_image_url ? (
                    <img src={profile.header_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-400" />
                  )}
                </div>
                <div className="p-4 relative">
                  <div className="w-14 h-14 rounded-full bg-gray-200 border-2 border-white absolute -top-7 left-4 overflow-hidden flex items-center justify-center">
                    {profile.profile_image_url ? (
                      <img src={profile.profile_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-gray-500">
                        {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div className="mt-8">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {profile.display_name}
                    </h3>
                    <p className="text-sm text-gray-500">@{profile.username}</p>
                    {profile.headline && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{profile.headline}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>{t('NO_PROFILES_YET')}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">{t('PLATFORM')}</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link to="/browse" className="hover:text-blue-600 transition-colors">
                    {t('BROWSE_PROFILES')}
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-blue-600 transition-colors">
                    {t('CREATE_PROFILE')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">{t('RESOURCES')}</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="https://docs.seliseblocks.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                    {t('DOCUMENTATION')}
                  </a>
                </li>
                <li>
                  <a href="https://github.com/SELISEdigitalplatforms/blocks-construct-react" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                    {t('CONSTRUCT_REPO')}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">{t('BUILT_WITH')}</h3>
              <p className="text-sm text-gray-600">
                {t('POWERED_BY')}{' '}
                <a href="https://seliseblocks.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  SELISE Blocks
                </a>
              </p>
            </div>
          </div>
          <div className="border-t pt-6 text-center text-sm text-gray-500">
            <p> {t('COPYRIGHT')} — {t('UNIVERSAL_PROFILE_ENGINE')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
