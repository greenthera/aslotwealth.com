/**
 * GitHub Pages has no server, so it cannot send real redirects. For every
 * post's `redirect_from` slug this writes a tiny static redirect page:
 *
 *   out/blog/<old-slug>/index.html  →  <base>/blog/<new-slug>/
 *
 * It uses <meta http-equiv="refresh"> (works without JS and for link-preview
 * bots), location.replace() as a fallback, a plain link, and noindex so search
 * engines keep only the new URL. Normal builds (`next start`, Vercel) send a
 * real 308 from app/blog/[id]/page.tsx instead and don't need this.
 *
 * Usage: node scripts/write-static-redirects.mjs <projectDir> <outDir> [basePath]
 */
import fs from 'node:fs';
import path from 'node:path';

const [projectDir, outDir, basePath = ''] = process.argv.slice(2);
if (!projectDir || !outDir) {
  console.error('Usage: write-static-redirects.mjs <projectDir> <outDir> [basePath]');
  process.exit(1);
}

const blogDir = path.join(projectDir, 'content', 'blog');
const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** redirect_from values from a README's front matter (inline, [a, b] or "- item" list). */
function redirectFrom(md) {
  const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return [];
  const lines = fm[1].split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^redirect_from:\s*(.*)$/);
    if (!m) continue;
    const inline = m[1].trim();
    if (inline) {
      out.push(...inline.replace(/^\[|\]$/g, '').split(','));
    } else {
      for (let j = i + 1; j < lines.length && /^\s+-\s+/.test(lines[j]); j++) {
        out.push(lines[j].replace(/^\s+-\s+/, ''));
      }
    }
  }
  return out
    .map((s) => s.trim().replace(/^['"]|['"]$/g, '').replace(/^\/?blog\//, '').replace(/^\/|\/$/g, ''))
    .filter((s) => s && !s.includes('..') && !s.includes('/'));
}

if (!fs.existsSync(blogDir)) process.exit(0);
const folders = fs
  .readdirSync(blogDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'));
const live = new Set(folders.map((d) => d.name));

let count = 0;
for (const { name: slug } of folders) {
  const readme = fs
    .readdirSync(path.join(blogDir, slug))
    .find((f) => ['readme.md', 'index.md'].includes(f.toLowerCase()));
  if (!readme) continue;
  const md = fs.readFileSync(path.join(blogDir, slug, readme), 'utf8');
  if (/^draft:\s*true\s*$/m.test(md.split(/\r?\n---/)[0] ?? '')) continue; // drafts aren't published

  for (const from of redirectFrom(md)) {
    if (live.has(from)) continue; // a real post with that name wins
    const target = escapeAttr(`${basePath}/blog/${slug}/`);
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting…</title>
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${target}">
<script>location.replace(${JSON.stringify(`${basePath}/blog/${slug}/`)} + location.search + location.hash);</script>
</head>
<body>
<p>This article has moved: <a href="${target}">${target}</a></p>
</body>
</html>
`;
    const dir = path.join(outDir, 'blog', from);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    count++;
    console.log(`  /blog/${from}/ → ${basePath}/blog/${slug}/`);
  }
}
console.log(`static redirects: ${count}`);
