"use server";

import { revalidatePath } from "next/cache";
import type { ArticleStatus } from "@/lib/types";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";

/**
 * Server Actions for article create/update/delete — separated from
 * lib/data/articles.ts's plain reads, same reason as every other
 * lib/actions/*.ts file (see lib/actions/vehicles.ts).
 *
 * Slug handling mirrors lib/actions/vehicles.ts exactly: a title-derived
 * slug that's editable, regenerated only when it actually needs to
 * change, with the previous slug recorded into article_slug_history
 * whenever it does — so a published article's old URL 308-redirects
 * instead of 404ing (see lib/data/articles.ts:getArticleRedirectSlug and
 * app/(public)/articles/[slug]/page.tsx).
 */

export interface ArticleInput {
  title: string;
  /** Empty string means "auto-generate from title" — see createArticle/updateArticle. */
  slug: string;
  excerpt: string | null;
  content: string;
  category: string | null;
  tags: string[];
  status: ArticleStatus;
  seoTitle: string | null;
  seoDescription: string | null;
}

function validateArticleInput(input: ArticleInput): string | null {
  if (!input.title.trim()) return "Title is required.";
  return null;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[/,&_.]+/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Deterministic uniqueness: base, then base-2, base-3, … — the first one not already in use. */
async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof getSupabaseSessionClient>>,
  base: string,
  excludeId?: string
): Promise<string> {
  let candidate = base;
  let suffix = 2;
  for (;;) {
    let query = supabase.from("articles").select("id").eq("slug", candidate).limit(1);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query;
    if (!data || data.length === 0) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function friendlyConstraintError(message: string): string {
  if (message.includes("articles_slug_key")) {
    return "That URL slug is already used by another article — try a different one.";
  }
  return message;
}

function toRow(input: ArticleInput) {
  return {
    title: input.title.trim(),
    excerpt: input.excerpt?.trim() || null,
    content: input.content,
    category: input.category?.trim() || null,
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
    status: input.status,
    published_at: input.status === "PUBLISHED" ? new Date().toISOString() : null,
    seo_title: input.seoTitle?.trim() || null,
    seo_description: input.seoDescription?.trim() || null,
  };
}

export async function createArticle(
  input: ArticleInput
): Promise<{ error: string | null; id?: string }> {
  const validationError = validateArticleInput(input);
  if (validationError) return { error: validationError };

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const base = slugify(input.slug.trim() || input.title);
  if (!base) return { error: "Could not generate a URL from the title — check that field." };
  const slug = await generateUniqueSlug(supabase, base);

  const { data, error } = await supabase
    .from("articles")
    .insert({ ...toRow(input), slug, created_by: user.id })
    .select("id")
    .single();

  if (error) {
    return { error: error.code === "23505" ? friendlyConstraintError(error.message) : error.message };
  }

  revalidatePath("/", "layout");
  return { error: null, id: (data as unknown as { id: string }).id };
}

/**
 * publishedAt is preserved once an article has ever been published —
 * unpublishing and republishing must not lose the original publish date.
 * toRow() above always stamps "now" on any save with status PUBLISHED,
 * which is correct on first publish but wrong on every subsequent edit —
 * this function corrects that by looking up the current row first and
 * only letting toRow's published_at through when the row wasn't already
 * published before this save.
 */
export async function updateArticle(
  id: string,
  input: ArticleInput
): Promise<{ error: string | null }> {
  const validationError = validateArticleInput(input);
  if (validationError) return { error: validationError };

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: currentData, error: currentError } = await supabase
    .from("articles")
    .select("slug, status, published_at")
    .eq("id", id)
    .maybeSingle();
  if (currentError) return { error: currentError.message };
  if (!currentData) return { error: "Article not found." };

  const current = currentData as unknown as {
    slug: string;
    status: ArticleStatus;
    published_at: string | null;
  };

  const rowUpdate: Record<string, unknown> = toRow(input);

  // Slug is stable once it's set: only regenerate it if the admin actually
  // typed a different one (or cleared it, meaning "regenerate from title").
  const desiredBase = slugify(input.slug.trim() || input.title);
  const currentBase = slugify(current.slug);
  if (desiredBase && desiredBase !== currentBase) {
    // Record the URL this article is about to stop answering to, before it
    // stops answering to it. A history-recording failure must never block
    // the actual article update — it's bookkeeping for redirects, not the
    // primary write.
    const { error: historyError } = await supabase
      .from("article_slug_history")
      .upsert({ article_id: id, slug: current.slug }, { onConflict: "slug", ignoreDuplicates: true });
    if (historyError) {
      console.error("[updateArticle] Failed to record article_slug_history:", historyError);
    }
    rowUpdate.slug = await generateUniqueSlug(supabase, desiredBase, id);
  }

  // Preserve the original publish date across unpublish/republish and
  // ordinary content edits — only a genuine first publish sets "now".
  if (current.status === "PUBLISHED" || (current.published_at && input.status === "PUBLISHED")) {
    rowUpdate.published_at = current.published_at;
  }

  const { error } = await supabase.from("articles").update(rowUpdate).eq("id", id);

  if (error) {
    return { error: error.code === "23505" ? friendlyConstraintError(error.message) : error.message };
  }

  revalidatePath("/", "layout");
  return { error: null };
}

/**
 * Real delete, same as content (lib/actions/content.ts) rather than
 * vehicles' archive-only pattern — nothing references articles.id as a
 * foreign key except article_slug_history, which cascades. Removes the
 * cover/OG image storage objects (if any) after the row delete succeeds,
 * not before.
 */
export async function deleteArticle(id: string): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: row } = await supabase
    .from("articles")
    .select("cover_image_storage_path, og_image_storage_path")
    .eq("id", id)
    .maybeSingle();
  const paths = (
    row as unknown as { cover_image_storage_path: string | null; og_image_storage_path: string | null } | null
  );

  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) return { error: error.message };

  const toRemove = [paths?.cover_image_storage_path, paths?.og_image_storage_path].filter(
    (p): p is string => Boolean(p)
  );
  if (toRemove.length > 0) {
    await supabase.storage.from("article-media").remove(toRemove);
  }

  revalidatePath("/", "layout");
  return { error: null };
}

export type ArticleImageField = "cover" | "og";

/** Metadata-only — receives the storage path of an object already uploaded to Supabase Storage, never a File. Mirrors lib/actions/site-settings.ts:recordSiteAsset. */
export async function recordArticleImage(
  id: string,
  field: ArticleImageField,
  storagePath: string
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const column = field === "cover" ? "cover_image_storage_path" : "og_image_storage_path";
  const { error } = await supabase
    .from("articles")
    .update({ [column]: storagePath })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { error: null };
}
