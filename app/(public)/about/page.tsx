import type { Metadata } from "next";
import { HowToBuySection } from "@/components/public/how-to-buy-section";
import { WhatsAppCta } from "@/components/public/whatsapp-cta";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { genericWhatsAppUrl } from "@/lib/utils/whatsapp";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: "Tentang Perkasa Motors: penjual mobil dan motor. Informasi unit, cara pembelian, dan kontak.",
};

/**
 * Short and factual: four blocks, only statements the business
 * configuration supports (company name, address/phone/WhatsApp from
 * website settings). No inspection, curation, warranty, after-sales,
 * history or team claims. The CMS about_page_sections rows are
 * intentionally not rendered here (the stored copy contains unsupported
 * claims; cleaning that data is Phase 2R.5 admin/CMS work).
 * OWNER_FACT_REQUIRED: opening hours, showroom visit policy.
 */
export default async function AboutPage() {
  const settings = await getWebsiteSettings();
  const whatsappHref = genericWhatsAppUrl(settings);

  return (
    <div className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
      <div className="max-w-3xl">
        <p className="mb-4 font-body text-label uppercase tracking-[0.1em] text-primary">Tentang Kami</p>
        <h1 className="font-display text-headline-lg text-ink lg:text-display-sm">Siapa Perkasa Motors</h1>
        <p className="mt-6 font-body text-body-lg text-muted">
          {settings.companyName} menjual mobil dan motor
          {settings.address ? ` di ${settings.address}` : ""}. Unit yang ditampilkan di situs ini adalah stok
          {" "}
          {settings.companyName}.
        </p>
      </div>

      <section aria-labelledby="about-sells-heading" className="mt-12 max-w-3xl border-t border-border pt-10">
        <h2 id="about-sells-heading" className="font-display text-headline-md text-ink">
          Apa yang kami jual
        </h2>
        <p className="mt-4 font-body text-body-lg text-muted">
          Mobil dan motor. Setiap unit ditampilkan dengan foto, spesifikasi, dan harga. Unit yang sudah
          terjual tetap ditampilkan di bagian Unit Terjual.
        </p>
      </section>

      <HowToBuySection className="mt-12 border-t border-border pt-10" />

      <section aria-labelledby="about-contact-heading" className="mt-12 max-w-3xl border-t border-border pt-10">
        <h2 id="about-contact-heading" className="font-display text-headline-md text-ink">
          Kontak &amp; lokasi
        </h2>
        <ul className="mt-4 flex flex-col gap-2 font-body text-body text-muted">
          {settings.address && <li>{settings.address}</li>}
          {settings.phone && (
            <li>
              <a href={`tel:${settings.phone}`} className="hover:text-primary">
                {settings.phone}
              </a>
            </li>
          )}
        </ul>
        {whatsappHref && (
          <div className="mt-6">
            <WhatsAppCta
              href={whatsappHref}
              label="Hubungi via WhatsApp"
              className="h-auto min-h-13 whitespace-normal py-3 text-center"
            />
          </div>
        )}
      </section>
    </div>
  );
}
