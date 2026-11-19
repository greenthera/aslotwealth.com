#!/usr/bin/env bash
#
# Builds a static copy of the site and force-pushes it to the `gh-pages`
# branch of the target repo. In GitHub: Settings → Pages → "Deploy from a
# branch" → gh-pages / (root). No GitHub Actions involved.
#
# Usage:  npm run deploy
#         (or)  bash scripts/deploy-gh-pages.sh <repo-git-url>
#         DRY_RUN=1 npm run deploy   → build only, no push (prints output folder)
#         DEPLOY_MESSAGE="Add new blog post" npm run deploy   → custom commit message
#
# - Builds from your current files (including uncommitted changes).
# - Builds in a temporary folder: your ./.next, a running `npm run dev`,
#   and your own branches are never touched.
# - Only the gh-pages branch of the target repo is (re)written.
#
set -euo pipefail

REPO_URL="${1:?Usage: deploy-gh-pages.sh <repo-git-url>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
BUILD="$TMP/site"
trap 'rm -rf "$TMP"' EXIT

# Served from <user>.github.io/<repo>/ unless a custom domain (public/CNAME)
# is set, or the repo itself is <user>.github.io.
REPO_NAME="$(basename "$REPO_URL" .git)"
if [[ -f "$ROOT/public/CNAME" || "$REPO_NAME" == *.github.io ]]; then
  BASE_PATH=""
else
  BASE_PATH="/$REPO_NAME"
fi

echo "▸ Target repo : $REPO_URL (branch gh-pages)"
echo "▸ Base path   : ${BASE_PATH:-/ (root)}"

echo "▸ Copying project to a temporary build folder…"
mkdir -p "$BUILD"
rsync -a --exclude node_modules --exclude .next --exclude .git --exclude out \
  --exclude '.env*' "$ROOT/" "$BUILD/"
ln -s "$ROOT/node_modules" "$BUILD/node_modules"

# Static hosting cannot run server code:
#  - API routes (e.g. /api/linkedin-activity) are left out of this build.
#  - The OG image is rendered once at build time instead of on the edge.
rm -rf "$BUILD/app/api"
sed -i.bak "s/^export const runtime = 'edge';/export const dynamic = 'force-static';/" \
  "$BUILD/app/opengraph-image.tsx" && rm -f "$BUILD/app/opengraph-image.tsx.bak"

echo "▸ Copying blog images (content/blog/<slug>/ → public/blog/<slug>/)…"
node "$ROOT/scripts/sync-blog-assets.mjs" "$BUILD"

echo "▸ Optimising images (no image server on GitHub Pages)…"
node "$ROOT/scripts/optimize-images-for-export.mjs" "$BUILD"

echo "▸ Building static site…"
(cd "$BUILD" && GITHUB_PAGES=true NEXT_PUBLIC_BASE_PATH="$BASE_PATH" npx next build)

OUT="$BUILD/out"
# Without this, GitHub's Jekyll step drops the _next/ folder (CSS/JS).
touch "$OUT/.nojekyll"

# Renamed posts (redirect_from): replace the JS-only redirect Next exports
# with a real static redirect page (works without JS and for link previews).
echo "▸ Writing redirects for renamed blog posts…"
node "$ROOT/scripts/write-static-redirects.mjs" "$BUILD" "$OUT" "$BASE_PATH"

# GitHub Pages picks the Content-Type from the file extension. The exported
# link-preview image has none ("opengraph-image"), so WhatsApp/Facebook may not
# treat it as an image. Give it ".png" and point the og/twitter tags at it.
if [[ -f "$OUT/opengraph-image" ]]; then
  mv "$OUT/opengraph-image" "$OUT/opengraph-image.png"
  find "$OUT" -type f \( -name '*.html' -o -name '*.txt' \) -print0 \
    | xargs -0 sed -i.bak 's#/opengraph-image?#/opengraph-image.png?#g'
  find "$OUT" -name '*.bak' -delete
fi

if [[ "${DRY_RUN:-}" == "1" ]]; then
  trap - EXIT
  echo "✓ Dry run: built but NOT pushed. Output: $OUT"
  exit 0
fi

echo "▸ Publishing to gh-pages…"
cd "$OUT"
git init -q -b gh-pages
git add -A
# Commit message shown on the gh-pages branch. Default "Updated";
# custom: DEPLOY_MESSAGE="Add new blog post" npm run deploy
git -c user.name="$(git -C "$ROOT" config user.name || echo deploy)" \
    -c user.email="$(git -C "$ROOT" config user.email || echo deploy@localhost)" \
    commit -q -m "${DEPLOY_MESSAGE:-Updated}"
git push -f "$REPO_URL" gh-pages

echo ""
echo "✓ Deployed to the gh-pages branch."
if [[ -f "$OUT/CNAME" ]]; then
  echo "  URL: https://$(tr -d '[:space:]' < "$OUT/CNAME")/  (live 1–2 minutes after the push)"
elif [[ -n "$BASE_PATH" ]]; then
  OWNER="$(echo "$REPO_URL" | sed -E 's#.*github\.com[:/]([^/]+)/.*#\1#')"
  echo "  URL (after enabling Pages): https://${OWNER}.github.io${BASE_PATH}/"
fi
