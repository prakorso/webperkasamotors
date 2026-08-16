import { SectionHeading } from "@/components/public/section-heading";
import { SocialContentStrip } from "@/components/public/social-content-strip";
import type { SocialContent } from "@/lib/types";

/**
 * Homepage Social Content (Phase 4 Batch 4.6) — a thin section wrapper
 * around the existing SocialContentStrip (already used on vehicle detail
 * pages), which already handles thumbnail vs. "Preview unavailable",
 * platform icons, and target="_blank" rel="noopener noreferrer" links
 * out to the original permalink. No new creation workflow, no duplicate
 * records — this only ever reads existing PUBLISHED content
 * (lib/data/social-content.ts:getPublishedContentForHomepage).
 *
 * Zero items means the section is omitted entirely (handled by the
 * caller, app/(public)/page.tsx) rather than showing
 * SocialContentStrip's own "No linked content yet" empty state, which
 * was written for an admin context, not public marketing copy.
 */
export function HomepageSocialSection({ items }: { items: SocialContent[] }) {
  if (items.length === 0) return null;

  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
        <SectionHeading eyebrow="Sorotan" title="Dari Media Sosial Kami" className="text-center" />
        <SocialContentStrip items={items} />
      </div>
    </section>
  );
}
