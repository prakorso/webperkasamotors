/**
 * Instagram-sourced (and, later, other editorial) content, optionally
 * linked to a vehicle. Backed by the `content` table (see
 * lib/data/social-content.ts, lib/actions/content.ts) — there is no
 * automated Instagram ingestion, so every row today is entered by staff
 * through the admin Content page. lib/mock/social-content.ts remains as
 * local-dev fixture data only, per docs/PHASE-2-SUPABASE-PLAN.md section H.
 */

/**
 * Business rule: not every Instagram post is a vehicle. This classification
 * is independent of vehicleId below — content can be linked to a vehicle
 * without ever making that vehicle an inventory record, and content can
 * exist with no vehicle at all (editorial/brand content).
 */
export type SocialContentType =
  | "STOCK"
  | "REVIEW"
  | "REEL"
  | "FEATURE"
  | "NEWS"
  | "OTHER";

export type SocialContentStatus =
  | "INBOX"
  | "CLASSIFIED"
  | "PUBLISHED"
  | "IGNORED";

export interface SocialContent {
  id: string;
  /** Optional link to a vehicle. Setting this must never create or mutate a
   *  vehicle record — the data-access layer only ever reads this as a
   *  foreign key, never as a signal to write to lib/data/vehicles.ts. */
  vehicleId: string | null;
  contentType: SocialContentType;
  status: SocialContentStatus;
  caption: string;
  permalink: string;
  /** Null until a thumbnail is uploaded (content.thumbnail_storage_path is
   *  nullable) — the admin action layer refuses to set status PUBLISHED
   *  while this is null, so a publicly-rendered item always has one, but
   *  the type stays honest about the underlying column's real nullability. */
  thumbnailUrl: string | null;
  postedAt: string | null;
  /** Ingestion idempotency key for a future automated pipeline — optional
   *  today since every row is entered manually. */
  instagramMediaId: string | null;
}
