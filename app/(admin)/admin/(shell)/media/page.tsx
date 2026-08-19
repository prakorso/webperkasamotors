import { redirect } from "next/navigation";

/**
 * The standalone Media Library page was removed from CRM navigation and
 * user-facing admin UI (one-person-operation simplification — media is
 * already managed contextually: Inventory > vehicle photos, Website >
 * Hero/About/etc., Articles > cover/OG image, Content > thumbnails).
 *
 * This route itself redirects rather than 404ing, in case anything still
 * links here (a bookmark, browser history). Nothing about the underlying
 * media infrastructure changed: Supabase Storage, every bucket, the
 * upload architecture (lib/storage/*), AssetUploadField,
 * InlineImageUpload, vehicle-media-manager, every media Server Action,
 * every media table, and every storage RLS policy are all untouched —
 * this file is the only thing that changed.
 */
export default function AdminMediaPage() {
  redirect("/admin/inventory");
}
