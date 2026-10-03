import type { Metadata } from "next";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { genericWhatsAppUrl } from "@/lib/utils/whatsapp";
import { absoluteUrl } from "@/lib/site-url";
import { CONSENT_STORAGE_KEY } from "@/lib/measurement/consent";
import { PrivacySettingsButton } from "@/components/public/privacy-settings-button";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Bagaimana situs Perkasa Motors menangani informasi pengunjung, cookie, dan pilihan privasi.",
  alternates: { canonical: absoluteUrl("/privacy") },
};

const LAST_UPDATED = "3 Oktober 2026";

/**
 * Factual product notice for the website as it actually works (no forms,
 * no accounts, WhatsApp-only contact, consent-gated measurement). It names
 * no legal entity, address, retention period or legal basis the business
 * has not confirmed. Update it whenever the measurement setup changes.
 */
export default async function PrivacyPage() {
  const settings = await getWebsiteSettings();
  const company = settings.companyName;
  const whatsappHref = genericWhatsAppUrl(settings);

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 md:px-8 lg:py-16">
      <h1 className="font-display text-headline-lg text-ink lg:text-display-sm">Kebijakan Privasi</h1>
      <p className="mt-3 font-body text-[13px] text-muted">Terakhir diperbarui: {LAST_UPDATED}</p>

      <div className="mt-8 space-y-8 font-body text-body leading-relaxed text-ink [&_h2]:font-display [&_h2]:text-headline-sm [&_h2]:text-ink [&_p]:mt-3 [&_p]:text-muted [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:text-muted">
        <section>
          <h2>Tentang pemberitahuan ini</h2>
          <p>
            Pemberitahuan ini menjelaskan bagaimana situs perkasamotors.id yang dikelola oleh {company}{" "}
            menangani informasi pengunjung. Situs ini menampilkan mobil dan motor milik {company}. Situs
            ini tidak memiliki formulir, akun pengguna, maupun pembayaran online.
          </p>
        </section>

        <section>
          <h2>Informasi yang Anda kirim lewat WhatsApp</h2>
          <p>
            Tombol WhatsApp di situs ini membuka aplikasi atau web WhatsApp dengan pesan yang sudah terisi
            (misalnya nama unit yang Anda lihat). Pesan baru terkirim jika Anda sendiri menekan kirim.
          </p>
          <p>
            Percakapan dan informasi yang Anda bagikan di WhatsApp, seperti nama atau nomor telepon,
            tidak melewati situs ini. Informasi tersebut diterima oleh {company} melalui WhatsApp dan juga
            tunduk pada ketentuan dan kebijakan privasi WhatsApp.
          </p>
        </section>

        <section>
          <h2>Fungsi penting situs</h2>
          <p>
            Untuk menampilkan halaman dan foto, situs ini menggunakan penyedia hosting dan penyimpanan
            (Netlify dan Supabase). Seperti situs web pada umumnya, layanan tersebut memproses data teknis
            standar dari permintaan browser Anda, seperti alamat IP dan jenis browser, agar halaman dapat
            dikirimkan. Fungsi ini berjalan apa pun pilihan privasi Anda.
          </p>
        </section>

        <section>
          <h2>Cookie dan penyimpanan di browser</h2>
          <p>
            Pilihan privasi Anda disimpan di penyimpanan lokal browser (localStorage) dengan nama{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 text-[13px] text-ink">{CONSENT_STORAGE_KEY}</code>.
            Isinya hanya pilihan Anda (diterima atau ditolak), versi pengaturan, dan waktu Anda memilih.
            Data ini tidak berisi nama, nomor telepon, email, atau identitas lain, dan tidak dikirim ke
            server.
          </p>
          <p>Tanpa persetujuan Anda, situs ini tidak memasang cookie analitik atau iklan.</p>
        </section>

        <section>
          <h2>Analitik dan iklan</h2>
          <p>
            {company} berencana menggunakan layanan berikut untuk memahami cara situs digunakan (misalnya
            halaman yang dilihat dan klik tombol WhatsApp) serta mengukur efektivitas iklan:
          </p>
          <ul>
            <li>Google Tag Manager dan Google Analytics (Google)</li>
            <li>Meta Pixel (Meta)</li>
          </ul>
          <p>
            Layanan ini hanya diaktifkan jika Anda memilih <strong className="text-ink">Terima</strong>.
            Jika Anda memilih <strong className="text-ink">Tolak</strong> atau belum memilih, layanan ini
            tidak dimuat. Saat aktif, layanan tersebut dapat memasang cookie (misalnya _ga atau _fbp) dan
            memproses data perangkat serta penggunaan situs sesuai kebijakan privasi Google dan Meta.
          </p>
          <p>Pada tanggal pembaruan di atas, layanan analitik dan iklan tersebut belum aktif di situs ini.</p>
        </section>

        <section>
          <h2>Mengubah pilihan Anda</h2>
          <p>
            Anda dapat mengubah pilihan kapan saja melalui tautan Pengaturan Privasi di bagian bawah setiap
            halaman, atau tombol di bawah ini.
          </p>
          <div className="mt-4">
            <PrivacySettingsButton className={buttonVariants({ variant: "secondary", size: "md" })} />
          </div>
        </section>

        <section>
          <h2>Pertanyaan</h2>
          <p>
            Untuk pertanyaan tentang pemberitahuan ini, hubungi {company}
            {whatsappHref ? (
              <>
                {" "}melalui{" "}
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-ink underline underline-offset-2 hover:text-primary"
                >
                  WhatsApp
                </a>
              </>
            ) : null}
            .
          </p>
        </section>

        <section>
          <h2>Perubahan</h2>
          <p>
            Pemberitahuan ini dapat diperbarui ketika cara kerja situs berubah. Tanggal pembaruan terakhir
            tercantum di bagian atas halaman ini.
          </p>
        </section>
      </div>
    </article>
  );
}
