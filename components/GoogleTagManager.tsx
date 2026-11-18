import Script from 'next/script';

/**
 * Google Tag Manager. Tags, triggers and GA4 are managed in the GTM dashboard
 * (tagmanager.google.com), not in this code.
 *
 * - Loads only in production builds (`npm run build` / `npm run deploy`), so
 *   local `npm run dev` visits don't pollute analytics.
 * - "afterInteractive" loads GTM right after the page becomes interactive:
 *   page speed stays high and no early page views are lost.
 * - Page changes inside the site happen without a full reload, so in GTM use
 *   a "History Change" trigger (or GA4's enhanced measurement) to count them.
 */
export const GTM_ID = 'GTM-W37XP4NK';
const enabled = process.env.NODE_ENV === 'production';

/** Goes in <head> (via the root layout). */
export function GoogleTagManagerScript() {
  if (!enabled) return null;
  return (
    <Script id="gtm" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}

/** Goes first inside <body>: tracking for visitors with JavaScript turned off. */
export function GoogleTagManagerNoScript() {
  if (!enabled) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        title="Google Tag Manager"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}
