"use server";

import { revalidatePath } from "next/cache";
import type { VehicleMedia } from "@/lib/types";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";
import { getStoragePublicUrl, removeFromStorage } from "@/lib/storage/provider";

/**
 * Server Actions for vehicle media metadata/reorder/primary/delete —
 * separated from lib/data/vehicles.ts's plain reads, same reason as every
 * other lib/actions/*.ts file (see lib/actions/site-settings.ts).
 *
 * Uses the existing vehicle-media bucket and the signed-in user's own
 * session throughout — never a service-role key. Staff-only writes are
 * enforced by the bucket's storage policy and the vehicle_media RLS
 * policies (supabase/migrations/*_storage_buckets.sql,
 * *_rls_policies.sql), not by anything in this file.
 *
 * REVISED: file bytes no longer pass through this file at all. The actual
 * upload to Storage happens directly from the browser
 * (components/admin/vehicle-media-manager.tsx, using
 * lib/supabase/browser.ts's getSupabaseBrowserClient() — same
 * authenticated session, same RLS policies, just initiated client-side
 * instead of proxied through a Server Action). That was causing 504s on
 * Netlify: routing multi-megabyte photo bytes through a serverless
 * function meant a double network hop (browser -> Netlify function ->
 * Supabase Storage, ap-southeast-1) plus several sequential DB round
 * trips, all inside one function invocation with a hard execution-time
 * ceiling. recordVehicleMediaUpload below only ever receives a small JSON
 * payload (an already-uploaded object's path) — no bytes, no proxy, no
 * double hop, so it can't reproduce that failure mode.
 */

const BUCKET = "vehicle-media";

export type VehicleMediaType = VehicleMedia["mediaType"];

const ALLOWED_MEDIA_TYPES: VehicleMediaType[] = [
  "EXTERIOR",
  "INTERIOR",
  "ENGINE",
  "WHEELS",
  "DOCUMENT",
  "VIDEO",
  "WALKAROUND",
  "OTHER",
];

/**
 * Records a file the browser has *already* uploaded directly to Supabase
 * Storage — this function never touches storage.upload() or sees file
 * bytes. storagePath is required to start with `${vehicleId}/`, the same
 * prefix the browser always generates: not an RLS boundary (the bucket
 * policy doesn't scope by path prefix), just a sanity check against a
 * buggy or malicious caller pointing this row at an unrelated object.
 *
 * Same business logic as before: first media for a vehicle becomes
 * primary automatically, sort_order increments from the current max.
 * If the insert fails, there's no upload left to roll back here — the
 * browser does that (removing the object it just uploaded) when this
 * action returns an error, since it's the one holding the session that
 * performed the upload in the first place.
 */
export async function recordVehicleMediaUpload(
  vehicleId: string,
  mediaType: VehicleMediaType,
  storagePath: string
): Promise<{ error: string | null; media?: VehicleMedia }> {
  if (!vehicleId) return { error: "No vehicle specified." };
  if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) return { error: "Invalid media type." };
  if (!storagePath || !storagePath.startsWith(`${vehicleId}/`)) {
    return { error: "Invalid storage path." };
  }

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { count } = await supabase
    .from("vehicle_media")
    .select("id", { count: "exact", head: true })
    .eq("vehicle_id", vehicleId);
  const isFirstMediaForVehicle = !count;

  const { data: last } = await supabase
    .from("vehicle_media")
    .select("sort_order")
    .eq("vehicle_id", vehicleId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = ((last as unknown as { sort_order: number } | null)?.sort_order ?? 0) + 1;

  const { data: inserted, error: insertError } = await supabase
    .from("vehicle_media")
    .insert({
      vehicle_id: vehicleId,
      media_type: mediaType,
      storage_path: storagePath,
      alt_text: "",
      // First image uploaded for a vehicle becomes primary automatically —
      // otherwise every new vehicle would show no image anywhere until
      // someone remembers to set one manually.
      is_primary: isFirstMediaForVehicle,
      sort_order: nextSortOrder,
    })
    .select("id, vehicle_id, media_type, storage_path, alt_text, is_primary, sort_order")
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  const row = inserted as unknown as {
    id: string;
    vehicle_id: string;
    media_type: VehicleMediaType;
    storage_path: string;
    alt_text: string;
    is_primary: boolean;
    sort_order: number;
  };
  const url = getStoragePublicUrl(supabase, BUCKET, row.storage_path);

  revalidatePath("/", "layout");
  return {
    error: null,
    media: {
      id: row.id,
      vehicleId: row.vehicle_id,
      mediaType: row.media_type,
      url,
      altText: row.alt_text,
      isPrimary: row.is_primary,
      sortOrder: row.sort_order,
    },
  };
}

/**
 * Sets one media item primary and clears the flag on the rest of that
 * vehicle's media in a separate statement first — the DB enforces at most
 * one is_primary = true per vehicle_id via a partial unique index
 * (supabase/migrations/*_indexes.sql), so setting the new one true before
 * clearing the old one would violate it.
 */
export async function setPrimaryVehicleMedia(
  vehicleId: string,
  mediaId: string
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error: clearError } = await supabase
    .from("vehicle_media")
    .update({ is_primary: false })
    .eq("vehicle_id", vehicleId)
    .neq("id", mediaId);
  if (clearError) return { error: clearError.message };

  const { error: setError } = await supabase
    .from("vehicle_media")
    .update({ is_primary: true })
    .eq("id", mediaId);
  if (setError) return { error: setError.message };

  revalidatePath("/", "layout");
  return { error: null };
}

/** Bulk-updates sort_order — the up/down reorder controls in the admin media manager. */
export async function reorderVehicleMedia(
  items: Array<{ id: string; sortOrder: number }>
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  for (const item of items) {
    const { error } = await supabase
      .from("vehicle_media")
      .update({ sort_order: item.sortOrder })
      .eq("id", item.id);
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { error: null };
}

/** Deletes both the storage object and its vehicle_media row — looks up the storage path itself so the client never needs to know it. */
export async function deleteVehicleMedia(mediaId: string): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: row, error: fetchError } = await supabase
    .from("vehicle_media")
    .select("storage_path")
    .eq("id", mediaId)
    .maybeSingle();
  if (fetchError) return { error: fetchError.message };
  if (!row) return { error: "Media item not found." };

  const storagePath = (row as unknown as { storage_path: string }).storage_path;

  const { error: storageError } = await removeFromStorage(supabase, BUCKET, [storagePath]);
  if (storageError) return { error: storageError };

  const { error: dbError } = await supabase.from("vehicle_media").delete().eq("id", mediaId);
  if (dbError) return { error: dbError.message };

  revalidatePath("/", "layout");
  return { error: null };
}
