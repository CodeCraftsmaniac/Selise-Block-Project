import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Globe, Palette, Share2, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui-kit/button';

/**
 * Public marketing home at `/`.
 *
 * Matches `routeModuleMap['/']` → `['common', 'landing']`.
 * Kept deliberately small and dependency-light to respect the landing
 * bundle budget (<400 KB gz, per design §Performance). All visible copy
 * is routed through i18next so the uilm key-mode extension works here too.
 */
export function LandingPage() {
  const { t } = useTranslation(['common', 'landing']);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      {/* Hero */}
      <section
        aria-labelledby="landing-hero-title"
        className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:py-24"
      >
        <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {t('POWERED_BY_SELISE_BLOCKS')}
        </span>

        <h1
          id="landing-hero-title"
          className="mb-4 text-4xl font-bold tracking-tight md:text-6xl"
        >
          {t('HERO_TITLE')}
        </h1>

        <p className="mb-8 max-w-2xl text-lg text-gray-600 md:text-xl">
          {t('HERO_SUBTITLE')}
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link to="/signup">{t('GET_STARTED')}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/browse">{t('BROWSE_PROFILES')}</Link>
          </Button>
        </div>
      </section>

      {/* Value proposition */}
      <section
        aria-labelledby="landing-value-title"
        className="mx-auto max-w-6xl px-4 py-16"
      >
        <h2
          id="landing-value-title"
          className="mb-4 text-center text-3xl font-bold"
        >
          {t('VALUE_PROP_TITLE')}
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-gray-600">
          {t('VALUE_PROP_SUBTITLE')}
        </p>

        <ul
          role="list"
          className="grid gap-8 md:grid-cols-3"
        >
          <li className="rounded-xl border bg-white p-6 shadow-sm">
            <div
              aria-hidden="true"
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100"
            >
              <Palette className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('FEATURE_CUSTOMIZE_TITLE')}
            </h3>
            <p className="text-gray-600">{t('FEATURE_CUSTOMIZE_DESC')}</p>
          </li>

          <li className="rounded-xl border bg-white p-6 shadow-sm">
            <div
              aria-hidden="true"
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100"
            >
              <Globe className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('FEATURE_PUBLISH_TITLE')}
            </h3>
            <p className="text-gray-600">{t('FEATURE_PUBLISH_DESC')}</p>
          </li>

          <li className="rounded-xl border bg-white p-6 shadow-sm">
            <div
              aria-hidden="true"
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100"
            >
              <Share2 className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('FEATURE_SHARE_TITLE')}
            </h3>
            <p className="text-gray-600">{t('FEATURE_SHARE_DESC')}</p>
          </li>
        </ul>
      </section>

      {/* How it works */}
      <section
        aria-labelledby="landing-how-title"
        className="mx-auto max-w-6xl px-4 py-16"
      >
        <h2
          id="landing-how-title"
          className="mb-12 text-center text-3xl font-bold"
        >
          {t('HOW_IT_WORKS')}
        </h2>

        <ol role="list" className="grid gap-8 md:grid-cols-3">
          {[
            { step: '1', icon: User, titleKey: 'STEP_1_TITLE', descKey: 'STEP_1_DESC' },
            { step: '2', icon: Palette, titleKey: 'STEP_2_TITLE', descKey: 'STEP_2_DESC' },
            { step: '3', icon: Globe, titleKey: 'STEP_3_TITLE', descKey: 'STEP_3_DESC' },
          ].map(({ step, icon: Icon, titleKey, descKey }) => (
            <li key={step} className="text-center">
              <div
                aria-hidden="true"
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-lg"
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wide text-blue-600">
                {t('STEP')} {step}
              </span>
              <h3 className="mb-2 mt-1 text-lg font-semibold">{t(titleKey)}</h3>
              <p className="text-sm text-gray-600">{t(descKey)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Secondary CTA */}
      <section
        aria-labelledby="landing-cta-title"
        className="mx-auto max-w-6xl px-4 py-16"
      >
        <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
          <h2
            id="landing-cta-title"
            className="mb-4 text-3xl font-bold"
          >
            {t('CTA_TITLE')}
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-gray-600">{t('CTA_SUBTITLE')}</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link to="/signup">
                {t('GET_STARTED')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/browse">{t('BROWSE_PROFILES')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-gray-500">
          <p>
            {t('POWERED_BY')}{' '}
            <a
              href="https://seliseblocks.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              SELISE Blocks
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
