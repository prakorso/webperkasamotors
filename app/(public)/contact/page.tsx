import type { Metadata } from "next";
import { ContactForm } from "@/components/public/contact-form";

export const metadata: Metadata = {
  title: "Hubungi Kami",
  description: "Get in touch with the Perkasa Motors sales team.",
};

export default function ContactPage() {
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
            ketersediaan unit tertentu.
          </p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
