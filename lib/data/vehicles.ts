import "server-only";
import type { Vehicle, VehicleMedia, VehicleType } from "@/lib/types";
import { MOCK_VEHICLES, MOCK_VEHICLE_MEDIA } from "@/lib/mock/vehicles";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Vehicle data access.
 *
 * PHASE 2B: the public read functions below (getFeaturedVehicles,
 * getVehiclesByType, getVehicleBySlug, getVehicleMedia, getRelatedVehicles)
 * read from Supabase (public.vehicles / public.vehicle_media) via the
 * anon/publishable client. Row Level Security — see
 * supabase/migrations/*_rls_policies.sql — is what actually restricts
 * what these queries can see; there's no application-level visibility
 * filter left in this file for them.
 *
 * The three admin-only functions at the bottom still read from
 * lib/mock/vehicles.ts. That's deliberate, not leftover: there is no admin
 * auth yet (see docs/PHASE-2-SUPABASE-PLAN.md section E), so the only
 * Supabase client available here is anon-keyed — and the RLS policy above
 * means an anon query can never return a DRAFT or unpublished vehicle,
 * full stop. Pointing the admin functions at Supabase today would make
 * /admin/inventory silently show an incomplete list with no error. They
 * switch over once the admin write/auth phase lands a real staff session.
 *
 * Every function signature is unchanged from Phase 1 — no importing page
 * or component changed for this swap.
 */

const VEHICLE_MEDIA_BUCKET = "vehicle-media";

const VEHICLE_COLUMNS =
  "id, stock_number, slug, vehicle_type, brand, model, variant, year, price, " +
  "currency, mileage_km, transmission, fuel_type, exterior_color, location, " +
  "condition, status, is_published, is_featured, description, highlights, " +
  "seo_title, seo_description";

const MEDIA_COLUMNS = "id, vehicle_id, media_type, storage_path, alt_text, is_primary, sort_order";

/** Shape of a row from the `vehicles` table, before mapping to Vehicle. */
interface VehicleRow {
  id: string;
  stock_number: string;
  slug: string;
  vehicle_type: Vehicle["vehicleType"];
  brand: string;
  model: string;
  variant: string | null;
  year: number;
  price: number | string; // Postgres bigint comes back as a string over PostgREST
  currency: string;
  mileage_km: number;
  transmission: Vehicle["transmission"];
  fuel_type: Vehicle["fuelType"];
  exterior_color: string | null;
  location: string | null;
  condition: Vehicle["condition"];
  status: Vehicle["status"];
  is_published: boolean;
  is_featured: boolean;
  description: string;
  highlights: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
}

function mapVehicleRow(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    stockNumber: row.stock_number,
    slug: row.slug,
    vehicleType: row.vehicle_type,
    brand: row.brand,
    model: row.model,
    variant: row.variant ?? undefined,
    year: row.year,
    price: Number(row.price),
    currency: "IDR",
    mileageKm: row.mileage_km,
    transmission: row.transmission,
    fuelType: row.fuel_type,
    exteriorColor: row.exterior_color ?? undefined,
    location: row.location ?? undefined,
    condition: row.condition,
    status: row.status,
    isPublished: row.is_published,
    isFeatured: row.is_featured,
    description: row.description,
    highlights: row.highlights ?? [],
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
  };
}

/** Shape of a row from the `vehicle_media` table, before mapping to VehicleMedia. */
interface VehicleMediaRow {
  id: string;
  vehicle_id: string;
  media_type: VehicleMedia["mediaType"];
  storage_path: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
}

function mapVehicleMediaRow(row: VehicleMediaRow): VehicleMedia {
  const supabase = getSupabaseServerClient();
  const { data } = supabase.storage.from(VEHICLE_MEDIA_BUCKET).getPublicUrl(row.storage_path);
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    mediaType: row.media_type,
    url: data.publicUrl,
    altText: row.alt_text,
    isPrimary: row.is_primary,
    sortOrder: row.sort_order,
  };
}

export async function getFeaturedVehicles(limit = 4): Promise<Vehicle[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(VEHICLE_COLUMNS)
    .eq("is_featured", true)
    .eq("status", "AVAILABLE")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`getFeaturedVehicles: ${error.message}`);
  return (data as unknown as VehicleRow[]).map(mapVehicleRow);
}

export async function getVehiclesByType(type: VehicleType): Promise<Vehicle[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(VEHICLE_COLUMNS)
    .eq("vehicle_type", type)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`getVehiclesByType: ${error.message}`);
  return (data as unknown as VehicleRow[]).map(mapVehicleRow);
}

export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(VEHICLE_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`getVehicleBySlug: ${error.message}`);
  return data ? mapVehicleRow(data as unknown as VehicleRow) : null;
}

export async function getVehicleMedia(vehicleId: string): Promise<VehicleMedia[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("vehicle_media")
    .select(MEDIA_COLUMNS)
    .eq("vehicle_id", vehicleId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`getVehicleMedia: ${error.message}`);
  return (data as unknown as VehicleMediaRow[]).map(mapVehicleMediaRow);
}

export async function getRelatedVehicles(
  vehicle: Vehicle,
  limit = 3
): Promise<Vehicle[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(VEHICLE_COLUMNS)
    .eq("vehicle_type", vehicle.vehicleType)
    .neq("id", vehicle.id)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`getRelatedVehicles: ${error.message}`);
  return (data as unknown as VehicleRow[]).map(mapVehicleRow);
}

// ---------------------------------------------------------------------------
// Admin-only — still mock. See file header for why.
// ---------------------------------------------------------------------------

/** Admin-only: every vehicle regardless of public visibility. */
export async function getAllVehiclesForAdmin(): Promise<Vehicle[]> {
  return MOCK_VEHICLES;
}

export async function getVehicleByIdForAdmin(id: string): Promise<Vehicle | null> {
  return MOCK_VEHICLES.find((v) => v.id === id) ?? null;
}

/**
 * Admin-only: every media item across every vehicle, grouped by vehicle
 * (each vehicle's items already appear together, in sortOrder, in the
 * source data).
 */
export async function getAllVehicleMediaForAdmin(): Promise<VehicleMedia[]> {
  return [...MOCK_VEHICLE_MEDIA];
}
