"use server";

import { revalidatePath } from "next/cache";
import type { SocialContentType, SocialContentStatus } from "@/lib/types";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";
import { detectSocialPlatform, fetchOEmbedPreview, fetchWithTimeout } from "@/lib/utils/social-embed";

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
 * REVISED (one-person-operation redesign): addSocialContent is now the
 * primary way content gets created — paste a URL, get a vehicle-linked
 * row back, nothing else required. createContent/updateContent remain
 * for the Content Library's manual edit path (fixing a wrong link,
 * correcting a caption, relinking to a different vehicle), where full
 * field control is still occasionally useful, but they're no longer the
 * everyday path. See lib/utils/social-embed.ts for exactly which
 * platforms auto-thumbnail can succeed for and why — this was verified
 * live, not assumed. Thumbnails are never a vehicle's own photo: a
 * vehicle image and a social-media thumbnail are different things, so a
 * content item with no retrievable preview simply has none — the UI
 * shows "preview unavailable", never a substitution.
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

/**
 * Downloads the bytes at sourceUrl and re-uploads them into our own
 * content-thumbnails bucket, returning the new storage path — or null on
 * any failure. Never hotlinks the platform's own URL: TikTok's oEmbed
 * thumbnail_url is CDN-signed and expires in roughly 48 hours (verified
 * by decoding a real response), so storing that URL directly would go
 * stale within days. Mirroring once at save time is the only path that
 * stays correct long-term, and doing it uniformly for every platform that
 * gives us a URL (currently just YouTube) keeps the architecture simple
 * rather than special-casing "this one platform's URL happens to be
 * stable today."
 */
async function mirrorThumbnail(
  supabase: Awaited<ReturnType<typeof getSupabaseSessionClient>>,
  vehicleId: string,
  sourceUrl: string
): Promise<string | null> {
  const res = await fetchWithTimeout(sourceUrl);
  if (!res) return null;

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) return null;

  let bytes: ArrayBuffer;
  try {
    bytes = await res.arrayBuffer();
  } catch {
    return null;
  }

  const extension = contentType.split("/")[1]?.split(";")[0] || "jpg";
  const path = `${vehicleId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, cacheControl: "3600" });

  return error ? null : path;
}

/**
 * The primary Social Content workflow: a vehicle ID (always the vehicle
 * the admin is already looking at — never re-selected) and a raw URL,
 * nothing else. Everything else is derived automatically:
 *
 * - content_type is fixed to "OTHER" — this classification field never
 *   surfaces in the simple workflow at all; the Content Library's edit
 *   form can still change it manually if anyone ever wants to.
 * - status is always PUBLISHED — content is visible the moment it's
 *   added, no Inbox/Classified triage step. Hiding it later is a single
 *   toggle on the Library edit view (sets IGNORED).
 * - caption comes from the platform's oEmbed title when one is
 *   available (YouTube/TikTok), otherwise stays empty — never required,
 *   never asked for.
 * - posted_at stays null. It is deliberately NOT set to "now" — the
 *   moment this was added to the CRM is not the same fact as when the
 *   post actually went up on the platform, and no platform's oEmbed
 *   response reliably provides the original publish date, so this column
 *   only ever gets a real value if a future integration can actually
 *   obtain one. Never asked for manually in this workflow.
 * - thumbnail_storage_path is set only if oEmbed returned a thumbnail
 *   AND mirroring it into our own storage succeeded (YouTube/TikTok
 *   only, per lib/utils/social-embed.ts's file header) — otherwise it
 *   stays null and the UI shows "preview unavailable". This can never
 *   fail the save itself: the thumbnail step is strictly best-effort.
 */
export async function addSocialContent(
  vehicleId: string,
  url: string
): Promise<{ error: string | null; id?: string }> {
  const permalink = url.trim();
  if (!permalink) return { error: "Paste a social media URL first." };
  try {
    new URL(permalink);
  } catch {
    return { error: "That doesn't look like a valid URL." };
  }

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const platform = detectSocialPlatform(permalink);
  const preview = await fetchOEmbedPreview(permalink, platform);

  const thumbnailPath = preview.thumbnailUrl
    ? await mirrorThumbnail(supabase, vehicleId, preview.thumbnailUrl)
    : null;

  const { data, error } = await supabase
    .from("content")
    .insert({
      vehicle_id: vehicleId,
      content_type: "OTHER",
      status: "PUBLISHED",
      caption: preview.title?.trim() || "",
      permalink,
      thumbnail_storage_path: thumbnailPath,
      instagram_media_id: null,
      posted_at: null,
      classified_by: user.id,
      classified_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.code === "23505" ? friendlyConstraintError(error.message) : error.message };
  }

  revalidatePath("/", "layout");
  return { error: null, id: (data as unknown as { id: string }).id };
}
