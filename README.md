# Aslot Wealth

A modern wealth management website built with Next.js, with a Markdown-powered blog.

## Features

- **Blog**: posts are Markdown files in `content/blog/`, pre-rendered to static pages
- **No database or login needed**: everything is built at build time
- **Responsive Design**: built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Content**: Markdown files (no CMS, no database)
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

No environment variables are required.

## Writing a blog post

1. Copy `content/blog/_template.md` to a new file, e.g. `content/blog/my-new-post.md`.
   The file name becomes the URL: `/blog/my-new-post`.
2. Fill in the front matter at the top:
   ```md
   ---
   title: My New Post
   date: 2026-11-16
   images:
     - /blog/my-cover.jpg
   draft: false
   ---
   ```
   - `images`: the first image is the cover, any others appear in a gallery.
     Put local images in `public/blog/` and reference them as `/blog/<file>`.
   - `draft: true` hides the post.
3. Write the post in Markdown below the front matter: `##` headings, `**bold**`,
   `*italic*`, `[links](url)`, `- lists`, `1. lists`, `> quotes`, `![images](url)`.
4. With `npm run dev` running, refresh the page to see it. For the live site, rebuild
   and redeploy. Posts are sorted newest first, by `date`.

Files whose name starts with `_` are never published.

## Production build

```bash
npm run build
npm start
```
