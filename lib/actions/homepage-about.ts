"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";

/**
 * Owner edit of the homepage "Tentang Perkasa Motors" block: minimal fields
 * only (eyebrow, title, description, three short points, on/off). Empty
 * text saves as NULL, which makes the homepage use its code default for
 * that field. Requires the homepage_about_* columns (migration prepared in
 * supabase/migrations/20261002010000_homepage_about_section.sql); until it
 * is applied the admin form is read-only and this action reports it.
 */
export interface UpdateHomepageAboutInput {
  eyebrow: string | null;
  title: string | null;
  description: string | null;
  points: [string | null, string | null, string | null];
  isActive: boolean;
}

const LIMITS = { eyebrow: 40, title: 80, description: 400, point: 90 } as const;

function validate(input: UpdateHomepageAboutInput): string | null {
  if ((input.eyebrow?.length ?? 0) > LIMITS.eyebrow) return `Label kecil maksimal ${LIMITS.eyebrow} karakter.`;
  if ((input.title?.length ?? 0) > LIMITS.title) return `Judul maksimal ${LIMITS.title} karakter.`;
  if ((input.description?.length ?? 0) > LIMITS.description) {
    return `Deskripsi maksimal ${LIMITS.description} karakter.`;
  }
  if (input.points.some((p) => (p?.length ?? 0) > LIMITS.point)) {
    return `Setiap poin maksimal ${LIMITS.point} karakter.`;
  }
  return null;
}

export async function updateHomepageAbout(
  input: UpdateHomepageAboutInput
): Promise<{ error: string | null }> {
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Anda harus masuk terlebih dahulu." };

  const { error } = await supabase
    .from("website_settings")
    .update({
      homepage_about_eyebrow: input.eyebrow,
      homepage_about_title: input.title,
      homepage_about_description: input.description,
      homepage_about_point_1: input.points[0],
      homepage_about_point_2: input.points[1],
      homepage_about_point_3: input.points[2],
      homepage_about_is_active: input.isActive,
      updated_by: user.id,
    })
    .eq("id", 1);

  if (error) {
    return {
      error: /homepage_about/i.test(error.message)
        ? "Fitur ini belum aktif di database. Hubungi pengelola teknis."
        : error.message,
    };
  }
  revalidatePath("/", "layout");
  return { error: null };
}
