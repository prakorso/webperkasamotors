import "server-only";
import type { SocialContent } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";

/**
 * Content data access — read-only. Mutations (create/update/delete,
 * thumbnail upload) live in lib/actions/content.ts as their own whole-file
 * "use server" module, same split as lib/data/vehicles.ts /
 * lib/actions/vehicles.ts.
 *
 * BATCH 3B: getSocialContentForVehicle now reads via the anon/publishable
 * client — RLS's "public can read published content" policy
 * (supabase/migrations/20260814030400_rls_policies.sql) is what actually
 * restricts this to status = 'PUBLISHED'. The two admin functions read via
 * the session client, exposed to every status through "staff can read all
 * content". lib/mock/social-content.ts remains as local-dev fixture data
 * only; nothing in app/ or components/ reads it anymore.
 */

const CONTENT_BUCKET = "content-thumbnails";

const CONTENT_COLUMNS =
  "id, vehicle_id, content_type, status, caption, permalink, " +
  "thumbnail_storage_path, instagram_media_id, posted_at";

/** Shape of a row from the `content` table, before mapping to SocialContent. */
interface ContentRow {
  id: string;
  vehicle_id: string | null;
  content_type: SocialContent["contentType"];
  status: SocialContent["status"];
  caption: string;
  permalink: string;
  thumbnail_storage_path: string | null;
  instagram_media_id: string | null;
  posted_at: string | null;
}

function mapContentRow(row: ContentRow): SocialContent {
  const supabase = getSupabaseServerClient();
  const thumbnailUrl = row.thumbnail_storage_path
    ? supabase.storage.from(CONTENT_BUCKET).getPublicUrl(row.thumbnail_storage_path).data.publicUrl
    : null;

  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    contentType: row.content_type,
    status: row.status,
    caption: row.caption,
    permalink: row.permalink,
    thumbnailUrl,
    postedAt: row.posted_at,
    instagramMediaId: row.instagram_media_id,
  };
}

export async function getSocialContentForVehicle(vehicleId: string): Promise<SocialContent[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("content")
    .select(CONTENT_COLUMNS)
    .eq("vehicle_id", vehicleId)
    .eq("status", "PUBLISHED")
    .order("posted_at", { ascending: false });

  if (error) throw new Error(`getSocialContentForVehicle: ${error.message}`);
  return (data as unknown as ContentRow[]).map(mapContentRow);
}

// ---------------------------------------------------------------------------
// Admin-only — session-authenticated. RLS's "staff can read all content"
// policy is what actually allows these to see INBOX/CLASSIFIED/IGNORED
// rows — an inactive or signed-out caller gets the same publicly-visible
// PUBLISHED-only subset the function above returns, never an error, since
// RLS just filters rows rather than rejecting the query.
// ---------------------------------------------------------------------------

/** Admin-only: every content item regardless of status, newest first. */
export async function getAllContentForAdmin(): Promise<SocialContent[]> {
  const supabase = await getSupabaseSessionClient();
  const { data, error } = await supabase
    .from("content")
    .select(CONTENT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getAllContentForAdmin: ${error.message}`);
  return (data as unknown as ContentRow[]).map(mapContentRow);
}

export async function getContentByIdForAdmin(id: string): Promise<SocialContent | null> {
  const supabase = await getSupabaseSessionClient();
  const { data, error } = await supabase
    .from("content")
    .select(CONTENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getContentByIdForAdmin: ${error.message}`);
  return data ? mapContentRow(data as unknown as ContentRow) : null;
}
