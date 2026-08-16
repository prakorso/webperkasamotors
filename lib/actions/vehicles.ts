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
  capacityCc: number | null;
  plateNumber: string | null;
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
 *
 * stockNumber is not validated here either — it's not part of
 * VehicleInput at all anymore. See generateStockNumber below.
 */
function validateVehicleInput(input: VehicleInput): string | null {
  if (!input.brand.trim()) return "Brand is required.";
  if (!input.model.trim()) return "Model is required.";
  if (!Number.isInteger(input.year) || input.year < 1980 || input.year > CURRENT_YEAR + 1) {
    return `Year must be between 1980 and ${CURRENT_YEAR + 1}.`;
  }
  if (!Number.isFinite(input.price) || input.price <= 0) return "Price must be a positive number.";
  if (!Number.isFinite(input.mileageKm) || input.mileageKm < 0) return "Mileage cannot be negative.";
  if (input.capacityCc !== null && (!Number.isFinite(input.capacityCc) || input.capacityCc <= 0)) {
    return "Kapasitas CC must be a positive number.";
  }
  return null;
}

/**
 * Row fields shared by create and update. Deliberately excludes `slug`
 * and `stock_number` — neither is part of VehicleInput at all anymore
 * (see the form: no field for either). createVehicle generates and
 * inserts both separately, once, on the way in; updateVehicle never
 * touches stock_number, and only touches slug when the vehicle's public
 * identity actually changed (see updateVehicle's own comment).
 */
function toRow(input: VehicleInput) {
  return {
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
    capacity_cc: input.capacityCc,
    plate_number: input.plateNumber?.trim() || null,
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
    return "Generated stock number collided with an existing one — this should be extremely rare; try saving again.";
  }
  if (message.includes("vehicles_slug_key")) {
    return "Generated slug collided with an existing one — this should be extremely rare; try saving again.";
  }
  return message;
}

// ---------------------------------------------------------------------------
// Slug generation. A vehicle's slug is its public URL identifier
// (vehicles.slug, unique — supabase/migrations/*_tables.sql). Unlike the
// original design, it's no longer permanently frozen at creation: it now
// follows the vehicle's identity (brand/model/variant/year) and its
// catalogue path follows vehicle_type, so an edited vehicle's URL stays
// accurate. What makes this safe for existing links is
// vehicle_url_history (supabase/migrations/20260815050100_vehicle_url_
// history.sql) — every (vehicle_type, slug) a vehicle has ever had is
// recorded there, and the public /cars/[slug] and /motorcycles/[slug]
// routes 308-redirect a historical URL to the vehicle's current one
// instead of 404ing.
// ---------------------------------------------------------------------------

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics — "é" -> "e"
    .toLowerCase()
    .replace(/[/,&_.]+/g, " ") // treat common separators as word breaks, not deletions -- "A/C" -> "a c", not "ac"
    .replace(/[^a-z0-9\s-]/g, "") // drop anything that isn't alphanumeric/space/hyphen
    .trim()
    .replace(/[\s-]+/g, "-") // collapse whitespace and repeated hyphens into one
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}

function buildSlugBase(input: {
  brand: string;
  model: string;
  variant: string | null;
  year: number;
}): string {
  const parts = [input.brand, input.model, input.variant, String(input.year)].filter(
    (part): part is string => Boolean(part && part.trim())
  );
  return slugify(parts.join(" "));
}

/**
 * Loose "does this slug still describe this vehicle" check — hyphenation/
 * spacing/case-insensitive substring test on brand+model only (not
 * variant/year, which many pre-dynamic-slug rows never included at all).
 * Used to catch slugs that are stale from *before* this edit (see
 * updateVehicle below) — deliberately looser than buildSlugBase, since a
 * slug merely missing a year suffix still correctly identifies its
 * vehicle and must NOT be treated as drift.
 */
function slugMatchesIdentity(
  slug: string,
  identity: { brand: string; model: string }
): boolean {
  const normalize = (s: string) => slugify(s).replace(/-/g, "");
  const identityToken = normalize(`${identity.brand} ${identity.model}`);
  const slugToken = normalize(slug);
  return identityToken.length > 0 && slugToken.includes(identityToken);
}

/** Deterministic uniqueness: base, then base-2, base-3, … — the first one not already in use. */
async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof getSupabaseSessionClient>>,
  base: string
): Promise<string> {
  let candidate = base;
  let suffix = 2;
  // A staff member editing vehicles one at a time never loops more than
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

  // Atomic, concurrency-safe — nextval() under the hood
  // (supabase/migrations/20260815050000_vehicle_stock_number_generation.sql).
  // Never a frontend MAX()+1: two staff creating vehicles at the same
  // moment can never receive the same number.
  const { data: stockNumberResult, error: stockNumberError } = await supabase.rpc(
    "generate_stock_number",
    { v_type: input.vehicleType }
  );
  if (stockNumberError) return { error: stockNumberError.message };
  const stockNumber = stockNumberResult as unknown as string;

  const { data, error } = await supabase
    .from("vehicles")
    .insert({ ...toRow(input), slug, stock_number: stockNumber, created_by: user.id })
    .select("id")
    .single();

  if (error) {
    return { error: error.code === "23505" ? friendlyConstraintError(error.message) : error.message };
  }

  revalidatePath("/", "layout");
  return { error: null, id: (data as unknown as { id: string }).id };
}

