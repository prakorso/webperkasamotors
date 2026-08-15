"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createLead } from "@/lib/actions/leads";

/**
 * The vehicle detail page's lead form — deliberately just two fields.
 * The vehicle is never asked for: vehicleSlug comes from the page this
 * form is rendered on (see components/public/vehicle-detail.tsx), and
 * the Server Action re-resolves the real vehicle from it server-side
 * rather than trusting anything the client sends. On success, opens a
 * WhatsApp chat pre-filled from the configured message template — the
 * lead is already saved in Supabase by the time that happens.
 */
export function InquiryForm({
  vehicleTitle,
  vehicleSlug,
}: {
  vehicleTitle: string;
  vehicleSlug: string;
}) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  // Hidden from view — a real visitor never sees or fills this field.
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createLead({ name, whatsapp, vehicleSlug, honeypot });
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSubmitted(true);
    if (result.whatsappUrl) {
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
    }
  }

  if (submitted) {
    return (
      <div className="border border-border bg-surface p-6">
        <p className="font-body text-body text-ink">Terima kasih, {name}!</p>
        <p className="mt-2 font-body text-[13px] text-muted">
          Tim kami akan segera menghubungi Anda melalui WhatsApp mengenai {vehicleTitle}.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-col gap-4 border border-border bg-surface p-6"
    >
      <div>
        <Label htmlFor="inquiry-name">Nama</Label>
        <Input
          id="inquiry-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Nama lengkap"
        />
      </div>
      <div>
        <Label htmlFor="inquiry-whatsapp">Nomor WhatsApp</Label>
        <Input
          id="inquiry-whatsapp"
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          required
          placeholder="08xx-xxxx-xxxx"
        />
      </div>
      {/* Honeypot: absolutely positioned off-screen rather than display:none —
          some bots skip fields hidden via display/visibility but still fill
          ones that are merely positioned outside the viewport. */}
      <input
        type="text"
        name="company_website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <Button type="submit" variant="primary" size="lg" disabled={submitting}>
        {submitting ? "Mengirim…" : "Hubungi Kami"}
      </Button>
      {error && <p className="font-body text-[13px] text-primary">{error}</p>}
    </form>
  );
}
