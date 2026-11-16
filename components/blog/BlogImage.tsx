import Image from 'next/image';

/**
 * Blog image that is resized + converted to AVIF/WebP by Next.js.
 *
 * Works for local images (`/blog/cover.jpg` in /public) and the remote hosts
 * allowed in next.config.ts → images.remotePatterns. Any other remote URL falls
 * back to a plain lazy <img>, so a post never breaks because of its image host.
 */
const OPTIMIZABLE = /^(\/(?!\/)|https:\/\/(fastly\.)?picsum\.photos\/)/;

type Props = {
  src: string;
  alt: string;
  className?: string;
  /** Rendered width of the image on screen — keeps the download small. */
  sizes: string;
  /** Above-the-fold image (the page's LCP): load first, no lazy-loading. */
  priority?: boolean;
};

export default function BlogImage({ src, alt, className, sizes, priority = false }: Props) {
  if (!OPTIMIZABLE.test(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      // Intrinsic size only sets the aspect hint; CSS classes control layout.
      width={1200}
      height={750}
      sizes={sizes}
      priority={priority}
      quality={70}
    />
  );
}
