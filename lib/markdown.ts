/**
 * Small, dependency-free Markdown → HTML renderer for blog posts.
 *
 * Supported:
 *   ## / ### headings (a single # is rendered as h2 — the page title is the h1)
 *   paragraphs, line breaks, --- horizontal rules
 *   - / * bullet lists, 1. numbered lists
 *   > blockquotes
 *   ``` fenced code blocks
 *   **bold**, *italic*, `inline code`, [links](url), ![images](url)
 *
 * All text is HTML-escaped, so raw HTML in a post is shown as text, not run.
 */

import { withBasePath } from '@/lib/basePath';

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export type MarkdownOptions = {
  /**
   * Turns a relative path written in the post ("image1.png", "./charts/a.png")
   * into a site URL ("/blog/<slug>/image1.png"). Without it, relative paths
   * are dropped.
   */
  resolveRelative?: (path: string) => string;
};

/**
 * Only allow safe targets (no javascript: etc.):
 *   https://…, mailto:, tel:, #anchor → as written
 *   /site/path                        → + base path
 *   image1.png, ./img/a.png           → resolved next to the post (+ base path)
 */
const safeUrl = (url: string, opts: MarkdownOptions) => {
  const u = url.trim();
  if (/^(https?:\/\/|mailto:|tel:|#)/i.test(u)) return u;
  if (u.startsWith('/')) return withBasePath(u);
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return '#'; // any other scheme is unsafe
  return opts.resolveRelative ? withBasePath(opts.resolveRelative(u)) : '#';
};

function inline(text: string, opts: MarkdownOptions): string {
  // Pull out inline code first so its contents are not formatted.
  const codes: string[] = [];
  let s = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code>${escapeHtml(c)}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });

  s = escapeHtml(s);

  // Images before links, since ![alt](src) contains [alt](src).
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) =>
    `<img src="${safeUrl(src, opts)}" alt="${alt}" loading="lazy" decoding="async" />`
  );
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const url = safeUrl(href, opts);
    const external = /^https?:\/\//i.test(url);
    return `<a href="${url}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
  });

  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>');

  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)]);
}

export function markdownToHtml(md: string, opts: MarkdownOptions = {}): string {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;

  const isBlockStart = (l: string) =>
    /^(#{1,6}\s|```|>\s?|[-*]\s+|\d+\.\s+|-{3,}\s*$)/.test(l);

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Fenced code block
    if (line.startsWith('```')) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++; // closing fence
      out.push(`<pre><code>${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }

    // Heading (# → h2, ## → h2, ### → h3, #### + → h4)
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = Math.min(Math.max(h[1].length, 2), 4);
      out.push(`<h${level}>${inline(h[2].trim(), opts)}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^-{3,}\s*$/.test(line)) {
      out.push('<hr />');
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${markdownToHtml(buf.join('\n'), opts)}</blockquote>`);
      continue;
    }

    // Lists
    const ordered = /^\d+\.\s+/.test(line);
    if (ordered || /^[-*]\s+/.test(line)) {
      const re = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(re, '').trim(), opts)}</li>`);
        i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.join('')}</${tag}>`);
      continue;
    }

    // Paragraph: consecutive non-empty lines that don't start another block.
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      buf.push(inline(lines[i].trim(), opts));
      i++;
    }
    out.push(`<p>${buf.join('<br />')}</p>`);
  }

  return out.join('\n');
}

/** Plain text version of markdown, for excerpts and reading time. */
export function markdownToText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^([-*]|\d+\.)\s+/gm, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
