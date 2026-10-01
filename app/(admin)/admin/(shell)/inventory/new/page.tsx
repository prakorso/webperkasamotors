import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { VehicleForm } from "@/components/admin/vehicle-form";

export const metadata: Metadata = { title: "Tambah Unit" };

export default function NewVehiclePage() {
  return (
    <div>
      <PageHeader
        title="Tambah Unit"
        description="Isi data unit, lalu tambahkan foto di langkah berikutnya. Unit baru berstatus Draft sampai Anda menayangkannya."
      />
      <VehicleForm />
    </div>
  );
}
