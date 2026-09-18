import Link from "next/link";
import { Hero, DEFAULT_HERO, type HeroContent } from "@/components/public/hero";
import { HeroSlideshow } from "@/components/public/hero-slideshow";
import { AboutSection, type AboutContent } from "@/components/public/about-section";
import { WhyPerkasaSection, DEFAULT_WHY_PERKASA, type WhyPerkasaContent } from "@/components/public/why-perkasa-section";
import { TestimonialsSection } from "@/components/public/testimonials-section";
import { SectionHeading } from "@/components/public/section-heading";
import { VehicleCard } from "@/components/public/vehicle-card";
import { WhatsAppCta } from "@/components/public/whatsapp-cta";
import { getFeaturedVehicles, getVehicleMedia } from "@/lib/data/vehicles";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { getActiveHomepageBenefits } from "@/lib/data/homepage-benefits";
import { getActiveTestimonials } from "@/lib/data/testimonials";
import { genericWhatsAppUrl, vehicleWhatsAppConfig } from "@/lib/utils/whatsapp";
import { cn } from "@/lib/utils/cn";
import type { HeroSlideSettings, AboutSectionSettings, WhyPerkasaSectionSettings, HomepageBenefit } from "@/lib/types";

/**
 * Featured Stock grid columns, keyed by how many featured vehicles there
 * actually are. A small, growing inventory means this is very often 1–2
 * items right now — a static `lg:grid-cols-4` would leave 2–3 empty
 * trailing column tracks next to the real cards, which reads as broken
 * or unfinished rather than as a small, intentional catalogue. Matching
 * the column count to the real count means the grid is always full.
 * (Static class strings, not a template literal, so Tailwind's build-time
 * scanner can find and keep them.)
 */
