import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { InventoryTable } from "@/components/admin/inventory-table";
import { buttonVariants } from "@/components/ui/button";
import { getAllVehiclesForAdmin } from "@/lib/data/vehicles";

export const metadata: Metadata = { title: "Inventory" };

export default async function AdminInventoryPage() {
  const vehicles = await getAllVehiclesForAdmin();

  return (
    <div>
      <PageHeader
        title="Vehicle Inventory"
        description={`${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"} — all statuses, including drafts and archived.`}
        action={
          <Link href="/admin/inventory/new" className={buttonVariants({ variant: "primary" })}>
            <Plus size={16} aria-hidden />
            Add Vehicle
          </Link>
        }
      />
      <InventoryTable vehicles={vehicles} />
    </div>
  );
}
