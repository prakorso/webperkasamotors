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

/**
 * What the owner-facing form submits (Phase 2R.5). Everything below the
 * "business facts" block is optional on purpose: when a field is omitted
 * it is left untouched on update (and defaulted on create), so the form
 * cannot accidentally overwrite a value another action changed after the
 * page loaded - notably `status`, which is now changed only by
 * setVehicleStatus, and `description` / SEO / flags, which have no input
 * in the form at all.
 */
export interface VehicleInput {
  // Business facts - required.
  vehicleType: VehicleType;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileageKm: number;
  transmission: Transmission;
  fuelType: FuelType;
  // Business facts - optional.
  variant?: string | null;
  exteriorColor?: string | null;
  capacityCc?: number | null;
  plateNumber?: string | null;
  highlights?: string[];
  // System fields - never shown to the owner; omitted = unchanged / default.
  location?: string | null;
  condition?: "NEW" | "USED";
  description?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  isFeatured?: boolean;
}

const VEHICLE_TYPES: VehicleType[] = ["CAR", "MOTORCYCLE"];
const TRANSMISSIONS: Transmission[] = ["MANUAL", "AUTOMATIC", "CVT"];
const FUEL_TYPES: FuelType[] = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC"];
/** Statuses the public site can show. is_published is derived from this, never chosen by the owner. */
const PUBLIC_STATUSES: VehicleStatus[] = ["AVAILABLE", "RESERVED", "SOLD"];
const ALL_STATUSES: VehicleStatus[] = ["DRAFT", "AVAILABLE", "RESERVED", "SOLD", "ARCHIVED"];

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
  if (!VEHICLE_TYPES.includes(input.vehicleType)) return "Pilih jenis kendaraan.";
  if (!TRANSMISSIONS.includes(input.transmission)) return "Pilih transmisi.";
  if (!FUEL_TYPES.includes(input.fuelType)) return "Pilih bahan bakar.";
  if (!input.brand.trim()) return "Brand is required.";
  if (!input.model.trim()) return "Model is required.";
  if (!Number.isInteger(input.year) || input.year < 1980 || input.year > CURRENT_YEAR + 1) {
    return `Year must be between 1980 and ${CURRENT_YEAR + 1}.`;
  }
  if (!Number.isFinite(input.price) || input.price <= 0) return "Price must be a positive number.";
  if (!Number.isFinite(input.mileageKm) || input.mileageKm < 0) return "Mileage cannot be negative.";
  if (!Number.isInteger(input.mileageKm)) return "Kilometer harus berupa bilangan bulat.";
  if (input.capacityCc != null && (!Number.isFinite(input.capacityCc) || input.capacityCc <= 0)) {
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
  const row: Record<string, unknown> = {
    vehicle_type: input.vehicleType,
    brand: input.brand.trim(),
    model: input.model.trim(),
    year: input.year,
    price: input.price,
    mileage_km: input.mileageKm,
    transmission: input.transmission,
    fuel_type: input.fuelType,
  };
  // Optional/system fields are written only when the caller supplied them.
  if (input.variant !== undefined) row.variant = input.variant?.trim() || null;
  if (input.exteriorColor !== undefined) row.exterior_color = input.exteriorColor?.trim() || null;
  if (input.capacityCc !== undefined) row.capacity_cc = input.capacityCc;
  if (input.plateNumber !== undefined) row.plate_number = input.plateNumber?.trim() || null;
  if (input.highlights !== undefined) row.highlights = input.highlights.filter((h) => h.trim().length > 0);
  if (input.location !== undefined) row.location = input.location?.trim() || null;
  if (input.condition !== undefined) row.condition = input.condition;
  if (input.description !== undefined) row.description = input.description.trim();
  if (input.seoTitle !== undefined) row.seo_title = input.seoTitle?.trim() || null;
  if (input.seoDescription !== undefined) row.seo_description = input.seoDescription?.trim() || null;
  if (input.isFeatured !== undefined) row.is_featured = input.isFeatured;
  return row;
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
  variant?: string | null;
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
    .insert({
      // New units always start as a private draft; the owner publishes
      // them with setVehicleStatus ("Tayangkan") once photos are added.
      status: "DRAFT",
      is_published: false,
      condition: "USED",
      ...toRow(input),
      slug,
      stock_number: stockNumber,
      created_by: user.id,
    })
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

// ---------------------------------------------------------------------------
// Quick actions (Phase 2R.5). Deliberately narrow: each one changes exactly
// the field(s) its name says, validates on the server, and reuses the same
// database rules as the full form (delete-lock triggers, RLS, revalidation).
// There is no generic "update any field" endpoint.
// ---------------------------------------------------------------------------

/**
 * Allowed owner-facing transitions. ARCHIVED is reachable only through
 * archiveVehicle; DRAFT is where new units start and where an unpublished
 * unit can be returned.
 */
const ALLOWED_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
  DRAFT: ["AVAILABLE"],
  AVAILABLE: ["RESERVED", "SOLD", "DRAFT"],
  RESERVED: ["AVAILABLE", "SOLD"],
  // SOLD is final from the owner UI: moving it back to AVAILABLE would make the
  // unit deletable again and let its permanently-reserved stock number be reused.
  SOLD: [],
  ARCHIVED: ["DRAFT", "AVAILABLE"],
};

/**
 * Changes a vehicle's status and derives is_published from it, so the
 * owner has one decision instead of two: AVAILABLE / RESERVED / SOLD are
 * public, DRAFT / ARCHIVED are not. Calling it with the vehicle's current
 * status (for a public one) re-syncs a legacy row whose is_published flag
 * disagreed with its status.
 *
 * Going from a non-public state (DRAFT/ARCHIVED) to a public one requires
 * at least one photo, so a vehicle never goes live with an empty gallery.
 */
export async function setVehicleStatus(
  id: string,
  status: VehicleStatus
): Promise<{ error: string | null }> {
  if (!ALL_STATUSES.includes(status) || status === "ARCHIVED") {
    return { error: "Status tidak valid." };
  }

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: current, error: currentError } = await supabase
    .from("vehicles")
    .select("status, is_published")
    .eq("id", id)
    .maybeSingle();
  if (currentError) return { error: currentError.message };
  if (!current) return { error: "Vehicle not found." };

  const from = (current as unknown as { status: VehicleStatus }).status;
  const isResync = from === status && PUBLIC_STATUSES.includes(status);
  if (from === status && !isResync) return { error: null };
  if (!isResync && !ALLOWED_TRANSITIONS[from]?.includes(status)) {
    return { error: `Tidak bisa mengubah status dari ${from} ke ${status}.` };
  }

  if (!PUBLIC_STATUSES.includes(from) && PUBLIC_STATUSES.includes(status)) {
    const { count, error: mediaError } = await supabase
      .from("vehicle_media")
      .select("id", { count: "exact", head: true })
      .eq("vehicle_id", id);
    if (mediaError) return { error: mediaError.message };
    if (!count) return { error: "Tambahkan minimal satu foto sebelum menayangkan unit ini." };
  }

  const { error } = await supabase
    .from("vehicles")
    .update({ status, is_published: PUBLIC_STATUSES.includes(status) })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { error: null };
}

/** Changes only the price. Must be a positive whole number of rupiah. */
export async function setVehiclePrice(
  id: string,
  price: number
): Promise<{ error: string | null }> {
  if (!Number.isFinite(price) || !Number.isInteger(price) || price <= 0) {
    return { error: "Harga harus berupa angka lebih dari 0." };
  }

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("vehicles").update({ price }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { error: null };
}
