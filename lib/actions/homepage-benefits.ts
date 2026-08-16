"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";
import { BENEFIT_ICON_OPTIONS } from "@/lib/utils/benefit-icons";

/**
 * Server Actions for Why Perkasa benefit cards (homepage_benefits table)
 * — separated from lib/data/homepage-benefits.ts's plain reads, same
 * split as every other domain in this codebase.
 */

const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 200;
const VALID_ICON_KEYS = new Set(BENEFIT_ICON_OPTIONS.map((o) => o.key));

export interface BenefitInput {
  title: string;
  description: string;
  icon: string | null;
  isActive: boolean;
}

function validateBenefit(input: BenefitInput): string | null {
  if (!input.title.trim()) return "Title is required.";
  if (input.title.length > TITLE_MAX_LENGTH) return `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`;
  if (!input.description.trim()) return "Description is required.";
  if (input.description.length > DESCRIPTION_MAX_LENGTH) {
    return `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }
  if (input.icon && !VALID_ICON_KEYS.has(input.icon)) return "Invalid icon selection.";
  return null;
}

function toRow(input: BenefitInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    icon: input.icon,
    is_active: input.isActive,
  };
}

export async function createHomepageBenefit(
  input: BenefitInput
): Promise<{ error: string | null; id?: string }> {
  const validationError = validateBenefit(input);
  if (validationError) return { error: validationError };

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // New cards go to the end of the list by default — matches
  // vehicle_media's "sort_order increments from the current max" pattern.
  const { data: last } = await supabase
    .from("homepage_benefits")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = ((last as unknown as { sort_order: number } | null)?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("homepage_benefits")
    .insert({ ...toRow(input), sort_order: nextSortOrder })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null, id: (data as unknown as { id: string }).id };
}

export async function updateHomepageBenefit(
  id: string,
  input: BenefitInput
): Promise<{ error: string | null }> {
  const validationError = validateBenefit(input);
  if (validationError) return { error: validationError };

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("homepage_benefits").update(toRow(input)).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { error: null };
}

export async function deleteHomepageBenefit(id: string): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("homepage_benefits").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { error: null };
}

/** Bulk-updates sort_order — the up/down reorder controls in the admin list, same pattern as reorderVehicleMedia. */
export async function reorderHomepageBenefits(
  items: Array<{ id: string; sortOrder: number }>
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  for (const item of items) {
    const { error } = await supabase
      .from("homepage_benefits")
      .update({ sort_order: item.sortOrder })
      .eq("id", item.id);
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { error: null };
}
