import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getAllPosts } from '@/lib/blog';
import { BlogPost } from '@/types/blog';
import Reveal from '@/components/motion/Reveal';
import BlogImage from '@/components/blog/BlogImage';

const readingTime = (content: string) =>
  Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

/** `text` is the post body with Markdown already stripped. */
const excerpt = (text: string, max = 180) =>
  text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const Meta = ({ post }: { post: BlogPost }) => (
  <p className="meta flex items-center gap-2 text-ink/70">
    <time dateTime={post.created_at}>{fmtDate(post.created_at)}</time>
    <span aria-hidden>·</span>
    <span className="tnum">{readingTime(post.text)} min read</span>
  </p>
);

/**
 * Image-led. The lead post runs wide with its excerpt; the rest fall into a
 * grid. Previously every post was an identical text row, so a single article
 * looked like an empty list rather than a featured piece.
 */
/** Latest posts shown on the homepage: one lead + a grid of up to three. */
const HOME_POST_COUNT = 4;

export default function BlogPreview() {
  const posts: BlogPost[] = getAllPosts().slice(0, HOME_POST_COUNT);

  if (posts.length === 0) return null;

  const [lead, ...rest] = posts;

  return (
    <section id="insights" className="section-y bg-surface">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <p className="section-label text-growth">Insights &amp; Expertise</p>
            <h2 className="h2 mt-4 max-w-xl text-forest">
              Perspectives on wealth, planning and markets
            </h2>
          </Reveal>

          <Reveal>
            <Link
              href="/blog"
              className="group/all meta inline-flex items-center gap-2 border-b border-ink/25 pb-1 text-ink/65 transition-colors duration-150 hover:border-growth hover:text-growth"
            >
              View all insights
              <ArrowRight
                size={14}
                className="transition-transform duration-150 group-hover/all:translate-x-0.5"
              />
            </Link>
          </Reveal>
        </div>

        {/* Lead article */}
        <Reveal as="article" className="team-card mt-14 block">
          <Link href={`/blog/${lead.id}`} className="group grid gap-x-14 gap-y-7 md:grid-cols-12">
            {lead.images?.[0] && (
              <div className="team-frame overflow-hidden bg-canvas md:col-span-7">
                <BlogImage
                  src={lead.images[0]}
                  alt=""
                  className="team-photo aspect-[16/10] w-full object-cover"
                  sizes="(min-width: 768px) 58vw, 100vw"
                />
              </div>
            )}

            <div
              className={`team-meta self-center ${lead.images?.[0] ? 'md:col-span-5' : 'md:col-span-8'
                }`}
            >
              <Meta post={lead} />
              <h3 className="h3 mt-4 text-forest transition-colors duration-150 group-hover:text-growth">
                {lead.title}
              </h3>
              <p className="prose-sm-x mt-4 text-ink/65">{excerpt(lead.text)}</p>
              <span className="meta mt-5 inline-flex items-center gap-2 text-growth">
                Read insight
                <ArrowRight
                  size={14}
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </Link>
        </Reveal>

        {rest.length > 0 && (
          <ul className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, i) => (
              <Reveal key={post.id} as="li" delay={i * 80} className="block">
                <Link href={`/blog/${post.id}`} className="group block">
                  {post.images?.[0] && (
                    <div className="mb-5 overflow-hidden bg-canvas">
                      <BlogImage
                        src={post.images[0]}
                        alt=""
                        className="aspect-[16/10] w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-[1.03]"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      />
                    </div>
                  )}
                  <div className="border-t border-forest/25 pt-5">
                    <Meta post={post} />
                    <h3 className="h4 mt-3 text-forest transition-colors duration-150 group-hover:text-growth">
                      {post.title}
                    </h3>
                    <p className="prose-sm-x mt-2.5 text-ink/60">{excerpt(post.text, 110)}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
