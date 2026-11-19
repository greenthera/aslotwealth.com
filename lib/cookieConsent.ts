import * as CookieConsent from 'vanilla-cookieconsent';
import { BASE_PATH } from '@/lib/basePath';
import { EMAIL } from '@/lib/site';

/**
 * Cookie consent (same standard as our other sites: vanilla-cookieconsent,
 * Google Consent Mode, nothing tracked before "Accept").
 *
 * GTM-W37XP4NK holds GA4 and Microsoft Clarity, so GTM itself is only loaded
 * once the visitor allows Analytics; until then no request goes to Google
 * Tag Manager, Google Analytics or Clarity.
 */
const GTM_ID = 'GTM-W37XP4NK';

/** Local `npm run dev` never loads GTM, so testing doesn't pollute analytics. */
const TRACKING_ENABLED = process.env.NODE_ENV === 'production';

let initialization: Promise<void> | undefined;
let trackingLoaded = false;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function syncConsent() {
  const analytics = CookieConsent.acceptedCategory('analytics');
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      // Google reads gtag queue entries as Arguments objects.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
  window.gtag('consent', 'update', {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  // Basic consent mode: no GTM request until analytics is allowed.
  if (analytics && !trackingLoaded && TRACKING_ENABLED) {
    trackingLoaded = true;
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
    document.head.appendChild(script);
  }
  window.dataLayer.push({ event: 'cookie_consent_updated', analytics_consent: analytics, marketing_consent: false });
  window.dispatchEvent(new Event('cookie-preferences-updated'));
}

const link = (path: string, label: string) => `<a href="${BASE_PATH}${path}" class="cc__link">${label}</a>`;

export function initCookieConsent() {
  if (!initialization)
    initialization = CookieConsent.run({
      root: document.getElementById('cookie-consent-root'),
      // Tracking is managed explicitly above, not by scanning React-owned scripts.
      manageScriptTags: false,
      revision: 1,
      cookie: { name: 'cc_cookie', expiresAfterDays: 182, path: BASE_PATH || '/' },
      guiOptions: {
        consentModal: { layout: 'box inline', position: 'bottom right', equalWeightButtons: true },
        preferencesModal: { layout: 'box', equalWeightButtons: true },
      },
      categories: {
        necessary: { enabled: true, readOnly: true },
        analytics: {
          // Google Analytics (_ga, _gid, _gat) and Microsoft Clarity (_clck, _clsk).
          autoClear: {
            cookies: [{ name: /^_ga/ }, { name: '_gid' }, { name: /^_gat/ }, { name: '_clck' }, { name: '_clsk' }],
          },
        },
      },
      onConsent: syncConsent,
      onChange: ({ changedCategories }) => {
        syncConsent();
        // Unload already-running vendor scripts when tracking permission is withdrawn.
        if (
          trackingLoaded &&
          changedCategories.some((category) => category === 'analytics' && !CookieConsent.acceptedCategory(category))
        )
          window.location.reload();
      },
      language: {
        default: 'en',
        translations: {
          en: {
            consentModal: {
              title: 'Your privacy, your choice',
              description: `We remember your cookie choices and show an embedded map in our contact section. With your permission, we use analytics to understand how our website is used. Read our ${link('/privacy-policy', 'Privacy Policy')} and ${link('/cookie-policy', 'Cookie Policy')}.`,
              acceptAllBtn: 'Accept',
              acceptNecessaryBtn: 'Decline',
              showPreferencesBtn: 'Cookie settings',
            },
            preferencesModal: {
              title: 'Cookie preferences',
              acceptAllBtn: 'Accept all',
              acceptNecessaryBtn: 'Reject all',
              savePreferencesBtn: 'Save preferences',
              closeIconLabel: 'Close preferences',
              sections: [
                {
                  title: 'You are in control',
                  description:
                    'Optional categories are off until you allow them. Change or withdraw your choices at any time using Cookie settings in the footer.',
                },
                {
                  title: 'Strictly necessary',
                  description:
                    'Always enabled: remembers your cookie preferences for 182 days and includes the map in our contact section. The embedded map connects to Google Maps, which may use its own cookies.',
                  linkedCategory: 'necessary',
                },
                {
                  title: 'Analytics',
                  description:
                    'Google Analytics and Microsoft Clarity help us understand how visitors use our website, such as pages visited and how they are used, so we can improve it.',
                  linkedCategory: 'analytics',
                },
                {
                  title: 'More information',
                  description: `Read our ${link('/cookie-policy', 'Cookie Policy')} or email <a href="mailto:${EMAIL}" class="cc__link">${EMAIL}</a>.`,
                },
              ],
            },
          },
        },
      },
    });
  return initialization;
}

export async function showCookiePreferences() {
  await initCookieConsent();
  CookieConsent.showPreferences();
}
