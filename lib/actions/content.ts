"use server";

import { revalidatePath } from "next/cache";
import type { SocialContentType, SocialContentStatus } from "@/lib/types";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";

/**
 * Server Actions for content create/update/delete plus thumbnail
 * upload/replace — separated from lib/data/social-content.ts's plain
 * reads, same reason as every other lib/actions/*.ts file (see
 * lib/actions/site-settings.ts).
 *
 * Unlike vehicles (archive-only, never a hard delete — see
 * lib/actions/vehicles.ts), content rows are really deleted here.
 * "IGNORED" is the content-table's own soft-hide state (RLS keeps it out
 * of the public PUBLISHED-only read), and deleting a content row has no
 * cascade risk — nothing references content.id as a foreign key — so a
 * real DELETE for genuinely-wrong or duplicate entries doesn't carry the
 * blast radius that ruled it out for vehicles.
 */

const BUCKET = "content-thumbnails";

const ALLOWED_CONTENT_TYPES: SocialContentType[] = [
  "STOCK",
  "REVIEW",
  "REEL",
  "FEATURE",
  "NEWS",
  "OTHER",
];

const ALLOWED_CONTENT_STATUSES: SocialContentStatus[] = [
  "INBOX",
  "CLASSIFIED",
  "PUBLISHED",
  "IGNORED",
];

export interface ContentInput {
  vehicleId: string | null;
  contentType: SocialContentType;
  status: SocialContentStatus;
  caption: string;
  permalink: string;
  instagramMediaId: string | null;
  /** ISO date (yyyy-mm-dd) or null — content.posted_at is a nullable timestamptz. */
  postedAt: string | null;
}

function validateContentInput(input: ContentInput): string | null {
  if (!input.permalink.trim()) return "Link is required.";
  if (!ALLOWED_CONTENT_TYPES.includes(input.contentType)) return "Invalid content type.";
  if (!ALLOWED_CONTENT_STATUSES.includes(input.status)) return "Invalid status.";
  return null;
}

/** Friendlier message for the one UNIQUE constraint (instagram_media_id) than raw Postgres error text. */
function friendlyConstraintError(message: string): string {
  if (message.includes("content_instagram_media_id_key")) {
    return "That Instagram Media ID is already used by another content item.";
  }
  return message;
}

/**
 * Row fields shared by create and update. Deliberately excludes
 * `thumbnail_storage_path` — that column is only ever written by
 * uploadContentThumbnail below, mirroring how vehicles' toRow() excludes
 * `slug`: create/update never touch it, so a thumbnail always survives an
 * unrelated caption/status edit.
 *
 * classified_by/classified_at are derived from status, not passed in
 * separately: any save that leaves status at something other than INBOX
 * stamps who did it and when; a save that moves status back to INBOX
 * clears both, since "classified" is no longer true of the row. This is a
 * deliberate choice, not an oversight — there's no requirement anywhere to
 * preserve the *original* classification once a row is un-classified.
 */
function toRow(input: ContentInput, userId: string) {
  const isClassified = input.status !== "INBOX";
  return {
    vehicle_id: input.vehicleId,
    content_type: input.contentType,
    status: input.status,
    caption: input.caption.trim(),
    permalink: input.permalink.trim(),
    instagram_media_id: input.instagramMediaId?.trim() || null,
    posted_at: input.postedAt || null,
    classified_by: isClassified ? userId : null,
    classified_at: isClassified ? new Date().toISOString() : null,
  };
}

export async function createContent(
  input: ContentInput
): Promise<{ error: string | null; id?: string }> {
  const validationError = validateContentInput(input);
  if (validationError) return { error: validationError };

  // A new row never has a thumbnail yet — thumbnails are uploaded on the
  // edit page after creation (mirrors vehicle photos: "Photos can be added
  // once the vehicle is created — save it first").
  if (input.status === "PUBLISHED") {
    return {
      error:
        "Add a thumbnail before publishing — save as Inbox or Classified first, then publish once uploaded.",
    };
  }

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data, error } = await supabase
    .from("content")
    .insert(toRow(input, user.id))
    .select("id")
    .single();

  if (error) {
    return { error: error.code === "23505" ? friendlyConstraintError(error.message) : error.message };
  }

  revalidatePath("/", "layout");
  return { error: null, id: (data as unknown as { id: string }).id };
}

export async function updateContent(
  id: string,
  input: ContentInput
): Promise<{ error: string | null }> {
  const validationError = validateContentInput(input);
  if (validationError) return { error: validationError };

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  if (input.status === "PUBLISHED") {
    const { data: existing } = await supabase
      .from("content")
      .select("thumbnail_storage_path")
      .eq("id", id)
      .maybeSingle();
    const hasThumbnail = Boolean(
      (existing as unknown as { thumbnail_storage_path: string | null } | null)?.thumbnail_storage_path
    );
    if (!hasThumbnail) return { error: "Add a thumbnail before publishing." };
  }

  const { error } = await supabase.from("content").update(toRow(input, user.id)).eq("id", id);

  if (error) {
    return { error: error.code === "23505" ? friendlyConstraintError(error.message) : error.message };
  }

  revalidatePath("/", "layout");
  return { error: null };
}

/**
 * Real delete — see the file header for why that's the right call here,
 * unlike vehicles. Removes the thumbnail storage object (if any) after the
 * row delete succeeds, not before: if storage removal itself fails, the
 * result is an orphaned file, not a live published row pointing at a
 * missing image.
 */
export async function deleteContent(id: string): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: row } = await supabase
    .from("content")
    .select("thumbnail_storage_path")
    .eq("id", id)
    .maybeSingle();
  const thumbnailPath = (row as unknown as { thumbnail_storage_path: string | null } | null)
    ?.thumbnail_storage_path;

  const { error } = await supabase.from("content").delete().eq("id", id);
  if (error) return { error: error.message };

  if (thumbnailPath) {
    await supabase.storage.from(BUCKET).remove([thumbnailPath]);
  }

  revalidatePath("/", "layout");
  return { error: null };
}

/**
 * Uploads a new thumbnail and replaces the previous one, if any — single
 * image, unlike vehicle media's ordered gallery, so "upload" always means
 * "replace" here. Uses the content-thumbnails bucket and the signed-in
 * user's own session throughout — never a service-role key. Staff-only
 * writes are enforced by the bucket's storage policy and the content RLS
 * policies (supabase/migrations/*_storage_buckets.sql, *_rls_policies.sql),
 * not by anything in this file.
 */
export async function uploadContentThumbnail(
  contentId: string,
  formData: FormData
): Promise<{ error: string | null; thumbnailUrl?: string }> {
  if (!contentId) return { error: "No content item specified." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file selected." };
  if (!file.type.startsWith("image/")) return { error: "Only image files are supported." };

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: existing } = await supabase
    .from("content")
    .select("thumbnail_storage_path")
    .eq("id", contentId)
    .maybeSingle();
  const previousPath = (existing as unknown as { thumbnail_storage_path: string | null } | null)
    ?.thumbnail_storage_path;

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${contentId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600" });
  if (uploadError) return { error: uploadError.message };

  const { error: updateError } = await supabase
    .from("content")
    .update({ thumbnail_storage_path: path })
    .eq("id", contentId);

  if (updateError) {
    // Roll back the upload so a failed update doesn't leave an orphaned file.
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: updateError.message };
  }

  if (previousPath) {
    await supabase.storage.from(BUCKET).remove([previousPath]);
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  revalidatePath("/", "layout");
  return { error: null, thumbnailUrl: urlData.publicUrl };
}
