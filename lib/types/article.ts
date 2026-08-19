/**
 * Editorial/SEO website content ("Articles") — see supabase/migrations/
 * 20260821010000_articles_cms.sql. Distinct from SocialContent
 * (lib/types/social-content.ts): Articles are long-form editorial/SEO
 * content written by staff, not Instagram/social posts.
 */

export type ArticleStatus = "DRAFT" | "PUBLISHED";

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  /** Falls back to coverImageUrl when null — see lib/data/articles.ts:resolveOgImageUrl. */
  ogImageUrl: string | null;
  category: string | null;
  tags: string[];
  status: ArticleStatus;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
}
