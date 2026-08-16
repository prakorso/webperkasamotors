import { SectionHeading } from "@/components/public/section-heading";
import { BENEFIT_ICON_MAP, DEFAULT_BENEFIT_ICON } from "@/lib/utils/benefit-icons";
import type { HomepageBenefit } from "@/lib/types";

export interface WhyPerkasaContent {
  eyebrow: string | null;
  headline: string;
  description: string | null;
  benefits: HomepageBenefit[];
}

/**
 * The original, always-safe Why Perkasa content — this was previously
 * hardcoded directly in app/(public)/page.tsx (3 cards: Terpercaya/
 * Kualitas Terjamin/Layanan Premium); preserved here byte-for-byte as
 * the fallback, same DEFAULT_HERO pattern, since it's generic evergreen
 * marketing copy rather than time-sensitive business data. Used whenever
 * the CMS section is inactive, has no headline, or has zero active
 * benefit cards — see resolveWhyPerkasa in app/(public)/page.tsx.
 */
export const DEFAULT_WHY_PERKASA: WhyPerkasaContent = {
  eyebrow: null,
  headline: "Mengapa Perkasa Motors?",
  description: null,
  benefits: [
    {
      id: "default-1",
      title: "Terpercaya",
      description: "Reputasi dalam menghadirkan kendaraan premium berkualitas tinggi untuk kepuasan pelanggan.",
      icon: "shield-check",
      sortOrder: 1,
      isActive: true,
    },
    {
      id: "default-2",
      title: "Kualitas Terjamin",
      description: "Setiap unit melewati inspeksi menyeluruh untuk memastikan performa dan kondisi sempurna.",
      icon: "badge-check",
      sortOrder: 2,
      isActive: true,
    },
    {
      id: "default-3",
      title: "Layanan Premium",
      description: "Pengalaman konsultasi, pembelian, hingga layanan purna jual yang eksklusif.",
      icon: "sparkles",
      sortOrder: 3,
      isActive: true,
    },
  ],
};

export function WhyPerkasaSection({ eyebrow, headline, description, benefits }: WhyPerkasaContent) {
  if (benefits.length === 0) return null;

  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
        <SectionHeading eyebrow={eyebrow ?? undefined} title={headline} className="text-center" />
        {description && (
          <p className="mx-auto -mt-6 mb-10 max-w-2xl text-center font-body text-body text-muted lg:mb-12">
            {description}
          </p>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = (benefit.icon && BENEFIT_ICON_MAP[benefit.icon]) || DEFAULT_BENEFIT_ICON;
            return (
              <div
                key={benefit.id}
                className="flex flex-col items-center border border-border bg-paper p-8 text-center"
              >
                <Icon className="mb-6 text-primary" size={40} aria-hidden />
                <h3 className="mb-3 font-display text-headline-sm text-ink">{benefit.title}</h3>
                <p className="font-body text-body text-muted">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
