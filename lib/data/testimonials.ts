import "server-only";
import type { Testimonial } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";
import { getStoragePublicUrl } from "@/lib/storage/provider";

/**
 * Testimonials — read-only. Mutations (create/update/delete/reorder)
 * live in lib/actions/testimonials.ts, same split as every other domain.
 */

const TESTIMONIALS_BUCKET = "testimonials";
const COLUMNS = "id, customer_name, testimonial, role_label, photo_storage_path, sort_order, is_active";

interface TestimonialRow {
  id: string;
  customer_name: string;
  testimonial: string;
  role_label: string | null;
  photo_storage_path: string | null;
  sort_order: number;
  is_active: boolean;
}

/**
 * Always resolves via the plain anon server client, regardless of which
 * client the row itself was fetched with — getPublicUrl is a pure
 * client-side URL construction (no network call, no auth needed), same
 * pattern lib/data/vehicles.ts's mapVehicleMediaRow already uses.
 */
function mapRow(row: TestimonialRow): Testimonial {
  const supabase = getSupabaseServerClient();
  return {
    id: row.id,
    customerName: row.customer_name,
    testimonial: row.testimonial,
    roleLabel: row.role_label,
    photoUrl: row.photo_storage_path
      ? getStoragePublicUrl(supabase, TESTIMONIALS_BUCKET, row.photo_storage_path)
      : null,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

/** Public read — active testimonials only, in display order. RLS enforces the is_active filter; the .eq() here just avoids fetching rows we'd discard. */
export async function getActiveTestimonials(): Promise<Testimonial[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select(COLUMNS)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`getActiveTestimonials: ${error.message}`);
  return (data as unknown as TestimonialRow[]).map(mapRow);
}

/** Admin-only: every testimonial regardless of active state, in display order. */
export async function getAllTestimonialsForAdmin(): Promise<Testimonial[]> {
  const supabase = await getSupabaseSessionClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select(COLUMNS)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`getAllTestimonialsForAdmin: ${error.message}`);
  return (data as unknown as TestimonialRow[]).map(mapRow);
}
