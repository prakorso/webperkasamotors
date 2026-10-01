import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Car, FileText, Globe } from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Phase 2R.5: the owner's four destinations. Everything else is reachable
 * by URL only and is intentionally NOT linked from the shell:
 *  - /admin/leads    - dormant. The public site uses direct WhatsApp, so
 *                      nothing writes leads; real CRM belongs to the future
 *                      Operating System.
 *  - /admin/content  - social content library; the public site no longer
 *                      shows social content.
 *  - /admin/settings - disabled placeholder shell.
 *  - /admin/media    - redirects to Inventory (photos live on each vehicle).
 * Routes and data are kept (nothing deleted); only the entry points moved.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/admin/inventory", label: "Inventory", icon: Car },
  { href: "/admin/website", label: "Website", icon: Globe },
  { href: "/admin/articles", label: "Artikel", icon: FileText },
];
