import type { Vehicle, VehicleStatus } from "@/lib/types";

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMileage(km: number): string {
  return `${new Intl.NumberFormat("id-ID").format(km)} km`;
}

export function vehicleTitle(vehicle: Vehicle): string {
  return [vehicle.brand, vehicle.model, vehicle.variant].filter(Boolean).join(" ");
}

const STATUS_LABEL: Record<VehicleStatus, string> = {
  DRAFT: "Draft",
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  ARCHIVED: "Archived",
};

export function statusLabel(status: VehicleStatus): string {
  return STATUS_LABEL[status];
}
