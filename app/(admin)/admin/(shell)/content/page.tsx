import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ContentTable } from "@/components/admin/content-table";
import { buttonVariants } from "@/components/ui/button";
import { getAllContentForAdmin } from "@/lib/data/social-content";
import { getAllVehiclesForAdmin } from "@/lib/data/vehicles";
import { vehicleTitle } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Content" };

export default async function AdminContentPage() {
  const [items, vehicles] = await Promise.all([getAllContentForAdmin(), getAllVehiclesForAdmin()]);
  const vehicleTitles = Object.fromEntries(vehicles.map((v) => [v.id, vehicleTitle(v)]));

  return (
    <div>
      <PageHeader
        title="Content"
        description={`${items.length} item${items.length === 1 ? "" : "s"} — overview of everything across every vehicle. To add or review one vehicle's social content, open it from Inventory instead.`}
        action={
          <Link href="/admin/content/new" className={buttonVariants({ variant: "primary" })}>
            <Plus size={16} aria-hidden />
            Add Content
          </Link>
        }
      />
      {items.length === 0 ? (
        <div className="border border-dashed border-border bg-surface p-8 text-center">
          <p className="font-body text-[13px] text-muted-2">
            No content yet. There&apos;s no automated Instagram ingestion — add items here as they
            come in.
          </p>
        </div>
      ) : (
        <ContentTable items={items} vehicleTitles={vehicleTitles} />
      )}
    </div>
  );
}
