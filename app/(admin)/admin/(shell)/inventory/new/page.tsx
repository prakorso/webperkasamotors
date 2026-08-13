import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { VehicleForm } from "@/components/admin/vehicle-form";

export const metadata: Metadata = { title: "Add Vehicle" };

export default function NewVehiclePage() {
  return (
    <div>
      <PageHeader title="Add Vehicle" description="Visual form shell — Phase 2 connects this to Supabase." />
      <VehicleForm />
    </div>
  );
}
