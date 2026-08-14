import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * First line of defense for /admin/*. Refreshes the Supabase session
 * cookie and redirects unauthenticated requests to /admin/login.
 *
 * Named `proxy` (not `middleware`) per Next.js 16 — the `middleware.ts`
 * file convention was renamed in this version; see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
 *
 * This checks only "is there a valid session" — it does not check
 * profiles.is_active or role, because Proxy can't safely do a second
 * database round-trip on every request without materially slowing the
 * whole admin console down. The deeper check (session + active profile
 * row) happens in app/(admin)/admin/(shell)/layout.tsx, which every
 * protected page renders through — that's the actual authorization
 * boundary; this is just the fast, first-pass gate that keeps signed-out
 * visitors from ever reaching a protected page at all.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginRoute = request.nextUrl.pathname === "/admin/login";

  if (!user && !isLoginRoute) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (user && isLoginRoute) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
