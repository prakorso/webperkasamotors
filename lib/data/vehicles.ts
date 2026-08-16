import "server-only";
import type { Vehicle, VehicleMedia, VehicleType } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";
import { getStoragePublicUrl } from "@/lib/storage/provider";

/**
 * Vehicle data access — read-only. Mutations (create/update/archive) live
 * in lib/actions/vehicles.ts as their own whole-file "use server" module;
 * see that file's header for why Server Actions can't share a module with
 * plain "server-only" reads (same reason as lib/actions/site-settings.ts
 * in Batch 2).
 *
 * The public functions (getFeaturedVehicles, getVehiclesByType,
 * getVehicleBySlug, getVehicleMedia, getRelatedVehicles) read via the
 * anon/publishable client — RLS (supabase/migrations/*_rls_policies.sql)
 * is what actually restricts what they can see.
 *
 * BATCH 3A: the three admin-only functions now read via the session
 * client instead of lib/mock — a real staff session exists (Batch 2's
 * admin auth), and the "staff can read all vehicles" RLS policy lets an
 * authenticated, active staff member see every vehicle regardless of
 * publish state. lib/mock/vehicles.ts remains as local-dev fixture data
 * only; nothing in app/ or components/ reads it anymore.
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
  const url = getStoragePublicUrl(supabase, VEHICLE_MEDIA_BUCKET, row.storage_path);
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    mediaType: row.media_type,
    url,
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

export interface VehicleRedirectTarget {
  vehicleType: VehicleType;
  slug: string;
}

/**
 * Looks up whether (vehicleType, slug) matches a vehicle's *previous*
 * identity — used by /cars/[slug] and /motorcycles/[slug] when the
 * direct lookup misses, so a renamed or re-typed vehicle's old URL
 * 308-redirects to its current one instead of 404ing (see
 * lib/actions/vehicles.ts:updateVehicle for where history rows come
 * from). Returns null if there's no history match, or if the vehicle it
 * pointed to is no longer publicly visible — RLS on `vehicles` already
 * filters that second query the same way every other public read here
 * is filtered, so an archived/unpublished target correctly falls
 * through to a genuine 404 rather than redirecting to a page that would
 * 404 anyway.
 */
export async function getVehicleRedirectTarget(
  vehicleType: VehicleType,
  slug: string
): Promise<VehicleRedirectTarget | null> {
  const supabase = getSupabaseServerClient();
  const { data: historyRow, error: historyError } = await supabase
    .from("vehicle_url_history")
    .select("vehicle_id")
    .eq("vehicle_type", vehicleType)
    .eq("slug", slug)
    .maybeSingle();

  if (historyError) throw new Error(`getVehicleRedirectTarget: ${historyError.message}`);
  if (!historyRow) return null;

  const vehicleId = (historyRow as unknown as { vehicle_id: string }).vehicle_id;

  const { data: vehicleRow, error: vehicleError } = await supabase
    .from("vehicles")
    .select("slug, vehicle_type")
    .eq("id", vehicleId)
    .maybeSingle();

  if (vehicleError) throw new Error(`getVehicleRedirectTarget: ${vehicleError.message}`);
  if (!vehicleRow) return null;

  const row = vehicleRow as unknown as { slug: string; vehicle_type: VehicleType };
  return { vehicleType: row.vehicle_type, slug: row.slug };
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
// Admin-only — session-authenticated. RLS's "staff can read all vehicles" /
// "staff can read all media" policies (supabase/migrations/*_rls_policies.sql)
// are what actually allow these to see DRAFT/ARCHIVED/unpublished rows —
// an inactive or signed-out caller gets the same publicly-visible subset
// the anon functions above return, never an error, since RLS just filters
// rows rather than rejecting the query.
// ---------------------------------------------------------------------------

/** Admin-only: every vehicle regardless of public visibility, newest first. */
export async function getAllVehiclesForAdmin(): Promise<Vehicle[]> {
  const supabase = await getSupabaseSessionClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(VEHICLE_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getAllVehiclesForAdmin: ${error.message}`);
  return (data as unknown as VehicleRow[]).map(mapVehicleRow);
}

export async function getVehicleByIdForAdmin(id: string): Promise<Vehicle | null> {
  const supabase = await getSupabaseSessionClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(VEHICLE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getVehicleByIdForAdmin: ${error.message}`);
  return data ? mapVehicleRow(data as unknown as VehicleRow) : null;
}

/** Admin-only: every media item across every vehicle, grouped by vehicle then sortOrder. */
export async function getAllVehicleMediaForAdmin(): Promise<VehicleMedia[]> {
  const supabase = await getSupabaseSessionClient();
  const { data, error } = await supabase
    .from("vehicle_media")
    .select(MEDIA_COLUMNS)
    .order("vehicle_id", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`getAllVehicleMediaForAdmin: ${error.message}`);
  return (data as unknown as VehicleMediaRow[]).map(mapVehicleMediaRow);
}

/** Admin-only: every media item for one vehicle, in order — used by the Inventory edit page's media manager. */
export async function getVehicleMediaForAdmin(vehicleId: string): Promise<VehicleMedia[]> {
  const supabase = await getSupabaseSessionClient();
  const { data, error } = await supabase
    .from("vehicle_media")
    .select(MEDIA_COLUMNS)
    .eq("vehicle_id", vehicleId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`getVehicleMediaForAdmin: ${error.message}`);
  return (data as unknown as VehicleMediaRow[]).map(mapVehicleMediaRow);
}

