'use client';

import { useEffect } from 'react';
import { initCookieConsent, showCookiePreferences } from '@/lib/cookieConsent';

/** Shows the consent dialog on a first visit; re-applies a saved choice on later visits. */
export function CookieConsentBanner() {
  useEffect(() => {
    void initCookieConsent();
  }, []);
  return <div id="cookie-consent-root" />;
}

/** Re-opens the cookie preferences (footer, Privacy Policy, Cookie Policy). */
export function CookieSettings({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => void showCookiePreferences()} className={className}>
      Cookie settings
    </button>
  );
}
