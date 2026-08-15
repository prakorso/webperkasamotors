"use server";

import { revalidatePath } from "next/cache";
import type {
  VehicleType,
  VehicleStatus,
  Transmission,
  FuelType,
} from "@/lib/types";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";

/**
 * Server Actions for vehicle create/update/archive — separated from
 * lib/data/vehicles.ts's plain reads, same reason as
 * lib/actions/site-settings.ts (Batch 2): a whole-file "use server"
 * module is the only pattern Next.js supports for Server Functions
 * called from Client Components.
 */

export interface VehicleInput {
  stockNumber: string;
  vehicleType: VehicleType;
  brand: string;
  model: string;
  variant: string | null;
  year: number;
  price: number;
  mileageKm: number;
  transmission: Transmission;
  fuelType: FuelType;
  exteriorColor: string | null;
  location: string | null;
  condition: "NEW" | "USED";
  status: VehicleStatus;
  isPublished: boolean;
  isFeatured: boolean;
  description: string;
  highlights: string[];
  seoTitle: string | null;
  seoDescription: string | null;
}

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Server-side validation — never trust the client, even though every
 * field is also constrained by an HTML input on the form.
 *
 * description is NOT required here, on purpose: the Inventory admin
 * form (components/admin/vehicle-form.tsx) no longer has a Description
 * field at all, per a UX simplification — requiring it would make
 * vehicle creation permanently impossible through that form. This
 * matches the database column itself, which is `not null default ''`,
 * not a hard non-empty requirement — this function used to be stricter
 * than the schema; now it isn't.
 */
function validateVehicleInput(input: VehicleInput): string | null {
  if (!input.stockNumber.trim()) return "Stock number is required.";
  if (!input.brand.trim()) return "Brand is required.";
  if (!input.model.trim()) return "Model is required.";
  if (!Number.isInteger(input.year) || input.year < 1980 || input.year > CURRENT_YEAR + 1) {
    return `Year must be between 1980 and ${CURRENT_YEAR + 1}.`;
  }
  if (!Number.isFinite(input.price) || input.price <= 0) return "Price must be a positive number.";
  if (!Number.isFinite(input.mileageKm) || input.mileageKm < 0) return "Mileage cannot be negative.";
  return null;
}

/**
 * Row fields shared by create and update. Deliberately excludes `slug` —
 * it's not part of VehicleInput at all anymore (see the form: there's no
 * slug field for staff to fill in). createVehicle generates and inserts
 * it separately, once, on the way in; updateVehicle's UPDATE statement
 * therefore never includes a `slug` key and so never touches the existing
 * value — see updateVehicle's comment for why that's deliberate.
 */
function toRow(input: VehicleInput) {
  return {
    stock_number: input.stockNumber.trim(),
    vehicle_type: input.vehicleType,
    brand: input.brand.trim(),
    model: input.model.trim(),
    variant: input.variant?.trim() || null,
    year: input.year,
    price: input.price,
    mileage_km: input.mileageKm,
    transmission: input.transmission,
    fuel_type: input.fuelType,
    exterior_color: input.exteriorColor?.trim() || null,
    location: input.location?.trim() || null,
    condition: input.condition,
    status: input.status,
    is_published: input.isPublished,
    is_featured: input.isFeatured,
    description: input.description.trim(),
    highlights: input.highlights.filter((h) => h.trim().length > 0),
    seo_title: input.seoTitle?.trim() || null,
    seo_description: input.seoDescription?.trim() || null,
  };
}

/** Friendlier message for the two UNIQUE constraints (stock_number, slug) than raw Postgres error text. */
function friendlyConstraintError(message: string): string {
  if (message.includes("vehicles_stock_number_key")) {
    return "That stock number is already in use by another vehicle.";
  }
  if (message.includes("vehicles_slug_key")) {
    return "Generated slug collided with an existing one — this should be extremely rare; try saving again.";
  }
  return message;
}

