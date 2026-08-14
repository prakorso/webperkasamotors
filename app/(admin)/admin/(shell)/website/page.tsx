import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { WebsiteSubnav } from "@/components/admin/website-subnav";
import { WebsiteGeneralForm } from "@/components/admin/website-general-form";
import { getWebsiteSettings } from "@/lib/data/site-settings";

export const metadata: Metadata = { title: "Website — General" };

export default async function AdminWebsiteGeneralPage() {
  const settings = await getWebsiteSettings();

  return (
    <div>
      <PageHeader
        title="Website"
        description="Branding, contact info, social links, and SEO for the public site."
      />
      <WebsiteSubnav />
      <WebsiteGeneralForm settings={settings} />
    </div>
  );
}
