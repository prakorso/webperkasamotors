"use server";

import { revalidatePath } from "next/cache";
import type { SocialContentType, SocialContentStatus } from "@/lib/types";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";

/**
 * Server Actions for content create/update/delete — separated from
 * lib/data/social-content.ts's plain reads, same reason as every other
 * lib/actions/*.ts file (see lib/actions/site-settings.ts).
 *
 * Unlike vehicles (archive-only, never a hard delete — see
 * lib/actions/vehicles.ts), content rows are really deleted here.
 * "IGNORED" is the content-table's own soft-hide state (RLS keeps it out
 * of the public PUBLISHED-only read), and deleting a content row has no
 * cascade risk — nothing references content.id as a foreign key — so a
 * real DELETE for genuinely-wrong or duplicate entries doesn't carry the
 * blast radius that ruled it out for vehicles.
 *
 * REVISED (post-Batch 3B): there is no manual thumbnail upload here
 * anymore, and publishing never depends on one. Content is a
 * social-media-to-vehicle link, not a media CMS — the display image
 * (lib/data/social-content.ts's mapContentRows) resolves from
 * thumbnail_storage_path if a future ingestion/scraping step ever sets
 * it, otherwise the linked vehicle's own primary photo, otherwise no
 * image. thumbnail_storage_path stays a real, writable column for that
 * future use — nothing here removes it — but this file no longer writes
 * to it, so BUCKET/cleanup logic only appears in deleteContent, to avoid
 * leaving an orphaned file if a row with one ever exists.
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
 * `thumbnail_storage_path` — nothing in this file writes it (see the file
 * header), mirroring how vehicles' toRow() excludes `slug`: create/update
 * never touch it, so a thumbnail always survives an unrelated
 * caption/status edit, if one is ever set by a future process.
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
