import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client factory — infrastructure only.
 *
 * PHASE 2B: not imported by lib/data/*.ts or any page yet. The vehicle
 * read path (and everything else) still reads from lib/mock/. This exists
 * so the client is ready to use when a future phase swaps lib/data's
 * implementation — see docs/PHASE-2-SUPABASE-PLAN.md section G.
 *
 * Uses the anon/publishable key, not the service role key. Row Level
 * Security (supabase/migrations/*_rls_policies.sql) is the actual access
 * boundary, so this client is safe to use for every public read path
 * without ever seeing service-role credentials. A separate service-role
 * client factory belongs with the admin write paths that need it — not
 * added here, since none exist yet.
 *
 * Reads configuration from environment variables only; nothing here is
 * ever hardcoded. Throws with an explicit message rather than silently
 * returning a broken client if those variables aren't set — which is
 * expected and fine today, since nothing calls this yet.
 */

let cachedClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured: NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must both be set. " +
        "lib/data/*.ts does not call this yet in Phase 2B — if you're " +
        "seeing this error, something is calling getSupabaseServerClient() " +
        "ahead of the planned cutover."
    );
  }

  cachedClient ??= createClient(url, key, {
    auth: { persistSession: false },
  });
  return cachedClient;
}
