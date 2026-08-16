import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The one place Supabase Storage's own API surface (`.storage.from(bucket)
 * .upload/.remove/.getPublicUrl`) is actually called from. Every other
 * file — browser upload utilities, Server Actions, read-side data
 * functions — goes through these three functions instead of touching
 * `supabase.storage` directly.
 *
 * Why this exists: if Perkasa Motors ever moves off Supabase Storage (S3,
 * Cloudflare R2, etc.), this is the only file that needs a second
 * implementation. No CMS component, Server Action, or read function would
 * need to change — they only know about `uploadToStorage`/
 * `removeFromStorage`/`getStoragePublicUrl`, never the underlying SDK.
 *
 * Deliberately NOT a provider interface/registry/plugin system — that's
 * more machinery than a one-person business's media system needs today.
 * Just a seam: three functions, one implementation, swappable later.
 *
 * Takes an already-constructed SupabaseClient rather than constructing
 * its own — callers already have one from lib/supabase/browser.ts,
 * lib/supabase/server.ts, or lib/supabase/server-session.ts (browser vs.
 * server-anon vs. server-session are about *auth context*, which this
 * file has no opinion on; RLS is what actually decides whether a given
 * call succeeds).
 */

export interface StorageUploadResult {
  path: string | null;
  error: string | null;
}

export interface StorageError {
  error: string | null;
}

export async function uploadToStorage(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  file: File | Blob | ArrayBuffer,
  opts?: { cacheControl?: string; upsert?: boolean; contentType?: string }
): Promise<StorageUploadResult> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: opts?.cacheControl ?? "3600",
    upsert: opts?.upsert ?? false,
    contentType: opts?.contentType,
  });
  if (error) return { path: null, error: error.message };
  return { path, error: null };
}

export async function removeFromStorage(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[]
): Promise<StorageError> {
  if (paths.length === 0) return { error: null };
  const { error } = await supabase.storage.from(bucket).remove(paths);
  return { error: error?.message ?? null };
}

export function getStoragePublicUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
