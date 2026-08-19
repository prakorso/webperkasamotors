import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Article } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";
import { getStoragePublicUrl } from "@/lib/storage/provider";

/**
 * Article data access — read-only. Mutations (create/update/delete,
 * publish/unpublish) live in lib/actions/articles.ts, same split as
 * lib/data/vehicles.ts / lib/actions/vehicles.ts.
 *
 * getPublishedArticles/getArticleBySlug read via the anon/publishable
 * client — RLS's "public can read published articles" policy
 * (supabase/migrations/20260821010000_articles_cms.sql) is what actually
 * restricts this to status = 'PUBLISHED'. The admin functions read via
 * the session client, exposed to every status through "staff can read
 * all articles".
 */

const ARTICLE_MEDIA_BUCKET = "article-media";
export const ARTICLES_PER_PAGE = 10;

const ARTICLE_COLUMNS =
  "id, slug, title, excerpt, content, cover_image_storage_path, og_image_storage_path, " +
  "category, tags, status, published_at, seo_title, seo_description, created_at, updated_at";

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_storage_path: string | null;
  og_image_storage_path: string | null;
  category: string | null;
  tags: string[];
  status: Article["status"];
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

function resolveImageUrl(supabase: SupabaseClient, path: string | null): string | null {
  return path ? getStoragePublicUrl(supabase, ARTICLE_MEDIA_BUCKET, path) : null;
}

function mapArticleRow(row: ArticleRow, supabase: SupabaseClient): Article {
  const coverImageUrl = resolveImageUrl(supabase, row.cover_image_storage_path);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl,
    // Falls back to the cover image when no dedicated OG image was set —
    // a real, retrievable image beats no image for link-preview cards.
    ogImageUrl: resolveImageUrl(supabase, row.og_image_storage_path) ?? coverImageUrl,
    category: row.category,
    tags: row.tags ?? [],
    status: row.status,
    publishedAt: row.published_at,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface PaginatedArticles {
  articles: Article[];
  totalCount: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/** Public listing — newest published first, paginated the same way the vehicle catalogue is. */
export async function getPublishedArticles(
  page = 1,
  perPage = ARTICLES_PER_PAGE
): Promise<PaginatedArticles> {
  const supabase = getSupabaseServerClient();
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS, { count: "exact" })
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw new Error(`getPublishedArticles: ${error.message}`);
  const totalCount = count ?? 0;
  return {
    articles: (data as unknown as ArticleRow[]).map((row) => mapArticleRow(row, supabase)),
    totalCount,
    page: safePage,
    perPage,
    totalPages: Math.max(1, Math.ceil(totalCount / perPage)),
  };
}

/** Every published article's slug — used by app/sitemap.ts. */
export async function getAllPublishedArticleSlugs(): Promise<string[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("articles").select("slug").eq("status", "PUBLISHED");
  if (error) throw new Error(`getAllPublishedArticleSlugs: ${error.message}`);
  return (data as unknown as { slug: string }[]).map((r) => r.slug);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`getArticleBySlug: ${error.message}`);
  return data ? mapArticleRow(data as unknown as ArticleRow, supabase) : null;
}

/**
 * Looks up whether `slug` matches an article's *previous* slug — used by
 * /articles/[slug] when the direct lookup misses, so a renamed article's
 * old URL 308-redirects to its current one instead of 404ing. Mirrors
 * lib/data/vehicles.ts:getVehicleRedirectTarget exactly.
 */
export async function getArticleRedirectSlug(slug: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  const { data: historyRow, error: historyError } = await supabase
    .from("article_slug_history")
    .select("article_id")
    .eq("slug", slug)
    .maybeSingle();

  if (historyError) throw new Error(`getArticleRedirectSlug: ${historyError.message}`);
  if (!historyRow) return null;

  const articleId = (historyRow as unknown as { article_id: string }).article_id;
  const { data: articleRow, error: articleError } = await supabase
    .from("articles")
    .select("slug")
    .eq("id", articleId)
    .maybeSingle();

  if (articleError) throw new Error(`getArticleRedirectSlug: ${articleError.message}`);
  if (!articleRow) return null;

  return (articleRow as unknown as { slug: string }).slug;
}

// ---------------------------------------------------------------------------
// Admin-only — session-authenticated. RLS's "staff can read all articles"
// policy is what actually allows these to see DRAFT rows.
// ---------------------------------------------------------------------------

/** Admin-only: every article regardless of status, newest first. */
export async function getAllArticlesForAdmin(): Promise<Article[]> {
  const supabase = await getSupabaseSessionClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getAllArticlesForAdmin: ${error.message}`);
  return (data as unknown as ArticleRow[]).map((row) => mapArticleRow(row, supabase));
}

export async function getArticleByIdForAdmin(id: string): Promise<Article | null> {
  const supabase = await getSupabaseSessionClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getArticleByIdForAdmin: ${error.message}`);
  return data ? mapArticleRow(data as unknown as ArticleRow, supabase) : null;
}
