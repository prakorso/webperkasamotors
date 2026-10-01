import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { WebsiteSubnav } from "@/components/admin/website-subnav";
import { HomepageHeroForm } from "@/components/admin/homepage-hero-form";
import { getWebsiteSettings } from "@/lib/data/site-settings";

export const metadata: Metadata = { title: "Website — Beranda" };

/**
 * Beranda: only what the owner can actually change on the homepage - the
 * hero slides. Everything else on the homepage is automatic: "Unit
 * Tersedia" shows the latest available units, "Unit Terjual" the sold
 * ones, and "Cara Pembelian" is fixed text. The About, Why Perkasa,
 * Testimonials and Social Content editors that used to be here were
 * removed from this screen because the public homepage no longer shows
 * them (their stored data is untouched).
 */
export default async function AdminWebsiteHomepagePage() {
  const settings = await getWebsiteSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageHeader
          title="Website"
          description="Slide hero di bagian atas beranda. Perubahan langsung tampil di situs."
        />
        <WebsiteSubnav />
      </div>

      <HomepageHeroForm settings={settings} />

      <section className="border border-border bg-surface p-6">
        <h2 className="font-display text-headline-sm text-ink">Otomatis di beranda</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 font-body text-[13px] text-muted">
          <li>Unit Tersedia: 4 unit tersedia terbaru, diambil dari Inventory.</li>
          <li>Cara Pembelian: teks tetap (4 langkah).</li>
          <li>Unit Terjual: 3 unit terjual, diambil dari Inventory.</li>
        </ul>
      </section>
    </div>
  );
}
