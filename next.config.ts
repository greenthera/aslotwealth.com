import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do not advertise the framework in response headers.
  poweredByHeader: false,
  images: {
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
