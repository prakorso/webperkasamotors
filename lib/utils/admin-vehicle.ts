import type { Vehicle, VehicleStatus } from "@/lib/types";

/** Owner-facing (Indonesian) status labels for the admin. The public site has its own mapping in lib/utils/format.ts. */
const ADMIN_STATUS_LABEL: Record<VehicleStatus, string> = {
  DRAFT: "Draft",
  AVAILABLE: "Tersedia",
  RESERVED: "Dipesan",
  SOLD: "Terjual",
  ARCHIVED: "Arsip",
};

export function adminStatusLabel(status: VehicleStatus): string {
  return ADMIN_STATUS_LABEL[status];
}

export const ADMIN_STATUS_VARIANT: Record<
  VehicleStatus,
  "success" | "warning" | "neutral" | "info" | "primary" | "outline"
> = {
  DRAFT: "outline",
  AVAILABLE: "success",
  RESERVED: "warning",
  SOLD: "neutral",
  ARCHIVED: "outline",
};

const PUBLIC_STATUSES: VehicleStatus[] = ["AVAILABLE", "RESERVED", "SOLD"];

/** Mirrors the public RLS rule: visible only when published AND in a public status. */
export function isLiveOnSite(vehicle: Pick<Vehicle, "status" | "isPublished">): boolean {
  return vehicle.isPublished && PUBLIC_STATUSES.includes(vehicle.status);
}

/** A status that should be public but whose is_published flag disagrees (legacy rows). */
export function needsPublishSync(vehicle: Pick<Vehicle, "status" | "isPublished">): boolean {
  return PUBLIC_STATUSES.includes(vehicle.status) && !vehicle.isPublished;
}

/** Same set as the vehicles_before_delete trigger's lock. */
export const UNDELETABLE_STATUSES: VehicleStatus[] = ["SOLD", "RESERVED"];
