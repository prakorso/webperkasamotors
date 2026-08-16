import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { WebsiteSubnav } from "@/components/admin/website-subnav";
import { HomepageHeroForm } from "@/components/admin/homepage-hero-form";
import { HomepageAboutForm } from "@/components/admin/homepage-about-form";
import { HomepageWhyPerkasaForm } from "@/components/admin/homepage-why-perkasa-form";
import { HomepageTestimonialsForm } from "@/components/admin/homepage-testimonials-form";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { getAllHomepageBenefitsForAdmin } from "@/lib/data/homepage-benefits";
import { getAllTestimonialsForAdmin } from "@/lib/data/testimonials";

export const metadata: Metadata = { title: "Website — Homepage" };

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-body text-[11px] font-bold uppercase tracking-[0.1em] text-muted-2">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

/**
 * Phase 4 Batch 4.4/4.5/4.6 completes the Homepage CMS: Why Perkasa and
 * Testimonials get real admin UI (their tables were schema-ready since
 * 20260815040000_homepage_cms.sql, but had no CRUD until now). Social
 * Content has no new admin surface here on purpose — the existing
 * Inventory > Vehicle > Social Content "paste a URL" workflow
 * (lib/actions/content.ts:addSocialContent) remains the only way
 * content gets created; the homepage just displays what's already
 * published, read-only from this page's point of view.
 */
export default async function AdminWebsiteHomepagePage() {
  const [settings, benefits, testimonials] = await Promise.all([
    getWebsiteSettings(),
    getAllHomepageBenefitsForAdmin(),
    getAllTestimonialsForAdmin(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <PageHeader
          title="Website"
          description="The public homepage reads this directly — changes apply immediately."
        />
        <WebsiteSubnav />
      </div>

      <div className="flex flex-col gap-4">
        <SectionDivider label="1. Hero" />
        <HomepageHeroForm settings={settings} />
      </div>

      <div className="flex flex-col gap-4">
        <SectionDivider label="2. About" />
        <HomepageAboutForm settings={settings} />
      </div>

      <div className="flex flex-col gap-4">
        <SectionDivider label="3. Why Perkasa" />
        <HomepageWhyPerkasaForm settings={settings} initialBenefits={benefits} />
      </div>

      <div className="flex flex-col gap-4">
        <SectionDivider label="4. Testimonials" />
        <HomepageTestimonialsForm initialTestimonials={testimonials} />
      </div>

      <div className="flex flex-col gap-4">
        <SectionDivider label="5. Social Content" />
        <div className="border border-border bg-surface p-6">
          <p className="font-body text-[13px] text-ink">
            The homepage automatically shows your most recently published Social Content — the same
            content you manage from each vehicle&apos;s Inventory page.
          </p>
          <p className="mt-2 font-body text-[13px] text-muted">
            There&apos;s nothing to configure here. To add or manage content, paste a link on the
            vehicle it belongs to, or open the{" "}
            <Link href="/admin/content" className="text-primary hover:text-ink">
              Content Library
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
