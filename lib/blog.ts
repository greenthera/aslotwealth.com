import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import type { BlogPost } from '@/types/blog';
import { markdownToHtml, markdownToText } from '@/lib/markdown';

/**
 * Each blog post is a folder in /content/blog. The folder name is the slug:
 *
 *   content/blog/<slug>/README.md      →  /blog/<slug>
 *   content/blog/<slug>/image1.png     →  /blog/<slug>/image1.png
 *
 * README.md starts with a front-matter block:
 *
 *   ---
 *   title: Why Starting a SIP Early Beats Timing the Market
 *   date: 2026-11-14
 *   images:
 *     - image1.png        ← cover (first) + gallery (rest), relative to the folder
 *   draft: false
 *   ---
 *
 * In the body, use the same relative names: ![Chart](image2.png). Images can be
 * used as often as you like. scripts/sync-blog-assets.mjs copies them to
 * /public/blog/<slug>/ so the site can serve them.
 *
 * Folders starting with "_" or "." (e.g. _template) are never published.
 */
export const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

/** Accepted names for a post's Markdown file (case-insensitive). */
const POST_FILES = ['readme.md', 'index.md'];

type FrontMatter = Record<string, string | string[] | boolean>;

const unquote = (v: string) => {
  const t = v.trim();
  return /^(['"]).*\1$/.test(t) ? t.slice(1, -1) : t;
};

const parseValue = (raw: string): string | string[] | boolean => {
  const v = raw.trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v.startsWith('[') && v.endsWith(']')) {
    return v
      .slice(1, -1)
      .split(',')
      .map(unquote)
      .filter(Boolean);
  }
  return unquote(v);
};

/** Minimal YAML front-matter parser: `key: value`, inline [a, b] and `- item` lists. */
function parseFrontMatter(file: string): { data: FrontMatter; body: string } {
  const match = file.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: file };

  const data: FrontMatter = {};
  let listKey: string | null = null;

  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      (data[listKey] as string[]).push(unquote(item[1]));
      continue;
    }

    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    if (value.trim() === '') {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = parseValue(value);
      listKey = null;
    }
  }

  return { data, body: match[2] };
}

const toIso = (value: unknown, fallback: Date) => {
  const d = typeof value === 'string' && value ? new Date(value) : fallback;
  return Number.isNaN(d.getTime()) ? fallback.toISOString() : d.toISOString();
};

/**
 * "image1.png" / "./img/a.png" → "/blog/<slug>/image1.png".
 * Absolute URLs ("https://…") and site paths ("/…") are left as written.
 */
export const postAssetUrl = (slug: string, src: string) => {
  const s = src.trim();
  if (/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(s)) return s;
  const clean = path.posix.normalize(s.replace(/^\.\//, ''));
  if (clean.startsWith('..')) return '#'; // never point outside the post folder
  return `/blog/${slug}/${clean.split('/').map(encodeURIComponent).join('/')}`;
};

/** The post's Markdown file inside its folder, or null if it has none. */
function findPostFile(dir: string): string | null {
  const name = fs.readdirSync(dir).find((f) => POST_FILES.includes(f.toLowerCase()));
  return name ? path.join(dir, name) : null;
}

function readPost(slug: string, file: string): BlogPost {
  const raw = fs.readFileSync(file, 'utf8');
  const { data, body } = parseFrontMatter(raw);
  const stat = fs.statSync(file);

  const rawImages = Array.isArray(data.images)
    ? data.images
    : typeof data.images === 'string' && data.images
      ? [data.images]
      : [];

  const created = toIso(data.date, stat.mtime);
  const content = body.trim();

  const redirectFrom = (Array.isArray(data.redirect_from)
    ? data.redirect_from
    : typeof data.redirect_from === 'string' && data.redirect_from
      ? [data.redirect_from]
      : []
  )
    .map((s) => s.trim().replace(/^\/?blog\//, '').replace(/^\/|\/$/g, ''))
    .filter(Boolean);

  return {
    id: slug,
    title: typeof data.title === 'string' ? data.title : slug,
    content,
    text: markdownToText(content),
    html: markdownToHtml(content, { resolveRelative: (src) => postAssetUrl(slug, src) }),
    images: rawImages.map((src) => postAssetUrl(slug, src)),
    active: data.draft !== true,
    redirectFrom,
    created_at: created,
    updated_at: toIso(data.updated, new Date(created)),
  };
}

/** Post folders: content/blog/<slug>/ that contain a README.md (not "_" or "."). */
export function listPostFolders(): { slug: string; dir: string; file: string }[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
    .map((d) => {
      const dir = path.join(BLOG_DIR, d.name);
      return { slug: d.name, dir, file: findPostFile(dir) };
    })
    .filter((p): p is { slug: string; dir: string; file: string } => p.file !== null);
}

/** All published posts, newest first. Cached per request/build. */
export const getAllPosts = cache((): BlogPost[] =>
  listPostFolders()
    .map(({ slug, file }) => readPost(slug, file))
    .filter((p) => p.active)
    .sort((a, b) => b.created_at.localeCompare(a.created_at)),
);

export const getPost = (slug: string): BlogPost | undefined =>
  getAllPosts().find((p) => p.id === slug);

/**
 * Old slug → current slug, from each post's `redirect_from`. Lets a post be
 * renamed without breaking links that were already shared or indexed.
 * A real post folder always wins over a redirect with the same name.
 */
export const getRedirects = (): Map<string, string> => {
  const posts = getAllPosts();
  const live = new Set(posts.map((p) => p.id));
  const map = new Map<string, string>();
  for (const p of posts) {
    for (const from of p.redirectFrom) if (!live.has(from)) map.set(from, p.id);
  }
  return map;
};
