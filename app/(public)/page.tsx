import Link from "next/link";
import { ShieldCheck, BadgeCheck, Sparkles } from "lucide-react";
import { Hero, DEFAULT_HERO, type HeroContent } from "@/components/public/hero";
import { HeroSlideshow } from "@/components/public/hero-slideshow";
import { AboutSection, type AboutContent } from "@/components/public/about-section";
import { SectionHeading } from "@/components/public/section-heading";
import { VehicleCard } from "@/components/public/vehicle-card";
import { getFeaturedVehicles, getVehicleMedia } from "@/lib/data/vehicles";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import type { HeroSlideSettings, AboutSectionSettings } from "@/lib/types";

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

export default async function HomePage() {
  const [featured, settings] = await Promise.all([getFeaturedVehicles(4), getWebsiteSettings()]);
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
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredWithMedia.map(({ vehicle, primaryMedia }) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} primaryMedia={primaryMedia} />
          ))}
        </div>
      </section>

      {about && <AboutSection {...about} />}

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
          <SectionHeading title="Mengapa Perkasa Motors?" className="text-center" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Terpercaya",
                body: "Reputasi dalam menghadirkan kendaraan premium berkualitas tinggi untuk kepuasan pelanggan.",
              },
              {
                icon: BadgeCheck,
                title: "Kualitas Terjamin",
                body: "Setiap unit melewati inspeksi menyeluruh untuk memastikan performa dan kondisi sempurna.",
              },
              {
                icon: Sparkles,
                title: "Layanan Premium",
                body: "Pengalaman konsultasi, pembelian, hingga layanan purna jual yang eksklusif.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex flex-col items-center border border-border bg-paper p-8 text-center"
              >
                <Icon className="mb-6 text-primary" size={40} aria-hidden />
                <h3 className="mb-3 font-display text-headline-sm text-ink">{title}</h3>
                <p className="font-body text-body text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-container px-6 py-16 text-center md:px-8 lg:px-margin lg:py-section">
        <h2 className="mx-auto max-w-2xl font-display text-headline-lg text-ink">
          Siap menemukan kendaraan impian Anda?
        </h2>
        <Link
          href="/contact"
          className="mt-8 inline-flex h-13 items-center bg-primary px-8 font-body text-label uppercase tracking-[0.1em] text-primary-ink transition-colors hover:bg-primary-hover"
        >
          Hubungi Sales Advisor
        </Link>
      </section>
    </>
  );
}
