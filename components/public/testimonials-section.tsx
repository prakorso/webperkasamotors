import Image from "next/image";
import { Quote } from "lucide-react";
import { SectionHeading } from "@/components/public/section-heading";
import type { Testimonial } from "@/lib/types";

/** First letters of up to the first two words — the fallback avatar when a testimonial has no photo (Photo is optional, per the CMS design). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/**
 * Homepage Testimonials — renders only what's passed in (already
 * filtered to active, sorted by sort_order by the caller). No hardcoded
 * fallback content exists for this section (unlike Hero/Why Perkasa) —
 * fabricating fake customer quotes would be actively dishonest, so zero
 * testimonials means the section is simply omitted
 * (app/(public)/page.tsx handles that, this component assumes it's only
 * ever rendered with at least one item).
 */
export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
      <SectionHeading eyebrow="Testimoni" title="Apa Kata Pelanggan Kami" className="text-center" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((item) => (
          <figure key={item.id} className="flex flex-col border border-border bg-paper p-8">
            <Quote className="mb-4 text-primary/40" size={28} aria-hidden />
            <blockquote className="flex-1 font-body text-body text-ink">{item.testimonial}</blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-6">
              {item.photoUrl ? (
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-muted">
                  <Image src={item.photoUrl} alt={item.customerName} fill sizes="44px" className="object-cover" />
                </div>
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-body text-[13px] font-semibold text-primary">
                  {initials(item.customerName)}
                </div>
              )}
              <div>
                <p className="font-body text-[13px] font-semibold text-ink">{item.customerName}</p>
                {item.roleLabel && <p className="font-body text-[12px] text-muted">{item.roleLabel}</p>}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
