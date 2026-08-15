"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/admin/website", label: "General" },
  { href: "/admin/website/navigation", label: "Header & Navigation" },
  { href: "/admin/website/footer", label: "Footer" },
  { href: "/admin/website/homepage", label: "Homepage" },
];

export function WebsiteSubnav() {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-4 py-3 font-body text-[13px] font-medium transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-ink"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
