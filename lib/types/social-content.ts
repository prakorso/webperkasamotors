/**
 * Instagram-sourced content, optionally linked to a vehicle.
 * Not populated by any real ingestion yet — see lib/mock for the
 * placeholder shape used to prove the UI slot on the vehicle detail page.
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
  thumbnailUrl: string;
  postedAt: string;
}
