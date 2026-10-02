import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { WebsiteSubnav } from "@/components/admin/website-subnav";
import { HomepageHeroForm } from "@/components/admin/homepage-hero-form";
import { HomepageAboutForm } from "@/components/admin/homepage-about-form";
import { HomepageAboutMediaManager } from "@/components/admin/homepage-about-media-manager";
import { HomepageTestimonialsManager } from "@/components/admin/homepage-testimonials-manager";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { getHomepageAboutState } from "@/lib/data/homepage-about";
import { getAboutMediaAdminState } from "@/lib/data/homepage-about-media";
import { getAllTestimonialsForAdmin } from "@/lib/data/testimonials";
import { HOMEPAGE_AVAILABLE_LIMIT, HOMEPAGE_SOLD_LIMIT } from "@/lib/data/vehicles";

export const metadata: Metadata = { title: "Website — Beranda" };

/**
 * Beranda: the three things the owner edits on the homepage (Hero, Tentang
 * Perkasa Motors, Testimoni), then a plain list of what is automatic.
 * Cara Pembelian and Mekanisme Pembayaran are business-process text owned
 * by the code, so there is deliberately nothing to edit for them.
 */
export default async function AdminWebsiteHomepagePage() {
  const [settings, aboutState, aboutMedia, testimonials] = await Promise.all([
    getWebsiteSettings(),
    getHomepageAboutState(),
    getAboutMediaAdminState(),
    getAllTestimonialsForAdmin().catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageHeader
          title="Website"
          description="Yang bisa diubah di beranda: Hero, Tentang Perkasa Motors (teks dan foto), dan Testimoni. Perubahan langsung tampil di situs."
        />
        <WebsiteSubnav />
      </div>

      <HomepageHeroForm settings={settings} />

      <HomepageAboutForm state={aboutState} />

      <HomepageAboutMediaManager state={aboutMedia} />

      <HomepageTestimonialsManager initialItems={testimonials} />

      <section className="border border-border bg-surface p-6">
        <h2 className="font-display text-headline-sm text-ink">Otomatis di beranda</h2>
        <p className="mt-1 font-body text-[13px] text-muted">Bagian ini tidak perlu diubah dan tidak ada pengaturannya.</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 font-body text-[13px] text-muted">
          <li>
            Unit Tersedia: maksimal {HOMEPAGE_AVAILABLE_LIMIT} unit tersedia terbaru (mobil dan motor seimbang),
            diambil dari Inventory, dengan tombol Lihat Semua Mobil dan Lihat Semua Motor.
          </li>
          <li>Cara Pembelian: dikelola sistem (4 langkah).</li>
          <li>Mekanisme Pembayaran: dikelola sistem (Cash Keras, Cash Tempo, Cicilan / Kredit).</li>
          <li>Unit Terjual: maksimal {HOMEPAGE_SOLD_LIMIT} unit terjual, diambil dari Inventory.</li>
          <li>Halaman Tentang Kami, Pembiayaan, dan Kontak sudah tidak ada; isinya ada di beranda.</li>
        </ul>
      </section>
    </div>
  );
}
