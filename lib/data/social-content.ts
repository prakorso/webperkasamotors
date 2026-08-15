import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SocialContent } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";

/**
 * Content data access — read-only. Mutations (create/update/delete, plus
 * the primary addSocialContent workflow) live in lib/actions/content.ts
 * as their own whole-file "use server" module, same split as
 * lib/data/vehicles.ts / lib/actions/vehicles.ts.
 *
 * getSocialContentForVehicle reads via the anon/publishable client —
 * RLS's "public can read published content" policy
 * (supabase/migrations/20260814030400_rls_policies.sql) is what actually
 * restricts this to status = 'PUBLISHED'. The admin functions read via
 * the session client, exposed to every status through "staff can read all
 * content". lib/mock/social-content.ts remains as local-dev fixture data
 * only; nothing in app/ or components/ reads it anymore.
 *
 * REVISED (one-person-operation redesign): a content item's display
 * image is its own thumbnail_storage_path, or nothing — there is no
 * fallback to the linked vehicle's photo. An earlier revision of this
 * file did fall back to the vehicle's primary photo, but that conflated
 * two different things: a vehicle's inventory photography and a social
 * post's own preview image. When thumbnailUrl is null here, the UI is
 * expected to show a "preview unavailable" state, not silently borrow
 * unrelated imagery.
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

function mapContentRows(rows: ContentRow[], supabase: SupabaseClient): SocialContent[] {
  return rows.map((row) => ({
    id: row.id,
    vehicleId: row.vehicle_id,
    contentType: row.content_type,
    status: row.status,
    caption: row.caption,
    permalink: row.permalink,
    thumbnailUrl: row.thumbnail_storage_path
      ? supabase.storage.from(CONTENT_BUCKET).getPublicUrl(row.thumbnail_storage_path).data.publicUrl
      : null,
    postedAt: row.posted_at,
    instagramMediaId: row.instagram_media_id,
  }));
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
  return mapContentRows(data as unknown as ContentRow[], supabase);
}

// ---------------------------------------------------------------------------
// Admin-only — session-authenticated. RLS's "staff can read all content"
// policy is what actually allows these to see INBOX/CLASSIFIED/IGNORED
// rows — an inactive or signed-out caller gets the same publicly-visible
// PUBLISHED-only subset the function above returns, never an error, since
// RLS just filters rows rather than rejecting the query.
// ---------------------------------------------------------------------------

/** Admin-only: every content item regardless of status, newest first — the Content Library overview page. */
export async function getAllContentForAdmin(): Promise<SocialContent[]> {
  const supabase = await getSupabaseSessionClient();
  const { data, error } = await supabase
    .from("content")
    .select(CONTENT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getAllContentForAdmin: ${error.message}`);
  return mapContentRows(data as unknown as ContentRow[], supabase);
}

export async function getContentByIdForAdmin(id: string): Promise<SocialContent | null> {
  const supabase = await getSupabaseSessionClient();
  const { data, error } = await supabase
    .from("content")
    .select(CONTENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getContentByIdForAdmin: ${error.message}`);
  if (!data) return null;
  return mapContentRows([data as unknown as ContentRow], supabase)[0];
}

/**
 * Admin-only: every content item linked to one vehicle, regardless of
 * status — powers the Inventory edit page's embedded Social Content
 * section, the primary workflow for managing a vehicle's linked content.
 */
export async function getContentForVehicleAdmin(vehicleId: string): Promise<SocialContent[]> {
  const supabase = await getSupabaseSessionClient();
  const { data, error } = await supabase
    .from("content")
    .select(CONTENT_COLUMNS)
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getContentForVehicleAdmin: ${error.message}`);
  return mapContentRows(data as unknown as ContentRow[], supabase);
}
