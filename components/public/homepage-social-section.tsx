import { SocialContentStrip } from "@/components/public/social-content-strip";
import type { SocialContent } from "@/lib/types";

/**
 * Homepage Social Content (Phase 4 Batch 4.6, copy revised in the
 * CMS/UX refinement batch) — a thin section wrapper around the existing
 * SocialContentStrip (already used on vehicle detail pages), which
 * already handles thumbnail vs. "Preview unavailable", platform icons,
 * and target="_blank" rel="noopener noreferrer" links out to the
 * original permalink. No new creation workflow, no duplicate records —
 * this only ever reads existing PUBLISHED content
 * (lib/data/social-content.ts:getPublishedContentForHomepage).
 *
 * Renders only the eyebrow "Social Media" — deliberately no headline
 * (previously "Dari Media Sosial Kami" / "From Instagram" elsewhere).
 * Not built with SectionHeading (components/public/section-heading.tsx)
 * since that component always renders an <h2>; this section needed the
 * eyebrow with no heading at all, so the eyebrow markup is duplicated
 * here instead — same classes, same red styling, just without a
 * required title. This is a public-copy change only: vehicle detail's
 * own Social section (components/public/vehicle-detail.tsx) is untouched
 * and still uses SectionHeading with its own eyebrow/title.
 *
 * Zero items means the section is omitted entirely (handled by the
 * caller, app/(public)/page.tsx) rather than showing an empty heading.
 */
export function HomepageSocialSection({ items }: { items: SocialContent[] }) {
  if (items.length === 0) return null;

  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
        <p className="mb-10 text-center font-body text-label uppercase tracking-[0.1em] text-primary lg:mb-12">
          Social Media
        </p>
        <SocialContentStrip items={items} />
      </div>
    </section>
  );
}
