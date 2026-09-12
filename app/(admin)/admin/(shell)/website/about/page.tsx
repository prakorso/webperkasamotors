import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { WebsiteSubnav } from "@/components/admin/website-subnav";
import { AboutPageForm } from "@/components/admin/about-page-form";
import { getAllAboutSectionsForAdmin } from "@/lib/data/about-page";

export const metadata: Metadata = { title: "Website — About" };

export default async function AdminWebsiteAboutPage() {
  const sections = await getAllAboutSectionsForAdmin();

  return (
    <div>
      <PageHeader
        title="Website"
        description="Editorial content for the public /about (“Tentang Kami”) page."
      />
      <WebsiteSubnav />
      <AboutPageForm sections={sections} />
    </div>
  );
}
