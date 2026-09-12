import type { Metadata } from "next";
import { SectionHeading } from "@/components/public/section-heading";
import { ArticleContent } from "@/components/public/article-content";
import { getPublishedAboutSections } from "@/lib/data/about-page";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import type { AboutPageSection } from "@/lib/types";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: "The story and standards behind Perkasa Motors.",
};

/**
 * CMS-driven — replaces the Phase 1 static placeholder. Content comes
 * from the `about_page_sections` table (lib/data/about-page.ts), edited
 * from Admin > Website > About. Sections render in sort_order; the first
 * one gets the large intro treatment (matching this page's original
 * hero-style header), every section after that renders as a bordered
 * block with its own eyebrow/headline — the same generic shape works for
 * any future section (Team, History, Standards, ...) an admin adds later,
 * with zero changes to this page.
 *
 * An inactive/unpublished section, or a missing eyebrow (optional
 * everywhere), simply doesn't render — never a technical placeholder. If
 * every section is unpublished or missing, the page falls back to
 * generic, already-published brand copy (company name + footer tagline)
 * rather than showing nothing or admin-facing text.
 */
export default async function AboutPage() {
  const sections = await getPublishedAboutSections();

  if (sections.length === 0) {
    const settings = await getWebsiteSettings();
    return (
      <div className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
        <div className="max-w-3xl">
          <p className="mb-4 font-body text-label uppercase tracking-[0.1em] text-primary">
            Tentang Kami
          </p>
          <h1 className="font-display text-headline-lg text-ink lg:text-display-sm">
            {settings.companyName}
          </h1>
          {settings.footerDescription && (
            <p className="mt-6 font-body text-body-lg text-muted">{settings.footerDescription}</p>
          )}
        </div>
      </div>
    );
  }

  const [intro, ...rest] = sections;

  return (
    <div className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
      <IntroSection section={intro} />
      {rest.map((section) => (
        <div key={section.id} className="mt-16 border-t border-border pt-16">
          <SectionHeading eyebrow={section.eyebrow ?? undefined} title={section.headline ?? ""} />
          {section.body && <ArticleContent content={section.body} />}
        </div>
      ))}
    </div>
  );
}

function IntroSection({ section }: { section: AboutPageSection }) {
  return (
    <div className="max-w-3xl">
      {section.eyebrow && (
        <p className="mb-4 font-body text-label uppercase tracking-[0.1em] text-primary">
          {section.eyebrow}
        </p>
      )}
      {section.headline && (
        <h1 className="font-display text-headline-lg text-ink lg:text-display-sm">
          {section.headline}
        </h1>
      )}
      {section.body && (
        <p className="mt-6 font-body text-body-lg text-muted">{section.body}</p>
      )}
    </div>
  );
}
