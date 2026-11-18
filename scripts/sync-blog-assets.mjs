/**
 * Copies each blog post's files (images, PDFs, …) from
 *   content/blog/<slug>/image1.png
 * to
 *   public/blog/<slug>/image1.png   →  served at /blog/<slug>/image1.png
 *
 * public/blog/ is GENERATED (git-ignored) and rebuilt from scratch every run,
 * so deleted or renamed images never linger. Edit images in content/blog/ only.
 *
 * Runs automatically before `npm run dev`, `npm run build` and `npm run deploy`.
 * Manually: npm run blog:sync
 *
 * Usage: node scripts/sync-blog-assets.mjs [projectRoot]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const SRC = path.join(root, 'content', 'blog');
const DEST = path.join(root, 'public', 'blog');

fs.rmSync(DEST, { recursive: true, force: true });
if (!fs.existsSync(SRC)) process.exit(0);

let copied = 0;
const copyAssets = (from, to) => {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyAssets(src, dst);
    } else if (!entry.name.toLowerCase().endsWith('.md')) {
      fs.mkdirSync(to, { recursive: true });
      fs.copyFileSync(src, dst);
      copied++;
    }
  }
};

for (const entry of fs.readdirSync(SRC, { withFileTypes: true })) {
  // Same rule as lib/blog.ts: "_template", ".git" etc. are never published.
  if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
  copyAssets(path.join(SRC, entry.name), path.join(DEST, entry.name));
}

console.log(`blog assets: ${copied} file(s) → public/blog/`);
