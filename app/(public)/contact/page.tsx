import type { Metadata } from "next";
import Link from "next/link";
import { WhatsAppCta } from "@/components/public/whatsapp-cta";
import { buttonVariants } from "@/components/ui/button";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { genericWhatsAppUrl } from "@/lib/utils/whatsapp";

export const metadata: Metadata = {
  title: "Hubungi Kami",
  description: "Get in touch with the Perkasa Motors sales team.",
};

export default async function ContactPage() {
  const settings = await getWebsiteSettings();
  const whatsappHref = genericWhatsAppUrl(settings);

  return (
    <div className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="mb-4 font-body text-label uppercase tracking-[0.1em] text-primary">
            Hubungi Kami
          </p>
          <h1 className="font-display text-headline-lg text-ink lg:text-display-sm">
            Tim kami siap membantu.
          </h1>
          <p className="mt-6 font-body text-body-lg text-muted">
            Ajukan pertanyaan umum, jadwalkan kunjungan, atau tanyakan
            ketersediaan unit tertentu — langsung lewat WhatsApp.
          </p>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="flex flex-col gap-6 border border-border bg-surface p-8">
            <div>
              <p className="font-body text-body text-ink">Chat langsung dengan tim Perkasa Motors.</p>
              <p className="mt-2 font-body text-[13px] text-muted">
                Klik tombol di bawah untuk membuka WhatsApp dengan pesan yang sudah disiapkan.
              </p>
            </div>

            {whatsappHref ? (
              <WhatsAppCta href={whatsappHref} label="Hubungi via WhatsApp" className="w-full sm:w-auto" />
            ) : (
              <Link
                href="/"
                className={buttonVariants({ variant: "primary", size: "lg" })}
              >
                Kembali ke Beranda
              </Link>
            )}

            {(settings.phone || settings.email || settings.address) && (
              <ul className="flex flex-col gap-2 border-t border-border pt-6 font-body text-[13px] text-muted">
                {settings.address && <li>{settings.address}</li>}
                {settings.phone && (
                  <li>
                    <a href={`tel:${settings.phone}`} className="hover:text-primary">
                      {settings.phone}
                    </a>
                  </li>
                )}
                {settings.email && (
                  <li>
                    <a href={`mailto:${settings.email}`} className="hover:text-primary">
                      {settings.email}
                    </a>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
