import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui-kit/button';
import { Globe, Palette, Share2, Sparkles, User, ArrowRight } from 'lucide-react';

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

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

      {/* Footer */}
      <div className="border-t py-8 text-center text-gray-500 text-sm">
        <p>
          {t('BUILT_WITH')}{' '}
          <a href="https://seliseblocks.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            SELISE Blocks
          </a>
        </p>
      </div>
    </div>
  );
}