const FEATURED_GRID_COLS: Record<number, string> = {
  1: "mx-auto max-w-sm sm:grid-cols-1 lg:grid-cols-1",
  2: "mx-auto max-w-3xl sm:grid-cols-2 lg:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * A slide participates in the public rotation only if it's marked active
 * AND has a headline — same bar the original single-hero column used
 * (`heroIsActive && heroHeadline?.trim()`), just applied per-slide now.
 * Image/eyebrow/description/CTA all stay optional; CTA falls back to
 * DEFAULT_HERO's own label/URL per slide, matching the original behavior.
 * Returns null for a slide that isn't usable, so the caller can filter.
 */
function resolveSlide(raw: HeroSlideSettings): HeroContent | null {
  if (!raw.isActive || !raw.headline?.trim()) return null;
  return {
    eyebrow: raw.eyebrow,
    headline: raw.headline,
    description: raw.description,
    imageUrl: raw.imageUrl,
    ctaLabel: raw.ctaLabel?.trim() || DEFAULT_HERO.ctaLabel,
    ctaUrl: raw.ctaUrl?.trim() || DEFAULT_HERO.ctaUrl,
  };
}

/**
 * Unlike Hero, there's no hardcoded default About copy — an unusable
 * About section (inactive, or missing headline/description) means the
 * section is omitted from the page entirely, not replaced with
 * placeholder content. Same required bar the Server Action itself
 * enforces (lib/actions/site-settings.ts:validateAboutSection), checked
 * again here since the CMS row could in principle be edited outside the
 * validated form path.
 */
function resolveAbout(raw: AboutSectionSettings): AboutContent | null {
  if (!raw.isActive || !raw.headline?.trim() || !raw.description?.trim()) return null;
  return {
    eyebrow: raw.eyebrow,
    headline: raw.headline,
    description: raw.description,
    imageUrl: raw.imageUrl,
    ctaLabel: raw.ctaLabel,
    ctaUrl: raw.ctaUrl,
  };
}

/**
 * Unlike About, Why Perkasa DOES have a hardcoded default (the original
 * 3-card content, preserved as DEFAULT_WHY_PERKASA — see that file's own
 * comment for why) — same fallback shape as Hero. Falls back when the
 * section is inactive, has no headline, OR has zero active benefit
 * cards (an active section with nothing to show would otherwise render
 * an empty grid, which is exactly the "CMS misconfiguration must never
 * break the homepage" rule this whole phase keeps repeating).
 */
function resolveWhyPerkasa(
  raw: WhyPerkasaSectionSettings,
  activeBenefits: HomepageBenefit[]
): WhyPerkasaContent {
  if (!raw.isActive || !raw.headline?.trim() || activeBenefits.length === 0) {
    return DEFAULT_WHY_PERKASA;
  }
  return {
    eyebrow: raw.eyebrow,
    headline: raw.headline,
    description: raw.description,
    benefits: activeBenefits,
  };
}

export default async function HomePage() {
  const [featured, settings, benefits, testimonials] = await Promise.all([
    getFeaturedVehicles(4),
    getWebsiteSettings(),
    getActiveHomepageBenefits(),
    getActiveTestimonials(),
  ]);
  const featuredWithMedia = await Promise.all(
    featured.map(async (vehicle) => ({
      vehicle,
      primaryMedia: (await getVehicleMedia(vehicle.id)).find((m) => m.isPrimary),
    }))
  );

  // Zero usable slides (nothing configured, everything inactive, or every
  // active slide missing a headline) falls back to the original hardcoded
  // hero — resolved here, once, rather than inside Hero/HeroSlideshow, so
  // both stay plain "render what I'm given" presentational pieces. A CMS
  // misconfiguration can never produce a broken/empty homepage hero.
  const slides = [settings.heroSlide1, settings.heroSlide2, settings.heroSlide3]
    .map(resolveSlide)
    .filter((slide): slide is HeroContent => slide !== null);
  const about = resolveAbout(settings.about);
  const whyPerkasa = resolveWhyPerkasa(settings.whyPerkasa, benefits);
  const whatsappConfig = vehicleWhatsAppConfig(settings);
  const genericWhatsappHref = genericWhatsAppUrl(settings);

  return (
    <>
      {slides.length > 0 ? <HeroSlideshow slides={slides} /> : <Hero {...DEFAULT_HERO} />}

      <section className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
        <div className="flex items-end justify-between">
          <SectionHeading eyebrow="Showroom" title="Featured Stock" className="mb-0" />
          <Link
            href="/cars"
            className="hidden font-body text-label uppercase tracking-[0.1em] text-primary hover:text-ink md:inline-block"
          >
            Lihat Semua →
          </Link>
        </div>
        <div className={cn("mt-10 grid grid-cols-1 gap-6", FEATURED_GRID_COLS[featuredWithMedia.length] ?? FEATURED_GRID_COLS[4])}>
          {featuredWithMedia.map(({ vehicle, primaryMedia }) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              primaryMedia={primaryMedia}
              whatsapp={whatsappConfig}
            />
          ))}
        </div>
      </section>

      {about && <AboutSection {...about} />}

      <WhyPerkasaSection {...whyPerkasa} />

      <TestimonialsSection testimonials={testimonials} />

      <section className="mx-auto max-w-container px-6 py-16 text-center md:px-8 lg:px-margin lg:py-section">
        <h2 className="mx-auto max-w-2xl font-display text-headline-lg text-ink">
          Siap menemukan kendaraan impian Anda?
        </h2>
        <div className="mt-8">
          {genericWhatsappHref ? (
            <WhatsAppCta
              href={genericWhatsappHref}
              label="Hubungi via WhatsApp"
              className="h-auto min-h-13 whitespace-normal py-3 text-center"
            />
          ) : (
            <Link
              href="/contact"
              className="inline-flex h-13 items-center bg-primary px-8 font-body text-label uppercase tracking-[0.1em] text-primary-ink transition-colors hover:bg-primary-hover"
            >
              Hubungi Kami
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
