import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-only Supabase client. Import this only from Client Components
 * ("use client") — it's used for sign-in/sign-out, where the call needs to
 * originate in the browser so @supabase/ssr can set the session cookie
 * that the server reads back via lib/supabase/server-session.ts and
 * middleware.ts.
 *
 * Anon/publishable key only, same as every other client in this codebase.
 */
let cached: ReturnType<typeof createBrowserClient> | undefined;

export function getSupabaseBrowserClient() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured: NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must both be set."
    );
  }

  cached = createBrowserClient(url, key);
  return cached;
}
