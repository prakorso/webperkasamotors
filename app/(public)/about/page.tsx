import type { Metadata } from "next";
import { SectionHeading } from "@/components/public/section-heading";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: "The story and standards behind Perkasa Motors.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
      <div className="max-w-3xl">
        <p className="mb-4 font-body text-label uppercase tracking-[0.1em] text-primary">
          Tentang Kami
        </p>
        <h1 className="font-display text-headline-lg text-ink lg:text-display-sm">
          Merancang ulang standar kemewahan.
        </h1>
        <p className="mt-6 font-body text-body-lg text-muted">
          Perkasa Motors adalah etalase otomotif digital yang mengutamakan
          kurasi, presisi, dan kepercayaan. Setiap kendaraan yang tampil di
          Perkasa Motors telah melalui inspeksi internal sebelum ditawarkan
          kepada pelanggan.
        </p>
      </div>

      <div className="mt-16 border-t border-border pt-16">
        <SectionHeading eyebrow="Placeholder" title="Full company story" />
        <p className="max-w-2xl font-body text-body text-muted">
          This page is a Phase 1 route shell proving the information
          architecture — the full editorial content (team, standards,
          history) is scheduled alongside the Content Management phase.
        </p>
      </div>
    </div>
  );
}
