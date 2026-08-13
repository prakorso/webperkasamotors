/**
 * Instagram-sourced content, optionally linked to a vehicle.
 * Not populated by any real ingestion yet — see lib/mock for the
 * placeholder shape used to prove the UI slot on the vehicle detail page.
 */

export type SocialContentType =
  | "STOCK"
  | "REVIEW"
  | "FEATURE"
  | "EDUCATION"
  | "PROMOTION"
  | "TESTIMONIAL"
  | "LIFESTYLE"
  | "NEWS"
  | "OTHER";

export type SocialContentStatus =
  | "INBOX"
  | "CLASSIFIED"
  | "PUBLISHED"
  | "IGNORED";

export interface SocialContent {
  id: string;
  vehicleId: string | null;
  contentType: SocialContentType;
  status: SocialContentStatus;
  caption: string;
  permalink: string;
  thumbnailUrl: string;
  postedAt: string;
}
