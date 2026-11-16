import type { NextConfig } from "next";

/**
 * GitHub Pages build (scripts/deploy-gh-pages.sh sets these env vars).
 * A normal `npm run build` / `npm run dev` is unaffected.
 *  - output: "export"  -> plain static HTML in ./out (Pages cannot run a server)
 *  - basePath          -> "/<repo>" when served from <user>.github.io/<repo>/,
 *                         "" when a custom domain (public/CNAME) is used
 *  - trailingSlash     -> /blog/ is blog/index.html, which Pages serves reliably
 *  - images.unoptimized-> no image server on Pages; the deploy script
 *                         pre-optimises the image files instead
 */
const isPages = process.env.GITHUB_PAGES === "true";
const basePath = isPages ? process.env.NEXT_PUBLIC_BASE_PATH || "" : "";

const nextConfig: NextConfig = {
  ...(isPages && { output: "export", trailingSlash: true, basePath }),
  // Do not advertise the framework in response headers.
  poweredByHeader: false,
  images: {
    // GitHub Pages has no image server (see above).
    unoptimized: isPages,
    // Serve modern formats: AVIF first, WebP as fallback. Both are far smaller than PNG/JPG.
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75],
    // Optimised images are cached for a year; source files are versioned by Next.js.
    minimumCacheTTL: 31536000,
    // Remote hosts blog images may come from (see components/blog/BlogImage.tsx).
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
};

export default nextConfig;
