import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { WebsiteSubnav } from "@/components/admin/website-subnav";
import { HomepageHeroForm } from "@/components/admin/homepage-hero-form";
import { HomepageAboutForm } from "@/components/admin/homepage-about-form";
import { getWebsiteSettings } from "@/lib/data/site-settings";

export const metadata: Metadata = { title: "Website — Homepage" };

/**
 * Phase 4 Batch 4.3 adds About below Hero. Why Perkasa and Testimonials
 * are still schema-ready only (supabase/migrations/20260815040000_
 * homepage_cms.sql) and land as their own sections on this same page in
 * later batches, not new routes — keeping "Website" at one subnav tab
 * for Homepage rather than one per section.
 */
export default async function AdminWebsiteHomepagePage() {
  const settings = await getWebsiteSettings();

  return (
    <div className="flex flex-col gap-10">
      <div>
        <PageHeader
          title="Website"
          description="The public homepage reads this directly — changes apply immediately."
        />
        <WebsiteSubnav />
        <HomepageHeroForm settings={settings} />
      </div>
      <HomepageAboutForm settings={settings} />
    </div>
  );
}
