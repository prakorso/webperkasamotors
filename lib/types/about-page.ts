/**
 * CMS content for the public /about ("Tentang Kami") page — backed by the
 * `about_page_sections` table (see
 * supabase/migrations/20260912020000_about_page_sections.sql for why this
 * is a dedicated table rather than reusing `content`, `articles`, or
 * website_settings columns).
 *
 * One row per named section. `sectionKey` is the stable identifier the
 * public page and admin form key off of — "hero" and "story" ship today;
 * additional sections (Team, History, Standards, Closing CTA, ...) are
 * just more rows with a new key, no schema change required.
 */
export interface AboutPageSection {
  id: string;
  sectionKey: string;
  eyebrow: string | null;
  headline: string | null;
  /** Plain text — rendered as paragraphs on blank lines, same convention as articles.content (see components/public/article-content.tsx). */
  body: string | null;
  sortOrder: number;
  isActive: boolean;
}
