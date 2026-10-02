import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { WebsiteSubnav } from "@/components/admin/website-subnav";
import { ContactWhatsappForm } from "@/components/admin/contact-whatsapp-form";
import { getWebsiteSettings } from "@/lib/data/site-settings";

export const metadata: Metadata = { title: "Website — Kontak & WhatsApp" };

export default async function AdminWebsiteContactPage() {
  const settings = await getWebsiteSettings();

  return (
    <div>
      <PageHeader
        title="Website"
        description="Kontak dan WhatsApp diubah di sini saja; footer dan semua tombol WhatsApp di situs ikut berubah."
      />
      <WebsiteSubnav />
      <ContactWhatsappForm settings={settings} />
    </div>
  );
}
