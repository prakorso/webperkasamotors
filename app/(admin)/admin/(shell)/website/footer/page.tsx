import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { WebsiteSubnav } from "@/components/admin/website-subnav";
import { WebsiteFooterForm } from "@/components/admin/website-footer-form";
import { NavigationManager } from "@/components/admin/navigation-manager";
import { getFooterSettings } from "@/lib/data/footer";
import { getAllNavigationItemsForAdmin } from "@/lib/data/navigation";

export const metadata: Metadata = { title: "Website — Footer" };

export default async function AdminWebsiteFooterPage() {
  const [footer, footerNavItems, legalItems] = await Promise.all([
    getFooterSettings(),
    getAllNavigationItemsForAdmin("FOOTER_NAV"),
    getAllNavigationItemsForAdmin("FOOTER_LEGAL"),
  ]);

  return (
    <div>
      <PageHeader
        title="Website"
        description="The public footer reads this directly — changes apply immediately."
      />
      <WebsiteSubnav />

      <div className="flex flex-col gap-8">
        <WebsiteFooterForm footer={footer} />

        <section>
          <h2 className="mb-4 font-display text-headline-sm text-ink">Footer Navigation Groups</h2>
          <NavigationManager placement="FOOTER_NAV" initialItems={footerNavItems} showGroupLabel />
        </section>

        <section>
          <h2 className="mb-4 font-display text-headline-sm text-ink">Legal Links</h2>
          <p className="mb-4 font-body text-[13px] text-muted">
            e.g. Privacy Policy, Terms &amp; Conditions — add these once real pages exist for
            them; there aren&apos;t any today, so none are seeded.
          </p>
          <NavigationManager placement="FOOTER_LEGAL" initialItems={legalItems} showCta={false} />
        </section>
      </div>
    </div>
  );
}
