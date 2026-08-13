import type { VehicleStatus } from "@/lib/types";
import { statusLabel } from "@/lib/utils/format";
import { Badge } from "./badge";

const VARIANT: Record<VehicleStatus, "success" | "warning" | "neutral" | "info" | "primary"> = {
  DRAFT: "neutral",
  AVAILABLE: "success",
  RESERVED: "warning",
  SOLD: "primary",
  ARCHIVED: "neutral",
};

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  return <Badge variant={VARIANT[status]}>{statusLabel(status)}</Badge>;
}
