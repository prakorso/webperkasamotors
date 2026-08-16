/**
 * Homepage customer testimonial — backed by the `testimonials` table
 * (supabase/migrations/20260815040000_homepage_cms.sql). Photo is
 * optional; when absent, the public card shows an initials placeholder
 * instead (see components/public/testimonials-section.tsx) — a missing
 * optional image must never look broken.
 */
export interface Testimonial {
  id: string;
  customerName: string;
  testimonial: string;
  roleLabel: string | null;
  photoUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}
