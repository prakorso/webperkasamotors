"use client";

import { Menu, Bell, Search } from "lucide-react";
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
          aria-label="Open sidebar"
          onClick={() => setSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center text-ink lg:hidden"
        >
          <Menu size={20} aria-hidden />
        </button>
        <div className="relative hidden md:block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search inventory, leads…"
            className="h-9 w-56 border border-border bg-paper pl-9 pr-3 font-body text-[13px] text-ink placeholder:text-muted-2 focus-visible:border-ink focus-visible:outline-none lg:w-72"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="text-muted hover:text-primary"
        >
          <Bell size={18} aria-hidden />
        </button>
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
