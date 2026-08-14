import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { WebsiteSubnav } from "@/components/admin/website-subnav";
import { NavigationManager } from "@/components/admin/navigation-manager";
import { getAllNavigationItemsForAdmin } from "@/lib/data/navigation";

export const metadata: Metadata = { title: "Website — Header & Navigation" };

export default async function AdminWebsiteNavigationPage() {
  const items = await getAllNavigationItemsForAdmin("HEADER");

  return (
    <div>
      <PageHeader
        title="Website"
        description="The public site header reads these items directly — changes apply immediately."
      />
      <WebsiteSubnav />
      <NavigationManager placement="HEADER" initialItems={items} showCta />
    </div>
  );
}
