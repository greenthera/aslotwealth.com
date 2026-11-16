/**
 * Prefix for root-relative URLs that Next.js does not rewrite by itself
 * (metadata icon paths, plain <img>/<a> in Markdown, unoptimised images).
 *
 * Empty for normal builds and custom domains, so output is unchanged there.
 * "/<repo>" only for a GitHub Pages build served at <user>.github.io/<repo>/.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const withBasePath = (url: string) =>
  BASE_PATH && url.startsWith('/') && !url.startsWith('//') ? `${BASE_PATH}${url}` : url;
