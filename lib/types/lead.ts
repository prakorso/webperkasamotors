/**
 * A customer inquiry. The public contact/vehicle-detail CTAs are visual
 * only in Phase 1 — nothing writes a Lead yet. This type exists so the
 * admin Leads screen has a real shape to render mock rows against.
 */

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "SITE_VISIT"
  | "NEGOTIATION"
  | "BOOKED"
  | "SOLD"
  | "LOST"
  | "SPAM";

export type LeadSource =
  | "WEBSITE"
  | "INSTAGRAM"
  | "WHATSAPP"
  | "WALK_IN"
  | "REFERRAL"
  | "OTHER";

export interface Lead {
  id: string;
  customerName: string;
  phone?: string;
  email?: string;
  message: string;
  interestedVehicleId: string | null;
  source: LeadSource;
  status: LeadStatus;
  assignedStaffName?: string;
  createdAt: string;
}
