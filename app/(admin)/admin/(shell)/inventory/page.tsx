import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { InventoryList } from "@/components/admin/inventory-list";
import { buttonVariants } from "@/components/ui/button";
import { getAllVehiclesForAdmin } from "@/lib/data/vehicles";
import { cn } from "@/lib/utils/cn";
import type { Vehicle } from "@/lib/types";

export const metadata: Metadata = { title: "Inventory" };

type Tab = "semua" | "tersedia" | "dipesan" | "terjual" | "lainnya";

const TABS: Array<{ key: Tab; label: string; match: (v: Vehicle) => boolean }> = [
  { key: "semua", label: "Semua", match: () => true },
  { key: "tersedia", label: "Tersedia", match: (v) => v.status === "AVAILABLE" },
  { key: "dipesan", label: "Dipesan", match: (v) => v.status === "RESERVED" },
  { key: "terjual", label: "Terjual", match: (v) => v.status === "SOLD" },
  { key: "lainnya", label: "Draft / Arsip", match: (v) => v.status === "DRAFT" || v.status === "ARCHIVED" },
];

/**
 * The owner's primary day-to-day screen. Status tabs are filters on this
 * one route (?status=…), not separate menu items. Counts are over all
 * vehicles; the list shows the selected tab.
 */
export default async function AdminInventoryPage(props: PageProps<"/admin/inventory">) {
  const searchParams = await props.searchParams;
  const requested = Array.isArray(searchParams?.status) ? searchParams.status[0] : searchParams?.status;
  const active = TABS.find((t) => t.key === requested) ?? TABS[0];

  const vehicles = await getAllVehiclesForAdmin();
  const shown = vehicles.filter(active.match);

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Ubah status, harga, dan foto unit di sini."
        action={
          <Link href="/admin/inventory/new" className={buttonVariants({ variant: "primary" })}>
            <Plus size={16} aria-hidden />
            Tambah Unit
          </Link>
        }
      />

      <nav aria-label="Filter status" className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const count = vehicles.filter(tab.match).length;
          const isActive = tab.key === active.key;
          return (
            <Link
              key={tab.key}
              href={tab.key === "semua" ? "/admin/inventory" : `/admin/inventory?status=${tab.key}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 border px-3 py-2 font-body text-[13px] font-medium transition-colors",
                isActive
                  ? "border-ink bg-ink text-paper"
                  : "border-border bg-surface text-muted hover:border-ink hover:text-ink"
              )}
            >
              {tab.label}
              <span className={cn("tabular-nums", isActive ? "text-paper/80" : "text-muted-2")}>{count}</span>
            </Link>
          );
        })}
      </nav>

      <InventoryList vehicles={shown} />
    </div>
  );
}
