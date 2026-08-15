import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ContentForm } from "@/components/admin/content-form";
import { getAllVehiclesForAdmin } from "@/lib/data/vehicles";
import { vehicleTitle } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Add Content" };

export default async function NewContentPage() {
  const vehicles = await getAllVehiclesForAdmin();
  const vehicleOptions = vehicles.map((v) => ({ id: v.id, label: `${vehicleTitle(v)} — ${v.stockNumber}` }));

  return (
    <div>
      <PageHeader
        title="Add Content"
        description="A thumbnail can be added once the item is created — save it first."
      />
      <ContentForm vehicleOptions={vehicleOptions} />
    </div>
  );
}
