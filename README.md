# Aslot Wealth

A modern wealth management website built with Next.js, with a Markdown-powered blog.

## Features

- **Blog**: one folder per post in `content/blog/<slug>/` (README.md + its images), pre-rendered to static pages
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

Every post is a **folder** in `content/blog/`. The folder name is the URL, and the
post's images live right next to its text:

```
content/blog/
  my-new-post/          → /blog/my-new-post
    README.md           ← the post
    image1.png          ← its images (any number, any names)
    chart.jpg
  _template/            ← copy this to start a post ("_" folders are never published)
```

1. Copy the `content/blog/_template/` folder and rename the copy, e.g. `my-new-post`.
   Use lowercase letters, numbers and dashes.
2. Put the post's images in that folder.
3. Edit `README.md`. Refer to images **by file name only**:
   ```md
   ---
   title: My New Post
   date: 2026-11-18
   images:
     - image1.png      # first = cover, the rest = gallery
   draft: false        # true hides the post
   ---

   Text with an image: ![Chart of returns](chart.jpg)

   The same image again, as often as needed: ![Chart](chart.jpg)
   ```
   Also supported: `##` headings, `**bold**`, `*italic*`, `[links](url)`,
   `- lists`, `1. lists`, `> quotes`, and links to files in the folder (`[PDF](report.pdf)`).
4. Run `npm run dev` and open `/blog/my-new-post`. Posts are sorted newest first by `date`.

**Sitemap:** `/sitemap.xml` is rebuilt on every `npm run build` / `npm run deploy`.
It finds every page in `app/` and every published post in `content/blog/`
automatically, so new pages and posts are included with no manual edit.
Drafts, `_template` and old redirected slugs are left out. When you edit an existing
post, add `updated: YYYY-MM-DD` to its front matter so the sitemap shows the
change. (`robots.txt` already points search engines to the sitemap.)

**Renaming a post?** Rename its folder, then list the old name in the front matter
so links that were already shared keep working (they redirect to the new URL):
```md
redirect_from:
  - old-folder-name
```

Images are copied to `public/blog/<slug>/` automatically when you run
`npm run dev`, `npm run build` or `npm run deploy`. That folder is generated and
git-ignored, so always edit images in `content/blog/`. If you add images while
`npm run dev` is already running, run `npm run blog:sync` (or restart dev).

## Production build

```bash
npm run build
npm start
```

## Deploy to GitHub Pages (branch, no Actions)

```bash
npm run deploy             # build + push to the gh-pages branch
DRY_RUN=1 npm run deploy   # build only, nothing pushed
```

This builds a static copy of the site in a temporary folder and force-pushes
it to the `gh-pages` branch of `github.com/greenthera/aslotwealth.com`
(change the URL in `package.json` → `scripts.deploy` to use another repo).

One-time setup in GitHub: **Settings → Pages → Build and deployment →
Source: Deploy from a branch → Branch: `gh-pages` / `(root)` → Save.**

- Without a custom domain the site is served at
  `https://greenthera.github.io/aslotwealth.com/` (the script adds that path prefix automatically).
- To use `www.aslotwealth.com`: create `public/CNAME` containing `www.aslotwealth.com`,
  run `npm run deploy` again, set the domain in Settings → Pages, and point the
  domain's DNS to GitHub Pages. The path prefix is then removed automatically.
- Static hosting cannot run server code, so `app/api/*` routes are not included in this build.
