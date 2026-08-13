import Link from "next/link";
import type { Vehicle } from "@/lib/types";
import { formatIDR, vehicleTitle } from "@/lib/utils/format";
import { VehicleStatusBadge } from "@/components/ui/vehicle-status-badge";

export function InventoryTable({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <table className="w-full min-w-[720px] border-collapse">
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
                <Link
                  href={`/admin/inventory/${vehicle.id}`}
                  className="font-body text-[13px] font-medium text-primary hover:text-ink"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
