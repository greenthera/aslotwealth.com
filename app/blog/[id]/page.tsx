import { getAllPosts, getPost, getRedirects } from '@/lib/blog';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BlogPost } from '@/types/blog';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ShareButton from '@/components/blog/ShareButton';
import ImageGallery from '@/components/blog/ImageGallery';
import BlogImage from '@/components/blog/BlogImage';
import ReadingProgress from '@/components/blog/ReadingProgress';
import BackToTop from '@/components/BackToTop';
import { DISCLAIMER_MF } from '@/lib/site';

interface BlogPostPageProps {
  params: Promise<{ id: string }>;
}

const readingTime = (content: string) =>
  Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/**
 * Every published post is pre-rendered to static HTML at build time.
 * Unknown slugs and drafts still 404 via notFound() below.
 * (No `dynamicParams = false`: in dev it breaks client-side navigation —
 * clicking a post link fails while a full page load works.)
 */
export function generateStaticParams() {
  return [
    ...getAllPosts().map((post) => ({ id: post.id })),
    // Old slugs (redirect_from) get a page too, which forwards to the new URL.
    ...[...getRedirects().keys()].map((id) => ({ id })),
  ];
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { id } = await params;
  const post = getPost(id);

  if (!post) {
    // Renamed post: send old links to the new URL (permanent, so search
    // engines move the ranking over). Static builds emit a redirect page.
    const target = getRedirects().get(id);
    if (target) permanentRedirect(`/blog/${target}`);
    notFound();
  }

  const related: BlogPost[] = getAllPosts()
    .filter((p) => p.id !== id)
    .slice(0, 3);

  const mins = readingTime(post.text);

  return (
    <>
      <ReadingProgress />
      <Navigation />

      <main id="main">
        <article className="section-y">
          <div className="container-page">
            <div className="mx-auto max-w-3xl">
              <Link
                href="/blog"
                className="meta inline-flex items-center gap-2 text-ink/70 transition-colors duration-150 hover:text-forest"
              >
                <ArrowLeft size={15} />
                All insights
              </Link>

              <p className="meta mt-8 flex items-center gap-2 text-ink/70">
                <time dateTime={post.created_at}>{fmtDate(post.created_at)}</time>
                <span aria-hidden>·</span>
                <span className="tnum">{mins} min read</span>
              </p>

              <h1 className="display mt-4 text-forest">{post.title}</h1>

              <div className="mt-8 border-b border-border pb-8">
                <ShareButton title={post.title} />
              </div>
            </div>
          </div>

          {post.images && post.images.length > 0 && (
            <div className="container-page mt-12">
              <BlogImage
                src={post.images[0]}
                alt={post.title}
                className="aspect-[21/9] w-full bg-surface object-cover"
                sizes="(min-width: 1280px) 1200px, 100vw"
                priority
              />
            </div>
          )}

          <div className="container-page mt-12">
            {/* HTML comes from our own Markdown renderer, which escapes all text. */}
            <div
              className="article mx-auto max-w-3xl"
              dangerouslySetInnerHTML={{ __html: post.html }}
            />

            {post.images && post.images.length > 1 && (
              <div className="mx-auto mt-16 max-w-3xl">
                <h2 className="h3 text-forest">Gallery</h2>
                <div className="mt-6">
                  <ImageGallery
                    images={post.images}
                    title={post.title}
                    thumbnailStartIndex={1}
                  />
                </div>
              </div>
            )}

            {/* COMPLIANCE BLOCK */}
            <div className="mx-auto mt-16 max-w-3xl border-t border-border pt-8">
              <p className="meta text-ink/70">{DISCLAIMER_MF}</p>
              <p className="meta mt-2 text-ink/70">
                Past performance does not guarantee future results. Market-linked debentures
                carry issuer credit risk; capital protection applies only at maturity and is
                subject to the issuer meeting its obligations.
              </p>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="section-y bg-surface">
            <div className="container-page">
              <h2 className="h3 text-forest">Continue reading</h2>

              <ul className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <li key={r.id} className="group border-t border-border pt-6">
                    {r.images && r.images.length > 0 && (
                      <div className="mb-5 overflow-hidden">
                        <BlogImage
                          src={r.images[0]}
                          alt=""
                          className="aspect-[16/10] w-full bg-canvas object-cover transition-transform duration-500 ease-soft group-hover:scale-105"
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        />
                      </div>
                    )}
                    <p className="meta flex items-center gap-2 text-ink/70">
                      <time dateTime={r.created_at}>{fmtDate(r.created_at)}</time>
                      <span aria-hidden>·</span>
                      <span className="tnum">{readingTime(r.text)} min read</span>
                    </p>
                    <h3 className="h4 mt-3">
                      <Link
                        href={`/blog/${r.id}`}
                        className="text-forest transition-colors duration-150 hover:text-growth"
                      >
                        {r.title}
                      </Link>
                    </h3>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <BackToTop />
    </>
  );
}
