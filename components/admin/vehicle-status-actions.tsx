"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Vehicle, VehicleStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { setVehicleStatus } from "@/lib/actions/vehicles";
import { needsPublishSync } from "@/lib/utils/admin-vehicle";

interface StatusAction {
  label: string;
  to: VehicleStatus;
  /** Extra confirmation text for actions that are hard to take back from the UI. */
  confirm?: string;
}

/**
 * Owner-facing status moves, per current status. Mirrors (and the server
 * re-validates against) ALLOWED_TRANSITIONS in lib/actions/vehicles.ts.
 */
function actionsFor(status: VehicleStatus): StatusAction[] {
  switch (status) {
    case "DRAFT":
      return [{ label: "Tayangkan", to: "AVAILABLE" }];
    case "AVAILABLE":
      return [
        { label: "Tandai Dipesan", to: "RESERVED" },
        {
          label: "Tandai Terjual",
          to: "SOLD",
          confirm:
            "Tandai unit ini sebagai Terjual? Setelah terjual, unit tidak bisa dikembalikan ke Tersedia dari sini.",
        },
      ];
    case "RESERVED":
      return [
        {
          label: "Tandai Terjual",
          to: "SOLD",
          confirm:
            "Tandai unit ini sebagai Terjual? Setelah terjual, unit tidak bisa dikembalikan ke Tersedia dari sini.",
        },
        { label: "Tersedia Lagi", to: "AVAILABLE" },
      ];
    case "ARCHIVED":
      return [{ label: "Kembalikan ke Draft", to: "DRAFT" }];
    default:
      return [];
  }
}

/**
 * Buttons for the owner's two-tap status changes. The server action does
 * the real validation (allowed transition, at least one photo before going
 * live); this component only offers the moves that make sense and shows the
 * server's message if one is refused. `size="sm"` for the list, "md" on the
 * edit page.
 */
export function VehicleStatusActions({
  vehicle,
  size = "sm",
}: {
  vehicle: Pick<Vehicle, "id" | "status" | "isPublished">;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<VehicleStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = actionsFor(vehicle.status);
  const resync = needsPublishSync(vehicle);

  async function run(to: VehicleStatus, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(to);
    setError(null);
    const result = await setVehicleStatus(vehicle.id, to);
    setBusy(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {resync && (
          <Button
            type="button"
            variant="primary"
            size={size}
            disabled={busy !== null}
            onClick={() => run(vehicle.status)}
          >
            {busy === vehicle.status ? "Menayangkan…" : "Tayangkan"}
          </Button>
        )}
        {actions.map((action) => (
          <Button
            key={action.to}
            type="button"
            variant={action.to === "AVAILABLE" && vehicle.status === "DRAFT" ? "primary" : "outline"}
            size={size}
            disabled={busy !== null}
            onClick={() => run(action.to, action.confirm)}
          >
            {busy === action.to ? "Menyimpan…" : action.label}
          </Button>
        ))}
      </div>
      {error && <p className="font-body text-[12px] text-primary">{error}</p>}
    </div>
  );
}
