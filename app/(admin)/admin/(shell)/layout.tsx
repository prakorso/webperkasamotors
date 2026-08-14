import { redirect } from "next/navigation";
import { AdminShellProvider } from "@/components/admin/admin-shell-context";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";
import { getCurrentAdminProfile } from "@/lib/supabase/server-session";
import { getWebsiteSettings } from "@/lib/data/site-settings";

/**
 * The actual authorization boundary for every /admin/* screen except
 * /admin/login (which lives outside this route group). proxy.ts already
 * redirected unauthenticated requests before they got here; this
 * additionally requires an active `profiles` row — a deactivated staff
 * account can still hold a valid Supabase Auth session but must not see
 * the console, and the proxy alone can't check that without a database
 * round trip on every request.
 */
export default async function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const [profile, settings] = await Promise.all([
    getCurrentAdminProfile(),
    getWebsiteSettings(),
  ]);
  if (!profile) redirect("/admin/login");

  return (
    <AdminShellProvider>
      <div className="min-h-full bg-paper">
        <Sidebar profile={profile} settings={settings} />
        <div className="lg:pl-64">
          <Topbar profile={profile} />
          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </AdminShellProvider>
  );
}
