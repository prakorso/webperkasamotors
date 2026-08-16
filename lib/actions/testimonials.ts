"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";
import { removeFromStorage } from "@/lib/storage/provider";

/**
 * Server Actions for testimonials (create/update/delete/reorder) —
 * separated from lib/data/testimonials.ts's plain reads, same split as
 * every other domain.
 *
 * Photo upload follows the same shared media architecture as everywhere
 * else, just inline rather than via a separate recordSiteAsset-style
 * call: the browser uploads the file directly to the `testimonials`
 * bucket first (lib/storage/upload-image.ts, same
 * uploadImage()/validateImageFile() used by Vehicle Photos/Hero/About),
 * then calls createTestimonial/updateTestimonial with the resulting
 * storage path as a plain string. This function never receives a File
 * or FormData — recordSiteAsset's pattern doesn't fit here directly
 * because testimonials aren't a singleton row (there's no single
 * "testimonials" field on website_settings to point at); each
 * testimonial is its own row, closer to how vehicle photos work.
 */

const TESTIMONIALS_BUCKET = "testimonials";
const CUSTOMER_NAME_MAX_LENGTH = 80;
const TESTIMONIAL_MAX_LENGTH = 500;
const ROLE_LABEL_MAX_LENGTH = 80;

export interface TestimonialInput {
  customerName: string;
  testimonial: string;
  roleLabel: string | null;
  /** Storage path already uploaded by the browser, or null to leave the photo unset. */
  photoStoragePath: string | null;
  isActive: boolean;
}

function validateTestimonial(input: TestimonialInput): string | null {
  if (!input.customerName.trim()) return "Customer Name is required.";
  if (input.customerName.length > CUSTOMER_NAME_MAX_LENGTH) {
    return `Customer Name must be ${CUSTOMER_NAME_MAX_LENGTH} characters or fewer.`;
  }
  if (!input.testimonial.trim()) return "Testimonial is required.";
  if (input.testimonial.length > TESTIMONIAL_MAX_LENGTH) {
    return `Testimonial must be ${TESTIMONIAL_MAX_LENGTH} characters or fewer.`;
  }
  if ((input.roleLabel?.length ?? 0) > ROLE_LABEL_MAX_LENGTH) {
    return `Role Label must be ${ROLE_LABEL_MAX_LENGTH} characters or fewer.`;
  }
  // storagePath, if present, must be a real upload from this feature's
  // own upload control — sanity check only, mirrors
  // recordVehicleMediaUpload's prefix check, not an RLS boundary.
  if (input.photoStoragePath && !input.photoStoragePath.startsWith("testimonial-")) {
    return "Invalid photo storage path.";
  }
  return null;
}

function toRow(input: TestimonialInput) {
  return {
    customer_name: input.customerName.trim(),
    testimonial: input.testimonial.trim(),
    role_label: input.roleLabel?.trim() || null,
    is_active: input.isActive,
  };
}

export async function createTestimonial(
  input: TestimonialInput
): Promise<{ error: string | null; id?: string }> {
  const validationError = validateTestimonial(input);
  if (validationError) return { error: validationError };

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: last } = await supabase
    .from("testimonials")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = ((last as unknown as { sort_order: number } | null)?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("testimonials")
    .insert({
      ...toRow(input),
      photo_storage_path: input.photoStoragePath,
      sort_order: nextSortOrder,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null, id: (data as unknown as { id: string }).id };
}

/**
 * photoStoragePath: pass the existing path unchanged to keep the current
 * photo, a new path to replace it, or null to remove it. The caller
 * (components/admin/homepage-testimonials-form.tsx) is responsible for
 * uploading a replacement before calling this, and for removing the old
 * object afterward on success — same rollback-on-failure shape as every
 * other uploader in this codebase.
 */
export async function updateTestimonial(
  id: string,
  input: TestimonialInput
): Promise<{ error: string | null }> {
  const validationError = validateTestimonial(input);
  if (validationError) return { error: validationError };

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("testimonials")
    .update({ ...toRow(input), photo_storage_path: input.photoStoragePath })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { error: null };
}

/** Deletes both the storage object (if any) and the row — looks up the storage path itself so the client never needs to track it, same pattern as deleteVehicleMedia. */
export async function deleteTestimonial(id: string): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: row } = await supabase
    .from("testimonials")
    .select("photo_storage_path")
    .eq("id", id)
    .maybeSingle();
  const photoPath = (row as unknown as { photo_storage_path: string | null } | null)?.photo_storage_path;

  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) return { error: error.message };

  if (photoPath) {
    await removeFromStorage(supabase, TESTIMONIALS_BUCKET, [photoPath]);
  }

  revalidatePath("/", "layout");
  return { error: null };
}

/** Bulk-updates sort_order — the up/down reorder controls in the admin list. */
export async function reorderTestimonials(
  items: Array<{ id: string; sortOrder: number }>
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  for (const item of items) {
    const { error } = await supabase
      .from("testimonials")
      .update({ sort_order: item.sortOrder })
      .eq("id", item.id);
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { error: null };
}
