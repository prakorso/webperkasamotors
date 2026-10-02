import "server-only";
import type { AboutMedia, AboutMediaAdminState } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";
import { getStoragePublicUrl } from "@/lib/storage/provider";

/**
 * Homepage About "proof" photos (reads only; writes are in
 * lib/actions/homepage-about-media.ts). Both readers fail open: if the
 * homepage_about_media table does not exist yet (migration prepared, applied
 * only after Owner authorization) or the read fails, the public page gets an
 * empty list and renders copy-only (no empty frames), and the admin gets
 * schemaReady=false.
 */
export const ABOUT_MEDIA_BUCKET = "site-assets";
/** Maximum photos shown publicly; the CMS may hold more (inactive or reordered). */
export const ABOUT_MEDIA_PUBLIC_LIMIT = 4;

const COLUMNS = "id, storage_path, caption, sort_order, is_active";

interface Row {
  id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  is_active: boolean;
}

function mapRow(row: Row): AboutMedia {
  const supabase = getSupabaseServerClient();
  return {
    id: row.id,
    url: getStoragePublicUrl(supabase, ABOUT_MEDIA_BUCKET, row.storage_path),
    storagePath: row.storage_path,
    caption: row.caption,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

/** Public: active photos in display order, at most ABOUT_MEDIA_PUBLIC_LIMIT (limit applied in the query). */
export async function getActiveAboutMedia(): Promise<AboutMedia[]> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("homepage_about_media")
      .select(COLUMNS)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(ABOUT_MEDIA_PUBLIC_LIMIT);
    if (error || !data) return [];
    return (data as unknown as Row[]).map(mapRow);
  } catch {
    return [];
  }
}

/** Admin: every photo regardless of state, plus whether the table exists. */
export async function getAboutMediaAdminState(): Promise<AboutMediaAdminState> {
  try {
    const supabase = await getSupabaseSessionClient();
    const { data, error } = await supabase
      .from("homepage_about_media")
      .select(COLUMNS)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error || !data) return { items: [], schemaReady: false };
    return { items: (data as unknown as Row[]).map(mapRow), schemaReady: true };
  } catch {
    return { items: [], schemaReady: false };
  }
}
