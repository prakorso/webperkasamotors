import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { uploadToStorage, removeFromStorage } from "@/lib/storage/provider";

/**
 * The one shared "upload a file straight from the browser to Supabase
 * Storage" entry point — every admin image uploader (Vehicle Photos,
 * Hero, Logo, Favicon, OG Image) calls this instead of talking to
 * `supabase.storage` itself.
 *
 * This is what actually eliminates the 504s: file bytes make one hop
 * (browser -> Supabase), never a second hop through a Next.js Server
 * Action/Netlify function. Every caller still follows up with its own
 * small metadata-only Server Action (recordSiteAsset,
 * recordVehicleMediaUpload, ...) to persist the resulting storage path —
 * that call carries a path string, never bytes.
 *
 * Uses the same authenticated browser session as the rest of the admin
 * (lib/supabase/browser.ts, backed by the same sb-*-auth-token cookie
 * @supabase/ssr manages) — the "staff can upload/update/delete ... objects"
 * storage policies enforce is_active_staff() identically regardless of
 * whether the call originates here or server-side, since both resolve
 * from the same auth.uid(). No new credentials, nothing service-role.
 */
export interface UploadImageParams {
  bucket: string;
  path: string;
  file: File;
  cacheControl?: string;
  /** Only meaningful if `path` can collide with an existing object — most callers generate a unique path per upload and never need this. */
  upsert?: boolean;
}

export interface UploadImageResult {
  path: string | null;
  error: string | null;
}

export async function uploadImage({
  bucket,
  path,
  file,
  cacheControl,
  upsert,
}: UploadImageParams): Promise<UploadImageResult> {
  try {
    const supabase = getSupabaseBrowserClient();
    return await uploadToStorage(supabase, bucket, path, file, { cacheControl, upsert });
  } catch {
    return { path: null, error: "Upload failed — check your connection and try again." };
  }
}

/**
 * Rollback helper: call this when a browser upload succeeded but the
 * follow-up metadata Server Action failed, so the object doesn't linger
 * orphaned in Storage. Best-effort — a rollback failure is logged, never
 * thrown, since the caller is already in its own error-handling path and
 * an orphaned file is a much smaller problem than losing the original
 * error message.
 */
export async function rollbackImageUpload(bucket: string, path: string): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await removeFromStorage(supabase, bucket, [path]);
    if (error) console.error("[rollbackImageUpload] Failed to remove orphaned object:", error);
  } catch (err) {
    console.error("[rollbackImageUpload] Threw:", err);
  }
}
