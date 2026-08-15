import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { WebsiteSubnav } from "@/components/admin/website-subnav";
import { HomepageHeroForm } from "@/components/admin/homepage-hero-form";
import { getWebsiteSettings } from "@/lib/data/site-settings";

export const metadata: Metadata = { title: "Website — Homepage" };

/**
 * Phase 4 Batch 1 — Hero only. About, Why Perkasa, and Testimonials are
 * schema-ready (supabase/migrations/20260815040000_homepage_cms.sql) but
 * land as their own sections on this same page in later batches, not new
 * routes — keeping "Website" at one subnav tab for Homepage rather than
 * one per section.
 */
export default async function AdminWebsiteHomepagePage() {
  const settings = await getWebsiteSettings();

  return (
    <div>
      <PageHeader
        title="Website"
        description="The public homepage reads this directly — changes apply immediately."
      />
      <WebsiteSubnav />
      <HomepageHeroForm settings={settings} />
    </div>
  );
}
