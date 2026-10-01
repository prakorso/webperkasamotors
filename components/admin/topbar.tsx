"use client";

import { Menu } from "lucide-react";
import { useAdminShell } from "./admin-shell-context";
import type { AdminProfile } from "@/lib/supabase/server-session";

export function Topbar({ profile }: { profile: AdminProfile }) {
  const { setSidebarOpen } = useAdminShell();
  const displayName = profile.fullName || profile.email;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Buka menu"
          onClick={() => setSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center text-ink lg:hidden"
        >
          <Menu size={20} aria-hidden />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center border border-border bg-surface-muted font-body text-[13px] font-semibold text-ink"
            aria-hidden
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden text-right sm:block">
            <p className="font-body text-[13px] font-medium leading-tight text-ink">
              {displayName}
            </p>
            <p className="font-body text-[11px] uppercase leading-tight tracking-[0.06em] text-muted">
              {profile.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
