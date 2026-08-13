"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

/**
 * MOCK — visually complete, does not write to a database. There is no
 * backend to send this to until Phase 2 (Supabase `leads`). Submitting
 * only flips local UI state; nothing is persisted or transmitted.
 */
export function InquiryForm({ vehicleTitle }: { vehicleTitle: string }) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="border border-border bg-surface p-6">
        <p className="font-body text-body text-ink">
          Thanks — this is a Phase 1 demo form, so nothing was actually sent yet.
        </p>
        <p className="mt-2 font-body text-[13px] text-muted">
          Real lead capture arrives once the Supabase backend is connected.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="flex flex-col gap-4 border border-border bg-surface p-6"
    >
      <div>
        <Label htmlFor="inquiry-name">Nama</Label>
        <Input id="inquiry-name" name="name" required placeholder="Nama lengkap" />
      </div>
      <div>
        <Label htmlFor="inquiry-contact">Telepon / Email</Label>
        <Input id="inquiry-contact" name="contact" required placeholder="08xx-xxxx-xxxx" />
      </div>
      <div>
        <Label htmlFor="inquiry-message">Pesan</Label>
        <Textarea
          id="inquiry-message"
          name="message"
          rows={3}
          defaultValue={`Saya tertarik dengan ${vehicleTitle}.`}
        />
      </div>
      <Button type="submit" variant="primary" size="lg">
        Ajukan Pertanyaan
      </Button>
      <p className="font-body text-[12px] text-muted-2">
        Demo only — not yet connected to a database.
      </p>
    </form>
  );
}
