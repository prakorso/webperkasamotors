"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/admin/website/homepage", label: "Beranda" },
  { href: "/admin/website/about", label: "Tentang" },
  { href: "/admin/website", label: "Kontak & WhatsApp" },
  { href: "/admin/website/advanced", label: "Lanjutan" },
];

export function WebsiteSubnav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Bagian website" className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-3 font-body text-[13px] font-medium transition-colors",
              active ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
