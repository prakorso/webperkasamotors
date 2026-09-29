import type { Vehicle, VehicleMedia, VehicleStatus, Lead } from "@/lib/types";

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

/**
 * Every vehicle_media row is uploaded with alt_text = "" (see
 * lib/actions/vehicle-media.ts) — there is no CMS field for it (Phase
 * 2C.2 decision: a deterministic fallback is simpler and more reliable
 * than asking staff to type alt text for every photo). Preserves a real,
 * non-empty alt value if one is ever set some other way; otherwise
 * derives "{Vehicle Name} {Year} — foto {N}" from data that's already on
 * the record. `sortOrder` (not array position) is the source for N so
 * the number stays correct even when the caller only has a single photo
 * (e.g. a card's primaryMedia) rather than the vehicle's full media list.
 */
export function vehicleMediaAlt(vehicle: Vehicle, media: VehicleMedia): string {
  const existing = media.altText.trim();
  if (existing) return existing;
  return `${vehicleTitle(vehicle)} ${vehicle.year} — foto ${media.sortOrder + 1}`;
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

/**
 * A lead's interestedVehicleId is a foreign key into a separately-sourced
 * vehicles list — the two are joined in the presentation layer, not by a
 * database join, so "referenced vehicle isn't in the loaded list" is a
 * real, permanent case to handle, not a hypothetical one. (It's the
 * current case for every non-null lead in lib/mock/leads.ts, which still
 * uses Phase 1's short mock ids like "v1" — lib/data/vehicles.ts now
 * returns real Supabase UUIDs, so none of those ids match. That's a
 * pre-existing mismatch between still-mock leads and now-real vehicles,
 * not something to paper over: even once leads is Supabase-backed, a
 * lead can still reference a vehicle that isn't in whatever vehicle list
 * happens to be loaded, so this stays a real lookup-can-miss case either
 * way.)
 *
 * Distinguishes "no vehicle was ever selected" from "a vehicle was
 * selected but isn't in the current list" — collapsing both into one
 * label would be the fallback-that-hides-a-real-state this function
 * exists to avoid.
 */
export function leadInterestLabel(lead: Lead, vehicles: Vehicle[]): string {
  if (!lead.interestedVehicleId) return "General inquiry";
  const vehicle = vehicles.find((v) => v.id === lead.interestedVehicleId);
  return vehicle ? vehicleTitle(vehicle) : "Vehicle no longer available";
}
