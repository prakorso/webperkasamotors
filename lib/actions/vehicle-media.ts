"use server";

import { revalidatePath } from "next/cache";
import type { VehicleMedia } from "@/lib/types";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";

/**
 * Server Actions for vehicle media upload/reorder/primary/delete —
 * separated from lib/data/vehicles.ts's plain reads, same reason as every
 * other lib/actions/*.ts file (see lib/actions/site-settings.ts).
 *
 * Uses the existing vehicle-media bucket and the signed-in user's own
 * session throughout — never a service-role key. Staff-only writes are
 * enforced by the bucket's storage policy and the vehicle_media RLS
 * policies (supabase/migrations/*_storage_buckets.sql,
 * *_rls_policies.sql), not by anything in this file.
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

export async function uploadVehicleMedia(
  vehicleId: string,
  mediaType: VehicleMediaType,
  formData: FormData
): Promise<{ error: string | null; media?: VehicleMedia }> {
  if (!vehicleId) return { error: "No vehicle specified." };
  if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) return { error: "Invalid media type." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file selected." };
  }
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return { error: "Only image or video files are supported." };
  }

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${vehicleId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600" });
  if (uploadError) return { error: uploadError.message };

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
      storage_path: path,
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
    // Roll back the upload so a failed insert doesn't leave an orphaned file.
    await supabase.storage.from(BUCKET).remove([path]);
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
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(row.storage_path);

  revalidatePath("/", "layout");
  return {
    error: null,
    media: {
      id: row.id,
      vehicleId: row.vehicle_id,
      mediaType: row.media_type,
      url: urlData.publicUrl,
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

  const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (storageError) return { error: storageError.message };

  const { error: dbError } = await supabase.from("vehicle_media").delete().eq("id", mediaId);
  if (dbError) return { error: dbError.message };

  revalidatePath("/", "layout");
  return { error: null };
}
