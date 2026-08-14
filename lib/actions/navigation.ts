"use server";

import { revalidatePath } from "next/cache";
import type { NavPlacement } from "@/lib/types";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";

/**
 * Server Actions, separated from lib/data/navigation.ts's plain read
 * functions — see lib/actions/site-settings.ts for why the split exists.
 */

export interface NavigationItemInput {
  placement: NavPlacement;
  groupLabel: string | null;
  label: string;
  href: string;
  isVisible: boolean;
  isExternal: boolean;
  isCta: boolean;
}

export async function createNavigationItem(
  input: NavigationItemInput
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: last } = await supabase
    .from("navigation_items")
    .select("sort_order")
    .eq("placement", input.placement)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = ((last as unknown as { sort_order: number } | null)?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("navigation_items").insert({
    placement: input.placement,
    group_label: input.groupLabel,
    label: input.label,
    href: input.href,
    sort_order: nextSortOrder,
    is_visible: input.isVisible,
    is_external: input.isExternal,
    is_cta: input.isCta,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null };
}

export async function updateNavigationItem(
  id: string,
  input: NavigationItemInput
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const { error } = await supabase
    .from("navigation_items")
    .update({
      group_label: input.groupLabel,
      label: input.label,
      href: input.href,
      is_visible: input.isVisible,
      is_external: input.isExternal,
      is_cta: input.isCta,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null };
}

export async function deleteNavigationItem(id: string): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const { error } = await supabase.from("navigation_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null };
}

/** Bulk-updates sort_order for a set of items — the up/down reorder controls in the admin table. */
export async function reorderNavigationItems(
  items: Array<{ id: string; sortOrder: number }>
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  for (const item of items) {
    const { error } = await supabase
      .from("navigation_items")
      .update({ sort_order: item.sortOrder })
      .eq("id", item.id);
    if (error) return { error: error.message };
  }
  revalidatePath("/", "layout");
  return { error: null };
}
