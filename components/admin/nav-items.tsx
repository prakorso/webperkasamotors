import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Car,
  Users,
  Newspaper,
  FileText,
  Globe,
  Settings,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * The standalone Media page (image library across every vehicle) was
 * removed from this list — media is managed contextually instead
 * (Inventory > vehicle photos, Website > Hero/About/etc., Articles >
 * cover/OG image, Content > thumbnails). The route itself now redirects
 * to Inventory rather than 404ing — see app/(admin)/admin/(shell)/media/
 * page.tsx. No storage, bucket, upload action, or media table was
 * touched; this is a navigation-only change.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inventory", label: "Inventory", icon: Car },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/content", label: "Content", icon: Newspaper },
  { href: "/admin/articles", label: "Articles", icon: FileText },
  { href: "/admin/website", label: "Website", icon: Globe },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
