"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";
import { removeFromStorage } from "@/lib/storage/provider";

/**
 * Owner management of the homepage About proof photos (Website > Beranda >
 * Tentang Perkasa Motors). Same shape as every other uploader here: the
 * browser uploads the file straight to the site-assets bucket first
 * (lib/storage/upload-image.ts) and these actions only receive the resulting
 * storage path (a string, never bytes). Requires the homepage_about_media
 * table (migration prepared, applied only after Owner authorization); until
 * then every action reports that instead of failing obscurely.
 */
const BUCKET = "site-assets";
const CAPTION_MAX = 140;
const PATH_PREFIX = "about-proof-";
const NOT_READY = "Fitur foto ini belum aktif di database. Hubungi pengelola teknis.";

function friendly(message: string): string {
  return /homepage_about_media/i.test(message) ? NOT_READY : message;
}

async function requireStaff() {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function addAboutMedia(
  storagePath: string,
  caption: string | null
): Promise<{ error: string | null; id?: string; sortOrder?: number }> {
  if (!storagePath.startsWith(PATH_PREFIX)) return { error: "Lokasi file tidak valid." };
  const cleanCaption = caption?.trim() || null;
  if ((cleanCaption?.length ?? 0) > CAPTION_MAX) return { error: `Keterangan maksimal ${CAPTION_MAX} karakter.` };

  const { supabase, user } = await requireStaff();
  if (!user) return { error: "Anda harus masuk terlebih dahulu." };

  const { data: last, error: lastError } = await supabase
    .from("homepage_about_media")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) return { error: friendly(lastError.message) };
  const sortOrder = ((last as unknown as { sort_order: number } | null)?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("homepage_about_media")
    .insert({ storage_path: storagePath, caption: cleanCaption, sort_order: sortOrder, is_active: true })
    .select("id")
    .single();
  if (error) return { error: friendly(error.message) };

  revalidatePath("/", "layout");
  return { error: null, id: (data as unknown as { id: string }).id, sortOrder };
}

export async function updateAboutMedia(
  id: string,
  fields: { caption: string | null; isActive: boolean }
): Promise<{ error: string | null }> {
  const cleanCaption = fields.caption?.trim() || null;
  if ((cleanCaption?.length ?? 0) > CAPTION_MAX) return { error: `Keterangan maksimal ${CAPTION_MAX} karakter.` };

  const { supabase, user } = await requireStaff();
  if (!user) return { error: "Anda harus masuk terlebih dahulu." };

  const { error } = await supabase
    .from("homepage_about_media")
    .update({ caption: cleanCaption, is_active: fields.isActive })
    .eq("id", id);
  if (error) return { error: friendly(error.message) };

  revalidatePath("/", "layout");
  return { error: null };
}

/** Swaps sort_order between two photos (the up/down buttons). */
export async function reorderAboutMedia(
  items: Array<{ id: string; sortOrder: number }>
): Promise<{ error: string | null }> {
  const { supabase, user } = await requireStaff();
  if (!user) return { error: "Anda harus masuk terlebih dahulu." };

  for (const item of items) {
    const { error } = await supabase.from("homepage_about_media").update({ sort_order: item.sortOrder }).eq("id", item.id);
    if (error) return { error: friendly(error.message) };
  }
  revalidatePath("/", "layout");
  return { error: null };
}

/** Deletes the row and its storage object (the path is looked up here so the client never tracks it). */
export async function deleteAboutMedia(id: string): Promise<{ error: string | null }> {
  const { supabase, user } = await requireStaff();
  if (!user) return { error: "Anda harus masuk terlebih dahulu." };

  const { data: row } = await supabase.from("homepage_about_media").select("storage_path").eq("id", id).maybeSingle();
  const path = (row as unknown as { storage_path: string } | null)?.storage_path;

  const { error } = await supabase.from("homepage_about_media").delete().eq("id", id);
  if (error) return { error: friendly(error.message) };

  if (path) await removeFromStorage(supabase, BUCKET, [path]);
  revalidatePath("/", "layout");
  return { error: null };
}
