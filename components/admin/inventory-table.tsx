"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Vehicle } from "@/lib/types";
import { formatIDR, vehicleTitle } from "@/lib/utils/format";
import { VehicleStatusBadge } from "@/components/ui/vehicle-status-badge";
import { deleteVehicle } from "@/lib/actions/vehicles";

/**
 * SOLD/RESERVED vehicles can't be deleted — the vehicles_before_delete
 * trigger (supabase/migrations/20260816010000_vehicle_stock_number_reuse_
 * and_safe_delete.sql) would reject it anyway, but disabling it here too
 * means staff see why up front instead of hitting a database error.
 */
const UNDELETABLE_STATUSES: Vehicle["status"][] = ["SOLD", "RESERVED"];

function DeleteAction({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = UNDELETABLE_STATUSES.includes(vehicle.status);

  if (locked) {
    return (
      <span
        className="font-body text-[13px] text-muted-2"
        title={`This vehicle is ${vehicle.status.toLowerCase()} — its stock number is permanently reserved and it can't be deleted. Archive it instead.`}
      >
        Delete
      </span>
    );
  }

  async function handleDelete() {
    if (
      !confirm(
        `Permanently delete ${vehicleTitle(vehicle)} (${vehicle.stockNumber})? This removes its photos and cannot be undone. Its stock number will become available for reuse.`
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    const result = await deleteVehicle(vehicle.id);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="font-body text-[13px] font-medium text-primary hover:text-ink disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>
      {error && <span className="font-body text-[12px] text-primary">{error}</span>}
    </span>
  );
}

export function InventoryTable({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <table className="w-full min-w-[820px] border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-left">
            <th className="px-4 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-muted">
              Stock #
            </th>
            <th className="px-4 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-muted">
              Vehicle
            </th>
            <th className="px-4 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-muted">
              Type
            </th>
            <th className="px-4 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-muted">
              Price
            </th>
            <th className="px-4 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-muted">
              Status
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id} className="border-b border-border last:border-b-0 hover:bg-surface-muted">
              <td className="whitespace-nowrap px-4 py-3 font-body text-[13px] text-muted">
                {vehicle.stockNumber}
              </td>
              <td className="px-4 py-3 font-body text-[13px] font-medium text-ink">
                {vehicleTitle(vehicle)}
                <span className="block font-body text-[12px] font-normal text-muted">
                  {vehicle.year}
                </span>
              </td>
              <td className="px-4 py-3 font-body text-[13px] text-muted">
                {vehicle.vehicleType === "CAR" ? "Car" : "Motorcycle"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-body text-[13px] text-ink">
                {formatIDR(vehicle.price)}
              </td>
              <td className="px-4 py-3">
                <VehicleStatusBadge status={vehicle.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <span className="inline-flex items-center gap-4">
                  <Link
                    href={`/admin/inventory/${vehicle.id}`}
                    className="font-body text-[13px] font-medium text-primary hover:text-ink"
                  >
                    Edit
                  </Link>
                  <DeleteAction vehicle={vehicle} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
