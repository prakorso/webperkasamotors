"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ADMIN_NAV_ITEMS } from "./nav-items";
import { useAdminShell } from "./admin-shell-context";

/**
 * Desktop (lg:+): always visible, fixed, 240px.
 * Tablet/mobile: off-canvas, toggled from Topbar — a dense application
 * shell, not a scaled-down version of the public site's editorial layout.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAdminShell();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/admin/dashboard" className="whitespace-nowrap">
            <span className="font-display text-headline-sm text-primary">Perkasa Motors</span>
            <span className="block font-body text-[11px] uppercase tracking-[0.1em] text-muted">
              Admin Console
            </span>
          </Link>
        </div>

        <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 border-l-2 px-3 py-2.5 font-body text-[13px] font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-transparent text-muted hover:bg-surface-muted hover:text-ink"
                    )}
                  >
                    <Icon size={18} aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-3">
          <Link
            href="/admin/login"
            className="flex items-center gap-3 px-3 py-2.5 font-body text-[13px] text-muted hover:text-ink"
          >
            <LogOut size={18} aria-hidden />
            Sign Out
          </Link>
        </div>
      </aside>
    </>
  );
}
