import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { WebsiteSubnav } from "@/components/admin/website-subnav";
import { AdvancedSettingsForm } from "@/components/admin/advanced-settings-form";
import { NavigationManager } from "@/components/admin/navigation-manager";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { getAllNavigationItemsForAdmin } from "@/lib/data/navigation";

export const metadata: Metadata = { title: "Website — Lanjutan" };

/**
 * Rarely-changed settings: branding assets, default SEO, footer text,
 * and the navigation menus. Contact facts live in Kontak & WhatsApp.
 */
export default async function AdminWebsiteAdvancedPage() {
  const [settings, headerItems, footerItems, legalItems] = await Promise.all([
    getWebsiteSettings(),
    getAllNavigationItemsForAdmin("HEADER"),
    getAllNavigationItemsForAdmin("FOOTER_NAV"),
    getAllNavigationItemsForAdmin("FOOTER_LEGAL"),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <PageHeader title="Website" description="Pengaturan yang jarang diubah." />
        <WebsiteSubnav />
      </div>

      <AdvancedSettingsForm settings={settings} />

      <section aria-labelledby="nav-rules-heading" className="border border-border bg-surface p-6">
        <h2 id="nav-rules-heading" className="font-display text-headline-sm text-ink">
          Menu situs
        </h2>
        <p className="mt-2 font-body text-[13px] text-muted">
          Menu di bawah mengatur tautan header dan footer. Perhatikan aturan otomatis di situs publik:
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 font-body text-[13px] text-muted">
          <li>
            Tautan ke <code className="font-mono text-ink">/articles</code> (Artikel) otomatis disembunyikan
            sampai ada minimal 3 artikel terbit.
          </li>
          <li>
            Tautan ke halaman yang sudah tidak ada (<code className="font-mono text-ink">/about</code>,{" "}
            <code className="font-mono text-ink">/financing</code>, <code className="font-mono text-ink">/contact</code>)
            tidak ditampilkan di situs. Isinya sekarang ada di beranda.
          </li>
          <li>
            Menu utama yang tampil: Beli Mobil, Beli Motor, dan Artikel (bila syaratnya terpenuhi). Tombol
            WhatsApp di header diatur otomatis dari Kontak &amp; WhatsApp.
          </li>
          <li>Alamat tautan inti (/cars, /motorcycles) jangan diubah.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-4 font-display text-headline-sm text-ink">Menu header</h2>
        <NavigationManager placement="HEADER" initialItems={headerItems} showCta={false} />
      </section>

      <section>
        <h2 className="mb-4 font-display text-headline-sm text-ink">Menu footer</h2>
        <NavigationManager placement="FOOTER_NAV" initialItems={footerItems} showGroupLabel />
      </section>

      <section>
        <h2 className="mb-4 font-display text-headline-sm text-ink">Tautan legal</h2>
        <p className="mb-4 font-body text-[13px] text-muted">
          Mis. Kebijakan Privasi. Tambahkan hanya jika halamannya sudah ada; saat ini belum ada.
        </p>
        <NavigationManager placement="FOOTER_LEGAL" initialItems={legalItems} showCta={false} />
      </section>
    </div>
  );
}
