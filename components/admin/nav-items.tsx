import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Car,
  Users,
  Newspaper,
  Image as ImageIcon,
  Settings,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inventory", label: "Inventory", icon: Car },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/content", label: "Content", icon: Newspaper },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
