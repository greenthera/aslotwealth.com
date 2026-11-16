import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import type { BlogPost } from '@/types/blog';
import { markdownToHtml, markdownToText } from '@/lib/markdown';

/**
 * Blog posts live as Markdown files in /content/blog.
 *
 *   content/blog/<slug>.md   →   /blog/<slug>
 *
 * Each file starts with a front-matter block:
 *
 *   ---
 *   title: Why Starting a SIP Early Beats Timing the Market
 *   date: 2026-11-14
 *   images:
 *     - /blog/sip-cover.jpg
 *   draft: false
 *   ---
 *
 * Files starting with "_" (e.g. _template.md) are ignored.
 */
const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

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

function readPost(fileName: string): BlogPost {
  const fullPath = path.join(BLOG_DIR, fileName);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const { data, body } = parseFrontMatter(raw);
  const stat = fs.statSync(fullPath);

  const images = Array.isArray(data.images)
    ? data.images
    : typeof data.images === 'string' && data.images
      ? [data.images]
      : [];

  const created = toIso(data.date, stat.mtime);
  const content = body.trim();

  return {
    id: fileName.replace(/\.md$/, ''),
    title: typeof data.title === 'string' ? data.title : fileName.replace(/\.md$/, ''),
    content,
    text: markdownToText(content),
    html: markdownToHtml(content),
    images,
    active: data.draft !== true,
    created_at: created,
    updated_at: toIso(data.updated, new Date(created)),
  };
}

/** All published posts, newest first. Cached per request/build. */
export const getAllPosts = cache((): BlogPost[] => {
  if (!fs.existsSync(BLOG_DIR)) return [];

  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map(readPost)
    .filter((p) => p.active)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
});

export const getPost = (slug: string): BlogPost | undefined =>
  getAllPosts().find((p) => p.id === slug);
