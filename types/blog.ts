export interface BlogPost {
  /** URL slug — the Markdown file name without ".md". */
  id: string
  title: string
  /** Raw Markdown body. */
  content: string
  /** Plain-text version of the body, for excerpts and reading time. */
  text: string
  /** Rendered HTML body. */
  html: string
  images: string[]
  /** false when the post has `draft: true`. Drafts are never published. */
  active: boolean
  /** Old slugs (`redirect_from` in front matter) that redirect to this post. */
  redirectFrom: string[]
  created_at: string
  updated_at: string
}
