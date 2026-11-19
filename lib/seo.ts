import type { Metadata } from 'next';

/**
 * The one primary address of the site: https, no www.
 * Used for metadataBase, canonical tags, og:url, the sitemap and JSON-LD.
 * (robots.txt and public/CNAME hold the same domain as plain text.)
 */
export const SITE_URL = 'https://aslotwealth.com';

/** Site-wide link-preview fields (same values as before, now shared). */
export const OPEN_GRAPH_BASE = {
  title: 'Aslot Wealth Advisor – Personalised Investment Management',
  description:
    'A family wealth practice in Surat since 1989. Goal-aligned portfolios built for the long run. ₹75 crore+ AUM, 250+ clients, 99% retention.',
  type: 'website',
  locale: 'en_IN',
  siteName: 'Aslot Wealth Advisor',
} as const;

export const TWITTER_BASE = {
  card: 'summary_large_image',
  title: 'Aslot Wealth Advisor – Personalised Investment Management',
  description:
    'A family wealth practice in Surat since 1989. Goal-aligned portfolios built for the long run.',
} as const;

/**
 * The link-preview image made by app/opengraph-image.tsx (same alt/size).
 * The "?" matters: the GitHub Pages deploy renames the file to
 * opengraph-image.png and rewrites "/opengraph-image?" links to match.
 */
const PREVIEW_IMAGE = {
  url: '/opengraph-image?v=1',
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: 'Aslot Wealth Advisor — Personalised Investment Management',
};

/** Homepage: canonical + og:url. Its preview image comes from app/opengraph-image.tsx. */
export const homeMetadata: Pick<Metadata, 'alternates' | 'openGraph' | 'twitter'> = {
  alternates: { canonical: '/' },
  openGraph: { ...OPEN_GRAPH_BASE, url: '/' },
  twitter: TWITTER_BASE,
};

/**
 * Canonical + og:url for any other page, so it points at ITSELF
 * (https://aslotwealth.com/<path>/) instead of the homepage.
 *
 * Next.js replaces (does not merge) a parent's `openGraph` / `twitter`, which
 * also drops the inherited preview image, so the shared fields and the image
 * are repeated here. The GitHub Pages trailing slash is added by Next.
 */
export function pageMetadata(path: string): Pick<Metadata, 'alternates' | 'openGraph' | 'twitter'> {
  return {
    alternates: { canonical: path },
    openGraph: { ...OPEN_GRAPH_BASE, url: path, images: [PREVIEW_IMAGE] },
    twitter: { ...TWITTER_BASE, images: [PREVIEW_IMAGE] },
  };
}