// ---------------------------------------------------------------------------
// Slug generation — createVehicle only. A vehicle's slug is its public URL
// identifier (vehicles.slug, unique — supabase/migrations/*_tables.sql),
// so it's generated once at creation and never touched again: editing
// brand/model/variant/year later must not change it, or every existing
// link to that vehicle (bookmarks, shared links, search engine index)
// breaks. There's no admin UI to regenerate it — that's deliberate, not a
// missing feature.
// ---------------------------------------------------------------------------

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics — "é" -> "e"
    .toLowerCase()
    .replace(/[/,&_.]+/g, " ") // treat common separators as word breaks, not deletions -- "A/C" -> "a c", not "ac"
    .replace(/[^a-z0-9\s-]/g, "") // drop anything that isn't alphanumeric/space/hyphen
    .trim()
    .replace(/[\s-]+/g, "-") // collapse whitespace and repeated hyphens into one
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}

function buildSlugBase(input: Pick<VehicleInput, "brand" | "model" | "variant" | "year">): string {
  const parts = [input.brand, input.model, input.variant, String(input.year)].filter(
    (part): part is string => Boolean(part && part.trim())
  );
  return slugify(parts.join(" "));
}

/** Deterministic uniqueness: base, then base-2, base-3, … — the first one not already in use. */
async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof getSupabaseSessionClient>>,
  base: string
): Promise<string> {
  let candidate = base;
  let suffix = 2;
  // A staff member creating vehicles one at a time never loops more than
  // once or twice in practice; this only runs longer if many vehicles
  // share the exact same brand/model/variant/year.
  for (;;) {
    const { data } = await supabase.from("vehicles").select("id").eq("slug", candidate).limit(1);
    if (!data || data.length === 0) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function createVehicle(
  input: VehicleInput
): Promise<{ error: string | null; id?: string }> {
  const validationError = validateVehicleInput(input);
  if (validationError) return { error: validationError };

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const slugBase = buildSlugBase(input);
  if (!slugBase) {
    return { error: "Could not generate a URL from Brand, Model, and Year — check those fields." };
  }
  const slug = await generateUniqueSlug(supabase, slugBase);

  const { data, error } = await supabase
    .from("vehicles")
    .insert({ ...toRow(input), slug, created_by: user.id })
    .select("id")
    .single();

  if (error) {
    return { error: error.code === "23505" ? friendlyConstraintError(error.message) : error.message };
  }

  revalidatePath("/", "layout");
  return { error: null, id: (data as unknown as { id: string }).id };
}

/**
 * Never touches `slug` — toRow() doesn't include it, so this UPDATE
 * statement doesn't set that column at all, regardless of how far
 * brand/model/variant/year drift from what the slug was generated from.
 * That's the whole point: an existing public URL must never break because
 * someone corrected a typo in the model name.
 */
export async function updateVehicle(
  id: string,
  input: VehicleInput
): Promise<{ error: string | null }> {
  const validationError = validateVehicleInput(input);
  if (validationError) return { error: validationError };

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("vehicles").update(toRow(input)).eq("id", id);

  if (error) {
    return { error: error.code === "23505" ? friendlyConstraintError(error.message) : error.message };
  }

  revalidatePath("/", "layout");
  return { error: null };
}

/**
 * "Delete" in this admin means archive, not a destructive row removal.
 * The schema already models this: VehicleStatus includes ARCHIVED, and
 * public visibility (RLS) already excludes it regardless of is_published.
 * A hard DELETE would cascade-remove vehicle_media (foreign key ON DELETE
 * CASCADE) and orphan any leads/content that reference this vehicle —
 * far more destructive than routine inventory management calls for, and
 * nothing in the approved schema asked for that workflow. Reversible: an
 * archived vehicle can be brought back by editing its status again.
 */
export async function archiveVehicle(id: string): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("vehicles").update({ status: "ARCHIVED" }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { error: null };
}
