import "server-only";
import type { Vehicle, VehicleMedia, VehicleType } from "@/lib/types";
import { MOCK_VEHICLES, MOCK_VEHICLE_MEDIA } from "@/lib/mock/vehicles";

/**
 * Vehicle data access.
 *
 * PHASE 1: reads from lib/mock/vehicles.ts.
 * PHASE 2: these function signatures stay the same; only the implementation
 * becomes a Supabase query. No component in app/ or components/ should ever
 * import lib/mock directly — always come through here.
 */

const PUBLIC_STATUSES = new Set(["AVAILABLE", "RESERVED", "SOLD"]);

function isPubliclyVisible(vehicle: Vehicle) {
  return PUBLIC_STATUSES.has(vehicle.status);
}

export async function getFeaturedVehicles(limit = 4): Promise<Vehicle[]> {
  return MOCK_VEHICLES.filter((v) => v.isFeatured && v.status === "AVAILABLE").slice(
    0,
    limit
  );
}

export async function getVehiclesByType(type: VehicleType): Promise<Vehicle[]> {
  return MOCK_VEHICLES.filter((v) => v.vehicleType === type && isPubliclyVisible(v));
}

export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  const vehicle = MOCK_VEHICLES.find((v) => v.slug === slug);
  if (!vehicle || !isPubliclyVisible(vehicle)) return null;
  return vehicle;
}

export async function getVehicleMedia(vehicleId: string): Promise<VehicleMedia[]> {
  return MOCK_VEHICLE_MEDIA.filter((m) => m.vehicleId === vehicleId).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
}

export async function getRelatedVehicles(
  vehicle: Vehicle,
  limit = 3
): Promise<Vehicle[]> {
  return MOCK_VEHICLES.filter(
    (v) =>
      v.id !== vehicle.id &&
      v.vehicleType === vehicle.vehicleType &&
      isPubliclyVisible(v)
  ).slice(0, limit);
}

/** Admin-only: every vehicle regardless of public visibility. */
export async function getAllVehiclesForAdmin(): Promise<Vehicle[]> {
  return MOCK_VEHICLES;
}

export async function getVehicleByIdForAdmin(id: string): Promise<Vehicle | null> {
  return MOCK_VEHICLES.find((v) => v.id === id) ?? null;
}
