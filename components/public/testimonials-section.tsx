import Image from "next/image";
import { Quote } from "lucide-react";
import { SectionHeading } from "@/components/public/section-heading";
import type { Testimonial } from "@/lib/types";

/** First letters of up to the first two words - the fallback avatar when a testimonial has no photo (photo is optional). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** "Unit Dibeli" is stored in role_label; show it as "Customer <unit>" without doubling a prefix the owner already typed. */
function purchaseLabel(roleLabel: string): string {
  return /^customer\b/i.test(roleLabel.trim()) ? roleLabel.trim() : `Customer ${roleLabel.trim()}`;
}

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <figure className="flex h-full w-[min(86vw,22rem)] shrink-0 snap-start flex-col rounded-[20px] border border-border/80 bg-paper p-6 md:p-7">
      <Quote className="mb-4 text-primary/40" size={26} aria-hidden="true" />
      <blockquote className="flex-1 font-body text-body leading-relaxed text-ink">{item.testimonial}</blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        {item.photoUrl ? (
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-muted">
            <Image src={item.photoUrl} alt="" fill sizes="44px" className="object-cover" />
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-body text-[13px] font-semibold text-primary"
          >
            {initials(item.customerName)}
          </div>
        )}
        <div>
          <p className="font-body text-[13px] font-semibold text-ink">{item.customerName}</p>
          {item.roleLabel && <p className="font-body text-[12px] text-muted">{purchaseLabel(item.roleLabel)}</p>}
        </div>
      </figcaption>
    </figure>
  );
}

/** Below this many testimonials a looping marquee would just repeat the same one or two cards, so a static row is shown instead. */
const MARQUEE_MIN_ITEMS = 4;

/**
 * Homepage "Testimoni" - only REAL customer testimonials entered by the
 * owner; there is no fallback or placeholder content, and with zero active
 * testimonials the page omits this section entirely (the caller handles
 * that). CSS-only horizontal rail (see .testimonial-* in globals.css):
 * slow automatic movement on desktop that pauses on hover/focus; on touch
 * and small screens a native swipeable row; with prefers-reduced-motion it
 * is a static scrollable list. The looped copy is aria-hidden so screen
 * readers read each testimonial once.
 */
export function TestimonialsSection({ testimonials, className }: { testimonials: Testimonial[]; className?: string }) {
  if (testimonials.length === 0) return null;
  const marquee = testimonials.length >= MARQUEE_MIN_ITEMS;

  return (
    <section id="testimoni" aria-labelledby="home-testimonials-heading" className={className}>
      <div className="mx-auto max-w-container px-6 md:px-8 lg:px-margin">
        <SectionHeading eyebrow="Testimoni" title="Apa Kata Pelanggan" id="home-testimonials-heading" className="mb-8 lg:mb-10" />
      </div>
      <div
        className={marquee ? "testimonial-rail" : "testimonial-rail testimonial-rail--static"}
        style={marquee ? ({ "--testimonial-duration": `${testimonials.length * 9}s` } as React.CSSProperties) : undefined}
      >
        <div className="testimonial-track">
          <div className="testimonial-group">
            {testimonials.map((item) => (
              <TestimonialCard key={item.id} item={item} />
            ))}
          </div>
          {marquee && (
            <div className="testimonial-group testimonial-group--clone" aria-hidden="true">
              {testimonials.map((item) => (
                <TestimonialCard key={`clone-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
