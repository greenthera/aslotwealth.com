import fs from 'node:fs';
import path from 'node:path';
import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';

/**
 * /sitemap.xml — rebuilt on every `npm run build` / `npm run deploy`
 * (also in the GitHub Pages static export). Nothing here needs editing when
 * content changes:
 *
 *  - Pages:      every page.tsx under app/ is found automatically
 *                (add app/about/page.tsx → /about is listed on the next build).
 *  - Blog posts: every published folder in content/blog/ (drafts, "_template"
 *                and old redirect_from slugs are left out).
 */
export const dynamic = 'force-static';

/** Canonical domain — same as metadataBase in app/layout.tsx. */
const SITE_URL = 'https://aslotwealth.com';

/**
 * Last content change of pages that are not driven by blog posts.
 * Bump it when you edit the homepage sections or the legal pages.
 */
const PAGES_UPDATED = '2026-09-10';

/** Optional per-page hints; any page not listed gets the default. */
const PAGE_HINTS: Record<string, Pick<MetadataRoute.Sitemap[number], 'changeFrequency' | 'priority'>> = {
  '/': { changeFrequency: 'monthly', priority: 1.0 },
  '/blog': { changeFrequency: 'weekly', priority: 0.8 },
  '/privacy-policy': { changeFrequency: 'yearly', priority: 0.3 },
  '/terms-of-service': { changeFrequency: 'yearly', priority: 0.3 },
  '/disclaimer': { changeFrequency: 'yearly', priority: 0.3 },
  '/regulatory-information': { changeFrequency: 'yearly', priority: 0.3 },
};
const DEFAULT_HINT = { changeFrequency: 'monthly', priority: 0.5 } as const;

/** Pages that list blog posts — their date moves with the newest post. */
const LISTS_POSTS = new Set(['/', '/blog']);

const PAGE_FILE = /^page\.(tsx|ts|jsx|js|mdx)$/;

/**
 * The GitHub Pages build uses trailingSlash (next.config.ts), so /blog is
 * served at /blog/ and /blog answers with a 301. List the exact URL each build
 * serves, so every sitemap entry returns 200 without a redirect.
 */
const TRAILING_SLASH = process.env.GITHUB_PAGES === 'true';
const toUrl = (route: string) =>
  `${SITE_URL}${route === '/' ? '/' : TRAILING_SLASH ? `${route}/` : route}`;

/**
 * Every static page route under app/. Skips:
 *  - api/ and private folders ("_x"), parallel routes ("@x")
 *  - dynamic segments ("[id]") — blog posts are added from content/ instead
 * Route groups ("(marketing)") don't appear in URLs, so they are flattened.
 */
function findPageRoutes(dir: string, route = ''): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const routes = entries.some((e) => e.isFile() && PAGE_FILE.test(e.name)) ? [route || '/'] : [];

  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const name = e.name;
    if (name === 'api' || name.startsWith('_') || name.startsWith('@') || name.startsWith('[')) continue;
    const segment = name.startsWith('(') && name.endsWith(')') ? '' : `/${name}`;
    routes.push(...findPageRoutes(path.join(dir, name), `${route}${segment}`));
  }
  return routes;
}

const latest = (...dates: string[]) =>
  dates.reduce((a, b) => (new Date(b) > new Date(a) ? b : a));

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts(); // published only, newest first
  const newestPost = posts.length ? latest(...posts.map((p) => p.updated_at)) : PAGES_UPDATED;

  const page = (route: string): MetadataRoute.Sitemap[number] => ({
    url: toUrl(route),
    lastModified: new Date(LISTS_POSTS.has(route) ? latest(PAGES_UPDATED, newestPost) : PAGES_UPDATED),
    ...(PAGE_HINTS[route] ?? DEFAULT_HINT),
  });

  const routes = [...new Set(findPageRoutes(path.join(process.cwd(), 'app')))];
  const listing = ['/', '/blog'].filter((r) => routes.includes(r));
  const others = routes.filter((r) => !listing.includes(r)).sort();

  // Order: homepage, /blog, newest posts, then every other page A→Z.
  return [
    ...listing.map(page),
    ...posts.map((post) => ({
      url: toUrl(`/blog/${post.id}`),
      lastModified: new Date(post.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...others.map(page),
  ];
}
