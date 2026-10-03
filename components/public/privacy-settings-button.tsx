"use client";

import { openPrivacySettings } from "@/lib/measurement/consent";

export function PrivacySettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openPrivacySettings} className={className}>
      Pengaturan Privasi
    </button>
  );
}
