import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { WebsiteSubnav } from "@/components/admin/website-subnav";

export const metadata: Metadata = { title: "Website — Tentang" };

/**
 * The public /about page is written in code (four short, factual blocks),
 * so there is nothing to edit here, and a form that looked functional
 * but changed nothing would be misleading. This screen says exactly where
 * each part of the page comes from. The old About sections stored in the
 * CMS (table about_page_sections) are kept but are no longer shown.
 */
const SOURCES: Array<[string, string]> = [
  ["Siapa Perkasa Motors", "Nama usaha dan alamat, dari Kontak & WhatsApp."],
  ["Apa yang kami jual", "Teks tetap."],
  ["Cara Pembelian", "Teks tetap (4 langkah), sama dengan di beranda."],
  ["Kontak & lokasi", "Alamat, telepon, dan nomor WhatsApp, dari Kontak & WhatsApp."],
];

export default function AdminWebsiteAboutPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageHeader title="Website" description="Halaman Tentang Kami." />
        <WebsiteSubnav />
      </div>

      <section className="max-w-3xl border border-border bg-surface p-6">
        <h2 className="font-display text-headline-sm text-ink">Isi halaman Tentang Kami</h2>
        <p className="mt-2 font-body text-[13px] text-muted">
          Halaman ini berisi teks tetap yang singkat dan faktual, sehingga tidak ada yang perlu diedit di
          sini. Asal tiap bagian:
        </p>
        <dl className="mt-4 border-t border-border">
          {SOURCES.map(([title, source]) => (
            <div key={title} className="grid gap-1 border-b border-border py-3 sm:grid-cols-3">
              <dt className="font-body text-[13px] font-semibold text-ink">{title}</dt>
              <dd className="font-body text-[13px] text-muted sm:col-span-2">{source}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex flex-wrap gap-4 font-body text-[13px] font-medium">
          <Link href="/admin/website" className="text-primary hover:text-ink">
            Ubah alamat &amp; kontak
          </Link>
          <a href="/about" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-ink">
            Lihat halaman
          </a>
        </div>
        <p className="mt-5 border-t border-border pt-4 font-body text-[12px] text-muted-2">
          Teks Tentang Kami lama yang tersimpan di CMS tidak lagi ditampilkan di situs dan tidak bisa diubah
          dari sini. Jam buka dan aturan kunjungan belum ditampilkan karena belum ada data resminya.
        </p>
      </section>
    </div>
  );
}
