/**
 * Domain types for the vehicle inventory.
 *
 * These describe the shape the UI consumes today (backed by lib/mock).
 * They intentionally only cover fields the current UI needs — the full
 * database-generated types arrive once Supabase is connected in Phase 2,
 * at which point these are expected to be superseded by generated types,
 * not hand-maintained forever.
 */

export type VehicleType = "CAR" | "MOTORCYCLE";

export type VehicleStatus =
  | "DRAFT"
  | "AVAILABLE"
  | "RESERVED"
  | "SOLD"
  | "ARCHIVED";

export type Transmission = "MANUAL" | "AUTOMATIC" | "CVT";

export type FuelType = "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC";

export interface Vehicle {
  id: string;
  stockNumber: string;
  slug: string;
  vehicleType: VehicleType;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  price: number;
  currency: "IDR";
  mileageKm: number;
  transmission: Transmission;
  fuelType: FuelType;
  exteriorColor?: string;
  /** Showroom / lot the unit is physically at. Optional — single-location
   *  today, but every listing already implies "where is this car" as a
   *  question a buyer asks, so the field exists ahead of a second location. */
  location?: string;
  condition: "NEW" | "USED";
  status: VehicleStatus;
  /** Distinct from `status`: a vehicle can be AVAILABLE internally while
   *  still withheld from the public site (e.g. pending photography). Public
   *  data-access functions must require both isPublished and a public
   *  status — see isPubliclyVisible() in lib/data/vehicles.ts. */
  isPublished: boolean;
  isFeatured: boolean;
  description: string;
  /** Short highlight specs shown on the vehicle card and detail hero. */
  highlights: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface VehicleMedia {
  id: string;
  vehicleId: string;
  mediaType:
    | "EXTERIOR"
    | "INTERIOR"
    | "ENGINE"
    | "WHEELS"
    | "DOCUMENT"
    | "VIDEO"
    | "WALKAROUND"
    | "OTHER";
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}