/**
 * stock_number is never included in the update payload — like the
 * original slug design, it's assigned once at creation and stays fixed
 * even if the vehicle's type is edited later, since it may already
 * correspond to real paperwork/asset tags.
 *
 * slug DOES change here now, but only when it needs to: this fetches the
 * vehicle's current brand/model/variant/year/vehicle_type/slug first,
 * recomputes what the slug *base* would be for both the old and new
 * identity, and regenerates when either the identity-derived base
 * changed, vehicle_type changed (which moves the catalogue path even if
 * the slug text itself wouldn't), or — separately — the *currently
 * stored* slug no longer even contains the vehicle's *currently stored*
 * brand/model (slugDrifted, see slugMatchesIdentity above).
 *
 * That third check matters: comparing old-vs-new submitted values only
 * ever catches drift introduced by *this* edit. It can never catch a row
 * whose brand/model were already changed at some point in the past
 * without slug ever following (e.g. a listing repurposed for a different
 * vehicle before this slug-dynamism feature existed) — in that case the
 * stored row and a same-value resubmission are identical, so old-vs-new
 * alone always reports "unchanged" and the stale slug would persist
 * forever, even across repeated saves. slugDrifted catches that case on
 * the next save regardless of what the admin actually edited. It's
 * deliberately loose (brand+model only, hyphenation-insensitive) so it
 * never fires on slugs that are merely missing a year/variant suffix —
 * only on slugs that no longer describe the vehicle at all.
 *
 * Editing price/status/description/etc. never touches the slug unless
 * slugDrifted is already true. Whenever the effective URL does change,
 * the *previous* (vehicle_type, slug) is recorded into
 * vehicle_url_history before the row is updated, so the old URL keeps
 * resolving via a redirect instead of 404ing.
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

  const { data: currentData, error: currentError } = await supabase
    .from("vehicles")
    .select("brand, model, variant, year, slug, vehicle_type")
    .eq("id", id)
    .maybeSingle();
  if (currentError) return { error: currentError.message };
  if (!currentData) return { error: "Vehicle not found." };

  const current = currentData as unknown as {
    brand: string;
    model: string;
    variant: string | null;
    year: number;
    slug: string;
    vehicle_type: VehicleType;
  };

  const oldBase = buildSlugBase(current);
  const newBase = buildSlugBase(input);
  const identityChanged = oldBase !== newBase;
  const typeChanged = current.vehicle_type !== input.vehicleType;
  const slugDrifted = !slugMatchesIdentity(current.slug, current);

  const rowUpdate: Record<string, unknown> = toRow(input);

  if (identityChanged || typeChanged || slugDrifted) {
    // Record the URL this vehicle is about to stop answering to, before
    // it stops answering to it. ignoreDuplicates so re-editing back to a
    // name it already had once (bouncing between two names) can't fail
    // this on the unique(vehicle_type, slug) constraint.
    const { error: historyError } = await supabase
      .from("vehicle_url_history")
      .upsert(
        { vehicle_id: id, vehicle_type: current.vehicle_type, slug: current.slug },
        { onConflict: "vehicle_type,slug", ignoreDuplicates: true }
      );
    // A history-recording failure must never block the actual vehicle
    // update — it's bookkeeping for redirects, not the primary write.
    if (historyError) {
      console.error("[updateVehicle] Failed to record vehicle_url_history:", historyError);
    }
  }

  if (identityChanged || slugDrifted) {
    if (!newBase) {
      return { error: "Could not generate a URL from Brand, Model, and Year — check those fields." };
    }
    rowUpdate.slug = await generateUniqueSlug(supabase, newBase);
  }

  const { error } = await supabase.from("vehicles").update(rowUpdate).eq("id", id);

  if (error) {
    return { error: error.code === "23505" ? friendlyConstraintError(error.message) : error.message };
  }

  revalidatePath("/", "layout");
  return { error: null };
}

/**
 * Soft-delete: sets status to ARCHIVED rather than removing the row.
 * Public visibility (RLS) already excludes ARCHIVED regardless of
 * is_published. Reversible — an archived vehicle can be brought back by
 * editing its status again. This is the only "remove from active stock"
 * action for SOLD/RESERVED vehicles (see deleteVehicle below, which the
 * database itself refuses for those two statuses).
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

/**
 * Hard delete — genuinely removes the row, unlike archiveVehicle above.
 * Deliberately thin: all the real safety logic lives in the
 * vehicles_before_delete trigger (supabase/migrations/20260816010000_
 * vehicle_stock_number_reuse_and_safe_delete.sql), not here, so it can
 * never be bypassed by a path other than this Server Action:
 *
 *   - SOLD/RESERVED vehicles are rejected with a Postgres exception —
 *     the trigger raises it, this function just surfaces the message.
 *   - Otherwise, the vehicle's stock number is released into
 *     stock_number_pool for reuse before the row is actually removed.
 *
 * vehicle_media and vehicle_url_history cascade-delete with the vehicle
 * (their FKs are ON DELETE CASCADE — losing a deleted vehicle's photos
 * and old-URL redirects is correct, nothing should keep pointing at a
 * vehicle that no longer exists). leads.interested_vehicle_id and
 * content.vehicle_id are ON DELETE SET NULL — those rows survive, they
 * just stop referencing this vehicle. Storage objects for the vehicle's
 * photos are NOT removed by this (a pre-existing gap, not introduced
 * here) — only the vehicle_media rows pointing at them are.
 */
export async function deleteVehicle(id: string): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { error: null };
}
