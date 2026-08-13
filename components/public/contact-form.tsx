"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

/** MOCK — same non-persisting pattern as the vehicle inquiry form. */
export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="border border-border bg-surface p-8">
        <p className="font-body text-body-lg text-ink">Terima kasih!</p>
        <p className="mt-2 font-body text-body text-muted">
          This is a Phase 1 demo — the message wasn&apos;t actually sent. Real
          lead capture arrives once Supabase is connected.
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
      className="flex flex-col gap-5 border border-border bg-surface p-8"
    >
      <div>
        <Label htmlFor="contact-name">Nama</Label>
        <Input id="contact-name" name="name" required placeholder="Nama lengkap" />
      </div>
      <div>
        <Label htmlFor="contact-contact">Telepon / Email</Label>
        <Input id="contact-contact" name="contact" required placeholder="08xx-xxxx-xxxx" />
      </div>
      <div>
        <Label htmlFor="contact-message">Pesan</Label>
        <Textarea
          id="contact-message"
          name="message"
          rows={5}
          placeholder="Bagaimana kami dapat membantu Anda?"
          required
        />
      </div>
      <Button type="submit" variant="primary" size="lg">
        Kirim Pesan
      </Button>
    </form>
  );
}
