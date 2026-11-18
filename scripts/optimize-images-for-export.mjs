/**
 * Shrinks images for the GitHub Pages build.
 *
 * Pages has no image server, so next/image serves files as-is there. This
 * resizes + recompresses them in place — run it ONLY on the throwaway build
 * copy made by scripts/deploy-gh-pages.sh, never on the real project.
 *
 * Usage: node scripts/optimize-images-for-export.mjs <project-copy-dir>
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const dir = process.argv[2];
if (!dir || !fs.existsSync(path.join(dir, 'package.json'))) {
  console.error('Pass the build-copy directory.');
  process.exit(1);
}
const sharp = createRequire(path.join(dir, 'package.json'))('sharp');

// [file, max width in px]. Widths cover the largest on-screen size at 2x.
const JOBS = [
  ['assets/teams/Ishan Aslot.jpg', 840],
  ['assets/teams/Pragnesh Aslot.jpg', 840],
  ['assets/teams/Seema Aslot.jpg', 840],
  ['assets/images/logo.png', 360],
  ['assets/images/footer_logo.png', 360],
];

// Blog images (copied from content/blog/<slug>/ by sync-blog-assets.mjs).
// 1600px covers the widest blog image (~1200px column) on high-DPI screens.
const walk = (d) =>
  fs.existsSync(d)
    ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)],
      )
    : [];
for (const file of walk(path.join(dir, 'public', 'blog'))) {
  if (/\.(png|jpe?g|webp)$/i.test(file)) JOBS.push([path.relative(dir, file), 1600]);
}

for (const [rel, width] of JOBS) {
  const file = path.join(dir, rel);
  if (!fs.existsSync(file)) continue;
  const before = fs.statSync(file).size;
  const img = sharp(fs.readFileSync(file)).resize({ width, withoutEnlargement: true });
  const ext = path.extname(rel).toLowerCase();
  const out =
    ext === '.png'
      ? await img.png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer()
      : ext === '.webp'
        ? await img.webp({ quality: 75 }).toBuffer()
        : await img.jpeg({ quality: 72, mozjpeg: true }).toBuffer();
  if (out.length < before) fs.writeFileSync(file, out);
  console.log(`  ${rel}: ${Math.round(before / 1024)} KB -> ${Math.round(Math.min(out.length, before) / 1024)} KB`);
}
