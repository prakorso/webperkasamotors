import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Session-aware Supabase client for Server Components, Server Actions, and
 * Route Handlers under /admin. Distinct from lib/supabase/server.ts (the
 * public, anon-only, session-less client lib/data/vehicles.ts reads
 * through) — this one reads/writes the auth session cookie via
 * next/headers, so it only makes sense inside a request context, never at
 * module scope.
 *
 * Still only the anon/publishable key. What elevates a signed-in user's
 * requests past anon-level RLS to the "authenticated" + is_active_staff()
 * policies is their own session JWT, carried in the cookie — never a
 * service-role key.
 */
export async function getSupabaseSessionClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured: NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must both be set."
    );
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component during render, which can't set
          // cookies — middleware.ts is what actually refreshes the session
          // cookie on the way in. Safe to ignore here.
        }
      },
    },
  });
}

export type StaffRole = "OWNER" | "ADMIN" | "STAFF";

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: StaffRole;
  isActive: boolean;
}

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  role: StaffRole;
  is_active: boolean;
}

/**
 * The signed-in staff member's profile, or null if there is no session, no
 * matching profiles row, or the profile is deactivated. This — not just
 * "is there a session" — is the actual admin-access check; use it (or the
 * shell layout that already calls it) rather than checking auth state
 * alone.
 */
export async function getCurrentAdminProfile(): Promise<AdminProfile | null> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as unknown as ProfileRow | null;
  if (!profile || !profile.is_active) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    isActive: profile.is_active,
  };
}
